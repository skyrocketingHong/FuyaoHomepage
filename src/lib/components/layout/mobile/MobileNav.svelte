<script lang="ts">
	/**
	 * 移动端底部导航栏组件
	 *
	 * 在移动设备上显示的底部导航条。
	 */
	import LiquidGlass from '$lib/components/ui/liquid-glass.svelte';
	import Copyright from '../common/Copyright.svelte';
	import { navItems } from '$lib/config';
	import { page } from '$app/state';
	import { isActiveRoute } from '$lib/utils/nav';
	import { t, locale } from '$lib/i18n/store';
	import Crossfade from '$lib/components/ui/crossfade.svelte';
</script>

<nav class="fixed right-2 bottom-2 left-2 z-50 md:hidden">
	<LiquidGlass class="pointer-events-auto flex h-full w-full flex-col p-2">
		<div class="grid w-full grid-cols-5">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex flex-col items-center justify-center rounded-lg py-1 transition-all duration-200 hover:bg-white/10 hover:text-white {isActiveRoute(
						page.url.pathname,
						item.href
					)
						? 'bg-white/10 text-white'
						: 'text-white/70'}"
				>
					<item.icon class="size-5" />
					<span class="text-[8px] leading-tight"
						><Crossfade key={$locale} class="inline-grid"><span>{$t(item.i18nKey)}</span></Crossfade
						></span
					>
				</a>
			{/each}
		</div>
		<!-- 版权信息 -->
		<Copyright />
	</LiquidGlass>
</nav>
