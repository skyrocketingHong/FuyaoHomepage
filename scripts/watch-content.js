#!/usr/bin/env node
/**
 * 生产内容监听器。
 *
 * 递归监听外部文章和照片目录，将短时间内的事件合并后调用原子部署脚本。
 * 文章变更直接触发构建；照片变更由部署脚本先完成导入、缩略图和公开元数据更新。
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.heic', '.webp', '.tiff', '.tif']);

/** @typedef {'posts' | 'albums'} ContentScope */
/** @typedef {'posts' | 'albums'} DeployReason */

/**
 * @param {unknown} scope
 * @param {unknown} filename
 * @returns {DeployReason | null}
 */
export function classifyContentChange(scope, filename) {
	if (typeof filename !== 'string' || filename.length === 0) return null;
	if (scope === 'posts') return path.extname(filename).toLowerCase() === '.md' ? 'posts' : null;
	if (scope === 'albums') {
		return imageExtensions.has(path.extname(filename).toLowerCase()) ? 'albums' : null;
	}
	return null;
}

/** @param {string} directory */
export function hasRootAlbumImports(directory) {
	if (!fs.existsSync(directory)) return false;
	return fs
		.readdirSync(directory, { withFileTypes: true })
		.some((entry) => entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase()));
}

/** @param {string} name */
function requiredDirectory(name) {
	const value = process.env[name];
	if (!value) throw new Error(`缺少监听目录变量 ${name}`);
	const resolved = fs.realpathSync(value);
	if (!fs.statSync(resolved).isDirectory()) throw new Error(`${name} 不是目录`);
	return resolved;
}

export function startWatcher() {
	const postsDirectory = requiredDirectory('FUYAO_POSTS_WATCH_DIR');
	const albumsDirectory = requiredDirectory('FUYAO_ALBUM_PHOTOS_DIR');
	const watchMode = process.env.FUYAO_WATCH_MODE || 'deploy';
	if (!['deploy', 'prepare'].includes(watchMode)) {
		throw new Error(`不支持的 FUYAO_WATCH_MODE：${watchMode}`);
	}
	const deployScript = path.resolve(
		process.env.FUYAO_CONTENT_DEPLOY_SCRIPT || path.join(projectRoot, 'scripts/deploy.js')
	);
	const actionScript =
		watchMode === 'prepare'
			? path.join(projectRoot, 'scripts/prepare-content-update.js')
			: deployScript;
	const debounceMs = Math.max(
		500,
		Number.parseInt(process.env.FUYAO_WATCH_DEBOUNCE_MS || '5000', 10) || 5000
	);
	const pendingReasons = new Set();
	/** @type {fs.FSWatcher[]} */
	const watchers = [];
	/** @type {NodeJS.Timeout | undefined} */
	let timer;
	let running = false;
	/** @type {import('node:child_process').ChildProcess | undefined} */
	let child;
	let stopping = false;

	/** @param {DeployReason} reason */
	function schedule(reason) {
		pendingReasons.add(reason);
		if (running || stopping) return;
		if (timer) clearTimeout(timer);
		timer = setTimeout(runDeployment, debounceMs);
	}

	function runDeployment() {
		timer = undefined;
		if (running || stopping || pendingReasons.size === 0) return;
		const reasons = [...pendingReasons].sort();
		pendingReasons.clear();
		running = true;
		console.log(
			`[Watcher] 开始${watchMode === 'prepare' ? '准备内容' : '部署'}：${reasons.join(',')}`
		);
		child = spawn(process.execPath, [actionScript], {
			cwd: projectRoot,
			stdio: 'inherit',
			env: {
				...process.env,
				...(watchMode === 'deploy'
					? {
							FUYAO_SOURCE_ROOT: process.env.FUYAO_SOURCE_ROOT || projectRoot,
							FUYAO_SKIP_INSTALL: '1',
							FUYAO_FAST_DEPLOY: '1'
						}
					: {}),
				FUYAO_DEPLOY_REASON: reasons.join(',')
			}
		});
		child.once('error', (error) => {
			console.error(`[Watcher] 无法启动部署：${error.message}`);
		});
		child.once('close', (code, signal) => {
			child = undefined;
			running = false;
			if (code !== 0) {
				console.error(
					`[Watcher] 处理失败：${signal ? `signal=${signal}` : `exit=${String(code)}`}`
				);
			} else {
				console.log(`[Watcher] 处理完成：${reasons.join(',')}`);
				// 相册导入会在 photos 内部移动文件；根目录无待导入照片时忽略这些自身事件。
				if (reasons.includes('albums') && !hasRootAlbumImports(albumsDirectory)) {
					pendingReasons.delete('albums');
				}
			}
			if (pendingReasons.size > 0 && !stopping) {
				timer = setTimeout(runDeployment, debounceMs);
			}
		});
	}

	/**
	 * @param {ContentScope} scope
	 * @param {string} directory
	 */
	function watch(scope, directory) {
		console.log(`[Watcher] 监听 ${scope}: ${directory}`);
		const watcher = fs.watch(directory, { recursive: true }, (event, filename) => {
			const reason = classifyContentChange(scope, filename);
			if (!reason) return;
			console.log(`[Watcher] ${event}: ${scope}/${filename}`);
			schedule(reason);
		});
		watchers.push(watcher);
	}

	/** @param {string} signal */
	function stop(signal) {
		if (stopping) return;
		stopping = true;
		console.log(`[Watcher] 收到 ${signal}，停止监听`);
		if (timer) clearTimeout(timer);
		for (const watcher of watchers) watcher.close();
		if (child) child.kill('SIGTERM');
	}

	watch('posts', postsDirectory);
	watch('albums', albumsDirectory);
	process.on('SIGUSR1', () => schedule('posts'));
	process.on('SIGUSR2', () => schedule('albums'));
	process.on('SIGTERM', () => stop('SIGTERM'));
	process.on('SIGINT', () => stop('SIGINT'));
	console.log(`[Watcher] 防抖时间：${debounceMs}ms`);
	console.log(`[Watcher] 模式：${watchMode}`);
	return { schedule, stop };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	try {
		startWatcher();
	} catch (error) {
		console.error(`[Watcher] 启动失败：${error instanceof Error ? error.message : String(error)}`);
		process.exit(1);
	}
}
