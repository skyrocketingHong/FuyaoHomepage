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
	 * @prop sources - 响应式 picture source 列表
	 * @prop loading - 浏览器加载策略，默认保持 lazy
	 */
	import { cn } from '$lib/utils/index';
	import LoadingSpinner from '../feedback/LoadingSpinner.svelte';
	import { fade } from 'svelte/transition';

	interface ResponsiveSource {
		srcset: string;
		media?: string;
		sizes?: string;
		type?: string;
	}

	interface Props {
		src: string;
		srcset?: string;
		sizes?: string;
		sources?: ResponsiveSource[];
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
		/** 浏览器加载策略；普通内容图片默认继续懒加载 */
		loading?: 'eager' | 'lazy';
		decoding?: 'async' | 'sync' | 'auto';
		fetchpriority?: 'high' | 'low' | 'auto';
	}

	let {
		src,
		srcset,
		sizes,
		sources = [],
		alt = '',
		class: className = '',
		width,
		height,
		fit = 'cover',
		fill = false,
		onload,
		onerror,
		imgClass = '',
		loading = 'lazy',
		decoding = 'async',
		fetchpriority = 'auto'
	}: Props = $props();

	let loaded = $state(false);

	function handleLoad() {
		loaded = true;
		onload?.();
	}

	function handleError() {
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
			class="absolute inset-0 z-10 flex items-center justify-center bg-muted/10"
			out:fade={{ duration: 300 }}
		>
			<LoadingSpinner size="md" />
		</div>
	{/if}

	<!-- 图片；未传 sources 时仍保持既有内容图片行为 -->
	<picture class={fill ? 'block h-full w-full' : undefined}>
		{#each sources as source (source.srcset)}
			<source srcset={source.srcset} media={source.media} sizes={source.sizes} type={source.type} />
		{/each}
		<img
			{src}
			{srcset}
			{sizes}
			{alt}
			{loading}
			{decoding}
			{fetchpriority}
			class={cn(
				'will-change-opacity transition-opacity duration-500',
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
	</picture>
</div>
