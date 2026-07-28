<script lang="ts">
	/**
	 * 可复用的分段控制器组件 (Segmented Control)
	 *
	 * 采用胶囊样式，支持图标和标签，带平滑激活背景切换。
	 * 默认模式由 LiquidGlass (variant="control") 提供玻璃材质；
	 * embedded 模式用于 Header 工具栏胶囊：外壳使用 .header-control-shell 共享材质
	 * (主体染色来自 --glass-surface)，自行承担一次
	 * control 级原生背景模糊，不依赖 HeaderChrome、不注册 WebGL 合成器、不使用 SVG 折射；
	 * 尺寸由外壳单层 padding 控制 (桌面：外壳 36px + 四边 4px 内距 + 内部轨道 28px；
	 * 移动端：外壳 44px + 四边 4px 内距 + 内部轨道 36px)，按钮与选中指示直接占满轨道；
	 * 选中层为半透明浅色专用 token (--header-control-selected)，外壳 isolate 建立局部
	 * 层叠上下文，选中层位于局部底层 (z-index 0)，图标与文字在其上 (z-index 1)。
	 *
	 * @prop items - 选项数组 { id: string, label: string, icon?: Component }
	 * @prop activeId - 当前选中的 ID
	 * @prop onSelect - 选中回调
	 * @prop embedded - 是否使用嵌入 chrome 的静态表面模式 (默认 false)
	 * @prop class - 外部容器样式类
	 */
	import { fade } from 'svelte/transition';
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import FadeEdge from '$lib/components/ui/effect/FadeEdge.svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import type { ComponentType } from 'svelte';

	interface Item {
		id: string;
		label: string;
		icon?: ComponentType;
	}

	let {
		items,
		activeId,
		onSelect,
		size = 'md',
		noShadow = false,
		embedded = false,
		class: className = ''
	} = $props<{
		items: Item[];
		activeId: string;
		onSelect: (id: string) => void;
		size?: 'sm' | 'md';
		noShadow?: boolean;
		embedded?: boolean;
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
		void items;
		void activeId;
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

{#snippet controlBody()}
	<FadeEdge
		orientation="horizontal"
		{showStart}
		{showEnd}
		fadeSize="10%"
		class="w-full {embedded ? 'h-full' : size === 'sm' ? 'h-7' : 'h-9'}"
	>
		<div
			bind:this={container}
			onscroll={updateScrollState}
			class="no-scrollbar flex h-full w-full items-center gap-0.5 overflow-x-auto {embedded
				? 'p-0'
				: 'p-0.5'}"
			onwheel={handleWheel}
		>
			{#each items as item (item.id)}
				<!-- embedded：按钮直接占满内部轨道 (高度 100%)，尺寸仅由外壳 padding 控制 -->
				<button
					class="group relative flex shrink-0 items-center whitespace-nowrap transition-all
					{embedded
						? 'h-full px-3 text-sm'
						: 'gap-1 ' + (size === 'sm' ? 'h-6 px-2 text-[12px]' : 'h-7 px-3 text-sm')}
					rounded-full font-medium
					{activeId === item.id
						? 'text-foreground'
						: 'text-foreground/70 hover:bg-accent/40 hover:text-accent-foreground'}
					"
					onclick={() => onSelect(item.id)}
				>
					{#if activeId === item.id}
						<!-- 选中指示：embedded 为半透明浅色 token 填充，位于局部底层 (z-0)，无 backdrop-filter -->
						<div
							class="absolute inset-0 rounded-full transition-all duration-300 {embedded
								? 'bg-header-control-selected z-0 shadow-[inset_0_1px_2px_var(--header-control-shadow)]'
								: 'z-deep bg-background backdrop-blur-sm ' + (noShadow ? '' : 'shadow-sm')}"
							transition:fade={{ duration: 200 }}
						></div>
					{/if}

					<span class="relative z-[1] flex items-center gap-1">
						{#if item.icon}
							<item.icon size={embedded ? 18 : 14} strokeWidth={2} class="shrink-0" />
						{/if}
						<Crossfade key={item.label} inline class="inline-grid"
							><span>{item.label}</span></Crossfade
						>
					</span>
				</button>
			{/each}
		</div>
	</FadeEdge>
{/snippet}

{#if embedded}
	<!-- Header 工具栏胶囊：共享外壳材质，自带 control 级背景模糊，isolate 建立局部层叠上下文 -->
	<div
		class="header-control-shell pointer-events-auto isolate mx-auto box-border flex h-11 w-fit max-w-full items-center rounded-full p-1 text-foreground md:h-9 {className}"
	>
		{@render controlBody()}
	</div>
{:else}
	<LiquidGlass
		variant="control"
		class="group pointer-events-auto mx-auto box-border flex w-fit max-w-full items-center rounded-full p-0 text-foreground {className}"
		flat={noShadow}
	>
		{@render controlBody()}
	</LiquidGlass>
{/if}
