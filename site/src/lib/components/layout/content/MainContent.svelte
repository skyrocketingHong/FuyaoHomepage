<script lang="ts">
	/**
	 * 主内容区域组件
	 *
	 * 负责渲染页面的主要内容，处理滚动位置恢复和页面切换动画。
	 * 顶部内边距统一由 token 计算：Header 高度 + Header-Content 间距 (移动端 12px / 桌面端 16px)，
	 * 普通 Header、扩展 Header 及桌面端共用同一计算规则。
	 * 通过 bindable 的 headerObscured 向根布局暴露“内容已进入 Header 后方”的状态：
	 * 以真实内部滚动容器为准 (不监听 window)，滚动阈值等于 Header-Content 间距。
	 * 底部边缘渐隐在本实例局部关闭 (fadeEndSize=0)：正文滚动到底后保持完整不透明；
	 * 顶部渐隐、共享 FadeEdge/ScrollContainer 默认行为及其他实例均不受影响。
	 * 当后代包含 StatusState viewport 数据标记时，使用 :has() 声明式关闭本实例滚动、
	 * 移除渐隐并隐藏布局底部占位，不恢复页面生命周期维护全局滚动状态的旧方案。
	 * 固定视口支付页通过 data-payment-page 仅放开垂直视觉溢出，使 Pass 表面可延伸到
	 * 固定 Dock 后方；最外层应用框架继续裁定视口边界，因此不会产生页面滚动。
	 *
	 * @prop children - Svelte Snippet 页面内容
	 * @prop pathname - 当前页面路径 (用于触发切换动画的 key)
	 * @prop scrollable - 内容区域是否可滚动 (由路由配置派生)
	 * @prop headerObscured - (bindable) 内容是否已滚动进入 Header 后方
	 * @prop class - 额外的 CSS 类名
	 */
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import ScrollContainer from '$lib/components/ui/layout/ScrollContainer.svelte';
	import { layoutState, headerState } from '$lib/stores/app.svelte';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/index';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { tick } from 'svelte';

	let {
		children,
		pathname,
		scrollable,
		headerObscured = $bindable(false),
		class: className = ''
	} = $props<{
		children: Snippet;
		pathname: string;
		scrollable: boolean;
		headerObscured?: boolean;
		class?: string;
	}>();

	let isScrollable = $derived(scrollable);
	// 自动检测 Header 是否处于扩展模式 (即存在中间组件 - CategoryNav)
	let isHeaderExtended = $derived(!!headerState.middle.component);
	let mainContentTopInset = $derived(
		isHeaderExtended
			? 'calc(var(--header-height-extended) + var(--header-content-gap))'
			: 'calc(var(--header-height) + var(--header-content-gap))'
	);

	let hasScrollTop = $state(false);
	let hasScrollBottom = $state(false);
	let scrollRef = $state<HTMLElement>();

	import { SvelteMap } from 'svelte/reactivity';
	// 存储滚动位置的 Map: pathname -> scrollTop
	let scrollPositions = new SvelteMap<string, number>();

	/** 读取 --header-content-gap token 的当前像素值，作为 Chrome 显隐阈值 (随断点变化) */
	function getHeaderGapPx(): number {
		if (!scrollRef) return 0;
		const raw = getComputedStyle(scrollRef).getPropertyValue('--header-content-gap');
		const parsed = Number.parseFloat(raw);
		return Number.isFinite(parsed) ? parsed : 0;
	}

	/** 首个内容顶部到达 Header 底边 (滚动距离 >= Header-Content 间距) 时视为遮挡 */
	function updateHeaderObscured() {
		headerObscured = !!scrollRef && isScrollable && scrollRef.scrollTop >= getHeaderGapPx();
	}

	// 监听真实内部滚动容器 (不监听 window)，并在容器尺寸/断点变化后重新计算
	$effect(() => {
		const el = scrollRef;
		if (!el || !isScrollable) {
			headerObscured = false;
			return;
		}
		updateHeaderObscured();
		el.addEventListener('scroll', updateHeaderObscured, { passive: true });
		const ro = new ResizeObserver(updateHeaderObscured);
		ro.observe(el);
		return () => {
			el.removeEventListener('scroll', updateHeaderObscured);
			ro.disconnect();
		};
	});

	// 页面切换后重新计算 (滚动位置恢复/重置会触发 scroll 事件，这里兜底一次)
	$effect(() => {
		void pathname;
		updateHeaderObscured();
	});

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
		updateHeaderObscured();
	});
</script>

<ScrollContainer
	class={cn(
		// 两者的基础样式 (使用响应式前缀区分)
		// 仅过渡布局 padding (Header 扩展时顶部间距变化)，不使用 transition-all
		'main-content relative flex w-full flex-col transition-[padding] duration-300 ease-in-out',
		// 移动端特定: 100dvh, padding. 针对扩展头部动态调整顶部 padding.
		// 顶部内边距统一为 Header 高度 + Header-Content 间距 token，页面不得再单独补间距
		'h-[100dvh] px-[var(--content-inline-inset)]',
		isHeaderExtended
			? 'pt-[calc(var(--header-height-extended)+var(--header-content-gap))] lg:pt-[calc(var(--header-height)+var(--header-content-gap))]'
			: 'pt-[calc(var(--header-height)+var(--header-content-gap))]',
		// 桌面端特定: h-full (嵌套在受限容器中), 不同的 padding
		'lg:h-full lg:min-h-0 lg:pb-4',
		// 滚动状态样式
		isScrollable ? 'overflow-y-auto' : 'overflow-hidden',
		layoutState.isContentTransparent ? 'pointer-events-none' : 'pointer-events-auto',
		className
	)}
	style={`--main-content-top-inset: ${mainContentTopInset};`}
	enabled={isScrollable}
	fadeEndSize="0px"
	bind:hasScrollTop
	bind:hasScrollBottom
	bind:ref={scrollRef}
>
	<div class={cn('grid w-full', isScrollable ? 'min-h-full' : 'h-full min-h-0')}>
		<Crossfade key={pathname} class="size-full">
			{@render children()}
		</Crossfade>
	</div>
</ScrollContainer>

<style>
	:global(.main-content:has([data-status-layout='viewport'])) {
		overflow-x: hidden !important;
		overflow-y: hidden !important;
		mask-image: none !important;
		-webkit-mask-image: none !important;
	}

	:global(.main-content:has([data-status-layout='viewport']) [data-main-content-spacer]) {
		display: none !important;
	}

	:global(.main-content:has([data-payment-page])) {
		overflow: visible !important;
		mask-image: none !important;
		-webkit-mask-image: none !important;
	}

	@media (min-width: 1024px) {
		:global(.main-content) {
			--main-content-top-inset: calc(var(--header-height) + var(--header-content-gap)) !important;
		}
	}
</style>
