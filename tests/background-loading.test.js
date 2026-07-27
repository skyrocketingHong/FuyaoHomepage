import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** @param {string} relativePath */
function read(relativePath) {
	return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
}

test('全屏加载页显式居中 BottomInfo，默认布局继续左对齐', () => {
	const loadingState = read('src/lib/components/ui/feedback/LoadingState.svelte');
	const bottomInfo = read('src/lib/components/layout/bottom-info/BottomInfo.svelte');
	const serviceStatus = read('src/lib/components/layout/bottom-info/ServiceStatus.svelte');
	const copyrightText = read('src/lib/components/layout/bottom-info/CopyrightText.svelte');

	assert.match(loadingState, /<BottomInfo direction="vertical" alignment="center" \/>/);
	assert.match(loadingState, /bottom: max\(16px, env\(safe-area-inset-bottom\)\)/);
	assert.match(bottomInfo, /alignment = 'start'/);
	assert.match(bottomInfo, /<ServiceStatus \{direction\} \{alignment\} \/>/);
	assert.match(bottomInfo, /<CopyrightText \{direction\} \{alignment\} \/>/);
	assert.match(serviceStatus, /'justify-center text-center' : 'justify-start text-left'/);
	assert.match(copyrightText, /'justify-center text-center' : 'justify-start text-left'/);
});

test('背景加载状态使用可重入事务并拒绝过期完成回调', () => {
	const appStore = read('src/lib/stores/app.svelte.ts');

	assert.match(appStore, /export type BackgroundLoadingKind = 'initial' \| 'resize'/);
	assert.match(appStore, /const id = \+\+this\.loadingSequence/);
	assert.match(appStore, /this\.activeLoadingId === id/);
	assert.match(appStore, /if \(!this\.isLoading\(id\)\) return false/);
	assert.match(appStore, /this\.loadingKind = null/);
});

test('马赛克尺寸事务先显示加载页，防抖后绘制并在提交帧后结束', () => {
	const mosaic = read('src/lib/components/ui/background/MosaicBackground.svelte');
	const rebuildStart = mosaic.indexOf('async function rebuildForSize');
	const waitForLoader = mosaic.indexOf('await waitForLoaderPaint()', rebuildStart);
	const resizeCanvas = mosaic.indexOf('initGrid(false, true)', rebuildStart);
	const waitForCommit = mosaic.indexOf('await waitForCanvasCommit()', resizeCanvas);
	const finishResize = mosaic.indexOf('finishResize(sequence, loadingId)', waitForCommit);

	assert.match(mosaic, /const RESIZE_DEBOUNCE_MS = 175/);
	assert.match(mosaic, /const RESIZE_EPSILON_PX = 2/);
	assert.match(mosaic, /const RESIZE_FALLBACK_MS = 2500/);
	assert.match(mosaic, /const loadingId = backgroundState\.beginLoading\('resize'\)/);
	assert.match(mosaic, /sequence === resizeSequence/);
	assert.match(mosaic, /backgroundState\.isLoading\(loadingId, 'resize'\)/);
	assert(waitForLoader > rebuildStart);
	assert(resizeCanvas > waitForLoader);
	assert(waitForCommit > resizeCanvas);
	assert(finishResize > waitForCommit);
	assert.doesNotMatch(mosaic, /readyNotified/);
});

test('马赛克尺寸失败保留有效画面，并清理观察器、帧和计时器', () => {
	const mosaic = read('src/lib/components/ui/background/MosaicBackground.svelte');

	assert.match(mosaic, /captureCanvasSnapshot\(\)/);
	assert.match(mosaic, /restoreCanvasSnapshot\(snapshot\)/);
	assert.match(mosaic, /resizeObserver\.disconnect\(\)/);
	assert.match(mosaic, /for \(const frameId of pendingFrameIds\) cancelAnimationFrame\(frameId\)/);
	assert.match(mosaic, /clearTimeout\(resizeDebounceTimer\)/);
	assert.match(mosaic, /clearTimeout\(resizeFallbackTimer\)/);
	assert.doesNotMatch(mosaic, /fetch\(/);
});
