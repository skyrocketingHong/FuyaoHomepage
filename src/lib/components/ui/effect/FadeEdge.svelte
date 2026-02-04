<script lang="ts">
	/**
	 * 滚动渐变遮罩组件
	 *
	 * 核心原子组件，通过 CSS Mask Image 实现容器边缘的渐变消失效果。
	 * 用于实现 Marquee 或 ScrollContainer 的视觉效果。
	 *
	 * @prop children - Svelte Snippet 内容
	 * @prop class - 容器的额外 CSS 类名
	 * @prop orientation - 渐变方向：'horizontal' | 'vertical' (默认 'horizontal')
	 * @prop showStart - 是否显示起始端（左/上）的遮罩 (默认 false)
	 * @prop showEnd - 是否显示结束端（右/下）的遮罩 (默认 false)
	 * @prop fadeSize - 渐变区域的大小 (支持 css 单位, 默认 '2rem')
	 * @prop ref - (bindable) 绑定的 DOM 元素引用
	 * @prop visible - 是否启用遮罩 (默认 true)
	 */
	import { cn } from '$lib/utils/index';
	import type { Snippet } from 'svelte';
	import { Spring } from 'svelte/motion';

	let {
		children,
		class: className = '',
		orientation = 'horizontal',
		showStart = false,
		showEnd = false,
		fadeSize = '2rem', // Can be px or %
		ref = $bindable(),
		visible = true,
		...rest
	} = $props<{
		children: Snippet;
		class?: string;
		orientation?: 'horizontal' | 'vertical';
		showStart?: boolean;
		showEnd?: boolean;
		fadeSize?: string;
		ref?: HTMLElement;
		visible?: boolean;
		[key: string]: any;
	}>();

	// 使用 Spring 类来实现平滑的透明度过渡 (Svelte 5)
	// 1 = 完全可见 (black), 0 = 完全透明 (transparent)
	// 忽略初始化时的状态引用警告，更新逻辑已在 effect 中处理
	// svelte-ignore state_referenced_locally
	const startAlpha = new Spring(showStart ? 0 : 1, { stiffness: 0.1, damping: 0.25 });
	// 忽略初始化时的状态引用警告，更新逻辑已在 effect 中处理
	// svelte-ignore state_referenced_locally
	const endAlpha = new Spring(showEnd ? 0 : 1, { stiffness: 0.1, damping: 0.25 });

	$effect(() => {
		startAlpha.target = showStart ? 0 : 1;
		endAlpha.target = showEnd ? 0 : 1;
	});

	let maskImageResult = $derived.by(() => {
		if (!visible) return 'none';
		
		const dir = orientation === 'horizontal' ? 'to right' : 'to bottom';
		
		// 定义 4 个点的颜色
		// 使用 rgba(0,0,0, alpha) 来控制透明度
		const c1 = `rgba(0,0,0, ${Math.max(0, Math.min(1, startAlpha.current))})`;
		const c2 = 'black'; // 在开始渐变的内边缘始终为 black
		const c3 = 'black'; // 在结束渐变的内边缘始终为 black
		const c4 = `rgba(0,0,0, ${Math.max(0, Math.min(1, endAlpha.current))})`;
		
		return `linear-gradient(${dir}, ${c1} 0, ${c2} ${fadeSize}, ${c3} calc(100% - ${fadeSize}), ${c4} 100%)`;
	});

</script>

<div
	bind:this={ref}
	class={cn(className)}
	style="
        mask-image: {maskImageResult}; 
        -webkit-mask-image: {maskImageResult}; 
        {rest.style || ''}
    "
	{...rest}
>
	{@render children()}
</div>
