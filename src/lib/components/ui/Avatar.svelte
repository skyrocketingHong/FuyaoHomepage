<script lang="ts">
	/**
	 * 头像组件
	 *
	 * 可复用的头像显示组件，支持不同尺寸和在线状态指示器。
	 */
	import { cn } from '$lib/utils';
	import { fade } from 'svelte/transition';
	import LoadingSpinner from './LoadingSpinner.svelte';

	interface Props {
		/** 头像图片 URL */
		src: string;
		/** 替代文本 */
		alt?: string;
		/** 尺寸：sm (48px), md (64px), lg (128px) */
		size?: 'sm' | 'md' | 'lg';
		/** 是否显示在线状态指示器 */
		showStatus?: boolean;
		/** 状态提示文字 */
		statusTitle?: string;
		/** 额外的 CSS 类名 */
		class?: string;
	}

	let {
		src,
		alt = 'Avatar',
		size = 'md',
		showStatus = false,
		statusTitle = '',
		class: className = ''
	}: Props = $props();

	const sizeClasses = {
		sm: 'size-12',
		md: 'size-16',
		lg: 'size-32'
	};

	const statusSizeClasses = {
		sm: 'h-2 w-2',
		md: 'h-3 w-3',
		lg: 'h-4 w-4'
	};

	const statusPositionClasses = {
		sm: '-right-1 -bottom-1 p-1',
		md: '-right-1.5 -bottom-1.5 p-1.5',
		lg: '-right-2 -bottom-2 p-2'
	};

	let loading = $state(true);

	$effect(() => {
		loading = true;
		const img = new Image();
		img.src = src;

		let active = true;
		img.onload = () => {
			if (active) loading = false;
		};

		return () => {
			active = false;
		};
	});
</script>

<div class={cn('relative shrink-0', className)}>
	<!-- 悬停光晕效果 -->
	<div
		class="absolute -inset-1 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
	></div>


	<!-- 头像内容区域 -->
	<div
		class={cn(
			'relative overflow-hidden rounded-full border border-white/10 bg-white/20 shadow-md',
			size === 'lg' && 'border-4 border-white/20',
			sizeClasses[size]
		)}
	>
		<!-- 头像图片 -->
		<img
			{src}
			{alt}
			class={cn(
				'h-full w-full object-cover transition-all duration-300 group-hover:scale-105',
				loading ? 'opacity-0' : 'opacity-100'
			)}
		/>

		<!-- 加载动画 -->
		{#if loading}
			<div
				class="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-sm transition-all duration-300 rounded-full"
				out:fade={{ duration: 300 }}
			>
				<LoadingSpinner {size} />
			</div>
		{/if}
	</div>

	<!-- 在线状态指示器 -->
	{#if showStatus}
		<div
			class={cn(
				'absolute rounded-full border-4 border-[#0f172a] bg-green-500',
				statusPositionClasses[size]
			)}
			title={statusTitle}
		>
			<div class={cn('animate-pulse rounded-full bg-white', statusSizeClasses[size])}></div>
		</div>
	{/if}
</div>
