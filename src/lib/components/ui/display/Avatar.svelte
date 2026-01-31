<script lang="ts">
	/**
	 * 头像组件
	 *
	 * 可复用的头像显示组件，支持不同尺寸和在线状态指示器。
	 * 支持自适应展示状态：头像可加载时显示在线，否则显示离线并使用默认头像。
	 * 
	 * @prop src - 头像图片 URL
	 * @prop alt - 替代文本 (默认 'Avatar')
	 * @prop size - 尺寸：sm | md | lg (默认 'md')
	 * @prop showStatus - 是否显示在线状态指示器 (默认 false)
	 * @prop statusTitle - 状态提示文字 (默认 '')
	 * @prop adaptiveStatus - 自适应展示状态：头像可加载时显示在线，否则显示离线 (默认 false)
	 * @prop class - 额外的 CSS 类名
	 */
	import { cn } from '$lib/utils';
	import { fade } from 'svelte/transition';
	import LoadingSpinner from '../feedback/LoadingSpinner.svelte';
	import Crossfade from '../effect/Crossfade.svelte';

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
			'relative overflow-hidden rounded-full border border-border bg-muted shadow-md',
			size === 'lg' && 'border-4 border-border',
			sizeClasses[size]
		)}
	>
		<!-- 头像图片或默认 emoji -->
		{#if loadFailed}
			<div class="flex h-full w-full items-center justify-center bg-muted text-2xl">
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
			<Crossfade key={loading} class="absolute inset-0 bg-background/10 backdrop-blur-sm rounded-full">
				<div class="h-full w-full flex items-center justify-center">
					<LoadingSpinner {size} />
				</div>
			</Crossfade>
		{/if}
	</div>

	<!-- 在线状态指示器 -->
	{#if shouldShowStatus}
		<div
			class={cn(
				'absolute rounded-full border-2 border-background',
				isOnline ? 'bg-green-500' : 'bg-muted',
				statusPositionClasses[size]
			)}
			title={computedStatusTitle}
		>
			<div class={cn('rounded-full bg-white', isOnline && 'animate-pulse', statusSizeClasses[size])}></div>
		</div>
	{/if}
</div>
