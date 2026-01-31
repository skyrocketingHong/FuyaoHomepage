<script lang="ts">
	/**
	 * 分类导航组件
	 *
	 * 显示文章分类的水平滚动列表（胶囊样式）。
	 * 当分类项溢出时自动显示左右渐变遮罩，并支持自动滚动到激活项。
	 *
	 * @prop categories - 分类项数组 (包含 slug 和 title)
	 * @prop activeCategory - 当前激活的分类 slug
	 * @prop onSelect - 选择分类时的回调函数
	 */
	import { fade } from 'svelte/transition';
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import FadeEdge from '$lib/components/ui/effect/FadeEdge.svelte';
	
	interface Category {
		slug: string;
		title: string;
	}

	let { categories, activeCategory, onSelect } = $props<{
		categories: Category[];
		activeCategory: string; // This matches the slug
		onSelect: (cat: string) => void;
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
		// 允许 1px 误差
		showEnd = Math.ceil(scrollLeft + tempClientWidth) < scrollWidth - 1;
	}

    function scrollToActive() {
        if (!container) return;
        const buttons = container.querySelectorAll('button');
        const index = categories.findIndex((c: Category) => c.slug === activeCategory);
        if (index >= 0 && buttons[index]) {
            const btn = buttons[index] as HTMLElement;
            // 居中按钮
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

    // 当 categories 或 activeCategory 变化时更新
    $effect(() => {
        // 依赖 categories
        categories;
        activeCategory;
        if (container) {
            setTimeout(() => {
                updateScrollState();
                scrollToActive();
            }, 50);
        }
    });
</script>

<LiquidGlass 
	tag="nav"
	class="group h-9 box-border w-fit mx-auto max-w-full rounded-full p-0 text-foreground pointer-events-auto flex items-center"
>
	<FadeEdge 
		orientation="horizontal"
		showStart={showStart}
		showEnd={showEnd}
		fadeSize="10%"
		class="w-full h-full"
	>
	<div 
		bind:this={container}
		onscroll={updateScrollState}
		class="w-full overflow-x-auto no-scrollbar flex items-center p-1 gap-0.5"
		onwheel={(e) => {
			if (e.deltaY !== 0) {
				e.preventDefault();
				e.currentTarget.scrollLeft += e.deltaY;
			}
		}}
	>
		{#each categories as cat}
			<button
				class="group relative px-3 py-0 text-sm font-medium rounded-full transition-all whitespace-nowrap shrink-0 h-7
				{activeCategory === cat.slug
					? 'text-foreground' 
					: 'text-foreground hover:bg-accent/40 hover:text-accent-foreground'} 
				"
				onclick={() => onSelect(cat.slug)}
			>
				{#if activeCategory === cat.slug}
					<!-- 激活背景胶囊 -->
					<div
						class="absolute inset-0 z-deep rounded-full bg-background shadow-sm backdrop-blur-sm transition-all duration-300"
						transition:fade={{ duration: 200 }}
					></div>
				{/if}
				{cat.title}
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
