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

test('图片背景直接使用 Bing 图片端点及移动竖屏 mini 变体', () => {
	const background = read('src/lib/components/layout/background/BackgroundLayer.svelte');
	const exampleConfig = read('config/site.example.yaml');

	assert.match(exampleConfig, /apiUrl: https:\/\/api\.imyan\.ren\/bing\/wallpaper/);
	assert.match(background, /const wallpaperApi = publicConfig\.services\.wallpaper\.apiUrl/);
	assert.match(background, /const url = new URL\(apiUrl\)/);
	assert.match(background, /url\.searchParams\.set\('type', 'mini'\)/);
	assert.match(background, /src=\{activeUrl\}/);
	assert.match(background, /srcset: mobileUrl/);
	assert.match(background, /media: '\(max-width: 767px\) and \(orientation: portrait\)'/);
	assert.doesNotMatch(background, /fetch\(wallpaperApi\)/);
	assert.doesNotMatch(background, /\.text\(\)/);
});

test('全局图片背景为高优先级 cover，普通图片默认保持懒加载', () => {
	const background = read('src/lib/components/layout/background/BackgroundLayer.svelte');
	const lazyImage = read('src/lib/components/ui/display/LazyImage.svelte');

	assert.match(background, /fit="cover"/);
	assert.match(background, /loading="eager"/);
	assert.match(background, /fetchpriority="high"/);
	assert.match(background, /decoding="async"/);
	assert.match(lazyImage, /loading = 'lazy'/);
	assert.match(lazyImage, /decoding = 'async'/);
	assert.match(lazyImage, /<picture\b/);
	assert.match(lazyImage, /{#each sources as source\b/);
});

test('Bing 失败切换默认壁纸，两级失败回退主题纯色并结束加载事务', () => {
	const background = read('src/lib/components/layout/background/BackgroundLayer.svelte');
	const fallbackBranch = background.indexOf('if (!usingFallback && spotlightUrl)');
	const fallbackAssignment = background.indexOf('usingFallback = true', fallbackBranch);
	const failedFallbackAssignment = background.indexOf(
		'failedFallbackUrl = spotlightUrl',
		fallbackAssignment
	);
	const finishLoading = background.indexOf('finishLoading()', failedFallbackAssignment);

	assert.match(background, /let usingFallback = \$state/);
	assert.match(background, /let imageUnavailable = \$derived/);
	assert(fallbackBranch >= 0);
	assert(fallbackAssignment > fallbackBranch);
	assert(failedFallbackAssignment > fallbackAssignment);
	assert(finishLoading > failedFallbackAssignment);
	assert.match(background, /{#if imageUnavailable}[\s\S]*bg-background/);
	assert.match(background, /setTimeout\(\(\) => \{[\s\S]*finishLoading\(\)[\s\S]*\}, 2500\)/);
});

test('Bing 来源仅在 API 图片成功后按所有权注入并提供完整国际化语义', () => {
	const background = read('src/lib/components/layout/background/BackgroundLayer.svelte');
	const info = read('src/lib/components/ui/background/BingWallpaperInfo.svelte');
	const zh = read('src/lib/i18n/locales/zh-CN.json');
	const en = read('src/lib/i18n/locales/en-US.json');

	assert.match(background, /loadedBingSession\s*=\s*[\s\S]*!usingFallback[\s\S]*imageSession/);
	assert.match(
		background,
		/mode === 'image'[\s\S]*loadedBingSession === imageSession[\s\S]*!usingFallback/
	);
	assert.match(
		background,
		/sidebarState\.setExtraInfo\(BingWallpaperInfo, \{\}, 'bing-wallpaper'\)/
	);
	assert.match(background, /return \(\) => sidebarState\.clearExtraInfo\(id\)/);
	assert.match(background, /function handleError\(\) \{\s*loadedBingSession = null/);
	assert.match(info, /data-simple-icon="microsoftbing"/);
	assert.match(info, /viewBox="0 0 24 24"/);
	assert.match(info, /fill="currentColor"/);
	assert.doesNotMatch(info, /lucide-svelte|ImageIcon/);
	assert.match(info, /title=\{label\}/);
	assert.match(info, /aria-label=\{label\}/);
	assert.match(info, /text-\[10px\]/);
	assert.match(info, /text-\[12px\]/);
	assert.match(info, /truncate/);
	assert.doesNotMatch(info, /Marquee|autoPlay|whitespace-normal|flex-wrap/);
	assert.match(zh, /"bing_wallpaper": "Bing 每日壁纸"/);
	assert.match(en, /"bing_wallpaper": "Bing Daily Wallpaper"/);
});

test('非图片背景分支不包含 Bing 图片元素或壁纸请求', () => {
	const background = read('src/lib/components/layout/background/BackgroundLayer.svelte');
	const imageBranch = background.indexOf('<!-- 默认/图片模式 -->');

	assert(imageBranch >= 0);
	assert.equal(background.slice(0, imageBranch).includes('<LazyImage'), false);
	assert.doesNotMatch(background, /\bfetch\(/);
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
