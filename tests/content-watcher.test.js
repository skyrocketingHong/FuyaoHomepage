import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { classifyContentChange, hasRootAlbumImports } from '../scripts/watch-content.js';

test('内容监听器只接受 Markdown 和支持的照片格式', () => {
	assert.equal(classifyContentChange('posts', 'category/article.md'), 'posts');
	assert.equal(classifyContentChange('posts', 'category/all.json'), null);
	assert.equal(classifyContentChange('albums', 'incoming/photo.JPG'), 'albums');
	assert.equal(classifyContentChange('albums', 'incoming/photo.heic'), 'albums');
	assert.equal(classifyContentChange('albums', 'metadata/index.json'), null);
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

test('生产构建和 systemd watcher 保留照片 GPS 并使用低内存内容准备模式', () => {
	const prepareScript = fs.readFileSync('scripts/prepare-build-inputs.js', 'utf8');
	const deployScript = fs.readFileSync('scripts/deploy.js', 'utf8');
	const contentPrepareScript = fs.readFileSync('scripts/prepare-content-update.js', 'utf8');
	const service = fs.readFileSync('deploy/systemd/fuyao-content-watcher.service', 'utf8');

	assert.doesNotMatch(prepareScript, /strip-gps/);
	assert.match(deployScript, /FUYAO_SOURCE_ROOT/);
	assert.doesNotMatch(deployScript, /strip-gps/);
	assert.doesNotMatch(contentPrepareScript, /strip-gps/);
	assert.match(deployScript, /线上 release-id 不一致/);
	assert.match(service, /InaccessiblePaths=\/srv\/fuyao\/shared\/secrets/);
	assert.match(service, /Environment=FUYAO_WATCH_MODE=prepare/);
	assert.match(service, /MemoryHigh=640M/);
	assert.match(service, /MemoryMax=768M/);
	assert.doesNotMatch(service, /FUYAO_CONTENT_DEPLOY_SCRIPT/);
	assert.match(service, /FUYAO_POSTS_WATCH_DIR=\/srv\/fuyao\/shared\/content\/posts/);
	assert.match(service, /FUYAO_ALBUM_PHOTOS_DIR=\/srv\/fuyao\/shared\/content\/albums\/photos/);
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
