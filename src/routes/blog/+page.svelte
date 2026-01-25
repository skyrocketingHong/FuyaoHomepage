<script lang="ts">
	/**
	 * 博客页面
	 *
	 * 通过 iframe 嵌入外部博客站点。
	 */
	import LiquidGlass from '$lib/components/ui/LiquidGlass.svelte';
	import Crossfade from '$lib/components/ui/Crossfade.svelte';
	import LoadingState from '$lib/components/ui/LoadingState.svelte';
	import { getTranslation } from '$lib/i18n/store';

	/** 博客地址，从环境变量读取 */
	const blogUrl = import.meta.env.VITE_BLOG_URL;
	const VITE_SITE_NAME = import.meta.env.VITE_SITE_NAME;
	const loadingText = `${getTranslation('common.travingto')}${getTranslation('common.colon')}${VITE_SITE_NAME}${getTranslation('blog.iframe_loading')}`;

	let isLoading = $state(true);
</script>

<!-- 博客 iframe 容器 -->
<div class="relative min-h-[calc(100vh-12rem)] w-full md:h-full md:min-h-0">
	<!-- 视觉外壳层：由于 iframe 需要在加载时保持存在，这里将视觉效果作为背景层分离 -->
	<Crossfade key={isLoading} class="absolute inset-0 z-10 w-full h-full">
		{#if isLoading}
			<!-- 加载状态：LiquidGlass + Spinner -->
			<LiquidGlass class="h-full w-full p-0">
				<div class="flex h-full w-full items-center justify-center">
					<LoadingState loading={true} variant="inline" text={loadingText}/>
				</div>
			</LiquidGlass>
		{:else}
			<!-- 加载完成：静态样式 -->
			<div
				class="h-full w-full rounded-2xl border-[0.5px] border-white/20 bg-white/10 shadow-lg dark:bg-black/20 dark:border-white/10"
			></div>
		{/if}
	</Crossfade>

	<!-- 内容层：Iframe 始终存在，加载完成后显示 -->
	<iframe
		src={blogUrl}
		frameborder="0"
		title="Blog"
		class="absolute inset-0 z-20 h-full w-full rounded-2xl transition-opacity duration-500 {isLoading
			? 'pointer-events-none opacity-0'
			: 'opacity-100'}"
		onload={() => (isLoading = false)}
	></iframe>
</div>

