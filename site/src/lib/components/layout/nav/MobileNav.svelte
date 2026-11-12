<script lang="ts">
	/**
	 * 移动端悬浮导航胶囊组件
	 *
	 * 仅包含导航项目的独立悬浮圆角玻璃胶囊，作为 MobileBottomDock 的子元素渲染，
	 * 不再自行承担固定定位（由 Dock 统一编排 Tab Bar + 间距 + 底部信息区 + 安全区）。
	 *
	 * - 材质：整个胶囊仅一层 LiquidGlass variant="chrome" + 一次 liveBackdrop 实时模糊，
	 *   局部饱和度降至 0.9（由 .mobile-dock-capsule 覆盖 --glass-saturation），
	 *   避免放大马赛克背景产生浑浊黄色玻璃；与底部版权胶囊共用 --glass-surface、
	 *   --glass-chrome-blur、圆角、单层边缘高光和环境阴影
	 * - 边界：只保留一层 1px 半透明高光边，顶部高光合并在同一边界层；
	 *   投影为向下扩散的柔和阴影 (0 10px 30px, 黑色约 18%)
	 * - 导航项：首页、足迹、博客、相册、打钱、友链恒为六项等宽直达链接，不折叠、不横向滚动；
	 *   存在注入列表时追加一个列表 Tab，复用全局 MobileDrawer
	 * - 激活底板相对单个等分区域四边统一内缩 4px，仅使用低透明度主题色填充；
	 *   未激活项降低前景色透明度，激活项使用主题色并提高字重
	 * - 320px 等窄屏仅收紧项目内部水平留白并将文字缩至 10px，不删除、不隐藏或换行
	 */
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import { navItems } from '$lib/config/index';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { isActiveRoute } from '$lib/utils/domain/nav';
	import { sidebarState } from '$lib/stores/app.svelte';
	import { t, locale } from '$lib/i18n/store';
	import { fade } from 'svelte/transition';
	import { Menu } from 'lucide-svelte';
</script>

<nav class="h-full w-full p-0">
	<LiquidGlass
		variant="chrome"
		chromeEdge="bottom"
		liveBackdrop
		showGloss={false}
		contentLayout="fill"
		contentClass="h-full w-full !p-0"
		class="mobile-dock-capsule pointer-events-auto h-[var(--mobile-nav-height)] w-full rounded-[var(--mobile-dock-capsule-radius)] !p-0 shadow-none"
	>
		<div
			class="grid h-full w-full items-center p-0"
			style="grid-template-columns: repeat({navItems.length +
				(sidebarState.listComponent ? 1 : 0)}, minmax(0, 1fr))"
		>
			{#each navItems as item (item.href)}
				{@const active = isActiveRoute(page.url.pathname, item.href)}
				<a
					href={resolve(item.href as '/')}
					aria-current={active ? 'page' : undefined}
					class="mobile-nav-item group relative flex h-full w-full max-w-full min-w-0 flex-col items-center justify-center gap-[2px] rounded-[20px] transition-[color,transform,filter] duration-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary/60 active:scale-[0.97] {active
						? 'font-semibold text-[var(--theme-color)]'
						: 'text-[color-mix(in_oklab,var(--foreground)_62%,transparent)]'}"
				>
					{#if active}
						<span
							aria-hidden="true"
							class="mobile-nav-indicator z-deep absolute"
							transition:fade={{ duration: 180 }}
						></span>
					{/if}

					<item.icon class="z-content size-[22px] shrink-0" strokeWidth={active ? 2.25 : 2} />

					<span class="mobile-nav-label z-content min-w-0 overflow-hidden">
						<Crossfade key={$locale} inline class="inline-grid max-w-full">
							<span>{$t(item.i18nKey)}</span>
						</Crossfade>
					</span>
				</a>
			{/each}

			{#if sidebarState.listComponent}
				<button
					type="button"
					onclick={() => sidebarState.toggleMobileDrawer()}
					class="mobile-nav-item group relative flex h-full w-full max-w-full min-w-0 cursor-pointer flex-col items-center justify-center gap-[2px] rounded-[20px] text-[color-mix(in_oklab,var(--foreground)_62%,transparent)] transition-[color,transform,filter] duration-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary/60 active:scale-[0.97] {sidebarState.isMobileDrawerOpen
						? 'font-semibold text-[var(--theme-color)]'
						: ''}"
					title={$t('nav.list')}
					aria-label={$t('nav.list')}
					aria-haspopup="dialog"
					aria-expanded={sidebarState.isMobileDrawerOpen}
				>
					{#if sidebarState.isMobileDrawerOpen}
						<span
							aria-hidden="true"
							class="mobile-nav-indicator z-deep absolute"
							transition:fade={{ duration: 180 }}
						></span>
					{/if}
					<Menu class="z-content size-[22px] shrink-0" />
					<span class="mobile-nav-label z-content min-w-0 overflow-hidden">
						<Crossfade key={$locale} inline class="inline-grid max-w-full">
							<span>{$t('nav.list')}</span>
						</Crossfade>
					</span>
				</button>
			{/if}
		</div>
	</LiquidGlass>
</nav>
