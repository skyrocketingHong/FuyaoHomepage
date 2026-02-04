<script lang="ts">
	/**
	 * 全局背景层组件
	 *
	 * 负责渲染全站的背景，可以是动态组件、静态图片、纯色或流动背景。
	 */
	import { onMount, untrack } from 'svelte';
    import { backgroundState, layoutState } from '$lib/stores/app.svelte';
	import SolidBackground from '../../ui/background/SolidBackground.svelte';
	import FlowingBackground from '../../ui/background/FlowingBackground.svelte';
	import MosaicBackground from '../../ui/background/MosaicBackground.svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import LazyImage from '$lib/components/ui/display/LazyImage.svelte';

	// Props 定义
	let { spotlightUrl = '', onImageLoad, mode = 'image' } = $props<{
		spotlightUrl?: string; // 仅在 mode='image' 时需要
		onImageLoad?: () => void; // 可选，用于通知外部图片加载完成
		mode?: 'image' | 'solid' | 'flowing' | 'none' | 'mosaic';
	}>();

    // 当前使用的壁纸 URL (支持从 API 动态加载覆盖传入的默认值)
    let activeUrl = $state(untrack(() => spotlightUrl));

    // 监听 props 变化，如果外部传入的 url 变了 (且不是空)，则更新 activeUrl
    $effect(() => {
        if (spotlightUrl) {
            activeUrl = spotlightUrl;
        }
    });

	// 本地图片加载状态，用于控制透明度过渡
	let isImageLoaded = $state(false);

	function handleLoad() {
		isImageLoaded = true;
		backgroundState.setLoaded(true);
		onImageLoad?.();
	}

    onMount(async () => {
        // 仅在图片模式下尝试加载动态壁纸
        if (mode === 'image') {
            const wallpaperApi = import.meta.env.VITE_WALLPAPER_API;
            if (wallpaperApi) {
                try {
                    const res = await fetch(wallpaperApi);
                    if (res.ok) {
                        const url = await res.text();
                        if (url && url.trim()) {
                            activeUrl = url.trim();
                        }
                    }
                } catch (error) {
                    console.error("Client-side wallpaper fetch failed:", error);
                    // 失败时保持使用 activeUrl (即默认值)
                }
            }
        }
    });

	// 如果是非图片模式，立即触发加载完成，以便移除 Loader
	$effect(() => {
		if (mode !== 'image') {
			// 给一点点延迟，确保组件挂载
			setTimeout(() => {
				isImageLoaded = true;
				backgroundState.setLoaded(true);
				onImageLoad?.();
			}, 100);
		}
	});
</script>

<div class="fixed inset-0 z-background overflow-hidden">
	{#if backgroundState.component}
		<!-- 动态背景组件 (优先级最高，用于特殊页面覆盖) -->
		<backgroundState.component {...backgroundState.props} />
	{:else}
		<!-- 使用 Crossfade 处理模式切换 -->
		<Crossfade key={mode} duration={700} class="h-full w-full">
			{#if mode === 'solid'}
				<SolidBackground />
			{:else if mode === 'flowing'}
				<FlowingBackground />
			{:else if mode === 'none'}
				<div class="absolute inset-0 bg-transparent"></div>
			{:else if mode === 'mosaic'}
				<MosaicBackground />
			{:else}
				<!-- 默认/图片模式 -->
				<div class="absolute inset-0 bg-black/40">
					<LazyImage
						src={activeUrl}
						alt="Background Wallpaper"
						class="h-full w-full"
						fill
						onload={handleLoad}
					/>
					<!-- 暗色遮罩 -->
					<div class="pointer-events-none absolute inset-0 bg-[var(--bg-overlay)]"></div>
				</div>
			{/if}
		</Crossfade>
	{/if}
</div>
