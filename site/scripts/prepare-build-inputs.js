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
import {
	assertDisjointPaths,
	assertThemeConfigAllowed,
	compileThemeConfigSchema,
	computeContentDigest,
	createContractValidator,
	declaredConfigSchemaFile,
	fileDigest,
	readThemeManifest,
	themeConfigDigest,
	verifyFrozenSnapshot,
	writeInputMetadata
} from './lib/theme-input.js';
import { normalizePublicTreePermissions } from './lib/public-permissions.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const modeArg = process.argv.find((value) => value.startsWith('--mode='));
const mode = modeArg?.split('=', 2)[1] ?? (args.has('--production') ? 'production' : 'ci');
const production = mode === 'production';
const frozenInput =
	process.argv.find((value) => value.startsWith('--frozen='))?.split('=', 2)[1] ??
	process.env.FUYAO_FROZEN_INPUT ??
	'';
// 平台（T3）注入数据库保存的公开站点设置与已校验主题配置；二者均为
// JSON 文件路径，值来自管理端受信任存储，不接收命令行内联 JSON。
const siteOverridesFile =
	process.argv.find((value) => value.startsWith('--site-overrides='))?.split('=', 2)[1] ?? '';
const themeConfigFile =
	process.argv.find((value) => value.startsWith('--theme-config='))?.split('=', 2)[1] ?? '';
const buildInputsRoot = path.join(projectRoot, '.fuyao', 'build-inputs');
const snapshotRoot = path.join(buildInputsRoot, 'current');
const publicRoot = path.join(snapshotRoot, 'public');
const privateRoot = path.join(snapshotRoot, 'private');
const buildAssetsRoot = path.join(projectRoot, '.fuyao', 'build-assets');
const lockPath = production
	? process.env.FUYAO_DEPLOY_LOCK || '/srv/fuyao/deploy.lock'
	: path.join(projectRoot, '.fuyao', 'prepare.lock');

if (production && !frozenInput) {
	for (const name of ['FUYAO_CONFIG_ROOT', 'FUYAO_CONTENT_ROOT', 'FUYAO_FAVICON_ROOT']) {
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

/** 重置可写构建资产镜像与 build-context；快照本身不被清理。 */
function resetBuildWorkspace() {
	makeWritable(buildAssetsRoot);
	fs.rmSync(buildAssetsRoot, { recursive: true, force: true });
}

function writeBuildContext(context) {
	fs.writeFileSync(
		path.join(projectRoot, '.fuyao', 'build-context.json'),
		`${JSON.stringify(context, null, 2)}\n`,
		{ mode: 0o600 }
	);
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

	// 主题身份先行：id/版本/输入协议不匹配时，任何模式都拒绝构建；
	// 结构层由权威契约 schema（与 Go 侧同一份文件）校验。
	const versionFile = JSON.parse(fs.readFileSync(path.join(projectRoot, 'version.json'), 'utf8'));
	const manifest = readThemeManifest(projectRoot, { expectedVersion: versionFile.version });
	const contract = createContractValidator();
	contract.assertManifest(manifest.raw);

	if ((siteOverridesFile || themeConfigFile) && frozenInput) {
		throw new Error('冻结消费模式禁止注入站点设置覆盖或主题配置');
	}

	if (frozenInput) {
		// 平台传入已冻结快照：只读校验，禁止重新读取实时源或覆盖快照。
		const frozenRoot = fs.realpathSync(frozenInput);
		if (!fs.statSync(frozenRoot).isDirectory()) throw new Error(`冻结快照不是目录：${frozenInput}`);
		// 相交检查必须先于任何清理：冻结输入落在可重建工作目录内会被后续
		// 清理删除，或反向吞掉工作目录。
		assertDisjointPaths(frozenRoot, [
			buildAssetsRoot,
			path.join(projectRoot, 'build'),
			snapshotRoot
		]);
		const { input } = verifyFrozenSnapshot(frozenRoot, manifest);
		contract.assertInput(input);
		// 主题配置约束遵守权威契约：未声明 configSchema 仅允许 {}，声明则按
		// 主题自己的 schema 校验（schema 路径已由 manifest schema 约束在主题根内）。
		const declaredSchema = declaredConfigSchemaFile(manifest.raw);
		const configValidator = declaredSchema
			? compileThemeConfigSchema(
					JSON.parse(fs.readFileSync(path.join(projectRoot, declaredSchema), 'utf8'))
				)
			: null;
		assertThemeConfigAllowed(manifest, input.themeConfig ?? {}, configValidator);
		resetBuildWorkspace();
		// 可写资产镜像与只读快照分离，SvelteKit adapter-static 只接触镜像；
		// 镜像必须解除快照继承的只读位，否则 adapter 覆盖同名文件时 EACCES
		// （fresh 分支的镜像来自未冻结源，本就与这里对齐为可写）。
		copyTree(path.join(frozenRoot, 'public'), buildAssetsRoot);
		makeWritable(buildAssetsRoot);
		writeBuildContext({
			schemaVersion: 2,
			mode: 'frozen',
			snapshotMode: input.mode,
			assetsDir: buildAssetsRoot,
			siteConfigFile: path.join(frozenRoot, 'private', 'site-config.json'),
			inputMetadataFile: path.join(frozenRoot, 'private', 'input.json'),
			frozenInput: frozenRoot,
			theme: { id: manifest.id, version: manifest.version },
			albumPublicBase: JSON.parse(
				fs.readFileSync(path.join(frozenRoot, 'private', 'content-config.json'), 'utf8')
			).media.albumPublicBase,
			preparedAt: new Date().toISOString()
		});
		console.log(`冻结快照消费就绪：${frozenRoot}（主题 ${manifest.id}@${manifest.version}）`);
	} else {
		prepareFreshSnapshot(manifest, contract, loadPlatformOverrides());
	}
} finally {
	if (lockFd !== undefined) fs.closeSync(lockFd);
	if (lockFd !== undefined && fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
}

/** 读取平台注入文件：站点设置覆盖（site.name/description/defaultLocale）与主题配置。 */
function loadPlatformOverrides() {
	let siteOverrides = null;
	if (siteOverridesFile) {
		const parsed = JSON.parse(fs.readFileSync(siteOverridesFile, 'utf8'));
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
			throw new Error('站点设置覆盖必须是 JSON 对象');
		}
		const allowed = new Set(['name', 'description', 'defaultLocale']);
		const patch = parsed.site;
		if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
			throw new Error('站点设置覆盖必须包含 site 对象');
		}
		for (const key of Object.keys(patch)) {
			if (!allowed.has(key)) throw new Error(`站点设置覆盖包含未知字段：${key}`);
			if (typeof patch[key] !== 'string') throw new Error(`站点设置覆盖字段 ${key} 必须是字符串`);
		}
		siteOverrides = patch;
	}
	let themeConfig = {};
	if (themeConfigFile) {
		const parsed = JSON.parse(fs.readFileSync(themeConfigFile, 'utf8'));
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
			throw new Error('主题配置必须是 JSON 对象');
		}
		themeConfig = parsed;
	}
	return { siteOverrides, themeConfig };
}

function prepareFreshSnapshot(manifest, contract, platform) {
	const configRoot = production
		? requireDirectory(process.env.FUYAO_CONFIG_ROOT, 'FUYAO_CONFIG_ROOT')
		: path.join(projectRoot, 'config');
	const contentRoot = production
		? requireDirectory(process.env.FUYAO_CONTENT_ROOT, 'FUYAO_CONTENT_ROOT')
		: path.join(projectRoot, 'fixtures', 'content');
	const faviconRoot = production
		? requireDirectory(process.env.FUYAO_FAVICON_ROOT, 'FUYAO_FAVICON_ROOT')
		: path.join(projectRoot, 'static', 'favicon');
	const siteFile = path.join(configRoot, production ? 'site.yaml' : 'site.example.yaml');
	const contentFile = path.join(configRoot, production ? 'content.yaml' : 'content.example.yaml');
	if (!fs.existsSync(siteFile) || !fs.existsSync(contentFile)) {
		throw new Error(`缺少配置文件：${siteFile} 或 ${contentFile}`);
	}

	const siteConfig = loadSiteConfig(siteFile, production);
	if (platform.siteOverrides) {
		Object.assign(siteConfig.site, platform.siteOverrides);
		// 站点描述进入公开 SEO 元数据，使保存的 description 有真实公开行为；
		// defaultLocale 是未保存访客语言偏好时的默认语言，客户端偏好仍优先。
		if (
			typeof platform.siteOverrides.description === 'string' &&
			platform.siteOverrides.description
		) {
			siteConfig.seo.description = platform.siteOverrides.description;
		}
	}
	const contentConfig = loadContentConfig(contentFile);
	const contentPaths = resolveContentPaths(contentConfig, contentRoot);

	fs.mkdirSync(buildInputsRoot, { recursive: true });
	// adapter-static 可能保留快照的只读权限；新构建前只清理仓库内的生成目录。
	const buildOutput = path.join(projectRoot, 'build');
	makeWritable(buildOutput);
	fs.rmSync(buildOutput, { recursive: true, force: true });
	resetBuildWorkspace();
	ensureSafeSnapshotTarget(snapshotRoot);
	makeWritable(snapshotRoot);
	fs.rmSync(snapshotRoot, { recursive: true, force: true });
	fs.mkdirSync(publicRoot, { recursive: true });
	fs.mkdirSync(privateRoot, { recursive: true });

	// 仅复制代码仓库中明确公开的静态资产；演示内容统一从 fixtures/content 进入快照。
	copyTree(faviconRoot, path.join(publicRoot, 'favicon'));
	copyIfPresent(path.join(projectRoot, 'static', 'fonts'), path.join(publicRoot, 'fonts'));
	copyIfPresent(
		path.join(projectRoot, 'static', 'robots.txt'),
		path.join(publicRoot, 'robots.txt')
	);
	copyTree(contentPaths.posts, path.join(publicRoot, 'posts'));
	copyTree(contentPaths.data, path.join(publicRoot, 'data'));
	copyTree(contentPaths.albumMetadata, path.join(publicRoot, 'albums'));

	const siteConfigFile = path.join(privateRoot, 'site-config.json');
	const contentConfigFile = path.join(privateRoot, 'content-config.json');
	const siteConfigBytes = `${JSON.stringify(siteConfig, null, 2)}\n`;
	const contentConfigBytes = `${JSON.stringify(contentConfig, null, 2)}\n`;
	fs.writeFileSync(siteConfigFile, siteConfigBytes, { mode: 0o600 });
	fs.writeFileSync(contentConfigFile, contentConfigBytes, { mode: 0o600 });

	run(process.execPath, [path.join(projectRoot, 'scripts', 'generate-blog-index.js')], {
		FUYAO_POSTS_SOURCE_DIR: path.join(publicRoot, 'posts'),
		FUYAO_BLOG_OUTPUT_DIR: path.join(publicRoot, 'posts'),
		FUYAO_STATIC_OUTPUT_DIR: publicRoot,
		FUYAO_SITE_CONFIG_JSON: siteConfigFile
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
	// 内容源允许使用 0600/0700 保存；进入公开快照后必须解除源权限继承，供 Caddy 读取。
	normalizePublicTreePermissions(publicRoot);
	run(
		process.execPath,
		[path.join(projectRoot, 'scripts', 'validate-deployment.js'), '--phase=inputs'],
		{
			FUYAO_BUILD_SNAPSHOT: snapshotRoot,
			FUYAO_CONTENT_ROOT: contentRoot,
			FUYAO_PRODUCTION: production ? '1' : '0'
		}
	);

	// 三个输入摘要覆盖公开内容树（含内容路径/媒体映射）、站点配置与主题配置。
	// 平台准备快照时注入数据库保存的主题配置；无注入时保持空对象（首主题默认）。
	const themeConfig = platform.themeConfig;
	// 注入的主题配置虽已在保存选择时按主题 schema 校验过，快照侧仍按
	// 权威契约独立复核一遍（未声明 configSchema 仅允许 {}）。
	if (themeConfigFile) {
		const declaredSchema = declaredConfigSchemaFile(manifest.raw);
		const configValidator = declaredSchema
			? compileThemeConfigSchema(
					JSON.parse(fs.readFileSync(path.join(projectRoot, declaredSchema), 'utf8'))
				)
			: null;
		assertThemeConfigAllowed(manifest, themeConfig, configValidator);
	}
	const digests = {
		contentDigest: computeContentDigest(publicRoot, [contentConfigFile]),
		siteConfigDigest: fileDigest(siteConfigFile),
		themeConfigDigest: themeConfigDigest(themeConfig)
	};
	const inputMetadata = writeInputMetadata(privateRoot, {
		mode,
		theme: { id: manifest.id, version: manifest.version },
		themeConfig,
		digests
	});
	// 写入后按权威 schema 自校验，准备与消费两侧同一份契约。
	contract.assertInput(inputMetadata);

	// SvelteKit adapter-static 会覆盖同名的静态资源与预渲染依赖；使用快照派生的
	// 可写临时镜像，避免把只读权限传播到适配器输出目录。
	copyTree(publicRoot, buildAssetsRoot);
	writeBuildContext({
		schemaVersion: 2,
		mode,
		assetsDir: buildAssetsRoot,
		siteConfigFile,
		inputMetadataFile: path.join(privateRoot, 'input.json'),
		albumPublicBase: contentConfig.media.albumPublicBase,
		theme: { id: manifest.id, version: manifest.version },
		inputs: digests,
		preparedAt: inputMetadata.preparedAt
	});
	freezeTree(snapshotRoot);
	console.log(`构建输入准备完成：${mode}，快照位于 .fuyao/build-inputs/current`);
}
