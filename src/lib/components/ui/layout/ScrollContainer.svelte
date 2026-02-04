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
		[key: string]: any; 
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
			const update = () => {
				requestAnimationFrame(updateScrollMask);
			};
			
			const ro = new ResizeObserver(update);
			ro.observe(container);
			// 如果存在第一个子元素，也监听它，因为它的尺寸通常决定了 scrollHeight
			if (container.firstElementChild) {
				ro.observe(container.firstElementChild);
			}

            // 监听 DOM 变动，以捕捉可能不会立即触发 Resize 的内容变化（例如图片加载状态更改，尚未改变布局但稍后可能会改变）
            const mo = new MutationObserver(update);
            mo.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });

			return () => {
				ro.disconnect();
				mo.disconnect();
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
	class={cn("scroll-smooth", className)}
    orientation={orientation}
    visible={enabled && useMask}
    showStart={hasScrollTop}
    showEnd={hasScrollBottom}
    fadeSize="32px"
	{...rest}
>
	{@render children()}
</FadeEdge>
