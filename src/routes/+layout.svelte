<script lang="ts">
	/**
	 * 全局根布局组件
	 *
	 * 负责应用的基础骨架搭建，处理响应式导航、侧边栏、全局加载状态及 SEO 逻辑。
	 */
	import '$lib/styles/app.css';

	import { navItems, getBackgroundPolicy, getContentScrollable } from '$lib/config/index';
	import type { BackgroundMode } from '$lib/config/index';
	import { page, navigating } from '$app/state';
	import { backgroundState, layoutState, sidebarState } from '$lib/stores/app.svelte';
	import { t } from '$lib/i18n/store';
	import { fade } from 'svelte/transition';

	// 引入新的模块化组件
	import BackgroundLayer from '$lib/components/layout/background/BackgroundLayer.svelte';
	import GlobalLoader from '$lib/components/layout/loader/GlobalLoader.svelte';
	import LoadingSpinner from '$lib/components/ui/feedback/LoadingSpinner.svelte';

	import MobileNav from '$lib/components/layout/nav/MobileNav.svelte';
	import BottomInfo from '$lib/components/layout/bottom-info/BottomInfo.svelte';
	import MobileDrawer from '$lib/components/layout/header/drawer/Drawer.svelte';
	import Sidebar from '$lib/components/layout/sidebar/Sidebar.svelte';
	import Header from '$lib/components/layout/header/Header.svelte';
	import HeaderChrome from '$lib/components/layout/header/HeaderChrome.svelte';
	import MainContent from '$lib/components/layout/content/MainContent.svelte';
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import PhotoLightbox from '$lib/components/albums/PhotoLightbox.svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import { lightboxState } from '$lib/stores/lightbox.svelte';

	let { children, data } = $props();

	// 派生当前页面标题
	let currentNavItem = $derived(
		navItems.find((item) => {
			if (item.href === '/') return page.url.pathname === '/';
			return page.url.pathname.startsWith(item.href);
		})
	);
	let pageLabel = $derived(currentNavItem ? $t(currentNavItem.i18nKey) : $t('nav.home'));

	// 从当前导航项派生 SEO 数据
	let seoTitle = $derived(currentNavItem?.seo?.title ?? pageLabel);
	let seoDescription = $derived(currentNavItem?.seo?.description);
	let seoKeywords = $derived(currentNavItem?.seo?.keywords);

	// 灯箱打开时覆盖标题
	let effectiveTitle = $derived(
		lightboxState.isOpen && lightboxState.pageTitle ? lightboxState.pageTitle : seoTitle
	);

	// 只有当图片加载完成时才显示内容
	let showContent = $derived(backgroundState.isLoaded);

	// 决定是否渲染布局层级的 SEO 标签。
	// 博客子页面（文章及特定分类）会自行处理 SEO，因此在此跳过。
	// 布局 SEO 仅应用于：
	// 1. 非博客页面（如首页、足迹等）
	// 2. 博客根路径 /blog 首页
	let shouldRenderLayoutSeo = $derived(
		!page.url.pathname.startsWith('/blog/') ||
			page.url.pathname === '/blog' ||
			page.url.pathname === '/blog/'
	);

	// 路由背景策略：背景模式 + 是否允许用户切换 (集中自 config)
	// 足迹页 none 与博客文章页 solid 属于语义背景，锁定且不允许用户偏好覆盖
	let backgroundPolicy = $derived(getBackgroundPolicy(page.url.pathname, page.data, page.route.id));
	// 最终背景模式：普通页面允许用户偏好覆盖，语义背景不覆盖
	let backgroundMode = $derived<BackgroundMode>(
		backgroundPolicy.switchable ? backgroundState.userPreference : backgroundPolicy.mode
	);
	// 是否渲染背景切换器 (锁定页面从 DOM 卸载切换器，禁止仅 CSS 隐藏)
	let backgroundSwitchable = $derived(backgroundPolicy.switchable);

	// 内容是否已滚动进入 Header 后方 (由 MainContent 的真实内部滚动容器提供)
	let headerObscured = $state(false);

	// 内容滚动模式由路由配置派生，是滚动状态的唯一来源
	let contentScrollable = $derived(getContentScrollable(page.url.pathname));

	function handleLightboxClose() {
		if (lightboxState.onClose) lightboxState.onClose();
		else lightboxState.close();
	}

	function handleLightboxNavigate(index: number) {
		if (lightboxState.onNavigate) lightboxState.onNavigate(index);
		else lightboxState.navigate(index);
	}
</script>

{#if shouldRenderLayoutSeo}
	<SeoHead title={effectiveTitle} description={seoDescription} keywords={seoKeywords} />
{/if}

<!-- 加载屏幕：在背景图片未加载时显示 -->
<GlobalLoader {showContent} />

<!-- 全局背景层 -->
<BackgroundLayer spotlightUrl={data.appConfig?.wallpaper?.default ?? ''} mode={backgroundMode} />

<div
	class="pointer-events-none min-h-screen font-sans transition-colors duration-300 {backgroundState.component ||
	backgroundMode === 'image'
		? backgroundState.uiTheme === 'light'
			? 'text-black'
			: 'text-white'
		: 'text-foreground'}"
>
	<!-- 移动端：底部导航栏 -->
	<MobileNav />

	<!-- 主布局容器：统一管理移动端和桌面端结构 -->
	<div class="flex h-screen w-full overflow-hidden">
		<!-- PC/平板：左侧侧边栏 (仅在桌面端显示)，贴边一体化布局 -->
		<div class="z-controls relative hidden h-full md:block">
			<Sidebar />
		</div>

		<!-- 内容区域容器：覆盖全屏 (移动端) 或 右侧区域 (桌面端) -->
		<div
			class={layoutState.isContentTransparent
				? 'pointer-events-none relative flex h-full flex-1 flex-col overflow-hidden'
				: 'pointer-events-auto relative flex h-full flex-1 flex-col overflow-hidden'}
		>
			<!-- 顶栏连续 chrome 背景层：位于滚动容器之外，仅在内容进入 Header 后方时显示 -->
			<HeaderChrome visible={headerObscured} />

			<!-- 头部栏：统一管理，适配移动端和桌面端 -->
			<Header
				{pageLabel}
				{backgroundSwitchable}
				class="z-controls pointer-events-auto absolute top-0 right-0 left-0 flex items-center justify-between p-2 lg:p-4"
			/>

			<!-- 可滚动的内容区域：统一实例，内部处理响应式差异 -->
			<!-- 避免了 resize 时组件的卸载和重新挂载 -->
			<MainContent pathname={page.url.pathname} scrollable={contentScrollable} bind:headerObscured>
				{@render children()}
				<!-- 移动端页脚：BottomInfo 位于可滚动内容末尾，普通文档流，不再并入固定导航表面 -->
				<!-- 固定视口页面 (如足迹地图) 不渲染全局移动页脚 -->
				{#if contentScrollable}
					<footer class="w-full shrink-0 px-2 pt-6 pb-2 md:hidden">
						<BottomInfo
							direction="horizontal"
							infoComponent={sidebarState.extraInfoComponent}
							infoComponentProps={{ ...sidebarState.extraInfoProps }}
							infoKey={sidebarState.extraInfoKey || 'default'}
						/>
					</footer>
				{/if}
				<!-- 底部占位：移动端为导航胶囊净空 (--mobile-nav-clearance = 导航高度 + 底部安全距离 + 16px 内容间距)，
				     桌面端固定 16px；位于正文与移动页脚之后，属于 MainContent 滚动内容 -->
				<div class="h-[var(--mobile-nav-clearance)] w-full shrink-0 md:h-4"></div>
			</MainContent>
		</div>
	</div>
</div>

<!-- 全局加载指示：仅无底色 spinner，不覆盖内容、不绘制半透明背景层 -->
{#if navigating.to}
	<div
		class="z-mask pointer-events-none fixed inset-0 flex size-full items-center justify-center"
		transition:fade={{ duration: 300 }}
	>
		<LoadingSpinner size="lg" />
	</div>
{/if}

<!-- 全局移动端抽屉 -->
<MobileDrawer />

<!-- 灯箱：在布局层级渲染，避免被侧边栏 stacking context 遮挡 -->
<Crossfade key={lightboxState.isOpen ? 'open' : 'closed'} inDuration={0} outDuration={250}>
	{#if lightboxState.isOpen}
		<PhotoLightbox
			photos={lightboxState.photos}
			currentIndex={lightboxState.currentIndex}
			onClose={handleLightboxClose}
			onNavigate={handleLightboxNavigate}
		/>
	{/if}
</Crossfade>
