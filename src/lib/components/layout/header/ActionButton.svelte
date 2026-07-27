<script lang="ts">
	/**
	 * 顶部操作按钮组件
	 *
	 * 用于 Header 和 HeaderActions 中的交互按钮。
	 * 默认模式：独立圆形控件，使用 .header-control-shell 共享材质
	 * (macOS 风格半透明中性外壳 + 单次 control 级原生背景模糊，见 components.css
	 * 与 theme.css 的 --header-control-* token)；不注册 WebGL 合成器，不使用 SVG 折射。
	 * 移动端命中区域不小于 44×44px，桌面端 36×36px。
	 * bare 模式：用于 ActionGroup 分段胶囊内部，背景透明、不单独模糊/加边框/加阴影，
	 * 由胶囊外壳统一提供材质与边界，hover/active 仅改变内部填充。
	 *
	 * 居中结构：根节点零内边距；纯图标按钮由根节点的居中网格 (grid place-items-center)
	 * 统一居中，图标与文字组合按钮使用 inline-flex；图标包装层固定 20×20px、
	 * line-height 0，内部 SVG 块级显示且禁止收缩，不通过 margin/位移/缩放补偿居中。
	 *
	 * 按钮默认仅渲染图标，宽度在交互前后保持不变，不随 hover 展开；
	 * 文本语义通过 title 与 aria-label 表达。确需常显文字的按钮需显式设置 showText。
	 *
	 * @prop title - 按钮的 title 属性 (同时用作 aria-label)
	 * @prop onclick - 点击回调函数
	 * @prop crossfadeKey - 用于 Crossfade 动画的唯一 key
	 * @prop bare - 是否为分段胶囊内的透明按钮 (默认 false)
	 * @prop showText - 是否常显文本 (默认 false，仅渲染图标)
	 * @prop text - 按钮文本内容 (Snippet，仅在 showText 时渲染)
	 * @prop icon - 按钮图标 (Snippet)
	 * @prop class - 额外的 CSS 类名
	 */
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		onclick: () => void;
		crossfadeKey: unknown;
		bare?: boolean;
		showText?: boolean;
		text?: Snippet;
		icon: Snippet;
		class?: string;
	}

	let {
		title,
		onclick,
		crossfadeKey,
		bare = false,
		showText = false,
		text,
		icon,
		class: className
	}: Props = $props();
</script>

{#snippet content()}
	{#if showText && text}
		<span class="pr-1.5 text-sm font-medium whitespace-nowrap">{@render text()}</span>
	{/if}
	<!-- 图标包装层：固定 20×20px、line-height 0，SVG 块级显示且禁止收缩 -->
	<span
		class="flex size-5 shrink-0 items-center justify-center leading-[0] [&>svg]:block [&>svg]:shrink-0"
	>
		{@render icon()}
	</span>
{/snippet}

{#if bare}
	<!-- 分段胶囊内按钮：透明背景，无独立模糊/边框/阴影；分段竖线由 ActionGroup 提供 -->
	<button
		type="button"
		{onclick}
		{title}
		aria-label={title}
		class="flex h-full min-w-9 cursor-pointer appearance-none items-center justify-center border-0 bg-transparent px-2 py-0 text-foreground transition-colors [font:inherit] hover:bg-secondary/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary/60 focus-visible:outline-solid active:bg-secondary/70 {className}"
	>
		<Crossfade key={crossfadeKey} inline>
			{@render content()}
		</Crossfade>
	</button>
{:else}
	<!-- 独立按钮：纯图标使用占满按钮的居中网格；图标+文字组合使用 inline-flex -->
	<button
		type="button"
		{onclick}
		{title}
		aria-label={title}
		class="header-control-shell cursor-pointer appearance-none rounded-full text-foreground [font:inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 focus-visible:outline-solid {showText
			? 'inline-flex h-11 items-center justify-center px-3 md:h-9'
			: 'grid h-11 w-11 place-items-center md:h-9 md:w-9'} {className}"
	>
		<Crossfade key={crossfadeKey} inline>
			{@render content()}
		</Crossfade>
	</button>
{/if}
