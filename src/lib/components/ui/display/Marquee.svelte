<script lang="ts">
	/**
	 * 跑马灯组件 (Marquee)
	 *
	 * 当文本内容超过容器尺寸时，通过鼠标悬停或触摸交互触发滚动播放效果。
	 *
	 * @prop text - 需要显示的文本内容 (可选，若不传则使用 children)
	 * @prop class - 容器的额外 CSS 类名 (默认 '')
	 * @prop direction - 滚动方向：'horizontal' | 'vertical' (默认 'horizontal')
	 * @prop fadeSize - 边缘渐变大小 (默认 '10%')
	 * @prop autoPlay - 是否自动播放 (默认 false)
	 */
	import { cn } from '$lib/utils/index';
	import FadeEdge from '$lib/components/ui/effect/FadeEdge.svelte';
	import { tick, type Snippet } from 'svelte';

	let { 
		text = '', 
		class: className = '', 
		direction = 'horizontal', 
		fadeSize = '10%',
		autoPlay = false,
		children
	} = $props<{
		text?: string;
		class?: string;
		direction?: 'horizontal' | 'vertical';
		fadeSize?: string;
		autoPlay?: boolean;
		children?: Snippet;
	}>();

	let containerRef: HTMLDivElement | undefined = $state();
	let spanRef: HTMLSpanElement | undefined = $state();
	let isOverflowing = $state(false);
	let scrollDistance = $state(0);
	let isHovered = $state(false);
	
	let isActive = $derived(autoPlay || isHovered);

	$effect(() => {
		if (containerRef && spanRef) {
			const check = async () => {
				await tick();
				if (!containerRef || !spanRef) return;
				
				if (direction === 'horizontal') {
					const contentWidth = spanRef.scrollWidth;
					const containerWidth = containerRef.clientWidth;
					isOverflowing = contentWidth > containerWidth;
					scrollDistance = contentWidth + 32;
				} else {
					const contentHeight = spanRef.scrollHeight;
					const containerHeight = containerRef.clientHeight;
					isOverflowing = contentHeight > containerHeight;
					scrollDistance = contentHeight + 16;
				}
			};
			check();
			
			const ro = new ResizeObserver(check);
			ro.observe(containerRef);
			ro.observe(spanRef); // Also observe content changes
			return () => ro.disconnect();
		}
	});
</script>

<FadeEdge
	bind:ref={containerRef}
	class={cn(
		'group/scroll relative overflow-hidden',
		direction === 'horizontal' ? 'whitespace-nowrap' : 'whitespace-normal',
		isActive && 'active',
		className
	)}
    orientation={direction}
    visible={isOverflowing}
    showStart={isActive}
    showEnd={true}
    fadeSize={fadeSize}
	title={isOverflowing && text ? text : undefined}
	role="group"
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
	ontouchstart={() => (isHovered = true)}
	ontouchend={() => (isHovered = false)}
	ontouchcancel={() => (isHovered = false)}
>
	<div
		class={cn(
			'flex will-change-transform',
			direction === 'horizontal' ? 'items-center flex-row gap-8' : 'flex-col gap-4',
			isOverflowing && isActive && (direction === 'horizontal' 
				? 'animate-[auto-scroll-text_linear_infinite]' 
				: 'animate-[auto-scroll-vertical_linear_infinite]')
		)}
		style:--scroll-dist="-{scrollDistance}px"
		style:animation-duration="{Math.max(scrollDistance / (direction === 'horizontal' ? 50 : 30), 2)}s"
	>
		<span bind:this={spanRef} class="flex items-center shrink-0">
			{#if children}
				{@render children()}
			{:else}
				{text}
			{/if}
		</span>
		{#if isOverflowing}
			<span aria-hidden="true" class="flex items-center shrink-0">
				{#if children}
					{@render children()}
				{:else}
					{text}
				{/if}
			</span>
		{/if}
	</div>
</FadeEdge>


