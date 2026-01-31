<script lang="ts">
	/**
	 * 滚动边缘模糊遮罩组件
	 *
	 * 在滚动区域的边缘叠加模糊渐变效果，增强视觉深度。
	 *
	 * @prop visible - 是否显示 (默认 true)
	 * @prop orientation - 方向：'vertical' (垂直) | 'horizontal' (水平)
	 * @prop position - 定位方式：'fixed' | 'absolute' | 'sticky' (默认 'fixed')
	 * @prop side - 显示边：'both' | 'start' | 'end' (默认 'both')
	 * @prop showStart - 强制显示/隐藏起始边 (优先级高于 side)
	 * @prop showEnd - 强制显示/隐藏结束边 (优先级高于 side)
	 * @prop class - 额外的 CSS 类名
	 * @prop style - 额外的 CSS 样式
	 */
	import { cn } from '$lib/utils';
	import { fade } from 'svelte/transition';

	let {
		visible = true,
		orientation = 'vertical',
		position = 'fixed',
		side = 'both',
		showStart = undefined,
		showEnd = undefined,
		class: className = '',
		style = ''
	} = $props<{
		visible?: boolean;
		orientation?: 'vertical' | 'horizontal';
		position?: 'fixed' | 'absolute' | 'sticky';
		side?: 'both' | 'start' | 'end';
		showStart?: boolean;
		showEnd?: boolean;
		class?: string;
		style?: string;
	}>();

	let commonClass = $derived(cn(
		'pointer-events-none z-mask',
		position,
		className
	));

	let effectiveShowStart = $derived(showStart !== undefined ? showStart : (side === 'both' || side === 'start'));
	let effectiveShowEnd = $derived(showEnd !== undefined ? showEnd : (side === 'both' || side === 'end'));
</script>

{#if visible}
	{#if orientation === 'vertical'}
		<!-- 顶部 -->
		{#if effectiveShowStart}
			<div
				class={cn(commonClass, 'top-0 left-0 right-0 h-32 w-full')}
				style="backdrop-filter: blur(8px); mask-image: linear-gradient(to bottom, black, transparent); -webkit-mask-image: linear-gradient(to bottom, black, transparent); {style}"
				transition:fade={{ duration: 300 }}
			></div>
		{/if}
		<!-- 底部 -->
		{#if effectiveShowEnd}
			<div
				class={cn(commonClass, 'bottom-0 left-0 right-0 h-40 md:h-12 w-full')}
				style="backdrop-filter: blur(8px); mask-image: linear-gradient(to top, black, transparent); -webkit-mask-image: linear-gradient(to top, black, transparent); {style}"
				transition:fade={{ duration: 300 }}
			></div>
		{/if}
	{:else}
		<!-- 左侧 -->
		{#if effectiveShowStart}
			<div
				class={cn(commonClass, 'left-0 top-0 bottom-0 w-3 md:w-6 h-full')}
				style="backdrop-filter: blur(8px); mask-image: linear-gradient(to right, black, transparent); -webkit-mask-image: linear-gradient(to right, black, transparent); {style}"
				transition:fade={{ duration: 300 }}
			></div>
		{/if}
		<!-- 右侧 -->
		{#if effectiveShowEnd}
			<div
				class={cn(commonClass, 'right-0 top-0 bottom-0 w-3 md:w-6 h-full')}
				style="backdrop-filter: blur(8px); mask-image: linear-gradient(to left, black, transparent); -webkit-mask-image: linear-gradient(to left, black, transparent); {style}"
				transition:fade={{ duration: 300 }}
			></div>
		{/if}
	{/if}
{/if}
