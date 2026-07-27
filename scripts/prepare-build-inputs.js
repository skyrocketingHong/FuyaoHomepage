#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
	loadContentConfig,
	loadSiteConfig,
	resolveContentPaths
} from '../src/lib/config/server.ts';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const modeArg = process.argv.find((value) => value.startsWith('--mode='));
const mode = modeArg?.split('=', 2)[1] ?? (args.has('--production') ? 'production' : 'ci');
const production = mode === 'production';
const buildInputsRoot = path.join(projectRoot, '.fuyao', 'build-inputs');
const snapshotRoot = path.join(buildInputsRoot, 'current');
const publicRoot = path.join(snapshotRoot, 'public');
const privateRoot = path.join(snapshotRoot, 'private');
const buildAssetsRoot = path.join(projectRoot, '.fuyao', 'build-assets');
const lockPath = production
	? process.env.FUYAO_DEPLOY_LOCK || '/srv/fuyao/deploy.lock'
	: path.join(projectRoot, '.fuyao', 'prepare.lock');

if (production) {
	for (const name of ['FUYAO_CONFIG_ROOT', 'FUYAO_CONTENT_ROOT']) {
		if (!process.env[name]) throw new Error(`生产模式缺少 ${name}，禁止回退到仓库演示内容`);
	}
}

function requireDirectory(value, name) {
	if (!value) throw new Error(`生产模式缺少 ${name}`);
	const resolved = fs.realpathSync(value);
	if (!fs.statSync(resolved).isDirectory()) throw new Error(`${name} 不是目录`);
	return resolved;
}

function ensureSafeSnapshotTarget(target) {
	const relative = path.relative(buildInputsRoot, target);
	if (relative.startsWith('..') || path.isAbsolute(relative)) {
		throw new Error(`拒绝清理构建输入根目录之外的路径：${target}`);
	}
}

function makeWritable(target) {
	if (!fs.existsSync(target)) return;
	for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
		const child = path.join(target, entry.name);
		if (entry.isDirectory()) makeWritable(child);
		if (!entry.isSymbolicLink()) fs.chmodSync(child, entry.isDirectory() ? 0o755 : 0o644);
	}
	fs.chmodSync(target, 0o755);
}

function copyTree(source, destination) {
	const sourceStat = fs.lstatSync(source);
	if (sourceStat.isSymbolicLink()) throw new Error(`构建输入禁止符号链接：${source}`);
	if (sourceStat.isDirectory()) {
		fs.mkdirSync(destination, { recursive: true });
		for (const entry of fs.readdirSync(source))
			copyTree(path.join(source, entry), path.join(destination, entry));
		return;
	}
	if (!sourceStat.isFile()) throw new Error(`构建输入只允许普通文件和目录：${source}`);
	fs.mkdirSync(path.dirname(destination), { recursive: true });
	fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL);
}

function copyIfPresent(source, destination) {
	if (fs.existsSync(source)) copyTree(source, destination);
}

function run(command, commandArgs, env = {}) {
	const result = spawnSync(command, commandArgs, {
		cwd: projectRoot,
		stdio: 'inherit',
		env: { ...process.env, ...env }
	});
	if (result.status !== 0) throw new Error(`${command} ${commandArgs.join(' ')} 执行失败`);
}

function freezeTree(target) {
	for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
		const child = path.join(target, entry.name);
		if (entry.isDirectory()) freezeTree(child);
		fs.chmodSync(child, entry.isDirectory() ? 0o555 : 0o444);
	}
	fs.chmodSync(target, 0o555);
}

let lockFd;
try {
	if (!process.env.FUYAO_SKIP_LOCK) {
		fs.mkdirSync(path.dirname(lockPath), { recursive: true });
		try {
			lockFd = fs.openSync(lockPath, 'wx', 0o600);
			fs.writeFileSync(lockFd, `${process.pid}\n`, { encoding: 'utf8' });
		} catch (error) {
			if (error && typeof error === 'object' && error.code === 'EEXIST') {
				throw new Error(`部署锁已存在：${lockPath}`);
			}
			throw error;
		}
	}

	const configRoot = production
		? requireDirectory(process.env.FUYAO_CONFIG_ROOT, 'FUYAO_CONFIG_ROOT')
		: path.join(projectRoot, 'config');
	const contentRoot = production
		? requireDirectory(process.env.FUYAO_CONTENT_ROOT, 'FUYAO_CONTENT_ROOT')
		: path.join(projectRoot, 'fixtures', 'content');
	const siteFile = path.join(configRoot, production ? 'site.yaml' : 'site.example.yaml');
	const contentFile = path.join(configRoot, production ? 'content.yaml' : 'content.example.yaml');
	if (!fs.existsSync(siteFile) || !fs.existsSync(contentFile)) {
		throw new Error(`缺少配置文件：${siteFile} 或 ${contentFile}`);
	}

	const siteConfig = loadSiteConfig(siteFile, production);
	const contentConfig = loadContentConfig(contentFile);
	const contentPaths = resolveContentPaths(contentConfig, contentRoot);

	fs.mkdirSync(buildInputsRoot, { recursive: true });
	// adapter-static 可能保留快照的只读权限；新构建前只清理仓库内的生成目录。
	const buildOutput = path.join(projectRoot, 'build');
	makeWritable(buildOutput);
	fs.rmSync(buildOutput, { recursive: true, force: true });
	makeWritable(buildAssetsRoot);
	fs.rmSync(buildAssetsRoot, { recursive: true, force: true });
	ensureSafeSnapshotTarget(snapshotRoot);
	makeWritable(snapshotRoot);
	fs.rmSync(snapshotRoot, { recursive: true, force: true });
	fs.mkdirSync(publicRoot, { recursive: true });
	fs.mkdirSync(privateRoot, { recursive: true });

	// 仅复制代码仓库中明确公开的静态资产；演示内容统一从 fixtures/content 进入快照。
	copyIfPresent(path.join(projectRoot, 'static', 'favicon'), path.join(publicRoot, 'favicon'));
	copyIfPresent(path.join(projectRoot, 'static', 'fonts'), path.join(publicRoot, 'fonts'));
	copyIfPresent(
		path.join(projectRoot, 'static', 'robots.txt'),
		path.join(publicRoot, 'robots.txt')
	);
	copyTree(contentPaths.posts, path.join(publicRoot, 'posts'));
	copyTree(contentPaths.data, path.join(publicRoot, 'data'));
	copyTree(contentPaths.albumMetadata, path.join(publicRoot, 'albums'));

	const publicConfigFile = path.join(privateRoot, 'public-config.json');
	const contentConfigFile = path.join(privateRoot, 'content-config.json');
	fs.writeFileSync(publicConfigFile, `${JSON.stringify(siteConfig, null, 2)}\n`, { mode: 0o600 });
	fs.writeFileSync(contentConfigFile, `${JSON.stringify(contentConfig, null, 2)}\n`, {
		mode: 0o600
	});

	run(process.execPath, [path.join(projectRoot, 'scripts', 'generate-blog-index.js')], {
		FUYAO_POSTS_SOURCE_DIR: path.join(publicRoot, 'posts'),
		FUYAO_BLOG_OUTPUT_DIR: path.join(publicRoot, 'posts'),
		FUYAO_STATIC_OUTPUT_DIR: publicRoot,
		FUYAO_SITE_CONFIG_JSON: publicConfigFile
	});
	run(
		process.execPath,
		[
			path.join(projectRoot, 'scripts', 'generate-album-index.js'),
			'--no-rename',
			'--metadata-only'
		],
		{
			FUYAO_ALBUM_PHOTOS_DIR: contentPaths.albumPhotos,
			FUYAO_ALBUM_THUMBNAILS_DIR: contentPaths.albumThumbnails,
			FUYAO_ALBUM_METADATA_DIR: path.join(publicRoot, 'albums'),
			FUYAO_REQUIRE_EXISTING_THUMBNAILS: production ? '1' : '0'
		}
	);
	run(
		process.execPath,
		[path.join(projectRoot, 'scripts', 'validate-deployment.js'), '--phase=inputs'],
		{
			FUYAO_BUILD_SNAPSHOT: snapshotRoot,
			FUYAO_CONTENT_ROOT: contentRoot,
			FUYAO_PRODUCTION: production ? '1' : '0'
		}
	);

	const context = {
		schemaVersion: 1,
		mode,
		assetsDir: buildAssetsRoot,
		publicConfigFile,
		albumPublicBase: contentConfig.media.albumPublicBase,
		preparedAt: new Date().toISOString()
	};
	// SvelteKit adapter-static 会覆盖同名的静态资源与预渲染依赖；使用快照派生的
	// 可写临时镜像，避免把只读权限传播到适配器输出目录。
	copyTree(publicRoot, buildAssetsRoot);
	fs.writeFileSync(
		path.join(projectRoot, '.fuyao', 'build-context.json'),
		`${JSON.stringify(context, null, 2)}\n`,
		{
			mode: 0o600
		}
	);
	freezeTree(snapshotRoot);
	console.log(`构建输入准备完成：${mode}，快照位于 .fuyao/build-inputs/current`);
} finally {
	if (lockFd !== undefined) fs.closeSync(lockFd);
	if (lockFd !== undefined && fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
}
