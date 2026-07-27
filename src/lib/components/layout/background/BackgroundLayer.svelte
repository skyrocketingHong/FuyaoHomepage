<script lang="ts">
	/**
	 * 全局背景层组件
	 *
	 * 负责渲染全站的背景，可以是动态组件、静态图片、阅读纯色 (solid) 或流动背景。
	 * 是全站唯一的背景绘制与背景过渡入口：
	 * - 进入或离开文章阅读背景时立即提交最终语义背景，避免旧背景与新页面重叠；
	 * - 普通背景之间继续使用 Crossfade；外观 View Transition 激活时本层时长归零；
	 * - prefers-reduced-motion 下 Crossfade 时长归零，直接切换最终状态。
	 */
	import { onMount, untrack } from 'svelte';
	import { backgroundState } from '$lib/stores/app.svelte';
	import {
		appearanceTransitionState,
		APPEARANCE_TRANSITION_MS
	} from '$lib/utils/effect/appearanceTransition.svelte';
	import SolidBackground from '../../ui/background/SolidBackground.svelte';
	import FlowingBackground from '../../ui/background/FlowingBackground.svelte';
	import MosaicBackground from '../../ui/background/MosaicBackground.svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import LazyImage from '$lib/components/ui/display/LazyImage.svelte';
	import { publicConfig } from '$lib/config/public';

	// Props 定义
	let {
		spotlightUrl = '',
		onImageLoad,
		mode = 'image'
	} = $props<{
		spotlightUrl?: string; // 仅在 mode='image' 时需要
		onImageLoad?: () => void; // 可选，用于通知外部图片加载完成
		mode?: 'image' | 'solid' | 'flowing' | 'none' | 'mosaic';
	}>();

	// 当前使用的壁纸 URL (支持从 API 动态加载覆盖传入的默认值)
	let activeUrl = $state(untrack(() => spotlightUrl));
	// BackgroundState 初始化时已创建首次加载事务；所有初始异步回调只允许完成该序号。
	const initialLoadingId = backgroundState.activeLoadingId;

	// 监听 props 变化，如果外部传入的 url 变了 (且不是空)，则更新 activeUrl
	$effect(() => {
		if (spotlightUrl) {
			activeUrl = spotlightUrl;
		}
	});

	function handleLoad() {
		backgroundState.completeLoading(initialLoadingId);
		onImageLoad?.();
	}

	/** 图片加载失败也必须退出加载页 */
	function handleError() {
		backgroundState.completeLoading(initialLoadingId);
		onImageLoad?.();
	}

	// 减少动态效果偏好：直接切换最终状态，不执行交叉淡化
	let reducedMotion = $state(false);
	let semanticModeChange = $state(false);
	let previousMode = untrack(() => mode);

	// solid 是文章阅读语义背景，进入和离开时均不得与普通背景交叉叠放。
	$effect.pre(() => {
		const nextMode = mode;
		semanticModeChange = nextMode === 'solid' || previousMode === 'solid';
		previousMode = nextMode;
	});

	// 语义背景、View Transition 或减少动态效果时，本层 Crossfade 时长归零
	let fadeDuration = $derived(
		appearanceTransitionState.active || reducedMotion || semanticModeChange
			? 0
			: APPEARANCE_TRANSITION_MS
	);

	onMount(() => {
		// 兜底超时：任何可选视觉效果失败都不得永久阻塞网站内容
		const fallbackTimer = setTimeout(() => {
			backgroundState.completeLoading(initialLoadingId);
			onImageLoad?.();
		}, 2500);

		// 监听减少动态效果偏好
		const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
		reducedMotion = motionQuery.matches;
		const handleMotionChange = (e: MediaQueryListEvent) => {
			reducedMotion = e.matches;
		};
		motionQuery.addEventListener('change', handleMotionChange);

		// 纯色/流动/无背景不会失败，直接标记完成
		// 马赛克背景由 MosaicBackground 首次绘制后主动标记
		// 图片背景由 LazyImage 的 onload/onerror 标记
		if (mode === 'solid' || mode === 'flowing' || mode === 'none') {
			backgroundState.completeLoading(initialLoadingId);
			onImageLoad?.();
		}

		// 仅在图片模式下尝试加载动态壁纸
		if (mode === 'image') {
			void (async () => {
				const wallpaperApi = publicConfig.services.wallpaper.apiUrl;
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
						console.error('Client-side wallpaper fetch failed:', error);
						// 失败时保持使用 activeUrl (即默认值)
					}
				}
			})();
		}

		return () => {
			clearTimeout(fallbackTimer);
			motionQuery.removeEventListener('change', handleMotionChange);
		};
	});
</script>

<div class="z-background fixed inset-0 overflow-hidden">
	{#if backgroundState.component}
		<!-- 动态背景组件 (优先级最高，用于特殊页面覆盖) -->
		<backgroundState.component {...backgroundState.props} />
	{:else}
		<!-- 使用 Crossfade 处理模式切换 (View Transition 激活时归零，由根节点过渡承担) -->
		<Crossfade key={mode} duration={fadeDuration} class="h-full w-full">
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
						onerror={handleError}
					/>
					<!-- 暗色遮罩 -->
					<div class="pointer-events-none absolute inset-0 bg-[var(--bg-overlay)]"></div>
				</div>
			{/if}
		</Crossfade>
	{/if}
</div>
