<script lang="ts">
	/**
	 * 懒加载图片组件
	 *
	 * 支持图片懒加载，带有加载中的 spinner 动画。
	 * 图片加载完成后平滑淡入。
	 *
	 * @prop src - 图片地址
	 * @prop alt - 图片描述
	 * @prop class - 外部传入的 class
	 * @prop width - 图片宽度
	 * @prop height - 图片高度
	 * @prop fit - 图片填充模式 (object-fit)
	 */
	import { cn } from '$lib/utils/index';
	import LoadingSpinner from '../feedback/LoadingSpinner.svelte';
	import { fade } from 'svelte/transition';

	interface Props {
		src: string;
		alt?: string;
		class?: string;
		/** 图片宽度 */
		width?: string | number;
		/** 图片高度 */
		height?: string | number;
		/** object-fit 属性 */
		fit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
        /** 是否使用绝对定位填充父容器 (常用模式) */
        fill?: boolean;
        /** 图片加载完成回调 */
        onload?: () => void;
        /** 内部 img 元素的额外 class */
        imgClass?: string;
        /** 图片加载失败回调 */
        onerror?: () => void;
	}

	let {
		src,
		alt = '',
		class: className = '',
		width,
		height,
		fit = 'cover',
        fill = false,
        onload,
        onerror,
        imgClass = ''
	}: Props = $props();

	let loaded = $state(false);
	let error = $state(false);

	function handleLoad() {
		loaded = true;
        onload?.();
	}

	function handleError() {
		error = true;
		loaded = true; // 即使出错也停止加载动画
        onerror?.();
	}
</script>

<div
	class={cn(
		'relative overflow-hidden bg-muted/20',
        fill ? 'absolute inset-0 h-full w-full' : '',
		className
	)}
    style:width={width ? (typeof width === 'number' ? `${width}px` : width) : undefined}
    style:height={height ? (typeof height === 'number' ? `${height}px` : height) : undefined}
>
	<!-- 加载动画 -->
	{#if !loaded}
		<div
			class="absolute inset-0 flex items-center justify-center bg-muted/10 z-10"
			out:fade={{ duration: 300 }}
		>
			<LoadingSpinner size="md" />
		</div>
	{/if}

	<!-- 图片 -->
	<img
		{src}
		{alt}
		loading="lazy"
		class={cn(
			'transition-opacity duration-500 will-change-opacity',
			loaded ? 'opacity-100' : 'opacity-0',
            fill ? 'h-full w-full' : '',
            fit === 'cover' && 'object-cover',
            fit === 'contain' && 'object-contain',
            fit === 'fill' && 'object-fill',
            fit === 'none' && 'object-none',
            fit === 'scale-down' && 'object-scale-down',
            imgClass
		)}
		onload={handleLoad}
		onerror={handleError}
	/>
</div>
