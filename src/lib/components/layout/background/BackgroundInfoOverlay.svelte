<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve */
	/**
	 * 全屏背景信息视图
	 *
	 * 在原布局渐隐后展示当前港铁站或 Bing 原图，保留背景用于即时预览，
	 * 并提供键盘关闭、焦点恢复及减少动态效果适配。
	 */
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import { SvelteSet } from 'svelte/reactivity';
	import {
		ArrowLeft,
		ArrowRight,
		Check,
		ChevronDown,
		ExternalLink,
		ImageOff,
		MapPin,
		X
	} from 'lucide-svelte';
	import { SiMtr } from '@icons-pack/svelte-simple-icons';
	import { backgroundInfoState } from '$lib/stores/backgroundInfo.svelte';
	import { mosaicState } from '$lib/stores/mosaic.svelte';
	import { themeState } from '$lib/stores/app.svelte';
	import { locale, t } from '$lib/i18n/store';
	import {
		MTR_LINES,
		findMtrStation,
		getMtrLineStations,
		getMtrStationDetails
	} from '$lib/config/mosaic';
	import { publicConfig } from '$lib/config/public';
	import { loadJsonResource } from '$lib/utils/network/jsonResource';
	import {
		createBingMetadataUrl,
		parseBingWallpaperMetadata,
		type BingWallpaperMetadata
	} from '$lib/utils/domain/wallpaper';
	import { formatDate } from '$lib/utils/datetime/date';
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import LazyImage from '$lib/components/ui/display/LazyImage.svelte';
	import ActionButton from '$lib/components/layout/header/ActionButton.svelte';
	import LoadingState from '$lib/components/ui/feedback/LoadingState.svelte';
	import StatusState from '$lib/components/ui/feedback/StatusState.svelte';

	const wallpaperApi = publicConfig.services.wallpaper.apiUrl?.trim() ?? '';
	const metadataApi = publicConfig.services.wallpaper.metadataApiUrl?.trim() ?? '';
	const expandedLines = new SvelteSet<string>();

	let viewElement = $state<HTMLDivElement>();
	let reducedMotion = $state(
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
	let metadata = $state<BingWallpaperMetadata | null>(null);
	let metadataStatus = $state<'idle' | 'loading' | 'success' | 'error'>(
		metadataApi ? 'loading' : 'idle'
	);
	let imageFailed = $state(false);
	let expandedForStation = $state('');

	let stationDetails = $derived(
		mosaicState.currentStation ? getMtrStationDetails(mosaicState.currentStation.name) : null
	);
	let activeStation = $derived(mosaicState.currentStation);
	let imageUrl = $derived(metadata?.imageUrl || wallpaperApi);
	let metadataMessageKey = $derived(
		metadataStatus === 'error' ? 'background.metadata_load_error' : 'background.no_metadata'
	);

	function formatAdjacentStations(stations: { name: string; nameZh: string }[]): string {
		if (!stations.length) return $t('background.no_adjacent');
		return stations.map((station) => `${station.nameZh} ${station.name}`).join($t('common.comma'));
	}

	function toggleLine(lineId: string) {
		if (expandedLines.has(lineId)) expandedLines.delete(lineId);
		else expandedLines.add(lineId);
	}

	function selectStation(name: string) {
		mosaicState.selectStation(name);
	}

	$effect(() => {
		const name = activeStation?.name;
		if (!name || expandedForStation === name) return;
		expandedForStation = name;
		for (const detail of stationDetails?.lines ?? []) expandedLines.add(detail.line.id);
	});

	$effect(() => {
		const currentLocale = $locale;
		if (backgroundInfoState.source !== 'bing') return;
		if (!metadataApi) {
			metadata = null;
			metadataStatus = 'idle';
			return;
		}

		const controller = new AbortController();
		metadata = null;
		metadataStatus = 'loading';
		void loadJsonResource(createBingMetadataUrl(metadataApi, currentLocale), {
			signal: controller.signal,
			cacheKey: `bing-wallpaper:${currentLocale}`,
			validate: parseBingWallpaperMetadata
		})
			.then((result) => {
				metadata = result;
				metadataStatus = 'success';
			})
			.catch(() => {
				if (controller.signal.aborted) return;
				metadata = null;
				metadataStatus = 'error';
			});
		return () => controller.abort();
	});

	$effect(() => {
		void imageUrl;
		imageFailed = false;
	});

	onMount(() => {
		const returnFocus =
			document.activeElement instanceof HTMLElement ? document.activeElement : null;
		const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		const handleMotionChange = (event: MediaQueryListEvent) => {
			reducedMotion = event.matches;
		};
		motionQuery.addEventListener('change', handleMotionChange);
		viewElement?.focus();

		return () => {
			motionQuery.removeEventListener('change', handleMotionChange);
			setTimeout(() => {
				if (returnFocus?.isConnected) returnFocus.focus();
			}, 0);
		};
	});
</script>

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape') backgroundInfoState.close();
	}}
/>

<div
	bind:this={viewElement}
	class="z-loader fixed inset-0 overflow-y-auto overscroll-contain text-foreground focus:outline-none"
	role="dialog"
	aria-modal="true"
	aria-labelledby="background-info-title"
	tabindex="-1"
	in:fade={{ duration: reducedMotion ? 0 : 240, delay: reducedMotion ? 0 : 200 }}
	out:fade={{ duration: reducedMotion ? 0 : 180 }}
>
	<div class="pointer-events-none fixed inset-0 bg-background/35"></div>

	<div
		class="relative mx-auto flex min-h-full w-full max-w-6xl flex-col gap-4 px-[var(--content-inline-inset)] pt-[max(12px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))] md:gap-6 md:pt-6 md:pb-8"
	>
		<header class="flex shrink-0 items-center justify-between gap-4">
			<div class="min-w-0">
				<Crossfade key={`${backgroundInfoState.source}:${$locale}`} inline>
					<h1 id="background-info-title" class="truncate text-2xl font-bold md:text-3xl">
						{$t('background.title')}
					</h1>
				</Crossfade>
			</div>
			<ActionButton
				onclick={() => backgroundInfoState.close()}
				title={$t('common.close')}
				crossfadeKey="close-background-info"
			>
				{#snippet icon()}<X size={20} />{/snippet}
			</ActionButton>
		</header>

		{#if backgroundInfoState.source === 'mosaic'}
			{#if activeStation && stationDetails}
				<LiquidGlass class="overflow-hidden rounded-[24px] !p-0" tilt={false}>
					<div
						class="h-2 w-full"
						style:background={activeStation.isRainbow
							? 'linear-gradient(90deg, #E44332, #F58536, #F7E94E, #4FA54B, #3366AA, #6B3A74)'
							: activeStation.color}
					></div>
					<Crossfade key={`${activeStation.name}:${$locale}`}>
						<div class="p-5 md:p-7">
							<div class="flex items-start gap-4">
								<span class="mt-1 size-8 shrink-0 [&>svg]:size-full" aria-hidden="true">
									<SiMtr />
								</span>
								<div class="min-w-0">
									<p class="text-xs font-medium tracking-wide text-muted-foreground">
										{$t('background.current_station')}
									</p>
									<h2
										class="mt-1 text-3xl font-semibold tracking-[0.12em] md:text-5xl"
										style="font-family: 'MTRSong', 'Noto Serif TC', 'PingFang TC', serif;"
									>
										{activeStation.nameZh}
									</h2>
									<p class="mt-1 text-lg text-muted-foreground md:text-xl">{activeStation.name}</p>
								</div>
							</div>

							<div class="mt-6 grid gap-3">
								{#each stationDetails.lines as detail (detail.line.id)}
									<section class="rounded-2xl bg-secondary/35 p-4">
										<div class="flex items-center gap-2 font-semibold">
											<span
												class="size-3 shrink-0 rounded-full"
												style:background-color={detail.line.color}
												aria-hidden="true"
											></span>
											<span>{detail.line.nameZh}</span>
											<span class="text-sm font-normal text-muted-foreground"
												>{detail.line.name}</span
											>
										</div>
										<div class="mt-4 grid gap-4 md:grid-cols-2">
											<div class="flex items-start gap-3">
												<ArrowLeft class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
												<div>
													<p class="text-xs text-muted-foreground">
														{$t('background.previous_station')}
													</p>
													<p class="mt-1 text-sm leading-6">
														{formatAdjacentStations(detail.previous)}
													</p>
												</div>
											</div>
											<div class="flex items-start gap-3">
												<ArrowRight class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
												<div>
													<p class="text-xs text-muted-foreground">
														{$t('background.next_station')}
													</p>
													<p class="mt-1 text-sm leading-6">
														{formatAdjacentStations(detail.next)}
													</p>
												</div>
											</div>
										</div>
									</section>
								{/each}
							</div>
						</div>
					</Crossfade>
				</LiquidGlass>
			{:else}
				<StatusState
					icon={MapPin}
					title={$t('background.current_station')}
					description={$t('background.no_adjacent')}
					transitionKey={$locale}
					layout="embedded"
				/>
			{/if}

			<LiquidGlass class="rounded-[24px] p-4 md:p-5" tilt={false}>
				<div class="mb-4 flex items-center justify-between gap-3">
					<h2 class="text-lg font-semibold">{$t('background.all_mtr_backgrounds')}</h2>
				</div>
				<div class="grid gap-2">
					{#each MTR_LINES as line (line.id)}
						{@const stations = getMtrLineStations(line)}
						{@const expanded = expandedLines.has(line.id)}
						<section class="overflow-hidden rounded-2xl border border-border/50 bg-secondary/20">
							<button
								type="button"
								onclick={() => toggleLine(line.id)}
								class="flex min-h-12 w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-secondary/45 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary/60"
								aria-expanded={expanded}
								aria-controls={`mtr-line-${line.id}`}
								aria-label={$t(expanded ? 'background.collapse_line' : 'background.expand_line', {
									line: `${line.nameZh} ${line.name}`
								})}
							>
								<span
									class="size-3 shrink-0 rounded-full"
									style:background-color={line.color}
									aria-hidden="true"
								></span>
								<span class="min-w-0 flex-1 truncate font-medium">
									{line.nameZh}
									<span class="text-xs font-normal text-muted-foreground">{line.name}</span>
								</span>
								<span class="shrink-0 text-xs text-muted-foreground">
									{$t('background.station_count', { count: String(stations.length) })}
								</span>
								<ChevronDown
									class="size-4 shrink-0 transition-transform duration-200 {expanded
										? 'rotate-180'
										: ''}"
								/>
							</button>

							{#if expanded}
								<div
									id={`mtr-line-${line.id}`}
									transition:slide|local={{ duration: reducedMotion ? 0 : 200 }}
								>
									<div
										class="grid gap-2 border-t border-border/50 p-3 sm:grid-cols-2 lg:grid-cols-3"
									>
										{#each stations as station (station.name)}
											{@const preset = findMtrStation(station.name, themeState.isDark)}
											{#if preset}
												{@const selected = activeStation?.name === station.name}
												<button
													type="button"
													onclick={() => selectStation(station.name)}
													class="flex min-h-14 min-w-0 cursor-pointer items-center gap-2.5 rounded-xl border bg-background/35 px-3 py-2 text-left transition-[border-color,background-color] hover:bg-secondary/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 {selected
														? 'border-transparent bg-secondary/60'
														: 'border-border/40'}"
													style:border-color={selected ? line.color : undefined}
													aria-pressed={selected}
													title={$t('background.select_station', {
														station: `${station.nameZh} ${station.name}`
													})}
												>
													<span
														class="h-9 w-2 shrink-0 rounded-full"
														style:background={preset.isRainbow
															? 'linear-gradient(180deg, #E44332, #F58536, #F7E94E, #4FA54B, #3366AA, #6B3A74)'
															: preset.color}
														aria-hidden="true"
													></span>
													<span class="min-w-0 flex-1">
														<span class="block truncate text-sm font-medium">{station.nameZh}</span>
														<span class="block truncate text-xs text-muted-foreground"
															>{station.name}</span
														>
													</span>
													{#if selected}
														<Check class="size-4 shrink-0" aria-label={$t('background.selected')} />
													{/if}
												</button>
											{/if}
										{/each}
									</div>
								</div>
							{/if}
						</section>
					{/each}
				</div>
			</LiquidGlass>
		{:else}
			<div class="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
				<LiquidGlass class="overflow-hidden rounded-[24px] !p-3 md:!p-4" tilt={false}>
					{#if imageUrl && !imageFailed}
						<div
							class="relative aspect-video w-full overflow-hidden rounded-2xl bg-black/5 dark:bg-white/5"
						>
							<LazyImage
								src={imageUrl}
								alt={metadata?.title || $t('layout.bottom_info.bing_wallpaper')}
								fill
								fit="contain"
								loading="eager"
								onerror={() => (imageFailed = true)}
							/>
						</div>
					{:else}
						<StatusState
							icon={ImageOff}
							title={$t('background.image_unavailable')}
							description={$t('background.image_unavailable_hint')}
							transitionKey={$locale}
							layout="embedded"
						/>
					{/if}
				</LiquidGlass>

				<LiquidGlass class="rounded-[24px] p-5" tilt={false}>
					<h2 class="text-xl font-semibold">{$t('layout.bottom_info.bing_wallpaper')}</h2>
					{#if imageUrl}
						<a
							href={imageUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-secondary/60 px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
						>
							{$t('background.open_original')}
							<ExternalLink class="size-4" />
						</a>
					{/if}

					<div class="mt-6 border-t border-border/60 pt-4">
						<h3 class="text-sm font-semibold">{$t('background.additional_info')}</h3>
						<Crossfade key={`${metadataStatus}:${$locale}`} class="mt-3">
							{#if metadataStatus === 'loading'}
								<LoadingState loading variant="inline" showCopyright={false} />
							{:else if metadataStatus === 'success' && metadata}
								<dl class="grid gap-4 text-sm">
									{#if metadata.title}
										<div>
											<dt class="sr-only">{$t('background.additional_info')}</dt>
											<dd>{metadata.title}</dd>
										</div>
									{/if}
									{#if metadata.startDate}
										<div>
											<dt class="text-xs text-muted-foreground">{$t('background.date')}</dt>
											<dd class="mt-1">{formatDate(metadata.startDate, $locale)}</dd>
										</div>
									{/if}
									{#if metadata.copyright}
										<div>
											<dt class="text-xs text-muted-foreground">{$t('background.copyright')}</dt>
											<dd class="mt-1 leading-6">{metadata.copyright}</dd>
										</div>
									{/if}
									{#if metadata.copyrightLink}
										<a
											href={metadata.copyrightLink}
											target="_blank"
											rel="noopener noreferrer"
											class="inline-flex items-center gap-1.5 text-sm font-medium underline decoration-border underline-offset-4 hover:decoration-current"
										>
											{$t('background.more_info')}
											<ExternalLink class="size-3.5" />
										</a>
									{/if}
								</dl>
							{:else}
								<p class="text-sm leading-6 text-muted-foreground">{$t(metadataMessageKey)}</p>
							{/if}
						</Crossfade>
					</div>
				</LiquidGlass>
			</div>
		{/if}
	</div>
</div>
