<script lang="ts">
	/**
	 * 移动端固定底部 Dock 编排组件
	 *
	 * 作为移动端固定底部区域的唯一编排组件，只负责视口左右定位、垂直间距与
	 * 底部安全区，不添加内部水平内边距。从上到下依次渲染：
	 * 1. Tab Bar (MobileNav)
	 * 2. --mobile-dock-gap 间距
	 * 3. 底部信息区 (BottomInfo horizontal)
	 * 4. env(safe-area-inset-bottom) 安全区
	 *
	 * Tab Bar 与底部信息区分别使用单层 LiquidGlass chrome 实时模糊，并通过
	 * .mobile-dock-capsule 共用表面、圆角、边缘高光与环境阴影；两个胶囊保持独立，
	 * 内部导航项和版权文本不再建立玻璃层。底部信息区内部维持紧凑两列对齐。
	 * 相册全屏灯箱等模态界面打开时由调用方卸载整个 Dock。
	 *
	 */
	import MobileNav from '$lib/components/layout/nav/MobileNav.svelte';
	import BottomInfo from '$lib/components/layout/bottom-info/BottomInfo.svelte';
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import { sidebarState } from '$lib/stores/app.svelte';
</script>

<div
	class="z-controls pointer-events-none fixed right-[var(--content-inline-inset)] bottom-0 left-[var(--content-inline-inset)] flex flex-col items-stretch md:hidden"
	style="padding-bottom: var(--mobile-dock-bottom-inset);"
>
	<!-- Tab Bar -->
	<div class="pointer-events-auto w-full">
		<MobileNav />
	</div>

	<!-- Tab Bar 与底部信息区之间的间距 -->
	<div class="w-full" style="height: var(--mobile-dock-gap);"></div>

	<!-- 底部信息区：独立单层 chrome 胶囊，仅在 LiquidGlass 根层执行一次实时模糊。 -->
	<LiquidGlass
		variant="chrome"
		chromeEdge="bottom"
		liveBackdrop
		showGloss={false}
		contentLayout="fill"
		contentClass="h-full w-full !p-0"
		class="mobile-dock-capsule pointer-events-auto h-[var(--mobile-bottom-info-height)] w-full rounded-[var(--mobile-dock-capsule-radius)] !p-0 shadow-none"
	>
		<BottomInfo
			direction="horizontal"
			infoComponent={sidebarState.extraInfoComponent}
			infoComponentProps={{ ...sidebarState.extraInfoProps }}
			infoKey={sidebarState.extraInfoKey || 'default'}
		/>
	</LiquidGlass>
</div>
