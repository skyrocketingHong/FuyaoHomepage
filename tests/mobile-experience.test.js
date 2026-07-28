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

test('移动端语言按钮保持 44px 且 Header 使用静态两级标题', () => {
	const actions = read('src/lib/components/layout/header/Actions.svelte');
	const header = read('src/lib/components/layout/header/Header.svelte');

	assert.match(actions, /class="h-11 w-11 shrink-0 md:h-9 md:w-9"/);
	assert.match(actions, /w-11 max-w-11 min-w-11 shrink-0 px-0 md:w-9 md:max-w-9 md:min-w-9/);
	assert.match(actions, /relative size-5 shrink-0 basis-5/);
	assert.match(header, /min-w-0 flex-1 shrink/);
	assert.match(header, /grid-rows-\[22px_14px\][\s\S]*<h1[^>]*truncate[^>]*text-\[19px\]/);
	assert.match(header, /text-\[12px\][^\n]*text-foreground\/60/);
	assert.doesNotMatch(header, /Marquee|autoPlay/);
	assert.match(header, /pointer-events-auto flex shrink-0 items-center/);
});

test('移动端导航始终展示六个等宽直达 Tab', () => {
	const config = read('src/lib/config/index.ts');
	const nav = read('src/lib/components/layout/nav/MobileNav.svelte');
	const dock = read('src/lib/components/layout/nav/MobileBottomDock.svelte');
	const theme = read('src/lib/styles/theme.css');
	const utilities = read('src/lib/styles/utilities.css');
	const layout = read('src/routes/+layout.svelte');
	const mainContent = read('src/lib/components/layout/content/MainContent.svelte');

	const navItemsBlock = config.match(/navItems:[^=]*= \[([\s\S]*?)\n\];/)?.[1] ?? '';
	const expectedKeys = ['home', 'footprint', 'blog', 'album', 'pay', 'friends'];
	assert.deepEqual(
		[...navItemsBlock.matchAll(/i18nKey: 'nav\.([^']+)'/g)].map((match) => match[1]),
		expectedKeys
	);
	assert.equal((navItemsBlock.match(/href:/g) ?? []).length, 6);
	assert.match(navItemsBlock, /href: '\/pay\/'/);
	assert.match(navItemsBlock, /href: '\/friends\/'/);
	assert.match(nav, /liveBackdrop/);
	assert.match(nav, /contentLayout="fill"/);
	assert.match(nav, /contentClass="h-full w-full !p-0"/);
	assert.match(nav, /mobile-dock-capsule[^"]*!p-0/);
	assert.match(nav, /<nav class="h-full w-full p-0">/);
	assert.match(nav, /class="grid h-full w-full items-center p-0"/);
	assert.match(nav, /repeat\(\{navItems\.length\}, minmax\(0, 1fr\)\)/);
	assert.match(
		nav,
		/\{#each navItems as item \(item\.href\)\}[\s\S]*<a[\s\S]*href=\{resolve\(item\.href/
	);
	assert.doesNotMatch(nav, /MoreSheet|nav\.more|<button|overflow-x/);
	assert.match(nav, /active:scale-\[0\.97\]/);
	assert.match(
		dock,
		/right-\[var\(--content-inline-inset\)\][\s\S]*left-\[var\(--content-inline-inset\)\]/
	);
	assert.match(theme, /--content-inline-inset: 8px/);
	assert.match(theme, /@media \(min-width: 768px\)[\s\S]*--content-inline-inset: 16px/);
	assert.match(mainContent, /px-\[var\(--content-inline-inset\)\]/);
	assert.match(theme, /--mobile-nav-height: 64px/);
	assert.match(theme, /--mobile-dock-capsule-radius: 28px/);
	assert.doesNotMatch(theme, /--mobile-nav-inline-inset/);
	assert.match(theme, /--mobile-nav-item-min-size: 44px/);
	assert.match(theme, /--mobile-nav-indicator-inset: 4px/);
	assert.match(theme, /--mobile-nav-indicator-radius: 24px/);
	assert.match(
		utilities,
		/\.mobile-nav-indicator[\s\S]*box-shadow: none[\s\S]*backdrop-filter: none/
	);
	assert.match(utilities, /\.mobile-nav-label[\s\S]*font-size: 11px[\s\S]*white-space: nowrap/);
	assert.match(utilities, /@media \(max-width: 359px\)[\s\S]*font-size: 10px/);
	assert.match(
		utilities,
		/\.mobile-dock-capsule\s*\{[\s\S]*--glass-saturation: 0\.9[\s\S]*background: var\(--glass-surface\)[\s\S]*box-shadow: 0 10px 30px var\(--mobile-dock-capsule-shadow\)/
	);
	assert.match(
		utilities,
		/\.mobile-dock-capsule \.liquid-glass-edge--chrome-bottom::before[\s\S]*border: 1px solid var\(--mobile-dock-capsule-edge\)/
	);
	assert.match(dock, /variant="chrome"/);
	assert.match(dock, /chromeEdge="bottom"/);
	assert.match(dock, /liveBackdrop/);
	assert.match(dock, /showGloss=\{false\}/);
	assert.match(dock, /contentLayout="fill"/);
	assert.match(dock, /mobile-dock-capsule[^"]*--mobile-bottom-info-height/);
	assert.doesNotMatch(dock, /rounded-\[14px\]|bg-\[var\(--glass-surface\)\]/);
	const navItemRule = utilities.match(/\.mobile-nav-item\s*\{([\s\S]*?)\}/)?.[1] ?? '';
	assert.doesNotMatch(navItemRule, /padding|backdrop-filter|box-shadow|border:/);
	assert.doesNotMatch(dock, /class="[^"]*\bpx-/);
	assert.match(layout, /\{#if !lightboxState\.isOpen\}[\s\S]*<MobileBottomDock \/>/);
	assert.doesNotMatch(layout, /<BottomInfo/);

	for (const viewportWidth of [320, 375, 390, 430]) {
		const itemWidth = (viewportWidth - 8 * 2) / 6;
		assert.ok(itemWidth >= 44, `${viewportWidth}px 视口下单项宽度不得小于 44px`);
	}
});

test('固定 Dock 使用统一净空且足迹控件保留高德版权避让', () => {
	const theme = read('src/lib/styles/theme.css');
	const dock = read('src/lib/components/layout/nav/MobileBottomDock.svelte');
	const footprint = read('src/routes/footprint/+page.svelte');
	const rootLayout = read('src/routes/+layout.svelte');

	for (const token of [
		'--mobile-bottom-info-height',
		'--mobile-dock-gap',
		'--mobile-dock-bottom-inset',
		'--mobile-dock-clearance'
	]) {
		assert.match(theme, new RegExp(token));
	}
	assert.match(dock, /<MobileNav \/>[\s\S]*<BottomInfo/);
	assert.match(rootLayout, /h-\[var\(--mobile-dock-clearance\)\]/);
	assert.match(footprint, /bottom-\[var\(--mobile-dock-clearance\)\]/);
	assert.match(footprint, /<MapCopyright/);
});

test('支付页统一信息卡与圆角层级，按断点切换 Wallet 栈和宽屏主从布局', () => {
	const page = read('src/routes/pay/+page.svelte');
	const wallet = read('src/lib/components/pay/QRCodeCard.svelte');
	const pass = read('src/lib/components/pay/WalletPass.svelte');
	const intro = read('src/lib/components/pay/PaymentIntro.svelte');
	const config = read('src/lib/config/index.ts');
	const theme = read('src/lib/styles/theme.css');
	const paymentSources = [page, wallet, pass, intro].join('\n');

	assert.doesNotMatch(page, /bg-gradient-to-r/);
	assert.doesNotMatch(page, /\bpx-(?:3|4)\b|md:px-/);
	assert.match(page, /h-\[calc\(100%-var\(--mobile-dock-clearance\)\)\]/);
	assert.match(page, /max-w-\[var\(--payment-content-max-width\)\]/);
	assert.match(page, /<PaymentIntro \/>/);
	assert.match(intro, /rounded-xl !p-3/);
	assert.equal((intro.match(/pay\.card\.purpose/g) ?? []).length, 1);
	assert.equal((intro.match(/pay\.card\.local_qr/g) ?? []).length, 1);
	assert.match(intro, /flex min-w-0 items-start gap-3 text-left/);
	assert.match(intro, /size-11 shrink-0[\s\S]*rounded-\[12px\][\s\S]*<WalletCards size=\{22\}/);
	assert.match(intro, /text-\[15px\] leading-5 font-semibold/);
	assert.match(intro, /text-xs leading-\[17px\] text-foreground\/65/);
	assert.doesNotMatch(intro, /mx-auto|text-center|flex-col/);
	assert.doesNotMatch(intro, /local_status|payment-intro-status/);
	assert.doesNotMatch(intro, /Marquee|overflow-x|animate-/);

	assert.doesNotMatch(wallet, /pay\.card\.(?:purpose|local_qr)|pay\.ticket\.title|LiquidGlass/);
	assert.match(
		wallet,
		/wallet-pass-stack relative mx-auto h-full min-h-0 w-full max-w-\[460px\] lg:hidden/
	);
	assert.match(wallet, /mode="mobile-stack"[\s\S]*expanded=\{selectedIndex === index\}/);
	assert.match(wallet, /selectedIndex = \$state<number \| null>\(null\)/);
	assert.match(wallet, /findIndex\(\(payment\) => payment\.linkAvailable\)/);
	assert.match(wallet, /activeIndex = \$derived\(selectedIndex \?\? defaultIndex\)/);
	assert.match(wallet, /selectedPosition=\{processedPayments\.length - 1\}/);
	assert.match(wallet, /--wallet-stack-step: clamp\(44px, 7dvh, 52px\)/);
	assert.match(wallet, /color: \{ dark: '#000000', light: '#ffffff' \}/);
	assert.match(wallet, /margin: 0/);
	assert.match(wallet, /event\.key === 'Escape'/);
	assert.match(wallet, /wallet-desktop-workspace hidden h-full min-h-0 w-full lg:grid/);
	assert.match(wallet, /wallet-method-list flex min-h-0 flex-col gap-3/);
	assert.match(wallet, /mode="desktop-summary"/);
	assert.match(wallet, /mode="desktop-detail"/);
	assert.match(wallet, /<Crossfade key=\{activeIndex\} duration=\{180\}/);
	assert.match(page, /pay\.states\.load_error/);
	assert.match(wallet, /<StatusState[\s\S]*layout="viewport"/);
	assert.match(pass, /pay\.states\.qr_error/);
	assert.match(theme, /--payment-content-max-width: 460px/);
	assert.match(theme, /--payment-desktop-list-width: 340px/);
	assert.match(theme, /--payment-desktop-detail-width: 420px/);
	assert.match(theme, /--payment-workspace-gap: 20px/);
	assert.match(
		theme,
		/@media \(min-width: 1024px\)[\s\S]*--payment-content-max-width: calc\([\s\S]*--payment-desktop-list-width[\s\S]*--payment-desktop-detail-width/
	);
	assert.match(
		wallet,
		/grid-template-columns:[\s\S]*--payment-desktop-list-width[\s\S]*--payment-desktop-detail-width/
	);
	assert.doesNotMatch(paymentSources, /auto-fit|auto-fill|repeat\(/);

	assert.match(pass, /WalletPassMode = 'mobile-stack' \| 'desktop-summary' \| 'desktop-detail'/);
	assert.match(pass, /rounded-2xl bg-\[var\(--payment-color\)\]/);
	assert.match(pass, /aria-expanded=\{expanded\}/);
	assert.match(pass, /aria-controls=\{`payment-panel-\$\{index\}`\}/);
	assert.match(pass, /h-\[68px\][^\n]*min-h-11/);
	assert.match(pass, /size-10[\s\S]*<IconComponent size=\{22\}/);
	assert.match(pass, /flex min-w-0 flex-1 flex-col items-start text-left/);
	assert.match(
		pass,
		/wallet-summary-button--selected[\s\S]*brightness\(1\.07\)[\s\S]*scale\(1\.012\)/
	);
	assert.match(pass, /grid-template-rows: 68px minmax\(0, 1fr\)/);
	assert.match(pass, /grid-template-rows: auto minmax\(0, 1fr\) 48px/);
	assert.match(pass, /padding: 12px/);
	assert.match(pass, /qr-scan-zone[\s\S]*rounded-\[12px\] bg-white/);
	assert.match(pass, /h-12 w-full[\s\S]*rounded-xl/);
	assert.match(pass, /transform 300ms[\s\S]*height 300ms/);
	assert.match(pass, /prefers-reduced-motion: reduce/);
	assert.match(pass, /background: var\(--payment-icon-surface\)/);
	assert.match(pass, /max-width: 359px[\s\S]*max-height: 620px[\s\S]*grid-template-columns: 152px/);
	assert.match(wallet, /max-width: 359px[\s\S]*max-height: 620px[\s\S]*--wallet-qr-size: 128px/);
	assert.match(wallet, /min-width: 1024px[\s\S]*clamp\(180px, min\(22vw, 28dvh\), 220px\)/);
	assert.match(pass, /orientation: landscape[\s\S]*max-height: 600px/);
	assert.match(
		wallet,
		/orientation: landscape[\s\S]*--wallet-qr-size: clamp\(128px, 26vw, 160px\)/
	);

	assert.doesNotMatch(
		paymentSources,
		/scrollIntoView|scrollTo\(|overflow-[xy]-(?:auto|scroll)|margin-inline|width:\s*calc\(100%/
	);
	assert.doesNotMatch(paymentSources, /rounded-\[24px\]|--payment-card-radius:\s*24px/);
	const payBlock = config.match(/i18nKey: 'nav\.pay'[\s\S]*?\n\t\},/)?.[0] ?? '';
	assert.match(payBlock, /contentScrollable: false/);
});

test('固定底部信息保持居中紧凑两列四条静态省略单行', () => {
	const bottomInfo = read('src/lib/components/layout/bottom-info/BottomInfo.svelte');
	const backgroundInfo = read('src/lib/components/layout/bottom-info/BackgroundInfo.svelte');
	const service = read('src/lib/components/layout/bottom-info/ServiceStatus.svelte');
	const copyright = read('src/lib/components/layout/bottom-info/CopyrightText.svelte');
	const mosaic = read('src/lib/components/ui/background/MosaicInfo.svelte');
	const theme = read('src/lib/styles/theme.css');
	const sources = [bottomInfo, backgroundInfo, service, copyright, mosaic].join('\n');

	assert.match(bottomInfo, /bottom-info-compact-grid/);
	assert.match(bottomInfo, /width: 100%/);
	assert.match(bottomInfo, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
	assert.match(bottomInfo, /column-gap: 14px/);
	assert.equal((bottomInfo.match(/grid-rows-\[13px_13px\]/g) ?? []).length, 2);
	assert.equal(
		(copyright.match(/h-\[13px\][^\n]*min-w-0[^\n]*overflow-hidden[^\n]*whitespace-nowrap/g) ?? [])
			.length,
		2
	);
	assert.match(theme, /--mobile-bottom-info-height: 38px/);
	assert.doesNotMatch(sources, /Marquee|autoPlay|measurementKey/);
	assert.ok((sources.match(/title=\{/g) ?? []).length >= 5);
	assert.ok((sources.match(/aria-label=\{/g) ?? []).length >= 5);
	assert.ok((sources.match(/truncate/g) ?? []).length >= 5);
	assert.doesNotMatch(sources, /flex-wrap|break-all|whitespace-normal/);
	assert.doesNotMatch(bottomInfo, /grid-cols-2|justify-between/);
	assert.doesNotMatch(service, /\bflex-1\b/);
	assert.match(copyright, /justify-end[^\n]*text-right/);
	assert.doesNotMatch(copyright, /\bflex-1\b/);
});

test('viewport 状态使用实际可用区域并声明式关闭 MainContent 滚动', () => {
	const status = read('src/lib/components/ui/feedback/StatusState.svelte');
	const loading = read('src/lib/components/ui/feedback/LoadingState.svelte');
	const mainContent = read('src/lib/components/layout/content/MainContent.svelte');
	const rootLayout = read('src/routes/+layout.svelte');
	const theme = read('src/lib/styles/theme.css');
	const albumGrid = read('src/lib/components/albums/AlbumGrid.svelte');
	const albumPage = read('src/routes/albums/[...path]/+page.svelte');
	const blogEmpty = read('src/lib/components/blog/home/EmptyState.svelte');
	const blogSearch = read('src/lib/components/blog/search/Search.svelte');
	const errorPage = read('src/routes/+error.svelte');
	const viewportSources = [albumGrid, albumPage, blogEmpty, errorPage].join('\n');

	assert.match(status, /layout\?: 'viewport' \| 'embedded'/);
	assert.match(status, /data-status-layout=\{layout\}/);
	assert.match(status, /viewport-state-region/);
	assert.match(status, /max-w-\[520px\][^\n]*rounded-\[24px\][^\n]*!p-5[^\n]*md:!p-6/);
	assert.match(status, /size-12/);
	assert.match(status, /text-\[44px\]/);
	assert.doesNotMatch(status, /size-20|text-6xl|justify-between|overflow-[xy]-auto/);
	assert.match(mainContent, /:has\(\[data-status-layout='viewport'\]\)/);
	assert.match(mainContent, /overflow-y: hidden !important/);
	assert.match(mainContent, /\[data-main-content-spacer\]/);
	assert.match(rootLayout, /data-main-content-spacer/);
	assert.match(theme, /\.viewport-state-region[\s\S]*--main-content-top-inset/);
	assert.match(theme, /bottom: var\(--viewport-state-bottom-clearance\)/);
	assert.match(loading, /data-status-layout="viewport"/);
	assert.match(loading, /viewport-state-region/);
	assert.ok((viewportSources.match(/layout="viewport"/g) ?? []).length >= 4);
	assert.equal((blogSearch.match(/layout="embedded"/g) ?? []).length, 2);
	assert.doesNotMatch(
		[status, albumGrid, blogEmpty, blogSearch].join('\n'),
		/min-h-\[(?:24|28)rem\]/
	);
});

test('编程统计仅以真实每日明细绘制堆叠柱并提供中性回退', () => {
	const coding = read('src/lib/components/home/content/CodingActivity.svelte');

	assert.match(coding, /languages\?: DailyLanguageEntry\[\]/);
	assert.match(coding, /getLanguageSeconds\(language\)/);
	assert.match(coding, /hasDailyLanguageData/);
	assert.match(coding, /NEUTRAL_BAR_COLOR/);
	assert.match(coding, /daily_breakdown_unavailable/);
	assert.match(coding, /aria-label=\{getDayAriaLabel\(day\)\}/);
	assert.doesNotMatch(coding, /bg-teal-400/);
});
