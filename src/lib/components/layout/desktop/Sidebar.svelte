<script lang="ts">
	/**
	 * 桌面端侧边栏组件
	 *
	 * 桌面布局左侧的侧边栏，包含主导航、动态列表区域和版权信息。
	 */
	import LiquidGlass from '$lib/components/ui/liquid-glass.svelte';
	import Copyright from '../common/Copyright.svelte';
	import { navItems } from '$lib/config';
	import { page } from '$app/state';
	import { sidebarState } from '$lib/state.svelte';
	import { isActiveRoute } from '$lib/utils/nav';
	import { t, locale } from '$lib/i18n/store';
	import Crossfade from '$lib/components/ui/crossfade.svelte';
</script>

<!-- 左侧侧边栏：路由、列表、版权 -->
<LiquidGlass class="pointer-events-auto h-full w-72 flex-none">
	<div class="flex h-full flex-col">
		<!-- 1. 路由导航区域 -->
		<div class="flex-none">
			<h2 class="mb-4 text-xs font-bold tracking-widest text-white/40 uppercase">
				<Crossfade key={$locale} class="inline-grid"
					><span>{$t('layout.sidebar.navigation')}</span></Crossfade
				>
			</h2>
			<nav class="flex flex-col gap-2">
				{#each navItems as item}
					<a
						href={item.href}
						class="flex items-center gap-4 rounded-lg px-3 py-1 text-base transition-all hover:bg-white/10 hover:text-white {isActiveRoute(
							page.url.pathname,
							item.href
						)
							? 'bg-white/10 text-white'
							: 'text-white/80'}"
					>
						<item.icon class="size-5" />
						<Crossfade key={$locale} class="inline-grid"><span>{$t(item.i18nKey)}</span></Crossfade>
					</a>
				{/each}
			</nav>
		</div>

		<!-- 2. 动态列表区域 -->
		<div class="flex flex-1 flex-col overflow-hidden">
			{#if sidebarState.listComponent}
				<div class="mt-2 border-t border-white/5 pt-4"></div>
				<div class="flex-1 overflow-y-auto px-1">
					<sidebarState.listComponent {...sidebarState.listProps} />
				</div>
			{:else}
				<!-- 无列表激活时的占位符 -->
				<div class="flex-1"></div>
			{/if}
		</div>

		<!-- 3. 版权区域 -->
		<div class="mt-auto">
			<Copyright />
		</div>
	</div>
</LiquidGlass>
