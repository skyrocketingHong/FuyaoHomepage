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
	import { backgroundState, sidebarState } from '$lib/stores/app.svelte';
	import {
		appearanceTransitionState,
		APPEARANCE_TRANSITION_MS
	} from '$lib/utils/effect/appearanceTransition.svelte';
	import SolidBackground from '../../ui/background/SolidBackground.svelte';
	import FlowingBackground from '../../ui/background/FlowingBackground.svelte';
	import MosaicBackground from '../../ui/background/MosaicBackground.svelte';
	import BingWallpaperInfo from '$lib/components/ui/background/BingWallpaperInfo.svelte';
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

	const wallpaperApi = publicConfig.services.wallpaper.apiUrl?.trim() ?? '';

	/** 使用 URL API 保留已有查询参数，并为移动竖屏覆盖 type 参数。 */
	function createMiniWallpaperUrl(apiUrl: string): string {
		if (!apiUrl) return '';
		const url = new URL(apiUrl);
		url.searchParams.set('type', 'mini');
		return url.toString();
	}

	// API 端点直接返回 JPEG；无 API 时才从备用图片开始。
	let usingFallback = $state(untrack(() => !wallpaperApi));
	let failedFallbackUrl = $state('');
	let activeUrl = $derived(usingFallback ? spotlightUrl : wallpaperApi);
	let mobileUrl = $derived(usingFallback ? '' : createMiniWallpaperUrl(wallpaperApi));
	let imageUnavailable = $derived(
		usingFallback && (!spotlightUrl || failedFallbackUrl === spotlightUrl)
	);
	// mode 每次变化都会生成新的会话标识；重新进入 image 模式后必须等待新的 onload。
	let imageSession = $derived.by(() => {
		const currentMode = mode;
		return Symbol(currentMode);
	});
	let loadedBingSession = $state<symbol | null>(null);
	let loadingFinished = false;
	// BackgroundState 初始化时已创建首次加载事务；所有初始异步回调只允许完成该序号。
	const initialLoadingId = backgroundState.activeLoadingId;

	function finishLoading() {
		if (loadingFinished) return;
		loadingFinished = true;
		backgroundState.completeLoading(initialLoadingId);
		onImageLoad?.();
	}

	function handleLoad() {
		loadedBingSession =
			mode === 'image' && !usingFallback && wallpaperApi.length > 0 ? imageSession : null;
		finishLoading();
	}

	/** API 失败后只切换一次备用图；备用图也失败时回退主题纯色并结束事务。 */
	function handleError() {
		loadedBingSession = null;
		if (!usingFallback && spotlightUrl) {
			usingFallback = true;
			return;
		}

		usingFallback = true;
		failedFallbackUrl = spotlightUrl;
		finishLoading();
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

	// Bing 来源信息只属于成功显示的 API 图片；所有权 ID 防止旧清理覆盖后继马赛克信息。
	$effect(() => {
		const shouldShowBingInfo =
			mode === 'image' &&
			loadedBingSession === imageSession &&
			!usingFallback &&
			wallpaperApi.length > 0 &&
			!backgroundState.component;
		if (!shouldShowBingInfo) return;

		const id = sidebarState.setExtraInfo(BingWallpaperInfo, {}, 'bing-wallpaper');
		return () => sidebarState.clearExtraInfo(id);
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
			finishLoading();
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
			finishLoading();
		}
		if (mode === 'image' && imageUnavailable) {
			finishLoading();
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
				{#if imageUnavailable}
					<div class="absolute inset-0 bg-background"></div>
				{:else}
					<div class="absolute inset-0 bg-background">
						{#key `${activeUrl}:${mobileUrl}`}
							<LazyImage
								src={activeUrl}
								sources={mobileUrl
									? [
											{
												srcset: mobileUrl,
												media: '(max-width: 767px) and (orientation: portrait)',
												type: 'image/jpeg'
											}
										]
									: []}
								alt="Background Wallpaper"
								class="h-full w-full"
								fill
								fit="cover"
								loading="eager"
								fetchpriority="high"
								decoding="async"
								onload={handleLoad}
								onerror={handleError}
							/>
						{/key}
						<!-- 与图片共用切换生命周期的单层壁纸可读性遮罩 -->
						<div
							class="pointer-events-none absolute inset-0 bg-[var(--wallpaper-readability-overlay)]"
						></div>
					</div>
				{/if}
			{/if}
		</Crossfade>
	{/if}
</div>
