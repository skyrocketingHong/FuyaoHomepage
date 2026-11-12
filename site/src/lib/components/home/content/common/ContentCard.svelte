<script lang="ts">
	/**
	 * 通用内容卡片组件
	 *
	 * 封装 LiquidGlass，提供统一的高度、内边距和交互效果。
	 */
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import { cn } from '$lib/utils/index';

	interface Props {
		/** 额外的 CSS 类名 */
		class?: string;
		/** 是否不透明 (默认 true) */
		opaque?: boolean;
		/** 是否开启倾斜效果 (默认 true) */
		tilt?: boolean;
		/** 子元素插槽 */
		children?: import('svelte').Snippet;
		/** 渲染的 HTML 标签类型 (默认 'div') */
		tag?: string;
		/** 链接地址 (当 tag 为 'a' 时使用) */
		href?: string;
		/** 链接打开方式 */
		target?: string;
		/** 点击事件处理 */
		onclick?: (e: MouseEvent) => void;
		/** 键盘事件处理 */
		onkeydown?: (e: KeyboardEvent) => void;
		/** Role 属性 */
		role?: string;
		/** TabIndex */
		tabindex?: number | string;
	}

	let {
		class: className,
		opaque = true,
		tilt = true,
		children,
		tag = 'div',
		...rest
	}: Props = $props();
</script>

<LiquidGlass {opaque} {tilt} {tag} class={cn('h-[116px] p-3', className)} {...rest}>
	{#if children}
		{@render children()}
	{/if}
</LiquidGlass>
