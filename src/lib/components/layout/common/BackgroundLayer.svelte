<script lang="ts">
	/**
	 * 全局背景层组件
	 *
	 * 负责渲染全站的背景，可以是动态组件或静态图片。
	 */
	import { backgroundState } from '$lib/state.svelte';
	import { fade } from 'svelte/transition';

	// Props 定义
	let { spotlightUrl, onImageLoad } = $props<{
		spotlightUrl: string;
		onImageLoad: () => void;
	}>();

	// 本地图片加载状态，用于控制透明度过渡
	let isImageLoaded = $state(false);

	function handleLoad() {
		isImageLoaded = true;
		onImageLoad();
	}
</script>

<div class="fixed inset-0 -z-50 overflow-hidden">
	{#if backgroundState.component}
		<!-- 动态背景组件 -->
		<backgroundState.component {...backgroundState.props} />
	{:else}
		<!-- 默认背景图片 -->
		<div class="h-full w-full bg-black/40" in:fade>
			<img
				src={spotlightUrl}
				alt="Background Wallpaper"
				class="h-full w-full object-cover transition-opacity duration-700 {isImageLoaded
					? 'opacity-100'
					: 'opacity-0'}"
				onload={handleLoad}
			/>
			<!-- 暗色遮罩，用于提升可读性 -->
			<div class="pointer-events-none absolute inset-0 bg-black/60"></div>
		</div>
	{/if}
</div>
