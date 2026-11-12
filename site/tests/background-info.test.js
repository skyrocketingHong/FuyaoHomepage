import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
	MTR_LINES,
	MTR_PRESETS_DAY,
	MTR_PRESETS_NIGHT,
	findMtrStation,
	getMtrLineStations,
	getMtrStationDetails
} from '../src/lib/config/mosaic.ts';
import {
	createBingMetadataUrl,
	parseBingWallpaperMetadata
} from '../src/lib/utils/domain/wallpaper.ts';

/** @param {string} relativePath */
function read(relativePath) {
	return fs.readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
}

/** @param {string} name */
function requireStationDetails(name) {
	const details = getMtrStationDetails(name);
	assert.ok(details);
	return details;
}

test('港铁线路区段只引用已知预设并覆盖全部可选背景', () => {
	const routeStations = new Set(MTR_LINES.flatMap((line) => line.routes.flat()));
	for (const name of routeStations) assert.ok(findMtrStation(name), `缺少站点预设：${name}`);
	for (const station of [...MTR_PRESETS_DAY, ...MTR_PRESETS_NIGHT]) {
		assert.ok(routeStations.has(station.name), `车站未纳入线路：${station.name}`);
	}
});

test('终点站与换乘站分别返回正确的线路和邻站', () => {
	const central = requireStationDetails('Central');
	const tsuenWan = central.lines.find((detail) => detail.line.id === 'tsuen-wan');
	const island = central.lines.find((detail) => detail.line.id === 'island');
	assert.ok(tsuenWan);
	assert.ok(island);
	assert.deepEqual(tsuenWan.previous, []);
	assert.deepEqual(
		tsuenWan.next.map((station) => station.name),
		['Admiralty']
	);
	assert.deepEqual(
		island.previous.map((station) => station.name),
		['Sheung Wan']
	);
	assert.deepEqual(
		island.next.map((station) => station.name),
		['Admiralty']
	);

	const hoManTin = requireStationDetails('Ho Man Tin');
	assert.deepEqual(
		hoManTin.lines.map((detail) => detail.line.id),
		['kwun-tong', 'tuen-ma']
	);
	assert.equal(getMtrStationDetails('Unknown Station'), null);
});

test('将军澳线与东铁线分支不会混入其他区段', () => {
	const tseungKwanO = requireStationDetails('Tseung Kwan O');
	assert.deepEqual(
		tseungKwanO.lines[0].next.map((station) => station.name),
		['Hang Hau', 'LOHAS Park']
	);
	const foTan = requireStationDetails('Fo Tan').lines[0];
	assert.deepEqual(
		foTan.previous.map((station) => station.name),
		['Sha Tin']
	);
	assert.deepEqual(
		foTan.next.map((station) => station.name),
		['University']
	);
	const racecourse = requireStationDetails('Racecourse').lines[0];
	assert.deepEqual(
		racecourse.previous.map((station) => station.name),
		['Sha Tin']
	);
	assert.deepEqual(
		racecourse.next.map((station) => station.name),
		['University']
	);
});

test('线路车站去重且站点预设按主题优先取色', () => {
	const line = MTR_LINES.find((item) => item.id === 'tseung-kwan-o');
	assert.ok(line);
	const stations = getMtrLineStations(line).map((station) => station.name);
	assert.equal(stations.filter((name) => name === 'Tseung Kwan O').length, 1);
	const dayStation = findMtrStation('Tung Chung', false);
	const nightStation = findMtrStation('Tung Chung', true);
	assert.ok(dayStation);
	assert.ok(nightStation);
	assert.equal(dayStation.color, '#6A5ACD');
	assert.equal(nightStation.color, '#274060');
});

test('Bing 扁平与官方嵌套响应均经过规范化和安全 URL 校验', () => {
	assert.deepEqual(
		parseBingWallpaperMetadata({
			start_date: '20261109',
			url: 'https://www.bing.com/th?id=example.jpg',
			copyright: 'Example copyright',
			copyright_link: 'https://www.bing.com/search?q=example'
		}),
		{
			title: undefined,
			imageUrl: 'https://www.bing.com/th?id=example.jpg',
			startDate: '2026-11-09',
			endDate: undefined,
			copyright: 'Example copyright',
			copyrightLink: 'https://www.bing.com/search?q=example'
		}
	);
	const official = parseBingWallpaperMetadata({
		images: [
			{ startdate: '20261109', url: '/th?id=example.jpg', copyrightlink: '/search?q=example' }
		]
	});
	assert.equal(official.imageUrl, 'https://www.bing.com/th?id=example.jpg');
	assert.equal(official.copyrightLink, 'https://www.bing.com/search?q=example');
	assert.equal(
		parseBingWallpaperMetadata({ copyright: 'safe', url: 'javascript:alert(1)' }).imageUrl,
		undefined
	);
	assert.throws(() => parseBingWallpaperMetadata({}), /Empty Bing wallpaper metadata/);
});

test('Bing 元数据 URL 保留查询参数并同步界面市场', () => {
	const url = new URL(createBingMetadataUrl('https://example.com/bing?format=json', 'en-US'));
	assert.equal(url.searchParams.get('format'), 'json');
	assert.equal(url.searchParams.get('mkt'), 'en-US');
});

test('来源入口打开全屏信息且港铁文字按站交叉淡化', () => {
	const mosaic = read('src/lib/components/ui/background/MosaicInfo.svelte');
	const bing = read('src/lib/components/ui/background/BingWallpaperInfo.svelte');
	const layout = read('src/routes/+layout.svelte');
	const overlay = read('src/lib/components/layout/background/BackgroundInfoOverlay.svelte');

	assert.match(mosaic, /resolve\('\/background\/mtr\/'\)/);
	assert.match(mosaic, /key=\{`\$\{station\.name\}:\$\{\$locale\}`\}/);
	assert.match(bing, /resolve\('\/background\/wallpaper\/'\)/);
	assert.match(layout, /inert=\{backgroundInfoState\.isOpen\}/);
	assert.match(layout, /backgroundInfoState\.isOpen \? 'opacity-0' : 'opacity-100'/);
	assert.match(layout, /<BackgroundInfoOverlay \/>/);
	assert.match(overlay, /role="dialog"/);
	assert.match(
		overlay,
		/in:fade=\{\{ duration: reducedMotion \? 0 : 240, delay: reducedMotion \? 0 : 200 \}\}/
	);
});

test('全局 SidebarState 注入一级线路并以横向站台卡片切换当前画布', () => {
	const overlay = read('src/lib/components/layout/background/BackgroundInfoOverlay.svelte');
	const sidebar = read('src/lib/components/layout/sidebar/Sidebar.svelte');
	const sidebarTree = read('src/lib/components/layout/sidebar/SidebarTree.svelte');
	const sidebarItem = read('src/lib/components/layout/sidebar/Item.svelte');
	const styles = read('src/lib/styles/components.css');
	const mosaic = read('src/lib/components/ui/background/MosaicBackground.svelte');
	const store = read('src/lib/stores/mosaic.svelte.ts');

	assert.match(overlay, /sidebarState\.setList\(\s*SidebarTree/);
	assert.match(overlay, /hideRoot: true/);
	assert.match(overlay, /sidebarState\.listTitleIcon = previousList\.titleIcon/);
	assert.match(sidebar, /TitleIcon = sidebarState\.listTitleIcon/);
	assert.match(sidebarTree, /hideRoot = false/);
	assert.match(sidebarItem, /labelEn\?: string/);
	assert.match(sidebarItem, /color\?: string/);
	assert.match(overlay, /labelEn: line\.name/);
	assert.match(overlay, /color: line\.color/);
	assert.match(overlay, /sidebarState\.updateList\(injectedListId/);
	assert.match(overlay, /activeId: selectedLineId,\s+hideRoot: true/);
	assert.match(overlay, /sidebarState\.currentListId = previousList\.id/);
	assert.match(overlay, /sidebarState\.isListPinned = previousList\.isListPinned/);
	assert.match(sidebar, /if \(sidebarState\.isListPinned\) return/);
	assert.match(overlay, /<Sidebar showNavigation=\{false\} \/>/);
	assert.match(sidebar, /showNavigation = true/);
	assert.match(sidebar, /\{#if showNavigation\}/);
	assert.match(overlay, /md:h-\[100dvh\]/);
	assert.match(overlay, /if \(!selectedLineId && lines\?\.length\)/);
	assert.doesNotMatch(
		overlay,
		/listComponent=\{SidebarTree\}|background-info-title|backdrop-blur-md|absolute top-3 right-3/
	);
	assert.match(overlay, /id="mtr-line-detail"/);
	assert.match(overlay, /\{#each selectedLineStations as station \(station\.name\)\}/);
	assert.match(overlay, /data-station-name=\{station\.name\}/);
	assert.match(overlay, /onclick=\{\(\) => selectStation\(station\.name\)\}/);
	assert.match(overlay, /centerActiveStation/);
	assert.match(overlay, /showStart=\{stationsShowStart\}/);
	assert.match(overlay, /showEnd=\{stationsShowEnd\}/);
	assert.doesNotMatch(overlay, /bg-background\/35/);
	assert.match(styles, /MTRSong/);
	assert.match(styles, /Myriad Pro Semibold/);
	assert.match(store, /selectedStationName = \$state\(''\)/);
	assert.match(mosaic, /fixedStation \|\| mosaicState\.selectedStationName/);
	assert.match(mosaic, /mosaicState\.currentStation\?\.name === requestedStation/);
});

test('背景信息直达路由驱动对应视图并锁定背景模式', () => {
	const layout = read('src/routes/+layout.svelte');
	const config = read('src/lib/config/index.ts');
	const mtrRoute = read('src/routes/background/mtr/+page.svelte');
	const wallpaperRoute = read('src/routes/background/wallpaper/+page.svelte');

	assert.match(layout, /getBackgroundInfoSource\(page\.url\.pathname\)/);
	assert.match(
		config,
		/startsWith\('\/background\/mtr'\)\) return \{ mode: 'mosaic', switchable: false \}/
	);
	assert.match(
		config,
		/startsWith\('\/background\/wallpaper'\)\) return \{ mode: 'image', switchable: false \}/
	);
	assert.match(mtrRoute, /港铁背景信息直达路由/);
	assert.match(wallpaperRoute, /Bing 壁纸信息直达路由/);
});

test('横向站点支持滚轮且窄屏通过底部 Tab 打开同一注入列表', () => {
	const overlay = read('src/lib/components/layout/background/BackgroundInfoOverlay.svelte');
	const mobileNav = read('src/lib/components/layout/nav/MobileNav.svelte');

	assert.match(overlay, /function handleStationsWheel/);
	assert.match(overlay, /event\.preventDefault\(\)/);
	assert.match(overlay, /onwheel=\{handleStationsWheel\}/);
	assert.match(overlay, /<MobileBottomDock \/>/);
	assert.match(overlay, /<MobileDrawer \/>/);
	assert.match(mobileNav, /sidebarState\.listComponent \? 1 : 0/);
	assert.match(mobileNav, /sidebarState\.toggleMobileDrawer\(\)/);
	assert.match(mobileNav, /aria-expanded=\{sidebarState\.isMobileDrawerOpen\}/);
});

test('壁纸详情使用当前已加载图片的真实地址而非随机 API 地址', () => {
	const background = read('src/lib/components/layout/background/BackgroundLayer.svelte');
	const lazyImage = read('src/lib/components/ui/display/LazyImage.svelte');
	const overlay = read('src/lib/components/layout/background/BackgroundInfoOverlay.svelte');

	assert.match(background, /image\.currentSrc \|\| image\.src/);
	assert.match(background, /backgroundInfoState\.setWallpaperUrl\(''\)/);
	assert.match(lazyImage, /onload\?\.\(event\)/);
	assert.match(
		overlay,
		/backgroundInfoState\.wallpaperUrl \|\| metadata\?\.imageUrl \|\| wallpaperApi/
	);
});
