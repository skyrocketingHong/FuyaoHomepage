<script lang="ts">
	/**
	 * 可复用的分段控制器组件 (Segmented Control)
	 * 
	 * 采用胶囊样式，支持图标和标签，带平滑激活背景切换。
	 * 
	 * @prop items - 选项数组 { id: string, label: string, icon?: Component }
	 * @prop activeId - 当前选中的 ID
	 * @prop onSelect - 选中回调
	 * @prop class - 外部容器样式类
	 */
	import { fade } from 'svelte/transition';
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import FadeEdge from '$lib/components/ui/effect/FadeEdge.svelte';
	import type { Component } from 'svelte';

	interface Item {
		id: string;
		label: string;
		icon?: Component<any>;
	}

	let { 
		items, 
		activeId, 
		onSelect, 
		size = "md",
		noShadow = false,
		class: className = "" 
	} = $props<{
		items: Item[];
		activeId: string;
		onSelect: (id: string) => void;
		size?: "sm" | "md";
		noShadow?: boolean;
		class?: string;
	}>();

	let container = $state<HTMLElement>();
	let showStart = $state(false);
	let showEnd = $state(false);

	function updateScrollState() {
		if (!container) return;
		const { scrollLeft, scrollWidth, tempClientWidth } = {
			scrollLeft: container.scrollLeft,
			scrollWidth: container.scrollWidth,
			tempClientWidth: container.clientWidth
		};
		
		showStart = scrollLeft > 0;
		showEnd = Math.ceil(scrollLeft + tempClientWidth) < scrollWidth - 1;
	}

    function scrollToActive() {
        if (!container) return;
        const buttons = container.querySelectorAll('button');
        const index = items.findIndex((i: Item) => i.id === activeId);
        if (index >= 0 && buttons[index]) {
            const btn = buttons[index] as HTMLElement;
            const containerCenter = container.clientWidth / 2;
            const btnCenter = btn.offsetLeft + btn.offsetWidth / 2;
            container.scrollTo({
                left: btnCenter - containerCenter,
                behavior: 'smooth'
            });
        }
    }

	$effect(() => {
		if (container) {
			updateScrollState();
			const ro = new ResizeObserver(updateScrollState);
			ro.observe(container);
			return () => ro.disconnect();
		}
	});

    $effect(() => {
        items;
        activeId;
        if (container) {
            setTimeout(() => {
                updateScrollState();
                scrollToActive();
            }, 50);
        }
    });

	function handleWheel(e: WheelEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		if (e.deltaY !== 0) {
			e.preventDefault();
			e.currentTarget.scrollLeft += e.deltaY;
		}
	}
</script>

<LiquidGlass 
	class="group box-border w-fit mx-auto max-w-full rounded-full p-0 text-foreground pointer-events-auto flex items-center {className}"
>
	<FadeEdge 
		orientation="horizontal"
		showStart={showStart}
		showEnd={showEnd}
		fadeSize="10%"
		class="w-full {size === 'sm' ? 'h-7' : 'h-9'}"
	>
		<div 
			bind:this={container}
			onscroll={updateScrollState}
			class="w-full h-full overflow-x-auto no-scrollbar flex items-center p-0.5 gap-0.5"
			onwheel={handleWheel}
		>
			{#each items as item (item.id)}
				<button
					class="group relative transition-all whitespace-nowrap shrink-0 flex items-center gap-1
					{size === 'sm' ? 'px-2 h-6 text-[12px]' : 'px-3 h-7 text-sm'}
					font-medium rounded-full
					{activeId === item.id
						? 'text-foreground' 
						: 'text-foreground/70 hover:bg-accent/40 hover:text-accent-foreground'} 
					"
					onclick={() => onSelect(item.id)}
				>
					{#if activeId === item.id}
						<!-- 激活背景胶囊 -->
						<div
							class="absolute inset-0 z-deep rounded-full bg-background backdrop-blur-sm transition-all duration-300 {noShadow ? '' : 'shadow-sm'}"
							transition:fade={{ duration: 200 }}
						></div>
					{/if}
					
					{#if item.icon}
						<item.icon size={14} class="shrink-0" />
					{/if}
					<span>{item.label}</span>
				</button>
			{/each}
		</div>
	</FadeEdge>
</LiquidGlass>

<style>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
