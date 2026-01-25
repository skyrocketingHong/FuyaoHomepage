<script lang="ts">
	/**
	 * 主布局文件
	 *
	 * 负责应用的整体结构，包括移动端和桌面端的响应式布局。
	 * 整合了所有的布局组件 (Sidebar, Header, Background, etc.)。
	 */
	import '../app.css';

	import { navItems } from '$lib/config';
	import { page } from '$app/state';
	import { backgroundState, layoutState } from '$lib/state.svelte';
	import { t } from '$lib/i18n/store';

	// 引入新的模块化组件
	import BackgroundLayer from '$lib/components/layout/common/BackgroundLayer.svelte';
	import GlobalLoader from '$lib/components/layout/common/GlobalLoader.svelte';
	import MobileNav from '$lib/components/layout/mobile/MobileNav.svelte';
	import MobileDrawer from '$lib/components/layout/mobile/Drawer.svelte';
	import Sidebar from '$lib/components/layout/desktop/Sidebar.svelte';
	import Header from '$lib/components/layout/common/Header.svelte';
	import Content from '$lib/components/layout/desktop/Content.svelte';
	import MobileContent from '$lib/components/layout/mobile/Content.svelte';
	import SeoHead from '$lib/components/seo/SeoHead.svelte';

	let { children, data } = $props();

	// 派生当前页面标题
	let currentNavItem = $derived(navItems.find((item) => page.url.pathname.startsWith(item.href)));
	let pageLabel = $derived(currentNavItem ? $t(currentNavItem.i18nKey) : $t('nav.home'));
    
    // 从当前导航项派生 SEO 数据
    let seoTitle = $derived(currentNavItem?.seo?.title ?? pageLabel);
    let seoDescription = $derived(currentNavItem?.seo?.description);
    let seoKeywords = $derived(currentNavItem?.seo?.keywords);

	// 图片加载状态
	let isImageLoaded = $state(false);
	let minTimeElapsed = $state(false);

	// 最小加载时间（毫秒）
	const MIN_LOADING_TIME = 1000;

	$effect(() => {
		const timer = setTimeout(() => {
			minTimeElapsed = true;
		}, MIN_LOADING_TIME);
		return () => clearTimeout(timer);
	});

	// 只有当图片加载完成且最小时间已过时才显示内容
	let showContent = $derived(isImageLoaded && minTimeElapsed);
</script>

<SeoHead 
    title={seoTitle}
    description={seoDescription}
    keywords={seoKeywords}
/>

<!-- 加载屏幕：在背景图片未加载时显示 -->
<GlobalLoader {showContent} />

<!-- 全局背景层 -->
<BackgroundLayer
	spotlightUrl={data.spotlightUrl ?? data.appConfig?.wallpaper?.default ?? ''}
	onImageLoad={() => (isImageLoaded = true)}
/>

{#if showContent}
	<div
		class="pointer-events-none min-h-screen font-sans transition-all duration-300 {backgroundState.uiTheme ===
		'light'
			? 'text-black'
			: 'text-white'}"
	>
		<!-- 移动端：顶部标题栏 -->
		<Header
			{pageLabel}
			class="fixed top-0 right-0 left-0 z-20 flex items-center justify-between bg-transparent p-2 md:hidden"
		/>

		<!-- 内容区域 (移动端带有上下内边距) -->
		<MobileContent pathname={page.url.pathname}>
			{@render children()}
		</MobileContent>

		<!-- 移动端：底部导航栏 -->
		<MobileNav />

		<!-- PC/平板：分栏视图 -->
		<div class="hidden h-screen overflow-hidden md:flex">
			<!-- 左侧侧边栏组件 -->
			<div class="pt-4 pb-4 pl-4"><Sidebar /></div>

			<!-- 右侧内容区域：标题 + 控件 + 内容 -->
			<div
				class={layoutState.isContentTransparent
					? 'pointer-events-none relative flex h-full flex-1 flex-col overflow-hidden'
					: 'pointer-events-auto relative flex h-full flex-1 flex-col overflow-hidden'}
			>
				<!-- 头部栏：标题 (左) + 控件 (右) -->
				<Header
					{pageLabel}
					class="pointer-events-auto absolute top-0 right-0 left-0 z-20 flex items-center justify-between pt-4 pl-4 pb-4"
				/>

				<!-- 可滚动的内容区域 -->
				<Content pathname={page.url.pathname}>
					{@render children()}
				</Content>
			</div>
		</div>
	</div>

	<!-- 全局移动端抽屉 -->
	<MobileDrawer />
{/if}
