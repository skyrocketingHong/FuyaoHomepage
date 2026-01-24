<script lang="ts">
	/**
	 * 移动端顶部标题栏组件
	 *
	 * 在移动设备上显示的顶部标题栏，包含标题、列表开关和全局操作。
	 */
	import LiquidGlass from '$lib/components/ui/liquid-glass.svelte';
	import Crossfade from '$lib/components/ui/crossfade.svelte';
	import HeaderActions from '../common/HeaderActions.svelte';
	import { Menu } from 'lucide-svelte';
	import { sidebarState } from '$lib/state.svelte';

	// Props 定义
	let { pageLabel } = $props<{ pageLabel: string }>();
</script>

<header
	class="fixed top-0 right-0 left-0 z-20 flex items-center justify-between bg-transparent p-2 md:hidden"
>
	<!-- 标题区域 -->
	<h1 class="flex items-center gap-1 text-xl font-bold drop-shadow-md">
		<span class="text-gradient-flow">扶摇skyrocketing</span>
		<Crossfade key={pageLabel} class="inline-grid">
			<span>· {pageLabel}</span>
		</Crossfade>
	</h1>

	<!-- 操作区域 -->
	<div class="pointer-events-auto flex items-center gap-2">
		<!-- 仅当有列表组件时显示列表按钮 -->
		{#if sidebarState.listComponent}
			<LiquidGlass
				tag="button"
				onclick={() => sidebarState.toggleMobileDrawer()}
				class="rounded-full p-2 hover:bg-white/10"
			>
				<Menu size={24} />
			</LiquidGlass>
		{/if}
		<HeaderActions />
	</div>
</header>
