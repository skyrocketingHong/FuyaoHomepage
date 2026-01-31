<script lang="ts">
	/**
	 * 跑马灯组件 (Marquee)
	 *
	 * 当文本内容超过容器尺寸时，通过鼠标悬停或触摸交互触发滚动播放效果。
	 *
	 * @prop text - 需要显示的文本内容 (默认 '')
	 * @prop class - 容器的额外 CSS 类名 (默认 '')
	 * @prop direction - 滚动方向：'horizontal' | 'vertical' (默认 'horizontal')
	 */
	import { cn } from '$lib/utils';
	import FadeEdge from '$lib/components/ui/effect/FadeEdge.svelte';
	import { tick } from 'svelte';

	let { text = '', class: className = '', direction = 'horizontal' } = $props<{
		text?: string;
		class?: string;
		direction?: 'horizontal' | 'vertical';
	}>();

	let containerRef: HTMLDivElement | undefined = $state();
	let spanRef: HTMLSpanElement | undefined = $state();
	let isOverflowing = $state(false);
	let scrollDistance = $state(0);
	let isActive = $state(false);

	$effect(() => {
		if (containerRef && spanRef && text) {
			const check = async () => {
				await tick();
				if (!containerRef || !spanRef) return;
				
				if (direction === 'horizontal') {
					const textWidth = spanRef.scrollWidth;
					const containerWidth = containerRef.clientWidth;
					isOverflowing = textWidth > containerWidth;
					scrollDistance = textWidth + 32;
				} else {
					const textHeight = spanRef.scrollHeight;
					const containerHeight = containerRef.clientHeight;
					isOverflowing = textHeight > containerHeight;
					scrollDistance = textHeight + 16;
				}
			};
			check();
			
			const ro = new ResizeObserver(check);
			ro.observe(containerRef);
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
    fadeSize="10%"
	title={isOverflowing ? text : undefined}
	role="group"
	onmouseenter={() => (isActive = true)}
	onmouseleave={() => (isActive = false)}
	ontouchstart={() => (isActive = true)}
	ontouchend={() => (isActive = false)}
	ontouchcancel={() => (isActive = false)}
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
		<span bind:this={spanRef}>{text}</span>
		{#if isOverflowing}
			<span aria-hidden="true">{text}</span>
		{/if}
	</div>
</FadeEdge>


