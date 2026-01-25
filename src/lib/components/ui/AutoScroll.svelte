<script lang="ts">
	import { cn } from '$lib/utils';
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

<div
	bind:this={containerRef}
	class={cn(
		'group/scroll relative overflow-hidden',
		direction === 'horizontal' ? 'whitespace-nowrap' : 'whitespace-normal',
		isOverflowing && (direction === 'horizontal' ? 'mask-gradient' : 'mask-gradient-vertical'),
		isActive && 'active',
		className
	)}
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
		style:animation-duration="{Math.max(text.length * (direction === 'horizontal' ? 0.15 : 0.05), direction === 'horizontal' ? 2 : 5)}s"
	>
		<span bind:this={spanRef}>{text}</span>
		{#if isOverflowing}
			<span aria-hidden="true">{text}</span>
		{/if}
	</div>
</div>

<style>
	.mask-gradient {
		mask-image: linear-gradient(to right, black 0%, black 90%, transparent 100%);
		-webkit-mask-image: linear-gradient(to right, black 0%, black 90%, transparent 100%);
	}
	.mask-gradient:hover,
	.mask-gradient.active {
		mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
		-webkit-mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
	}

	.mask-gradient-vertical {
		mask-image: linear-gradient(to bottom, black 0%, black 90%, transparent 100%);
		-webkit-mask-image: linear-gradient(to bottom, black 0%, black 90%, transparent 100%);
	}
	.mask-gradient-vertical:hover,
	.mask-gradient-vertical.active {
		mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%);
		-webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%);
	}
</style>
