import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { spawn } from 'node:child_process';

import {
	classifyContentChange,
	hasRootAlbumImports,
	readPendingReasons
} from '../scripts/watch-content.js';

test('内容监听器覆盖文章附件、外部静态资源、数据、favicon 和支持的照片格式', () => {
	assert.equal(classifyContentChange('posts', 'category/article.md'), 'posts');
	assert.equal(classifyContentChange('posts', 'category/diagram.webp'), 'posts');
	assert.equal(classifyContentChange('albums', 'incoming/photo.JPG'), 'albums');
	assert.equal(classifyContentChange('albums', 'incoming/photo.heic'), 'albums');
	assert.equal(classifyContentChange('albums', 'metadata/index.json'), null);
	assert.equal(classifyContentChange('data', 'friends.yaml'), 'data');
	assert.equal(classifyContentChange('data', 'notes.txt'), null);
	assert.equal(classifyContentChange('favicon', 'favicon-32x32.png'), 'favicon');
	assert.equal(classifyContentChange('static', 'uploads/image.png'), 'static');
	assert.equal(classifyContentChange('posts', '.upload.tmp'), null);
	assert.equal(classifyContentChange('unknown', 'article.md'), null);
});

test('相册自身整理完成后不会把子目录照片误判为待导入文件', (t) => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fuyao-watcher-'));
	t.after(() => fs.rmSync(root, { recursive: true, force: true }));
	fs.mkdirSync(path.join(root, '2026/07/27'), { recursive: true });
	fs.writeFileSync(path.join(root, '2026/07/27/processed.jpg'), 'fixture');

	assert.equal(hasRootAlbumImports(root), false);
	fs.writeFileSync(path.join(root, 'incoming.webp'), 'fixture');
	assert.equal(hasRootAlbumImports(root), true);
});

test('监听器重启后恢复未完成的内容发布原因', (t) => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fuyao-pending-recovery-'));
	t.after(() => fs.rmSync(root, { recursive: true, force: true }));
	const marker = path.join(root, 'pending.json');
	fs.writeFileSync(marker, '{"reasons":["posts","albums","static","unknown"]}\n');
	assert.deepEqual(readPendingReasons(marker), ['posts', 'albums', 'static']);
});

/** @param {() => boolean} predicate @param {number} [timeoutMs] */
async function waitFor(predicate, timeoutMs = 5000) {
	const deadline = Date.now() + timeoutMs;
	while (!predicate()) {
		if (Date.now() > deadline) throw new Error('等待 watcher 状态超时');
		await new Promise((resolve) => setTimeout(resolve, 25));
	}
}

test('发布失败的队列持久保存，服务重启后自动重放并在成功后清除', async (t) => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fuyao-watcher-retry-'));
	/** @type {import('node:child_process').ChildProcess[]} */
	const children = [];
	t.after(() => {
		for (const child of children) child.kill('SIGTERM');
		fs.rmSync(root, { recursive: true, force: true });
	});
	for (const name of ['posts', 'photos', 'data', 'favicon', 'state']) {
		fs.mkdirSync(path.join(root, name));
	}
	const countFile = path.join(root, 'calls.txt');
	const actionScript = path.join(root, 'publish.mjs');
	const marker = path.join(root, 'state/pending.json');
	fs.writeFileSync(
		actionScript,
		`import fs from 'node:fs';
const count = Number(fs.existsSync(process.env.TEST_CALLS) ? fs.readFileSync(process.env.TEST_CALLS, 'utf8') : 0) + 1;
fs.writeFileSync(process.env.TEST_CALLS, String(count));
process.exit(count === 1 ? 1 : 0);\n`
	);
	function start() {
		const child = spawn(process.execPath, ['scripts/watch-content.js'], {
			cwd: process.cwd(),
			stdio: ['ignore', 'pipe', 'pipe'],
			env: {
				...process.env,
				FUYAO_POSTS_WATCH_DIR: path.join(root, 'posts'),
				FUYAO_ALBUM_PHOTOS_DIR: path.join(root, 'photos'),
				FUYAO_DATA_WATCH_DIR: path.join(root, 'data'),
				FUYAO_FAVICON_WATCH_DIR: path.join(root, 'favicon'),
				FUYAO_STATIC_WATCH_DIRS: '',
				FUYAO_CONTENT_PENDING_FILE: marker,
				FUYAO_WATCH_MODE: 'deploy',
				FUYAO_CONTENT_DEPLOY_SCRIPT: actionScript,
				FUYAO_WATCH_DEBOUNCE_MS: '500',
				FUYAO_WATCH_RETRY_MS: '5000',
				TEST_CALLS: countFile
			}
		});
		let output = '';
		child.stdout?.on('data', (data) => {
			output += data.toString();
		});
		child.stderr?.on('data', (data) => {
			output += data.toString();
		});
		children.push(child);
		return { child, ready: () => output.includes('[Watcher] 模式：'), output: () => output };
	}
	const first = start();
	await waitFor(first.ready);
	first.child.kill('SIGUSR1');
	await waitFor(() => first.output().includes('将退避重试'));
	assert.equal(fs.readFileSync(countFile, 'utf8'), '1');
	assert.deepEqual(readPendingReasons(`${marker}.watcher.json`), ['posts']);
	first.child.kill('SIGTERM');
	await new Promise((resolve) => first.child.once('close', resolve));
	const restarted = start();
	await waitFor(() => restarted.output().includes('处理完成'));
	assert.equal(fs.readFileSync(countFile, 'utf8'), '2');
	assert.equal(fs.existsSync(`${marker}.watcher.json`), false);
	restarted.child.kill('SIGTERM');
	await new Promise((resolve) => restarted.child.once('close', resolve));
});

test('生产构建和 systemd watcher 保留照片 GPS 并使用低内存内容 release 模式', () => {
	const prepareScript = fs.readFileSync('scripts/prepare-build-inputs.js', 'utf8');
	const deployScript = fs.readFileSync('scripts/deploy.js', 'utf8');
	const contentPrepareScript = fs.readFileSync('scripts/prepare-content-update.js', 'utf8');
	const service = fs.readFileSync('deploy/systemd/fuyao-content-watcher.service', 'utf8');

	assert.doesNotMatch(prepareScript, /strip-gps/);
	assert.match(deployScript, /FUYAO_SOURCE_ROOT/);
	assert.match(prepareScript, /FUYAO_FAVICON_ROOT/);
	assert.doesNotMatch(deployScript, /strip-gps/);
	assert.doesNotMatch(contentPrepareScript, /strip-gps/);
	assert.match(deployScript, /线上 release-id 不一致/);
	assert.match(deployScript, /\/data\/friends\.yaml/);
	assert.match(deployScript, /\/favicon\/favicon-32x32\.png/);
	assert.match(service, /InaccessiblePaths=\/srv\/fuyao\/shared\/secrets/);
	assert.match(
		fs.readFileSync('deploy/systemd/fuyao-deploy.service', 'utf8'),
		/FUYAO_FAVICON_ROOT=\/srv\/fuyao\/shared\/legacy\/root-assets\/favicon/
	);
	assert.match(service, /Environment=FUYAO_WATCH_MODE=content-only/);
	assert.match(service, /MemoryHigh=640M/);
	assert.match(service, /MemoryMax=768M/);
	assert.match(service, /ReadWritePaths=\/srv\/fuyao /);
	assert.match(service, /ReadOnlyPaths=.*\/srv\/fuyao\/shared/);
	assert.match(service, /FUYAO_POSTS_WATCH_DIR=\/srv\/fuyao\/shared\/content\/posts/);
	assert.match(service, /FUYAO_ALBUM_PHOTOS_DIR=\/srv\/fuyao\/shared\/content\/albums\/photos/);
	assert.match(service, /FUYAO_DATA_WATCH_DIR=\/srv\/fuyao\/shared\/content\/data/);
	assert.match(
		service,
		/FUYAO_STATIC_WATCH_DIRS=\/srv\/fuyao\/shared\/content\/images:\/srv\/fuyao\/shared\/content\/wp-content/
	);
	assert.match(
		service,
		/FUYAO_FAVICON_WATCH_DIR=\/srv\/fuyao\/shared\/legacy\/root-assets\/favicon/
	);
});

test('低内存内容准备器合并文章待发布标记且不要求 Git', (t) => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fuyao-content-prepare-'));
	t.after(() => fs.rmSync(root, { recursive: true, force: true }));
	const stateDirectory = path.join(root, 'state');
	fs.mkdirSync(stateDirectory);
	const markerPath = path.join(stateDirectory, 'pending-deploy.json');

	const result = spawnSync(process.execPath, ['scripts/prepare-content-update.js'], {
		cwd: process.cwd(),
		encoding: 'utf8',
		env: {
			...process.env,
			FUYAO_CONTENT_ROOT: root,
			FUYAO_CONTENT_PENDING_FILE: markerPath,
			FUYAO_DEPLOY_REASON: 'posts'
		}
	});
	assert.equal(result.status, 0, result.stderr);
	const marker = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
	assert.deepEqual(marker.reasons, ['posts']);
	assert.equal(marker.schemaVersion, 1);
});

test('隐私审计支持无 Git 的服务器源码包并拒绝非示例环境文件', (t) => {
	const packageRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fuyao-package-audit-'));
	t.after(() => fs.rmSync(packageRoot, { recursive: true, force: true }));
	fs.mkdirSync(path.join(packageRoot, 'scripts'));
	fs.copyFileSync(
		'scripts/audit-repository.js',
		path.join(packageRoot, 'scripts/audit-repository.js')
	);
	fs.writeFileSync(path.join(packageRoot, 'package.json'), '{"name":"safe-package"}\n');

	const safeResult = spawnSync(
		process.execPath,
		[path.join(packageRoot, 'scripts/audit-repository.js'), '--current'],
		{ cwd: packageRoot, encoding: 'utf8' }
	);
	assert.equal(safeResult.status, 0, safeResult.stderr);
	assert.match(safeResult.stdout, /当前源码包隐私审计通过/);

	fs.writeFileSync(path.join(packageRoot, '.env'), 'password=abcdefghijklmnop\n');
	const unsafeResult = spawnSync(
		process.execPath,
		[path.join(packageRoot, 'scripts/audit-repository.js'), '--current'],
		{ cwd: packageRoot, encoding: 'utf8' }
	);
	assert.equal(unsafeResult.status, 1);
	assert.match(unsafeResult.stderr, /\.env 是非示例环境文件/);
});
