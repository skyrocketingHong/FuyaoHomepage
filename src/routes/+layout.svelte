<script lang="ts">
	/**
	 * 全局根布局组件
	 *
	 * 负责应用的基础骨架搭建，处理响应式导航、侧边栏、全局加载状态及 SEO 逻辑。
	 */
	import '../app.css';

	import { navItems, getBackgroundMode } from '$lib/config';
	import { page } from '$app/state';
	import { backgroundState, layoutState } from '$lib/state.svelte';
	import { t } from '$lib/i18n/store';

	// 引入新的模块化组件
	import BackgroundLayer from '$lib/components/layout/background/BackgroundLayer.svelte';
	import GlobalLoader from '$lib/components/layout/loader/GlobalLoader.svelte';

	import MobileNav from '$lib/components/layout/header/nav/MobileNav.svelte';
	import MobileDrawer from '$lib/components/layout/header/drawer/Drawer.svelte';
	import Sidebar from '$lib/components/layout/sidebar/Sidebar.svelte';
	import Header from '$lib/components/layout/header/Header.svelte';
	import MainContent from '$lib/components/layout/content/MainContent.svelte';
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import MosaicInfo from '$lib/components/ui/display/MosaicInfo.svelte';

	let { children, data } = $props();

	// 派生当前页面标题
	let currentNavItem = $derived(navItems.find((item) => page.url.pathname.startsWith(item.href)));
	let pageLabel = $derived(currentNavItem ? $t(currentNavItem.i18nKey) : $t('nav.home'));
    
    // 从当前导航项派生 SEO 数据
    let seoTitle = $derived(currentNavItem?.seo?.title ?? pageLabel);
    let seoDescription = $derived(currentNavItem?.seo?.description);
    let seoKeywords = $derived(currentNavItem?.seo?.keywords);

	// 只有当图片加载完成时才显示内容
	let showContent = $derived(backgroundState.isLoaded);

    // 决定是否渲染布局层级的 SEO 标签。
    // 博客子页面（文章及特定分类）会自行处理 SEO，因此在此跳过。
    // 布局 SEO 仅应用于：
    // 1. 非博客页面（如首页、足迹等）
    // 2. 博客根路径 /blog 首页
    let shouldRenderLayoutSeo = $derived(
        !page.url.pathname.startsWith('/blog/') || page.url.pathname === '/blog' || page.url.pathname === '/blog/'
    );

	let backgroundMode = $derived(getBackgroundMode(page.url.pathname));

	let backgroundInfoComponent = $derived(
		backgroundMode === 'mosaic' ? MosaicInfo : null
	);
</script>

{#if shouldRenderLayoutSeo}
    <SeoHead 
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
    />
{/if}

<!-- 加载屏幕：在背景图片未加载时显示 -->
<GlobalLoader {showContent} />

<!-- 全局背景层 -->
<BackgroundLayer 
	spotlightUrl={data.spotlightUrl ?? data.appConfig?.wallpaper?.default ?? ''}
	mode={backgroundMode}
/>


{#if showContent}
	<div
		class="pointer-events-none min-h-screen font-sans transition-all duration-300 {backgroundState.component || backgroundMode === 'image'
			? backgroundState.uiTheme === 'light'
				? 'text-black'
				: 'text-white'
			: 'text-foreground'}"
	>
		<!-- 移动端：底部导航栏 -->
		<MobileNav infoComponent={backgroundInfoComponent} />

		<!-- 主布局容器：统一管理移动端和桌面端结构 -->
		<div class="flex h-screen w-full overflow-hidden">
			<!-- PC/平板：左侧侧边栏 (仅在桌面端显示) -->
			<div class="relative z-controls hidden pt-4 pb-4 pl-4 md:block">
				<Sidebar 
					backgroundMode={backgroundMode}
					infoComponent={backgroundInfoComponent}
				/>
			</div>

			<!-- 内容区域容器：覆盖全屏 (移动端) 或 右侧区域 (桌面端) -->
			<div
				class={layoutState.isContentTransparent
					? 'pointer-events-none relative flex h-full flex-1 flex-col overflow-hidden'
					: 'pointer-events-auto relative flex h-full flex-1 flex-col overflow-hidden'}
			>
				<!-- 头部栏：统一管理，适配移动端和桌面端 -->
				<Header
					{pageLabel}
					class="pointer-events-auto absolute top-0 right-0 left-0 z-controls flex items-center justify-between p-2 md:pt-4 md:pl-4 md:pb-4"
				/>

				<!-- 可滚动的内容区域：统一实例，内部处理响应式差异 -->
				<!-- 避免了 resize 时组件的卸载和重新挂载 -->
				<MainContent pathname={page.url.pathname}>
					{@render children()}
                    <!-- 移动端：底部空白占位符，防止内容被导航栏遮挡 -->
                    <!-- 放在这里确保它永远在内容之后，并作为滚动内容的一部分 -->
                    <div class="h-30 w-full shrink-0 md:h-4"></div>
				</MainContent>
			</div>
		</div>
	</div>

	<!-- 全局移动端抽屉 -->
	<MobileDrawer />
{/if}
