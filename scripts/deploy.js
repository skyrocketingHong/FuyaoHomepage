#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

function required(name) {
	const value = process.env[name];
	if (!value) throw new Error(`缺少生产部署变量 ${name}`);
	return value;
}

function run(command, args, options = {}) {
	execFileSync(command, args, { stdio: 'inherit', ...options });
}

function runCapture(command, args, options = {}) {
	return execFileSync(command, args, { encoding: 'utf8', ...options });
}

function assertWithin(root, candidate, label) {
	const relative = path.relative(root, candidate);
	if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
		throw new Error(`${label} 越过允许目录`);
	}
}

function copyBuild(source, destination) {
	fs.cpSync(source, destination, {
		recursive: true,
		dereference: false,
		filter: (entry) => {
			if (fs.lstatSync(entry).isSymbolicLink()) throw new Error(`release 禁止符号链接：${entry}`);
			return true;
		}
	});
}

function atomicSwitch(currentLink, releasePath) {
	const parent = path.dirname(currentLink);
	const temporaryLink = path.join(parent, `.current-${process.pid}`);
	fs.symlinkSync(releasePath, temporaryLink);
	fs.renameSync(temporaryLink, currentLink);
}

const configRoot = fs.realpathSync(required('FUYAO_CONFIG_ROOT'));
const contentRoot = fs.realpathSync(required('FUYAO_CONTENT_ROOT'));
const releaseRoot = fs.realpathSync(required('FUYAO_RELEASE_ROOT'));
const currentLink = required('FUYAO_CURRENT_LINK');
const sharedRoot = fs.realpathSync(required('FUYAO_SHARED_ROOT'));
const configuredSourceRoot = process.env.FUYAO_SOURCE_ROOT;
const lockPath =
	process.env.FUYAO_DEPLOY_LOCK || path.join(path.dirname(releaseRoot), 'deploy.lock');
const keep = Number(process.env.FUYAO_RELEASE_KEEP || '5');
const rollbackId = process.argv.find((value) => value.startsWith('--rollback='))?.split('=', 2)[1];
const deployReasons = new Set(
	(process.env.FUYAO_DEPLOY_REASON || 'manual')
		.split(',')
		.map((value) => value.trim())
		.filter(Boolean)
);
const allowedReasons = new Set(['manual', 'posts', 'albums']);

if ([...deployReasons].some((reason) => !allowedReasons.has(reason))) {
	throw new Error(`不支持的部署原因：${[...deployReasons].join(',')}`);
}
if (!Number.isSafeInteger(keep) || keep < 1) throw new Error('FUYAO_RELEASE_KEEP 必须是正整数');

assertWithin(sharedRoot, configRoot, '配置目录');
assertWithin(sharedRoot, contentRoot, '内容目录');

let lockFd;
let temporaryRoot;
try {
	lockFd = fs.openSync(lockPath, 'wx', 0o600);
	fs.writeFileSync(lockFd, `${process.pid}\n`);

	if (rollbackId) {
		if (!/^[A-Za-z0-9._-]+$/.test(rollbackId)) throw new Error('回滚 release-id 无效');
		const rollbackPath = fs.realpathSync(path.join(releaseRoot, rollbackId));
		assertWithin(releaseRoot, rollbackPath, '回滚版本');
		atomicSwitch(currentLink, rollbackPath);
		console.log(`已回滚至 ${rollbackId}`);
		process.exit(0);
	}

	let sourceRoot;
	if (configuredSourceRoot) {
		sourceRoot = fs.realpathSync(configuredSourceRoot);
		if (!fs.statSync(sourceRoot).isDirectory()) throw new Error('FUYAO_SOURCE_ROOT 不是目录');
	} else {
		temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fuyao-deploy-'));
		sourceRoot = path.join(temporaryRoot, 'source');
		run('git', [
			'clone',
			'--depth',
			'1',
			'--branch',
			'main',
			required('FUYAO_REPOSITORY_URL'),
			sourceRoot
		]);
	}
	run(process.execPath, [path.join(sourceRoot, 'scripts', 'audit-repository.js'), '--current'], {
		cwd: sourceRoot
	});
	if (process.env.FUYAO_SKIP_INSTALL !== '1') run('npm', ['ci'], { cwd: sourceRoot });
	const deployEnv = {
		...process.env,
		FUYAO_CONFIG_ROOT: configRoot,
		FUYAO_CONTENT_ROOT: contentRoot,
		FUYAO_SKIP_LOCK: '1'
	};
	if (deployReasons.has('albums')) {
		const albumPhotos = fs.realpathSync(required('FUYAO_ALBUM_PHOTOS_DIR'));
		const albumThumbnails = fs.realpathSync(required('FUYAO_ALBUM_THUMBNAILS_DIR'));
		const albumMetadata = fs.realpathSync(required('FUYAO_ALBUM_METADATA_DIR'));
		assertWithin(contentRoot, albumPhotos, '相册原图目录');
		assertWithin(contentRoot, albumThumbnails, '相册缩略图目录');
		assertWithin(contentRoot, albumMetadata, '相册元数据目录');
		run(process.execPath, [path.join(sourceRoot, 'scripts', 'generate-album-index.js')], {
			cwd: sourceRoot,
			env: {
				...deployEnv,
				FUYAO_ALBUM_PHOTOS_DIR: albumPhotos,
				FUYAO_ALBUM_THUMBNAILS_DIR: albumThumbnails,
				FUYAO_ALBUM_METADATA_DIR: albumMetadata
			}
		});
	}
	if (process.env.FUYAO_FAST_DEPLOY !== '1') {
		run('npm', ['run', 'check'], { cwd: sourceRoot, env: deployEnv });
		run('npm', ['test'], { cwd: sourceRoot, env: deployEnv });
	}
	run('npm', ['run', 'build:production'], { cwd: sourceRoot, env: deployEnv });

	const createdAt = new Date();
	const releaseTimestamp = createdAt
		.toISOString()
		.replace(/[-:]/g, '')
		.replace(/\.\d{3}Z$/, 'Z');
	let releaseId = `fuyao-auto-${releaseTimestamp}`;
	if (fs.existsSync(path.join(releaseRoot, releaseId))) releaseId += `-${process.pid}`;
	const releasePath = path.join(releaseRoot, releaseId);
	assertWithin(releaseRoot, releasePath, '新版本');
	fs.mkdirSync(releasePath, { mode: 0o755 });
	copyBuild(path.join(sourceRoot, 'build'), releasePath);
	fs.writeFileSync(
		path.join(releasePath, 'release.json'),
		`${JSON.stringify(
			{
				schemaVersion: 1,
				releaseId,
				createdAt: createdAt.toISOString(),
				reasons: [...deployReasons].sort()
			},
			null,
			2
		)}\n`
	);

	const oldTarget = fs.existsSync(currentLink) ? fs.realpathSync(currentLink) : undefined;
	atomicSwitch(currentLink, releasePath);
	try {
		if (process.env.FUYAO_HEALTHCHECK_URL) {
			const releaseUrl = new URL('/release.json', process.env.FUYAO_HEALTHCHECK_URL);
			releaseUrl.searchParams.set('release', releaseId);
			const response = runCapture('curl', [
				'--fail',
				'--silent',
				'--show-error',
				'--max-time',
				'15',
				releaseUrl.toString()
			]);
			const healthRelease = JSON.parse(response);
			if (healthRelease.releaseId !== releaseId) {
				throw new Error(`线上 release-id 不一致：${String(healthRelease.releaseId)}`);
			}
		}
	} catch (error) {
		if (oldTarget) atomicSwitch(currentLink, oldTarget);
		throw new Error(
			`健康检查失败，current 已回滚：${error instanceof Error ? error.message : String(error)}`
		);
	}

	const currentTarget = fs.realpathSync(currentLink);
	const releaseDirectories = fs
		.readdirSync(releaseRoot, { withFileTypes: true })
		.filter((value) => value.isDirectory() && !value.isSymbolicLink())
		.map((value) => {
			const target = path.join(releaseRoot, value.name);
			return { target, modifiedAt: fs.statSync(target).mtimeMs };
		})
		.sort((a, b) => a.modifiedAt - b.modifiedAt);
	let removeCount = Math.max(0, releaseDirectories.length - keep);
	for (const { target } of releaseDirectories) {
		if (removeCount === 0) break;
		if (target === currentTarget) continue;
		assertWithin(releaseRoot, target, '旧版本');
		fs.rmSync(target, { recursive: true, force: true });
		removeCount--;
	}
	console.log(`部署成功：${releaseId}`);
} finally {
	if (lockFd !== undefined) fs.closeSync(lockFd);
	if (lockFd !== undefined && fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
	if (temporaryRoot) fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
