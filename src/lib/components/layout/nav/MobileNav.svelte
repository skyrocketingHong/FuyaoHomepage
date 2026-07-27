<script lang="ts">
	/**
	 * 移动端悬浮导航胶囊组件
	 *
	 * 仅包含导航项目的独立悬浮圆角玻璃胶囊，与 BottomInfo 完全分离：
	 * BottomInfo (背景信息、服务状态、版权) 已移至根布局可滚动内容末尾的普通文档流页脚。
	 *
	 * - 定位：左右各距视口 12px，底部 max(10px, env(safe-area-inset-bottom))，
	 *   尺寸与间距全部来自 theme.css 的 --mobile-nav-* token
	 * - 材质：整个胶囊仅一层 LiquidGlass variant="chrome" + 一次 liveBackdrop 实时模糊
	 *   (blur 24px, saturate 1.2)，不注册 WebGL 合成器，导航项目不再单独模糊；
	 *   表面/边界/投影颜色由 --mobile-nav-surface/edge/shadow token 驱动 (见 utilities.css
	 *   的 .mobile-nav-capsule)
	 * - 边界：只保留一层 1px 半透明高光边，顶部高光合并在同一边界层；
	 *   投影为向下扩散的柔和阴影 (0 10px 30px, 黑色约 18%)
	 * - 导航项：最小点击区域 44x44，图标 24px，文字 11px/13px，内容严格水平垂直居中；
	 *   激活项使用 52px 高、20px 圆角的半透明主题色底板 (无独立模糊/边框/阴影)，
	 *   未激活项约 62% 前景色；hover 仅调整亮度，按下缩放至 0.97 (无位移/发光)
	 */
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import { navItems } from '$lib/config/index';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { isActiveRoute } from '$lib/utils/domain/nav';
	import { t, locale } from '$lib/i18n/store';
	import { fade } from 'svelte/transition';
</script>

<nav
	class="z-controls fixed right-[var(--mobile-nav-inline-inset)] bottom-[var(--mobile-nav-bottom-inset)] left-[var(--mobile-nav-inline-inset)] md:hidden"
>
	<!--
		统一 chrome 胶囊：liveBackdrop 禁用共享 WebGL 合成器，在最外层直接应用原生 backdrop-filter，
		实时模糊胶囊后方的 DOM 内容；整个导航仅此一次模糊
	-->
	<LiquidGlass
		variant="chrome"
		chromeEdge="bottom"
		liveBackdrop
		showGloss={false}
		class="mobile-nav-capsule pointer-events-auto h-[var(--mobile-nav-height)] w-full rounded-[28px] p-0 shadow-none"
	>
		<!-- 导航项网格：六项等宽排列 -->
		<div
			class="grid h-full w-full items-center"
			style="grid-template-columns: repeat({navItems.length}, minmax(0, 1fr))"
		>
			{#each navItems as item (item.href)}
				{@const active = isActiveRoute(page.url.pathname, item.href)}
				<a
					href={resolve(item.href as '/')}
					aria-current={active ? 'page' : undefined}
					class="group relative flex h-full min-h-11 min-w-11 flex-col items-center justify-center gap-[3px] rounded-[20px] transition-[color,transform,filter] duration-200 hover:brightness-110 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary/60 active:scale-[0.97] {active
						? 'font-semibold text-[var(--theme-color)]'
						: 'text-[color-mix(in_oklab,var(--foreground)_62%,transparent)]'}"
				>
					<!-- 激活底板：52px 高、20px 圆角的半透明主题色层，无独立模糊/边框/阴影 -->
					{#if active}
						<div
							class="z-deep absolute inset-x-1 inset-y-1.5 rounded-[20px] bg-[color-mix(in_srgb,var(--theme-color)_15%,transparent)]"
							transition:fade={{ duration: 200 }}
						></div>
					{/if}

					<item.icon class="size-6 shrink-0" />

					<span class="text-[11px] leading-[13px]"
						><Crossfade key={$locale} inline class="inline-grid"
							><span>{$t(item.i18nKey)}</span></Crossfade
						>
					</span>
				</a>
			{/each}
		</div>
	</LiquidGlass>
</nav>
