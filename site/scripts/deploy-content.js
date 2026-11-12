#!/usr/bin/env node
/**
 * 低内存公开内容原子发布器。
 *
 * 基于当前完整站点 release 创建硬链接副本，仅替换文章、数据、相册元数据、favicon、
 * RSS 和 Sitemap。博客预渲染 HTML 会从内容 release 中移除，由 Caddy 回退到既有
 * 200.html 后在浏览器中读取最新 Markdown 与 JSON。
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { assertPublicTreePermissions } from './lib/public-permissions.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const allowedReasons = new Set(['manual', 'posts', 'albums', 'data', 'favicon', 'static']);

function required(name) {
	const value = process.env[name];
	if (!value) throw new Error(`缺少内容发布变量 ${name}`);
	return value;
}

function assertWithin(root, candidate, label) {
	const relative = path.relative(root, candidate);
	if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
		throw new Error(`${label} 越过允许目录`);
	}
}

function copyTree(source, destination) {
	const stat = fs.lstatSync(source);
	if (stat.isSymbolicLink()) throw new Error(`内容 release 禁止符号链接：${source}`);
	if (stat.isDirectory()) {
		fs.mkdirSync(destination, { recursive: true, mode: stat.mode & 0o777 });
		for (const entry of fs.readdirSync(source)) {
			copyTree(path.join(source, entry), path.join(destination, entry));
		}
		return;
	}
	if (!stat.isFile()) throw new Error(`内容 release 只允许普通文件和目录：${source}`);
	fs.mkdirSync(path.dirname(destination), { recursive: true });
	fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL);
}

/** 基于同一 release 文件系统创建低空间占用副本；后续修改前必须先解除对应硬链接。 */
export function cloneReleaseWithHardLinks(source, destination) {
	const stat = fs.lstatSync(source);
	if (stat.isSymbolicLink()) throw new Error(`基础 release 禁止符号链接：${source}`);
	if (stat.isDirectory()) {
		fs.mkdirSync(destination, { recursive: true, mode: stat.mode & 0o777 });
		for (const entry of fs.readdirSync(source)) {
			cloneReleaseWithHardLinks(path.join(source, entry), path.join(destination, entry));
		}
		return;
	}
	if (!stat.isFile()) throw new Error(`基础 release 只允许普通文件和目录：${source}`);
	fs.linkSync(source, destination);
}

function replaceContentTree(releaseRoot, contentRoot) {
	for (const name of ['posts', 'data', 'albums', 'favicon', 'blog']) {
		const target = path.join(releaseRoot, name);
		if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
	}
	const sitemap = path.join(releaseRoot, 'sitemap.xml');
	if (fs.existsSync(sitemap)) fs.unlinkSync(sitemap);

	for (const name of ['posts', 'data', 'albums', 'favicon', 'blog']) {
		copyTree(path.join(contentRoot, name), path.join(releaseRoot, name));
	}
	copyTree(path.join(contentRoot, 'sitemap.xml'), sitemap);
}

function atomicSwitch(currentLink, releasePath) {
	const temporaryLink = path.join(path.dirname(currentLink), `.current-content-${process.pid}`);
	fs.symlinkSync(releasePath, temporaryLink);
	fs.renameSync(temporaryLink, currentLink);
}

function run(command, args, options = {}) {
	execFileSync(command, args, { stdio: 'inherit', ...options });
}

function runCapture(command, args, options = {}) {
	return execFileSync(command, args, { encoding: 'utf8', ...options });
}

function parseReasons() {
	const reasons = new Set(
		(process.env.FUYAO_DEPLOY_REASON || 'manual')
			.split(',')
			.map((value) => value.trim())
			.filter(Boolean)
	);
	if ([...reasons].some((reason) => !allowedReasons.has(reason))) {
		throw new Error(`不支持的内容发布原因：${[...reasons].join(',')}`);
	}
	return reasons;
}

function markPendingState(markerPath, reasons) {
	if (!markerPath) return;
	let existing = {};
	if (fs.existsSync(markerPath)) {
		try {
			existing = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
		} catch {
			existing = {};
		}
	}
	const merged = new Set(Array.isArray(existing.reasons) ? existing.reasons : []);
	for (const reason of reasons) {
		if (reason !== 'manual') merged.add(reason);
	}
	if (merged.size === 0) return;
	const now = new Date().toISOString();
	const temporaryPath = path.join(path.dirname(markerPath), `.pending-deploy-${process.pid}.json`);
	fs.writeFileSync(
		temporaryPath,
		`${JSON.stringify(
			{
				schemaVersion: 1,
				reasons: [...merged].sort(),
				detectedAt: typeof existing.detectedAt === 'string' ? existing.detectedAt : now,
				preparedAt: now
			},
			null,
			2
		)}\n`,
		{ mode: 0o644 }
	);
	fs.renameSync(temporaryPath, markerPath);
}

function clearPendingState(markerPath, publishedReasons) {
	if (!markerPath || !fs.existsSync(markerPath)) return;
	let state;
	try {
		state = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
	} catch {
		return;
	}
	const remaining = (Array.isArray(state.reasons) ? state.reasons : []).filter(
		(reason) => !publishedReasons.has(reason)
	);
	if (remaining.length === 0) {
		fs.unlinkSync(markerPath);
		return;
	}
	const temporaryPath = path.join(path.dirname(markerPath), `.pending-deploy-${process.pid}.json`);
	fs.writeFileSync(
		temporaryPath,
		`${JSON.stringify({ ...state, reasons: remaining, preparedAt: new Date().toISOString() }, null, 2)}\n`,
		{ mode: 0o644 }
	);
	fs.renameSync(temporaryPath, markerPath);
}

function cleanupOldReleases(releaseRoot, currentTarget, keep) {
	const releases = fs
		.readdirSync(releaseRoot, { withFileTypes: true })
		.filter(
			(entry) => entry.isDirectory() && !entry.isSymbolicLink() && !entry.name.startsWith('.')
		)
		.map((entry) => {
			const target = path.join(releaseRoot, entry.name);
			return { target, modifiedAt: fs.statSync(target).mtimeMs };
		})
		.sort((a, b) => a.modifiedAt - b.modifiedAt);
	let removeCount = Math.max(0, releases.length - keep);
	for (const { target } of releases) {
		if (removeCount === 0) break;
		if (target === currentTarget) continue;
		assertWithin(releaseRoot, target, '旧 release');
		fs.rmSync(target, { recursive: true, force: true });
		removeCount--;
	}
}

export function deployContent() {
	const reasons = parseReasons();
	const sharedRoot = fs.realpathSync(required('FUYAO_SHARED_ROOT'));
	const configRoot = fs.realpathSync(required('FUYAO_CONFIG_ROOT'));
	const contentRoot = fs.realpathSync(required('FUYAO_CONTENT_ROOT'));
	const faviconRoot = fs.realpathSync(required('FUYAO_FAVICON_ROOT'));
	const releaseRoot = fs.realpathSync(required('FUYAO_RELEASE_ROOT'));
	const currentLink = path.resolve(required('FUYAO_CURRENT_LINK'));
	const lockPath = path.resolve(
		process.env.FUYAO_DEPLOY_LOCK || path.join(path.dirname(releaseRoot), 'deploy.lock')
	);
	const pendingFile = process.env.FUYAO_CONTENT_PENDING_FILE
		? path.join(
				fs.realpathSync(path.dirname(path.resolve(process.env.FUYAO_CONTENT_PENDING_FILE))),
				path.basename(process.env.FUYAO_CONTENT_PENDING_FILE)
			)
		: undefined;
	const keep = Number(process.env.FUYAO_RELEASE_KEEP || '5');
	if (!Number.isSafeInteger(keep) || keep < 1) throw new Error('FUYAO_RELEASE_KEEP 必须是正整数');

	assertWithin(sharedRoot, configRoot, '配置目录');
	assertWithin(sharedRoot, contentRoot, '内容目录');
	assertWithin(sharedRoot, faviconRoot, 'favicon 目录');
	if (pendingFile) assertWithin(contentRoot, path.dirname(pendingFile), '待发布状态目录');
	let baseRelease = '';
	let lockFd;
	let workspace;
	let stagingPath;
	try {
		lockFd = fs.openSync(lockPath, 'wx', 0o600);
		fs.writeFileSync(lockFd, `${process.pid}\n`);
		markPendingState(pendingFile, reasons);
		// 在持锁后读取当前指针，避免并发代码发布刚完成时克隆过期版本。
		if (!fs.existsSync(currentLink)) throw new Error('当前站点 release 不存在');
		baseRelease = fs.realpathSync(currentLink);
		assertWithin(releaseRoot, baseRelease, '基础 release');
		if (!fs.existsSync(path.join(baseRelease, '200.html'))) {
			throw new Error('基础 release 缺少 200.html，不能提供内容发布后的博客路由回退');
		}
		workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'fuyao-content-release-'));
		const generatedRoot = path.join(workspace, 'public');
		run(process.execPath, [path.join(projectRoot, 'scripts', 'prepare-content-release.js')], {
			cwd: projectRoot,
			env: {
				...process.env,
				FUYAO_CONFIG_ROOT: configRoot,
				FUYAO_CONTENT_ROOT: contentRoot,
				FUYAO_FAVICON_ROOT: faviconRoot,
				FUYAO_CONTENT_PUBLIC_ROOT: generatedRoot,
				FUYAO_DEPLOY_REASON: [...reasons].join(',')
			}
		});

		stagingPath = path.join(releaseRoot, `.content-release-${process.pid}`);
		if (fs.existsSync(stagingPath)) throw new Error(`内容 release 暂存目录已存在：${stagingPath}`);
		cloneReleaseWithHardLinks(baseRelease, stagingPath);
		replaceContentTree(stagingPath, generatedRoot);
		const oldReleaseManifest = path.join(stagingPath, 'release.json');
		if (fs.existsSync(oldReleaseManifest)) fs.unlinkSync(oldReleaseManifest);

		const createdAt = new Date();
		const timestamp = createdAt
			.toISOString()
			.replace(/[-:]/g, '')
			.replace(/\.\d{3}Z$/, 'Z');
		let releaseId = `fuyao-content-${timestamp}`;
		if (fs.existsSync(path.join(releaseRoot, releaseId))) releaseId += `-${process.pid}`;
		const releasePath = path.join(releaseRoot, releaseId);
		assertWithin(releaseRoot, releasePath, '新内容 release');
		let baseReleaseId = path.basename(baseRelease);
		const baseManifest = path.join(baseRelease, 'release.json');
		if (fs.existsSync(baseManifest)) {
			try {
				const manifest = JSON.parse(fs.readFileSync(baseManifest, 'utf8'));
				baseReleaseId =
					(manifest.mode === 'content-only' ? manifest.baseReleaseId : manifest.releaseId) ||
					baseReleaseId;
			} catch {
				// 基础 release 目录名仍可作为可追溯标识。
			}
		}
		fs.writeFileSync(
			path.join(stagingPath, 'release.json'),
			`${JSON.stringify(
				{
					schemaVersion: 1,
					releaseId,
					createdAt: createdAt.toISOString(),
					mode: 'content-only',
					baseReleaseId,
					reasons: [...reasons].sort()
				},
				null,
				2
			)}\n`,
			{ mode: 0o644 }
		);
		assertPublicTreePermissions(stagingPath, '内容 release');
		run(
			process.execPath,
			[path.join(projectRoot, 'scripts', 'validate-deployment.js'), '--phase=build'],
			{
				cwd: projectRoot,
				env: { ...process.env, FUYAO_BUILD_ROOT: stagingPath }
			}
		);
		fs.renameSync(stagingPath, releasePath);
		stagingPath = undefined;

		atomicSwitch(currentLink, releasePath);
		try {
			if (process.env.FUYAO_HEALTHCHECK_URL) {
				const releaseUrl = new URL('/release.json', process.env.FUYAO_HEALTHCHECK_URL);
				releaseUrl.searchParams.set('release', releaseId);
				const liveRelease = JSON.parse(
					runCapture('curl', [
						'--fail',
						'--silent',
						'--show-error',
						'--max-time',
						'15',
						releaseUrl.toString()
					])
				);
				if (liveRelease.releaseId !== releaseId) {
					throw new Error(`线上 release-id 不一致：${String(liveRelease.releaseId)}`);
				}
				const postsUrl = new URL('/posts/all.json', process.env.FUYAO_HEALTHCHECK_URL);
				postsUrl.searchParams.set('release', releaseId);
				const posts = JSON.parse(
					runCapture('curl', [
						'--fail',
						'--silent',
						'--show-error',
						'--max-time',
						'15',
						postsUrl.toString()
					])
				);
				if (posts[0]) {
					const category = (posts[0].categories?.[0] || 'Uncategorized')
						.split('/')
						.map(encodeURIComponent)
						.join('/');
					const articleUrl = new URL(
						`/blog/${category}/${encodeURIComponent(posts[0].slug)}/`,
						process.env.FUYAO_HEALTHCHECK_URL
					);
					runCapture('curl', [
						'--fail',
						'--silent',
						'--show-error',
						'--max-time',
						'15',
						articleUrl.toString()
					]);
				}
			}
		} catch (error) {
			atomicSwitch(currentLink, baseRelease);
			throw new Error(
				`内容健康检查失败，current 已回滚：${error instanceof Error ? error.message : String(error)}`
			);
		}

		clearPendingState(pendingFile, reasons.has('manual') ? allowedReasons : reasons);
		cleanupOldReleases(releaseRoot, fs.realpathSync(currentLink), keep);
		console.log(`内容发布成功：${releaseId}`);
	} finally {
		if (lockFd !== undefined) fs.closeSync(lockFd);
		if (lockFd !== undefined && fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
		if (stagingPath && fs.existsSync(stagingPath)) {
			fs.rmSync(stagingPath, { recursive: true, force: true });
		}
		if (workspace) fs.rmSync(workspace, { recursive: true, force: true });
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	try {
		deployContent();
	} catch (error) {
		console.error(`内容发布失败：${error instanceof Error ? error.message : String(error)}`);
		process.exit(1);
	}
}
