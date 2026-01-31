<script lang="ts">
	/**
	 * 主内容区域组件
	 *
	 * 负责渲染页面的主要内容，处理滚动位置恢复和页面切换动画。
	 *
	 * @prop children - Svelte Snippet 页面内容
	 * @prop pathname - 当前页面路径 (用于触发切换动画的 key)
	 * @prop class - 额外的 CSS 类名
	 */
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import ScrollContainer from '$lib/components/ui/layout/ScrollContainer.svelte';
	import BlurEdge from '$lib/components/ui/effect/BlurEdge.svelte';
	import { layoutState, headerState } from '$lib/state.svelte';
	import type { Snippet } from 'svelte';
    import { cn } from '$lib/utils';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { tick } from 'svelte';


	let { children, pathname, class: className = '' } = $props<{ 
        children: Snippet; 
        pathname: string;
        class?: string 
    }>();

    let isScrollable = $derived(layoutState.isContentScrollable);
    // 自动检测 Header 是否处于扩展模式 (即存在中间组件 - CategoryNav)
    let isHeaderExtended = $derived(!!headerState.middleComponent);
    
    let hasScrollTop = $state(false);
    let hasScrollBottom = $state(false);
	let scrollRef = $state<HTMLElement>();

	// Map to store scroll positions: pathname -> scrollTop
	let scrollPositions = new Map<string, number>();

	beforeNavigate(() => {
		if (scrollRef && isScrollable) {
			scrollPositions.set(pathname, scrollRef.scrollTop);
		}
	});

	afterNavigate(async ({ type, to }) => {
		await tick();
		if (!scrollRef || !isScrollable) return;

		if (type === 'popstate' && to?.url.pathname) {
			// Restore position for back/forward navigation
			const savedPosition = scrollPositions.get(to.url.pathname) ?? 0;
			scrollRef.scrollTop = savedPosition;
		} else {
			// Reset to top for normal navigation
			scrollRef.scrollTop = 0;
		}
	});
</script>

<ScrollContainer
	class={cn(
        // Base styles for both (using responsive prefixes for differences)
        "w-full flex flex-col transition-all duration-300 ease-in-out",
        // Mobile specific: 100dvh, padding. Dynamic top padding for extended header.
        "h-[100dvh] pr-2 pl-2",
        isHeaderExtended ? "pt-25" : "pt-13",
        // Desktop specific: h-full (nested in restricted container), different padding
        "md:h-full md:min-h-0 md:pt-16 md:pr-4 md:pb-4 md:pl-4",
        // Scroll state styling
        isScrollable ? "overflow-y-auto pointer-events-auto" : "overflow-hidden pointer-events-auto",
        className
    )}
	enabled={isScrollable}
    useMask={false}
    bind:hasScrollTop={hasScrollTop}
    bind:hasScrollBottom={hasScrollBottom}
	bind:ref={scrollRef}
>
	<div class={cn(
		"w-full transition-all duration-300 grid",
		isScrollable ? "min-h-full" : "h-full min-h-0"
	)}>
		<Crossfade 
			key={pathname} 
			class="size-full"
		>
		{@render children()}
		</Crossfade>
	</div>
    
    <BlurEdge visible={isScrollable} showStart={hasScrollTop} showEnd={hasScrollBottom} />
</ScrollContainer>
