<script lang="ts">
	/**
	 * 滚动遮罩容器
	 *
	 * 带有自动边缘渐变遮罩 (Fade Mask) 的滚动容器。
	 * 自动检测内容溢出情况，显示顶部或底部的阴影暗示更多内容。
	 *
	 * @prop children - Svelte Snippet 内容
	 * @prop class - 容器额外的 CSS 类名
	 * @prop ref - (bindable) 绑定的 DOM 元素引用
	 * @prop enabled - 是否启用滚动与遮罩检测 (默认 true)
	 * @prop useMask - 是否应用 CSS Mask 遮罩效果 (默认 true)
	 * @prop hasScrollTop - (bindable) 是否有顶部滚动距离
	 * @prop hasScrollBottom - (bindable) 是否有底部滚动余量
	 * @prop fadeSize - 边缘渐隐区域的大小 (支持 css 单位与变量, 默认 'var(--edge-fade-size, 3rem)')
	 * @prop fadeStartSize - 起始端 (左/上) 渐隐大小 (可选; 垂直方向默认 'var(--edge-fade-top-size, 20px)')
	 * @prop fadeEndSize - 结束端 (右/下) 渐隐大小 (可选; 垂直方向默认 'var(--edge-fade-bottom-size, 28px)')
	 */
	import { cn } from '$lib/utils/index';
	import FadeEdge from '$lib/components/ui/effect/FadeEdge.svelte';
	import type { Snippet } from 'svelte';

	let {
		children,
		class: className = '',
		ref = $bindable(),
		enabled = true,
		useMask = true,
		hasScrollTop = $bindable(false),
		hasScrollBottom = $bindable(false),
		orientation = 'vertical',
		fadeSize = 'var(--edge-fade-size, 3rem)',
		fadeStartSize = undefined,
		fadeEndSize = undefined,
		...rest
	} = $props<{
		children: Snippet;
		class?: string;
		ref?: HTMLElement;
		style?: string;
		enabled?: boolean;
		useMask?: boolean;
		hasScrollTop?: boolean;
		hasScrollBottom?: boolean;
		orientation?: 'horizontal' | 'vertical';
		fadeSize?: string;
		fadeStartSize?: string;
		fadeEndSize?: string;
		[key: string]: unknown;
	}>();

	let container = $state<HTMLElement>();

	$effect(() => {
		if (container) ref = container;
	});

	function updateScrollMask() {
		if (!container || !enabled) return;

		if (orientation === 'horizontal') {
			const { scrollLeft, scrollWidth, clientWidth } = container;
			// 映射到 hasScrollTop/Bottom 以保持 API 兼容 (Top -> Start/Left, Bottom -> End/Right)
			const left = scrollLeft > 0;
			const right = Math.ceil(scrollLeft + clientWidth) < scrollWidth - 1;
			hasScrollTop = left;
			hasScrollBottom = right;
		} else {
			const { scrollTop, scrollHeight, clientHeight } = container;
			const top = scrollTop > 0;
			const bottom = Math.ceil(scrollTop + clientHeight) < scrollHeight - 1;
			hasScrollTop = top;
			hasScrollBottom = bottom;
		}
	}

	$effect(() => {
		// 初始化时检查
		if (enabled) updateScrollMask();

		// 添加 ResizeObserver 以处理窗口大小调整或内容大小变化
		if (container && enabled) {
			// ResizeObserver 与 MutationObserver 共用单一挂起的 RAF，合并连续触发
			let rafId = 0;
			const update = () => {
				if (rafId) return;
				rafId = requestAnimationFrame(() => {
					rafId = 0;
					updateScrollMask();
				});
			};

			const ro = new ResizeObserver(update);
			ro.observe(container);
			// 如果存在第一个子元素，也监听它，因为它的尺寸通常决定了 scrollHeight
			if (container.firstElementChild) {
				ro.observe(container.firstElementChild);
			}

			// 仅监听子节点增删，以捕捉内容结构变化（例如图片加载完成）
			// 不监听 style/class 属性，避免交互动画导致的无效回调
			const mo = new MutationObserver(update);
			mo.observe(container, {
				childList: true,
				subtree: true
			});

			return () => {
				ro.disconnect();
				mo.disconnect();
				if (rafId) cancelAnimationFrame(rafId);
			};
		}
	});

	// 当 children 变化时重新检查（基础检查，大部分由 ResizeObserver 处理）
	$effect(() => {
		if (children && enabled) setTimeout(updateScrollMask, 100);
	});
</script>

<FadeEdge
	bind:ref={container}
	onscroll={enabled ? updateScrollMask : undefined}
	class={cn('scroll-smooth', className)}
	{orientation}
	visible={enabled && useMask}
	showStart={hasScrollTop}
	showEnd={hasScrollBottom}
	{fadeSize}
	fadeStartSize={fadeStartSize ??
		(orientation === 'vertical' ? 'var(--edge-fade-top-size, 20px)' : undefined)}
	fadeEndSize={fadeEndSize ??
		(orientation === 'vertical' ? 'var(--edge-fade-bottom-size, 28px)' : undefined)}
	{...rest}
>
	{@render children()}
</FadeEdge>
