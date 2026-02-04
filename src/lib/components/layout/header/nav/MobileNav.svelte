<script lang="ts">
	/**
	 * 移动端底部导航栏组件
	 *
	 * 在移动设备上显示的底部导航条。
	 * 使用 LiquidGlass 组件实现玻璃态效果，外形为胶囊形状。
	 * 
	 * @prop infoComponent - 可选的背景信息显示组件
	 */
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import { navItems } from '$lib/config/index';
	import { page } from '$app/state';
	import { isActiveRoute } from '$lib/utils/domain/nav';
	import { t, locale } from '$lib/i18n/store';
	import { fade } from 'svelte/transition';
	import Copyright from '../../sidebar/Copyright.svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import type { Component } from 'svelte';

	let { infoComponent = null } = $props<{
		infoComponent?: Component<any> | null;
	}>();
</script>

<nav class="fixed right-2 bottom-1 left-2 z-controls flex flex-col items-center gap-0 md:hidden">
	<!-- 
		导航项容器（玻璃胶囊）
	-->
	<LiquidGlass 
		class="pointer-events-auto flex w-full flex-col p-1 shadow-xl backdrop-blur-md transition-all duration-300 rounded-full"
	>
        <div class="grid w-full items-center gap-1" style="grid-template-columns: repeat({navItems.length}, minmax(0, 1fr))">
		{#each navItems as item}
			<a
				href={item.href}
				class="group relative flex flex-1 flex-col items-center justify-center rounded-full py-1.5 transition-all duration-300 {isActiveRoute(
					page.url.pathname,
					item.href
				)
					? 'text-[var(--theme-color)] font-semibold'
					: 'text-muted-foreground hover:bg-accent/40 hover:text-accent-foreground'}"
			>
				<!-- 活动指示器胶囊 -->
				{#if isActiveRoute(page.url.pathname, item.href)}
					<div class="absolute inset-0 z-deep rounded-full bg-primary/10 transition-all duration-300" transition:fade={{ duration: 200 }}></div>
				{/if}

				<item.icon class="size-6 transition-transform duration-300" />
				
				<span class="mt-0.5 text-[11px] leading-none"
					><Crossfade key={$locale} class="inline-grid"><span>{$t(item.i18nKey)}</span></Crossfade>
				</span>
			</a>
		{/each}
        </div>
	</LiquidGlass>
    
    <!-- 版权信息（玻璃外部） -->
    <!-- 移除了内边距，通过变换缩小比例以适应狭小空间 -->
    <div class="pointer-events-auto w-full text-muted-foreground px-2">
        <Copyright direction="horizontal" infoComponent={infoComponent} />
    </div>
</nav>

<style>
    /* 覆盖 Copyright 组件默认的顶部边框和内边距以节省空间 */
    :global(nav > div > div.border-t) {
        border-top: none !important;
        padding-top: 0 !important;
    }
</style>
