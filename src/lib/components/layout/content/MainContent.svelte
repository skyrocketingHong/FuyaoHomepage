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
	import { layoutState, headerState } from '$lib/stores/app.svelte';
	import type { Snippet } from 'svelte';
    import { cn } from '$lib/utils/index';
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

	// 存储滚动位置的 Map: pathname -> scrollTop
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
			// 为后退/前进导航恢复位置
			const savedPosition = scrollPositions.get(to.url.pathname) ?? 0;
			scrollRef.scrollTop = savedPosition;
		} else {
			// 正常导航时重置回顶部
			scrollRef.scrollTop = 0;
		}
	});
</script>

<ScrollContainer
	class={cn(
        // 两者的基础样式 (使用响应式前缀区分)
        "w-full flex flex-col transition-all duration-300 ease-in-out",
        // 移动端特定: 100dvh, padding. 针对扩展头部动态调整顶部 padding.
        "h-[100dvh] pr-2 pl-2",
        isHeaderExtended ? "pt-25" : "pt-13",
        // 桌面端特定: h-full (嵌套在受限容器中), 不同的 padding
        "lg:h-full lg:min-h-0 lg:pt-16 lg:pr-4 lg:pb-4 lg:pl-4",
        // 滚动状态样式
        isScrollable ? "overflow-y-auto" : "overflow-hidden",
        layoutState.isContentTransparent ? "pointer-events-none" : "pointer-events-auto",
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
