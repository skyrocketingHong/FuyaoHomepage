<script lang="ts">
	/**
	 * 通用顶部标题栏组件
	 *
	 * 整合了移动端和桌面端的标题栏逻辑。
	 * 在移动设备上显示为固定定位，包含菜单按钮。
	 * 在桌面设备上显示为绝对定位，字体更大，不包含菜单按钮。
	 */
	import LiquidGlass from '$lib/components/ui/LiquidGlass.svelte';
	import Crossfade from '$lib/components/ui/Crossfade.svelte';

	import HeaderActions from '$lib/components/layout/common/HeaderActions.svelte';
	import { Menu } from 'lucide-svelte';
	import { sidebarState } from '$lib/state.svelte';

	// Props 定义
	let { pageLabel, class: className = '' } = $props<{
		pageLabel: string;
		class?: string;
	}>();
</script>

<header class={className}>
	<!-- 标题区域 -->
	<h1
		class="flex items-center gap-1 text-xl font-bold drop-shadow-md md:text-2xl md:tracking-wide md:text-white"
	>
		{import.meta.env.VITE_SITE_NAME}
		<Crossfade key={pageLabel} class="inline-grid">
			<span>· {pageLabel}</span>
		</Crossfade>
	</h1>

	<!-- 操作区域 -->
	<div
		class="pointer-events-auto flex items-center gap-2 pr-0 md:pr-4"
	>
		<!-- 仅当有列表组件时显示列表按钮 (仅移动端) -->
		{#if sidebarState.listComponent}
			<LiquidGlass
				tag="button"
				onclick={() => sidebarState.toggleMobileDrawer()}
				class="rounded-full p-2 hover:bg-white/10 md:hidden"
			>
				<Menu size={24} />
			</LiquidGlass>
		{/if}
		<HeaderActions />
	</div>
</header>
