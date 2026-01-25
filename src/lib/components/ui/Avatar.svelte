<script lang="ts">
	/**
	 * 头像组件
	 *
	 * 可复用的头像显示组件，支持不同尺寸和在线状态指示器。
	 * 支持自适应展示状态：头像可加载时显示在线，否则显示离线并使用默认头像。
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
		/** 自适应展示状态：头像可加载时显示在线，否则显示离线 */
		adaptiveStatus?: boolean;
		/** 额外的 CSS 类名 */
		class?: string;
	}

	let {
		src,
		alt = 'Avatar',
		size = 'md',
		showStatus = false,
		statusTitle = '',
		adaptiveStatus = false,
		class: className = ''
	}: Props = $props();

	const sizeClasses = {
		sm: 'size-12',
		md: 'size-16',
		lg: 'size-32'
	};

	const statusSizeClasses = {
		sm: 'h-1.5 w-1.5',
		md: 'h-2 w-2',
		lg: 'h-3 w-3'
	};

	const statusPositionClasses = {
		sm: '-right-0.5 -bottom-0.5 p-0.5',
		md: '-right-1 -bottom-1 p-1',
		lg: '-right-1.5 -bottom-1.5 p-1.5'
	};

	let loading = $state(true);
	let loadFailed = $state(false);

	// 计算是否应该显示状态指示器
	let shouldShowStatus = $derived(showStatus || adaptiveStatus);

	// 计算是否为在线状态（自适应模式下根据加载结果判断）
	let isOnline = $derived(adaptiveStatus ? !loadFailed : true);

	// 计算状态提示文字
	let computedStatusTitle = $derived(
		statusTitle || (adaptiveStatus ? (isOnline ? '在线' : '离线') : '')
	);

	$effect(() => {
		loading = true;
		loadFailed = false;
		const img = new Image();
		img.src = src;

		let active = true;
		img.onload = () => {
			if (active) {
				loading = false;
				loadFailed = false;
			}
		};
		img.onerror = () => {
			if (active) {
				loading = false;
				loadFailed = true;
			}
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
		<!-- 头像图片或默认 emoji -->
		{#if loadFailed}
			<div class="flex h-full w-full items-center justify-center bg-white/10 text-2xl">
				❔
			</div>
		{:else}
			<img
				{src}
				{alt}
				class={cn(
					'h-full w-full object-cover transition-all duration-300 group-hover:scale-105',
					loading ? 'opacity-0' : 'opacity-100'
				)}
			/>
		{/if}

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
	{#if shouldShowStatus}
		<div
			class={cn(
				'absolute rounded-full border-2 border-[#0f172a]',
				isOnline ? 'bg-green-500' : 'bg-gray-400',
				statusPositionClasses[size]
			)}
			title={computedStatusTitle}
		>
			<div class={cn('rounded-full bg-white', isOnline && 'animate-pulse', statusSizeClasses[size])}></div>
		</div>
	{/if}
</div>
