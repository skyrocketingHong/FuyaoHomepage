<script lang="ts">
	/**
	 * 照片灯箱组件
	 *
	 * 全屏灯箱查看器，支持键盘/触摸导航、EXIF 信息展示、深链接。
	 * 桌面端为两列 Grid (照片 minmax(0,1fr) + 信息 320px)，照片区与信息区共享
	 * 明确的可用高度 (--lightbox-content-height)，信息面板在固定高度内独立滚动。
	 * 移动端为整体纵向滚动：照片区最大 45dvh，信息区自然高度，
	 * 由灯箱内容容器统一负责纵向滚动。
	 *
	 * @prop photos - 当前照片列表
	 * @prop currentIndex - 当前照片索引
	 * @prop onClose - 关闭回调
	 * @prop onNavigate - 切换照片回调
	 */
	import type { Photo } from '$lib/types/album';

	import {
		X,
		ChevronLeft,
		ChevronRight,
		MapPin,
		Aperture,
		Gauge,
		ExternalLink,
		Sun,
		Focus,
		Droplets,
		Zap,
		Frame,
		Blend,
		Layers,
		Mountain,
		Copy,
		Check
	} from 'lucide-svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import FadeEdge from '$lib/components/ui/effect/FadeEdge.svelte';
	import Marquee from '$lib/components/ui/display/Marquee.svelte';
	import LazyImage from '$lib/components/ui/display/LazyImage.svelte';
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import LightboxNavButton from './LightboxNavButton.svelte';
	import BrandIcon from './BrandIcon.svelte';
	import { locale, t } from '$lib/i18n/store';
	import { formatDate } from '$lib/utils/datetime/date';
	import { publicContentPaths } from '$lib/config/public';
	import { getMapUrl, getMapName } from '$lib/utils/domain/map';
	import {
		formatDeviceName,
		formatAperture,
		formatFocalLength,
		formatExposureTime,
		formatExposureComp,
		formatDMS,
		formatDirection,
		calcPhotoDisplay
	} from '$lib/utils/domain/exif';

	interface Props {
		photos: Photo[];
		currentIndex: number;
		onClose: () => void;
		onNavigate?: (index: number) => void;
	}

	let { photos, currentIndex, onClose, onNavigate }: Props = $props();

	let currentPhoto = $derived(photos[currentIndex]);
	let hasPrev = $derived(currentIndex > 0);
	let hasNext = $derived(currentIndex < photos.length - 1);

	function lookupEnumValue(category: string, value: number | string | undefined): string {
		if (value === undefined || value === null) return '';
		const key = `album.${category}_values.${value}`;
		const translated = $t(key);
		return translated !== key ? translated : String(value);
	}

	function goPrev(e?: Event) {
		e?.stopPropagation();
		if (hasPrev) onNavigate?.(currentIndex - 1);
	}

	function goNext(e?: Event) {
		e?.stopPropagation();
		if (hasNext) onNavigate?.(currentIndex + 1);
	}

	function handleKeydown(e: KeyboardEvent) {
		switch (e.key) {
			case 'Escape':
				onClose();
				break;
			case 'ArrowLeft':
				goPrev();
				break;
			case 'ArrowRight':
				goNext();
				break;
		}
	}

	function stopPropagation(e: Event) {
		e.stopPropagation();
	}

	// --- 视口尺寸 ---
	let windowWidth = $state(typeof window !== 'undefined' ? window.innerWidth : 1440);
	let windowHeight = $state(typeof window !== 'undefined' ? window.innerHeight : 900);

	$effect(() => {
		const onResize = () => {
			windowWidth = window.innerWidth;
			windowHeight = window.innerHeight;
		};
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	});

	let isMobile = $derived(windowWidth < 768);

	// --- 布局计算 ---
	const CONTAINER_ASPECT = 4 / 3;
	const INFO_WIDTH = 320;
	const INFO_GAP = 24;
	const SIDE_PADDING = 32;
	const CLOSE_SAFE = 56;

	let photoAspect = $derived(
		currentPhoto.width && currentPhoto.height ? currentPhoto.width / currentPhoto.height : 4 / 3
	);

	// 桌面可用尺寸：扣除左右安全边距、信息栏 320px、两列间距 24px 与关闭按钮安全区
	let maxPhotoHeight = $derived.by(() => {
		const maxH = windowHeight - SIDE_PADDING;
		const maxW = windowWidth - SIDE_PADDING - INFO_WIDTH - INFO_GAP - CLOSE_SAFE;
		return Math.min(maxH, maxW / CONTAINER_ASPECT);
	});
	let photoContainerWidth = $derived(maxPhotoHeight * CONTAINER_ASPECT);
	let wrapperWidth = $derived(isMobile ? windowWidth : photoContainerWidth + INFO_GAP + INFO_WIDTH);

	// 照片在 4:3 占位容器内的实际展示尺寸
	let desktopDisplay = $derived(
		calcPhotoDisplay(photoAspect, photoContainerWidth, maxPhotoHeight, CONTAINER_ASPECT)
	);
	let mobileDisplay = $derived(
		calcPhotoDisplay(
			photoAspect,
			windowWidth - SIDE_PADDING,
			(windowWidth - SIDE_PADDING) / CONTAINER_ASPECT,
			CONTAINER_ASPECT
		)
	);
	let displayW = $derived(isMobile ? mobileDisplay.width : desktopDisplay.width);
	let displayH = $derived(isMobile ? mobileDisplay.height : desktopDisplay.height);

	// --- 入场动画 ---
	let contentVisible = $state(false);
	$effect(() => {
		requestAnimationFrame(() => (contentVisible = true));
	});

	// --- 触摸滑动 ---
	let touchStartX = $state(0);
	let touchStartY = $state(0);
	let touchDeltaX = $state(0);
	let touchSwiping = $state(false);

	function handleTouchStart(e: TouchEvent) {
		touchStartX = e.touches[0].clientX;
		touchStartY = e.touches[0].clientY;
		touchDeltaX = 0;
		touchSwiping = false;
	}

	function handleTouchMove(e: TouchEvent) {
		const dx = e.touches[0].clientX - touchStartX;
		const dy = e.touches[0].clientY - touchStartY;
		if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
			touchDeltaX = dx;
			touchSwiping = true;
		}
	}

	function handleTouchEnd() {
		if (Math.abs(touchDeltaX) > 50) {
			if (touchDeltaX > 0 && hasPrev) goPrev();
			else if (touchDeltaX < 0 && hasNext) goNext();
		}
		touchDeltaX = 0;
		touchSwiping = false;
	}

	function handlePhotoClick() {
		if (!touchSwiping) onClose();
	}

	// --- 日期格式 ---
	let dateFormat = $derived($locale === 'zh-CN' ? 'YYYY年MM月DD日 HH:mm' : 'MMM D, YYYY h:mm A');

	// --- 复制链接 ---
	let copied = $state(false);
	let copyTimeout: ReturnType<typeof setTimeout> | undefined;

	function handleCopyLink() {
		const d = new Date(currentPhoto.date);
		const pad = (n: number) => String(n).padStart(2, '0');
		const path = `/albums/${d.getUTCFullYear()}/${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())}/${currentPhoto.filename}`;
		const url = `${window.location.origin}${path}`;
		navigator.clipboard.writeText(url);
		copied = true;
		clearTimeout(copyTimeout);
		copyTimeout = setTimeout(() => (copied = false), 2000);
	}

	// --- 参数/信息行是否有数据 ---
	let hasShootingParams = $derived(
		currentPhoto.aperture ||
			currentPhoto.focalLength ||
			currentPhoto.exposureTime ||
			currentPhoto.iso ||
			currentPhoto.exposureCompensation !== undefined
	);

	let hasSceneSettings = $derived(
		currentPhoto.exposureProgram ||
			currentPhoto.meteringMode ||
			currentPhoto.whiteBalance ||
			currentPhoto.flash !== undefined
	);

	// --- 滚动渐变 ---
	let infoScrollEl = $state<HTMLElement>();
	let showTopFade = $state(false);
	let showBottomFade = $state(false);

	function updateFade() {
		if (!infoScrollEl) return;
		showTopFade = infoScrollEl.scrollTop > 2;
		showBottomFade =
			infoScrollEl.scrollHeight - infoScrollEl.scrollTop - infoScrollEl.clientHeight > 2;
	}

	$effect(() => {
		const requestedIndex = currentIndex;
		// 切换照片时重置信息面板滚动位置，不允许残留上一张照片的滚动状态
		if (infoScrollEl) infoScrollEl.scrollTop = 0;
		// 下一帧重新计算上下渐隐状态
		requestAnimationFrame(() => {
			if (requestedIndex === currentIndex) updateFade();
		});
	});
</script>

<!-- 参数行：icon (14px, text-white/50) + mono text -->
{#snippet paramRow(icon: import('svelte').Snippet, text: string)}
	<div class="flex items-center gap-1.5 text-sm text-white/70">
		<span class="shrink-0 text-white/50">{@render icon()}</span>
		<span class="font-mono">{text}</span>
	</div>
{/snippet}

<!-- 信息行：icon (14px) + label (text-white/50) | value (mono, right) -->
{#snippet infoRow(icon: import('svelte').Snippet, label: string, value: string)}
	<div class="flex items-center justify-between gap-3 text-sm text-white/70">
		<span class="flex shrink-0 items-center gap-2 text-white/50">
			{@render icon()}
			{label}
		</span>
		<Marquee text={value} class="min-w-0 shrink text-right font-mono" fadeSize="1.5rem" autoPlay />
	</div>
{/snippet}

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="photo-lightbox-stage z-loader fixed inset-0 overflow-hidden overscroll-none bg-black"
	onclick={onClose}
	role="dialog"
	tabindex="-1"
	aria-modal="true"
	aria-label={currentPhoto.description || currentPhoto.filename}
>
	<div
		class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.045),transparent_48%)]"
	></div>
	<div
		class="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.018),transparent_20%,transparent_78%,rgba(255,255,255,0.012))]"
	></div>

	<!-- 关闭按钮 -->
	<LiquidGlass
		tag="button"
		variant="control"
		refractive
		blur={8}
		refractionStrength={4}
		contentLayout="center"
		onclick={(e: MouseEvent) => {
			e.stopPropagation();
			onClose();
		}}
		class="absolute top-4 right-4 z-10 inline-flex min-h-11 !w-auto min-w-11 rounded-full !p-0 text-white transition-all hover:bg-white/20"
		tilt={false}
		title={$t('common.close')}
		aria-label={$t('common.close')}
	>
		<span class="flex items-center justify-center p-2">
			<X size={20} />
		</span>
	</LiquidGlass>

	<!-- 内容容器：移动端整体纵向滚动；桌面端居中 -->
	<div
		class="flex h-full w-full flex-col overflow-y-auto overscroll-contain transition-all duration-300 ease-out md:p-4 {contentVisible
			? 'scale-100 opacity-100'
			: 'scale-95 opacity-0'}"
		onclick={stopPropagation}
	>
		<!-- 照片+信息整体：桌面两列 Grid，共享明确可用高度 -->
		<div
			class="mx-auto flex w-full flex-col md:my-auto md:grid md:max-h-[calc(100dvh-32px)] md:grid-cols-[minmax(0,1fr)_320px] md:items-start md:gap-6"
			style="max-width: {wrapperWidth}px; --lightbox-content-height: {maxPhotoHeight}px;"
		>
			<!-- 图片区域 -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="group/photo relative max-h-[45dvh] shrink-0 cursor-pointer md:max-h-none md:justify-self-center"
				style="aspect-ratio: {CONTAINER_ASPECT}; {isMobile
					? ''
					: `max-height: ${maxPhotoHeight}px; width: ${photoContainerWidth}px;`}"
				onclick={handlePhotoClick}
				ontouchstart={handleTouchStart}
				ontouchmove={handleTouchMove}
				ontouchend={handleTouchEnd}
			>
				<div
					class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-[#050505] shadow-[0_28px_80px_rgba(0,0,0,0.72)] ring-1 ring-white/10"
					style="width: {displayW}px; height: {displayH}px;"
				>
					<Crossfade key={currentIndex} inDuration={200} outDuration={150}>
						<LazyImage
							src={`${publicContentPaths.albumMedia}/photos/${currentPhoto.path}`}
							alt={currentPhoto.description || currentPhoto.filename}
							fit="contain"
							class="pointer-events-none h-full w-full"
						/>
					</Crossfade>
				</div>

				{#if hasPrev}
					<LightboxNavButton position="left" onclick={goPrev} disabled={touchSwiping}>
						{#snippet icon()}<ChevronLeft size={20} />{/snippet}
					</LightboxNavButton>
				{/if}

				{#if hasNext}
					<LightboxNavButton position="right" onclick={goNext} disabled={touchSwiping}>
						{#snippet icon()}<ChevronRight size={20} />{/snippet}
					</LightboxNavButton>
				{/if}

				{#if touchSwiping && Math.abs(touchDeltaX) > 10}
					<div
						class="pointer-events-none absolute inset-y-0 {touchDeltaX > 0
							? 'left-0 bg-gradient-to-r'
							: 'right-0 bg-gradient-to-l'} w-1/4 from-white/10 to-transparent"
					></div>
				{/if}
			</div>

			<!-- 照片信息：桌面固定高度独立滚动，移动端自然高度随内容容器滚动 -->
			<div class="min-h-0 md:h-[var(--lightbox-content-height)]">
				<Crossfade
					key={currentIndex}
					inDuration={200}
					outDuration={150}
					class="w-full text-white md:h-full"
				>
					<FadeEdge
						bind:ref={infoScrollEl}
						orientation="vertical"
						showStart={showTopFade}
						showEnd={showBottomFade}
						fadeSize="2rem"
						visible={!isMobile}
						class="overflow-visible px-4 pb-[calc(16px+env(safe-area-inset-bottom))] md:h-full md:overflow-y-auto md:overscroll-contain md:pr-2 md:pl-0 md:[scrollbar-gutter:stable]"
						onscroll={updateFade}
					>
						{#if currentPhoto.description}
							<p class="mb-3 text-sm text-white/80 md:mb-4">{currentPhoto.description}</p>
						{/if}

						<div class="mb-3 flex items-center gap-2">
							<span class="font-mono text-lg font-medium text-white/90"
								>{formatDate(currentPhoto.date, $locale, dateFormat)}</span
							>
							<LiquidGlass
								tag="button"
								variant="control"
								refractive
								blur={6}
								refractionStrength={3}
								contentLayout="center"
								onclick={handleCopyLink}
								class="inline-flex !w-auto rounded-full !p-0 text-white/50 transition-all hover:bg-white/20 hover:text-white"
								tilt={false}
								title={$t(copied ? 'album.copied' : 'album.copy_link')}
							>
								<span class="flex items-center gap-1 px-2 py-1">
									{#if copied}
										<Check size={12} class="text-green-400" />
									{:else}
										<Copy size={12} />
									{/if}
								</span>
							</LiquidGlass>
						</div>

						{#if currentPhoto.gps}
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
							<a
								href={getMapUrl(currentPhoto.gps, $locale, currentPhoto.coordType || 'wgs84')}
								target="_blank"
								rel="noopener noreferrer"
								class="mb-3 flex items-start gap-2 text-sm text-white/70 transition-colors hover:text-white"
								title={getMapName($locale)}
							>
								<MapPin size={16} class="mt-0.5 shrink-0" />
								<div class="flex flex-col gap-0.5 font-mono">
									<span>{formatDMS(currentPhoto.gps.latitude, true)}</span>
									<span>{formatDMS(currentPhoto.gps.longitude, false)}</span>
									{#if currentPhoto.gpsDirection !== undefined && currentPhoto.gpsDirection !== null}
										<span class="text-white/50">
											{$t('album.gps_direction')}: {formatDirection(
												currentPhoto.gpsDirection,
												$locale
											)}
										</span>
									{/if}
								</div>
								<ExternalLink size={12} class="mt-0.5 shrink-0 opacity-60" />
							</a>
						{/if}

						{#if currentPhoto.altitude !== undefined && currentPhoto.altitude !== null}
							{@render paramRow(mountain_icon, `${currentPhoto.altitude}m`)}
						{/if}

						<!-- 相机 & 镜头 -->
						{#if currentPhoto.make || currentPhoto.model || currentPhoto.lensModel}
							<div class="mb-4 flex items-start gap-2 text-sm text-white/70">
								<div class="mt-0.5 flex shrink-0 items-center gap-1">
									<BrandIcon make={currentPhoto.make} model={currentPhoto.model} size="size-4" />
								</div>
								<div class="flex flex-col gap-0.5">
									{#if currentPhoto.make || currentPhoto.model}
										<span>{formatDeviceName(currentPhoto.make, currentPhoto.model)}</span>
									{/if}
									{#if currentPhoto.lensModel}
										<span class="font-mono text-xs text-white/50">{currentPhoto.lensModel}</span>
									{/if}
								</div>
							</div>
						{/if}

						{#if hasShootingParams || hasSceneSettings}
							<div class="mb-3 grid grid-cols-2 gap-4 border-t border-white/10 pt-3">
								{#if hasShootingParams}
									<div class="space-y-1">
										{#if currentPhoto.aperture}
											{@render paramRow(
												aperture_icon,
												`ƒ/${formatAperture(currentPhoto.aperture).slice(2)}`
											)}
										{/if}
										{#if currentPhoto.focalLength}
											{@render paramRow(
												focus_icon,
												`${formatFocalLength(currentPhoto.focalLength)}${currentPhoto.focalLengthIn35mm && currentPhoto.focalLengthIn35mm !== Math.round(currentPhoto.focalLength) ? ` (${$t('album.focal_length_35mm')} ${currentPhoto.focalLengthIn35mm}mm)` : ''}`
											)}
										{/if}
										{#if currentPhoto.exposureTime}
											{@render paramRow(sun_icon, formatExposureTime(currentPhoto.exposureTime))}
										{/if}
										{#if currentPhoto.iso}
											{@render paramRow(gauge_icon, `ISO ${currentPhoto.iso}`)}
										{/if}
										{#if currentPhoto.exposureCompensation !== undefined && currentPhoto.exposureCompensation !== null}
											{@render paramRow(
												sun_icon,
												formatExposureComp(currentPhoto.exposureCompensation)
											)}
										{/if}
									</div>
								{/if}

								{#if hasSceneSettings}
									<div class="space-y-1">
										{#if currentPhoto.exposureProgram}
											{@render paramRow(
												sun_icon,
												lookupEnumValue('exposure_program', currentPhoto.exposureProgram)
											)}
										{/if}
										{#if currentPhoto.meteringMode}
											{@render paramRow(
												focus_icon,
												lookupEnumValue('metering_mode', currentPhoto.meteringMode)
											)}
										{/if}
										{#if currentPhoto.whiteBalance}
											{@render paramRow(
												droplets_icon,
												lookupEnumValue('white_balance', currentPhoto.whiteBalance)
											)}
										{/if}
										{#if currentPhoto.flash !== undefined && currentPhoto.flash !== null}
											{@render paramRow(zap_icon, lookupEnumValue('flash', currentPhoto.flash))}
										{/if}
									</div>
								{/if}
							</div>
						{/if}

						<!-- 底部信息 -->
						<div class="space-y-1 border-t border-white/10 pt-3">
							{#if currentPhoto.width && currentPhoto.height}
								{@render infoRow(
									frame_icon,
									$t('album.dimensions'),
									`${currentPhoto.width} × ${currentPhoto.height}`
								)}
							{/if}
							{#if currentPhoto.colorSpace}
								{@render infoRow(
									blend_icon,
									$t('album.color_space'),
									lookupEnumValue('colorSpace', currentPhoto.colorSpace)
								)}
							{/if}
							{#if currentPhoto.colorProfile}
								{@render infoRow(layers_icon, $t('album.color_profile'), currentPhoto.colorProfile)}
							{/if}
							<div class="flex items-center justify-between">
								<span class="text-sm text-white/50">
									{currentIndex + 1} / {photos.length}
								</span>
							</div>
						</div>
					</FadeEdge>
				</Crossfade>
			</div>
		</div>
	</div>
</div>

{#snippet mountain_icon()}<Mountain size={14} />{/snippet}
{#snippet aperture_icon()}<Aperture size={14} />{/snippet}
{#snippet focus_icon()}<Focus size={14} />{/snippet}
{#snippet sun_icon()}<Sun size={14} />{/snippet}
{#snippet gauge_icon()}<Gauge size={14} />{/snippet}
{#snippet droplets_icon()}<Droplets size={14} />{/snippet}
{#snippet zap_icon()}<Zap size={14} />{/snippet}
{#snippet frame_icon()}<Frame size={14} />{/snippet}
{#snippet blend_icon()}<Blend size={14} />{/snippet}
{#snippet layers_icon()}<Layers size={14} />{/snippet}
