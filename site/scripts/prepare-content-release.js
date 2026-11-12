#!/usr/bin/env node
/**
 * 生成可独立发布的公开内容快照。
 *
 * 处理文章、附件、数据 YAML、相册元数据和 favicon；相册变更时先导入新照片并更新
 * 缩略图与 EXIF 索引。脚本不运行 Vite 或 SvelteKit 预渲染。
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
	loadContentConfig,
	loadSiteConfig,
	resolveContentPaths
} from '../src/lib/config/server.ts';
import { normalizePublicTreePermissions } from './lib/public-permissions.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const allowedReasons = new Set(['manual', 'posts', 'albums', 'data', 'favicon', 'static']);

function required(name) {
	const value = process.env[name];
	if (!value) throw new Error(`缺少内容 release 变量 ${name}`);
	return value;
}

function requiredDirectory(name) {
	const resolved = fs.realpathSync(required(name));
	if (!fs.statSync(resolved).isDirectory()) throw new Error(`${name} 不是目录`);
	return resolved;
}

function copyTree(source, destination) {
	const stat = fs.lstatSync(source);
	if (stat.isSymbolicLink()) throw new Error(`公开内容禁止符号链接：${source}`);
	if (stat.isDirectory()) {
		fs.mkdirSync(destination, { recursive: true });
		for (const entry of fs.readdirSync(source)) {
			copyTree(path.join(source, entry), path.join(destination, entry));
		}
		return;
	}
	if (!stat.isFile()) throw new Error(`公开内容只允许普通文件和目录：${source}`);
	fs.mkdirSync(path.dirname(destination), { recursive: true });
	fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL);
}

function run(command, args, env) {
	const result = spawnSync(command, args, {
		cwd: projectRoot,
		stdio: 'inherit',
		env: { ...process.env, ...env }
	});
	if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} 执行失败`);
}

function deployReasons() {
	const reasons = new Set(
		(process.env.FUYAO_DEPLOY_REASON || 'manual')
			.split(',')
			.map((value) => value.trim())
			.filter(Boolean)
	);
	if ([...reasons].some((reason) => !allowedReasons.has(reason))) {
		throw new Error(`不支持的内容 release 原因：${[...reasons].join(',')}`);
	}
	return reasons;
}

export function prepareContentRelease() {
	const reasons = deployReasons();
	const configRoot = requiredDirectory('FUYAO_CONFIG_ROOT');
	const contentRoot = requiredDirectory('FUYAO_CONTENT_ROOT');
	const faviconRoot = requiredDirectory('FUYAO_FAVICON_ROOT');
	const outputRoot = path.resolve(required('FUYAO_CONTENT_PUBLIC_ROOT'));
	if (fs.existsSync(outputRoot) && fs.readdirSync(outputRoot).length > 0) {
		throw new Error(`公开内容输出目录必须为空：${outputRoot}`);
	}
	fs.mkdirSync(outputRoot, { recursive: true });

	const siteFile = path.join(configRoot, 'site.yaml');
	const contentFile = path.join(configRoot, 'content.yaml');
	if (!fs.existsSync(siteFile) || !fs.existsSync(contentFile)) {
		throw new Error(`缺少生产配置文件：${siteFile} 或 ${contentFile}`);
	}
	const siteConfig = loadSiteConfig(siteFile, true);
	const contentConfig = loadContentConfig(contentFile);
	const contentPaths = resolveContentPaths(contentConfig, contentRoot);

	if (reasons.has('manual') || reasons.has('albums')) {
		run(process.execPath, [path.join(projectRoot, 'scripts', 'generate-album-index.js')], {
			FUYAO_ALBUM_PHOTOS_DIR: contentPaths.albumPhotos,
			FUYAO_ALBUM_THUMBNAILS_DIR: contentPaths.albumThumbnails,
			FUYAO_ALBUM_METADATA_DIR: contentPaths.albumMetadata
		});
	}

	const postsRoot = path.join(outputRoot, 'posts');
	copyTree(contentPaths.posts, postsRoot);
	copyTree(contentPaths.data, path.join(outputRoot, 'data'));
	copyTree(contentPaths.albumMetadata, path.join(outputRoot, 'albums'));
	copyTree(faviconRoot, path.join(outputRoot, 'favicon'));

	const privateRoot = path.join(path.dirname(outputRoot), 'private');
	fs.mkdirSync(privateRoot, { recursive: true });
	const siteConfigFile = path.join(privateRoot, 'site-config.json');
	fs.writeFileSync(siteConfigFile, `${JSON.stringify(siteConfig, null, 2)}\n`, { mode: 0o600 });
	run(process.execPath, [path.join(projectRoot, 'scripts', 'generate-blog-index.js')], {
		FUYAO_POSTS_SOURCE_DIR: postsRoot,
		FUYAO_BLOG_OUTPUT_DIR: postsRoot,
		FUYAO_STATIC_OUTPUT_DIR: outputRoot,
		FUYAO_SITE_CONFIG_JSON: siteConfigFile
	});

	normalizePublicTreePermissions(outputRoot);
	run(
		process.execPath,
		[path.join(projectRoot, 'scripts', 'validate-deployment.js'), '--phase=content-release'],
		{ FUYAO_CONTENT_PUBLIC_ROOT: outputRoot }
	);
	console.log(`公开内容准备完成：${outputRoot}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	try {
		prepareContentRelease();
	} catch (error) {
		console.error(`公开内容准备失败：${error instanceof Error ? error.message : String(error)}`);
		process.exit(1);
	}
}
