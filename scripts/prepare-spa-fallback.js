#!/usr/bin/env node
/**
 * 将预渲染页面中的真实 GlobalLoader 编译结果写入 SPA fallback。
 *
 * 200.html 在 SvelteKit 客户端启动前没有组件树；这里复用 friends 页面已经由
 * Svelte 编译和 SSR 输出的 GlobalLoader。hooks.client 会直接水合这段输出，确保
 * 首屏加载状态继续由同一个组件及其 Crossfade 生命周期管理。
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const startMarker = '<template id="fuyao-global-loader-start"></template>';
const endMarker = '<template id="fuyao-global-loader-end"></template>';
const mountMarker = '<div id="sveltekit-body" style="display: contents">';
const hydrationStart = '<!--[-->';
const hydrationEnd = '<!--]-->';

/**
 * @param {string} source
 * @param {string} marker
 * @param {string} label
 */
function requiredIndex(source, marker, label) {
	const index = source.indexOf(marker);
	if (index < 0) throw new Error(`${label}缺少标记：${marker}`);
	return index;
}

export function prepareSpaFallback(buildRoot = path.join(projectRoot, 'build')) {
	const sourcePath = path.join(buildRoot, 'friends', 'index.html');
	const fallbackPath = path.join(buildRoot, '200.html');
	if (!fs.existsSync(sourcePath)) throw new Error(`缺少 GlobalLoader 预渲染来源：${sourcePath}`);
	if (!fs.existsSync(fallbackPath)) throw new Error(`缺少 SPA fallback：${fallbackPath}`);

	const source = fs.readFileSync(sourcePath, 'utf8');
	const start = requiredIndex(source, startMarker, '预渲染页面');
	const end = requiredIndex(source, endMarker, '预渲染页面') + endMarker.length;
	if (end <= start) throw new Error('GlobalLoader 预渲染标记顺序无效');
	const loader = source.slice(start, end);

	const fallback = fs.readFileSync(fallbackPath, 'utf8');
	if (fallback.includes('id="fuyao-prerendered-loader"')) {
		throw new Error('SPA fallback 已包含预渲染 GlobalLoader');
	}
	const mountIndex = requiredIndex(fallback, mountMarker, 'SPA fallback');
	const hydratedLoader = `${hydrationStart}${loader}${hydrationEnd}`;
	const injected = `${fallback.slice(0, mountIndex)}<div id="fuyao-prerendered-loader" style="display: contents">${hydratedLoader}</div>\n\t\t${fallback.slice(mountIndex)}`;
	fs.writeFileSync(fallbackPath, injected);
	console.log('SPA fallback 已复用预渲染 GlobalLoader');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	try {
		prepareSpaFallback();
	} catch (error) {
		console.error(
			`SPA fallback 准备失败：${error instanceof Error ? error.message : String(error)}`
		);
		process.exit(1);
	}
}
