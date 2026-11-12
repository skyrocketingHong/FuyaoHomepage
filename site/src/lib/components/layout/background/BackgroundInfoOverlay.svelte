<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve */
	/**
	 * 全屏背景信息视图
	 *
	 * 通过全局 SidebarState 注入港铁线路，信息视图内隐藏主导航；
	 * 右侧以横向站台色卡片展示线路，Bing 保留原图与可选元数据。
	 */
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Check, ExternalLink, ImageOff, MapPin, X } from 'lucide-svelte';
	import { SiMtr } from '@icons-pack/svelte-simple-icons';
	import { backgroundInfoState, isBackgroundInfoPath } from '$lib/stores/backgroundInfo.svelte';
	import { mosaicState } from '$lib/stores/mosaic.svelte';
	import { sidebarState, themeState } from '$lib/stores/app.svelte';
	import { locale, t } from '$lib/i18n/store';
	import Sidebar from '$lib/components/layout/sidebar/Sidebar.svelte';
	import SidebarTree from '$lib/components/layout/sidebar/SidebarTree.svelte';
	import type { SidebarItemType } from '$lib/types/sidebar';
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
	import FadeEdge from '$lib/components/ui/effect/FadeEdge.svelte';
	import LazyImage from '$lib/components/ui/display/LazyImage.svelte';
	import ActionButton from '$lib/components/layout/header/ActionButton.svelte';
	import MobileBottomDock from '$lib/components/layout/nav/MobileBottomDock.svelte';
	import MobileDrawer from '$lib/components/layout/header/drawer/Drawer.svelte';
	import LoadingState from '$lib/components/ui/feedback/LoadingState.svelte';
	import StatusState from '$lib/components/ui/feedback/StatusState.svelte';

	const wallpaperApi = publicConfig.services.wallpaper.apiUrl?.trim() ?? '';
	const metadataApi = publicConfig.services.wallpaper.metadataApiUrl?.trim() ?? '';

	let viewElement = $state<HTMLDivElement>();
	let lineTabsElement = $state<HTMLDivElement>();
	let stationsElement = $state<HTMLDivElement>();
	let reducedMotion = $state(
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
	let metadata = $state<BingWallpaperMetadata | null>(null);
	let metadataStatus = $state<'idle' | 'loading' | 'success' | 'error'>(
		metadataApi ? 'loading' : 'idle'
	);
	let imageFailed = $state(false);
	let selectedLineId = $state('');
	let injectedListId = $state('');
	let lineTabsShowStart = $state(false);
	let lineTabsShowEnd = $state(false);
	let stationsShowStart = $state(false);
	let stationsShowEnd = $state(false);

	let stationDetails = $derived(
		mosaicState.currentStation ? getMtrStationDetails(mosaicState.currentStation.name) : null
	);
	let activeStation = $derived(mosaicState.currentStation);
	let selectedLine = $derived(
		MTR_LINES.find((line) => line.id === selectedLineId) ??
			stationDetails?.lines[0]?.line ??
			MTR_LINES[0]
	);
	let selectedLineStations = $derived(getMtrLineStations(selectedLine));
	let mtrSidebarItem = $derived<SidebarItemType>({
		id: 'mtr-backgrounds',
		label: $t('background.all_mtr_backgrounds'),
		defaultExpanded: true,
		items: MTR_LINES.map((line) => ({
			id: `mtr-${line.id}`,
			dataId: `mtr-${line.id}`,
			label: line.nameZh,
			labelEn: line.name,
			labelClass: 'mtr-zh',
			labelEnClass: 'mtr-en text-muted-foreground',
			color: line.color,
			isActive: selectedLine.id === line.id,
			onClick: () => (selectedLineId = line.id)
		}))
	});
	let imageUrl = $derived(backgroundInfoState.wallpaperUrl || metadata?.imageUrl || wallpaperApi);
	let metadataMessageKey = $derived(
		metadataStatus === 'error' ? 'background.metadata_load_error' : 'background.no_metadata'
	);

	function selectStation(name: string) {
		mosaicState.selectStation(name);
	}

	function closeView() {
		sidebarState.isMobileDrawerOpen = false;
		const returnUrl = backgroundInfoState.returnUrl || '/';
		backgroundInfoState.close();
		if (isBackgroundInfoPath(page.url.pathname)) {
			void goto(resolve(isBackgroundInfoPath(returnUrl) ? '/' : (returnUrl as '/')));
		}
	}

	function updateLineTabsFade() {
		if (!lineTabsElement) return;
		lineTabsShowStart = lineTabsElement.scrollLeft > 2;
		lineTabsShowEnd =
			lineTabsElement.scrollWidth - lineTabsElement.scrollLeft - lineTabsElement.clientWidth > 2;
	}

	function updateStationsFade() {
		if (!stationsElement) return;
		stationsShowStart = stationsElement.scrollLeft > 2;
		stationsShowEnd =
			stationsElement.scrollWidth - stationsElement.scrollLeft - stationsElement.clientWidth > 2;
	}

	function handleStationsWheel(event: WheelEvent) {
		if (!stationsElement) return;
		const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
		if (!delta) return;
		const maxScrollLeft = stationsElement.scrollWidth - stationsElement.clientWidth;
		if (maxScrollLeft <= 0) return;
		const nextScrollLeft = Math.max(0, Math.min(maxScrollLeft, stationsElement.scrollLeft + delta));
		if (nextScrollLeft === stationsElement.scrollLeft) return;
		event.preventDefault();
		stationsElement.scrollLeft = nextScrollLeft;
	}

	function centerActiveStation() {
		if (!stationsElement || !activeStation) return;
		const target = stationsElement.querySelector<HTMLElement>(
			`[data-station-name="${CSS.escape(activeStation.name)}"]`
		);
		if (!target) return;
		const containerRect = stationsElement.getBoundingClientRect();
		const targetRect = target.getBoundingClientRect();
		const left =
			stationsElement.scrollLeft +
			targetRect.left -
			containerRect.left -
			(containerRect.width - targetRect.width) / 2;
		stationsElement.scrollTo({ left, behavior: reducedMotion ? 'auto' : 'smooth' });
	}

	$effect(() => {
		const lines = stationDetails?.lines;
		if (!selectedLineId && lines?.length) selectedLineId = lines[0].line.id;
	});

	$effect(() => {
		const item = mtrSidebarItem;
		if (injectedListId) {
			sidebarState.updateList(injectedListId, {
				item,
				activeId: selectedLineId,
				hideRoot: true
			});
		}
	});

	$effect(() => {
		void selectedLineId;
		void activeStation?.name;
		requestAnimationFrame(() => {
			updateLineTabsFade();
			centerActiveStation();
			updateStationsFade();
		});
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
		const previousList = {
			component: sidebarState.listComponent,
			props: sidebarState.listProps,
			title: sidebarState.listTitle,
			titleIcon: sidebarState.listTitleIcon,
			id: sidebarState.currentListId,
			modes: sidebarState.availableModes,
			viewMode: sidebarState.viewMode,
			activeId: sidebarState.activeId,
			filterLabel: sidebarState.filterLabel,
			onFilterClear: sidebarState.onFilterClear,
			onViewModeChange: sidebarState.onViewModeChange,
			isListPinned: sidebarState.isListPinned
		};
		if (backgroundInfoState.source === 'mosaic') {
			sidebarState.isListPinned = true;
			injectedListId = sidebarState.setList(
				SidebarTree,
				{ item: mtrSidebarItem, activeId: selectedLineId, hideRoot: true },
				'background.all_mtr_backgrounds',
				[],
				SiMtr
			);
		}

		const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		const handleMotionChange = (event: MediaQueryListEvent) => {
			reducedMotion = event.matches;
		};
		const frame = requestAnimationFrame(() => {
			updateLineTabsFade();
			centerActiveStation();
			updateStationsFade();
		});
		motionQuery.addEventListener('change', handleMotionChange);
		viewElement?.focus();

		return () => {
			cancelAnimationFrame(frame);
			motionQuery.removeEventListener('change', handleMotionChange);
			sidebarState.isMobileDrawerOpen = false;
			if (injectedListId) {
				sidebarState.clearList(injectedListId);
				injectedListId = '';
			}
			if (previousList.component) {
				sidebarState.listComponent = previousList.component;
				sidebarState.listProps = previousList.props;
				sidebarState.listTitle = previousList.title;
				sidebarState.listTitleIcon = previousList.titleIcon;
				sidebarState.currentListId = previousList.id;
				sidebarState.availableModes = previousList.modes;
				sidebarState.viewMode = previousList.viewMode;
				sidebarState.activeId = previousList.activeId;
				sidebarState.filterLabel = previousList.filterLabel;
				sidebarState.onFilterClear = previousList.onFilterClear;
				sidebarState.onViewModeChange = previousList.onViewModeChange;
				sidebarState.isMobileDrawerOpen = false;
			}
			sidebarState.isListPinned = previousList.isListPinned;
			setTimeout(() => {
				if (returnFocus?.isConnected) returnFocus.focus();
			}, 0);
		};
	});
</script>

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape') closeView();
	}}
/>

{#snippet closeButton()}
	<div class="mb-3 flex justify-end">
		<ActionButton
			onclick={closeView}
			title={$t('common.close')}
			crossfadeKey="close-background-info"
		>
			{#snippet icon()}<X size={20} />{/snippet}
		</ActionButton>
	</div>
{/snippet}

<div
	bind:this={viewElement}
	class="z-loader fixed inset-0 overflow-y-auto overscroll-contain text-foreground focus:outline-none"
	role="dialog"
	aria-modal="true"
	aria-label={$t('background.title')}
	tabindex="-1"
	in:fade={{ duration: reducedMotion ? 0 : 240, delay: reducedMotion ? 0 : 200 }}
	out:fade={{ duration: reducedMotion ? 0 : 180 }}
>
	<div class="relative min-h-full w-full">
		{#if backgroundInfoState.source === 'mosaic'}
			<div
				class="grid min-h-full w-full md:grid-cols-[248px_minmax(0,1fr)] lg:grid-cols-[256px_minmax(0,1fr)]"
			>
				<div class="hidden min-w-0 md:sticky md:top-0 md:block md:h-[100dvh]">
					<Sidebar showNavigation={false} />
				</div>

				<div
					class="min-w-0 px-[var(--content-inline-inset)] pt-3 pb-[var(--mobile-dock-clearance)] md:px-6 md:pt-4 md:pb-8"
				>
					{@render closeButton()}
					{#if activeStation && stationDetails}
						<LiquidGlass class="min-w-0 overflow-hidden rounded-[20px] !p-0" tilt={false}>
							<Crossfade key={`${activeStation.name}:${$locale}`}>
								<section class="relative px-5 pt-5 pb-6 md:px-7 md:pt-6 md:pb-7">
									<div
										class="absolute inset-x-0 top-0 h-1.5"
										style:background={activeStation.isRainbow
											? 'linear-gradient(90deg, #E44332, #F58536, #F7E94E, #4FA54B, #3366AA, #6B3A74)'
											: activeStation.color}
									></div>
									<p class="text-xs font-medium text-muted-foreground">
										{$t('background.current_station')}
									</p>
									<h2 class="mtr-zh mt-2 text-[clamp(3rem,7vw,5.75rem)] leading-[1.02]">
										{activeStation.nameZh}
									</h2>
									<p class="mtr-en mt-2 text-[clamp(1.4rem,3vw,2.5rem)] leading-[1.05]">
										{activeStation.name}
									</p>

									<FadeEdge
										bind:ref={lineTabsElement}
										orientation="horizontal"
										showStart={lineTabsShowStart}
										showEnd={lineTabsShowEnd}
										fadeSize="1.25rem"
										class="mt-6 overflow-x-auto"
										onscroll={updateLineTabsFade}
									>
										<div
											class="flex w-max flex-nowrap gap-2"
											role="group"
											aria-label={$t('background.lines')}
										>
											{#each stationDetails.lines as detail (detail.line.id)}
												{@const selected = selectedLine.id === detail.line.id}
												<button
													type="button"
													onclick={() => (selectedLineId = detail.line.id)}
													class="flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors hover:bg-secondary/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary/60 {selected
														? 'border-transparent bg-secondary/60'
														: 'border-border/50'}"
													style:border-bottom-color={selected ? detail.line.color : undefined}
													aria-pressed={selected}
													aria-controls="mtr-line-detail"
												>
													<span
														class="h-4 w-1 shrink-0 rounded-full"
														style:background-color={detail.line.color}
														aria-hidden="true"
													></span>
													<span class="mtr-zh text-sm whitespace-nowrap">{detail.line.nameZh}</span>
													<span class="mtr-en text-xs whitespace-nowrap text-muted-foreground"
														>{detail.line.name}</span
													>
												</button>
											{/each}
										</div>
									</FadeEdge>
								</section>
							</Crossfade>

							<section
								id="mtr-line-detail"
								class="border-t border-border/60 px-5 py-5 md:px-7 md:py-6"
							>
								<Crossfade key={`${selectedLine.id}:${$locale}`}>
									<div class="flex flex-wrap items-end justify-between gap-2">
										<div>
											<h3 class="mtr-zh text-2xl">{selectedLine.nameZh}</h3>
											<p class="mtr-en mt-0.5 text-lg text-muted-foreground">{selectedLine.name}</p>
										</div>
										<span class="text-xs text-muted-foreground tabular-nums">
											{$t(
												selectedLineStations.length === 1
													? 'background.station_count_one'
													: 'background.station_count',
												{ count: String(selectedLineStations.length) }
											)}
										</span>
									</div>

									<FadeEdge
										bind:ref={stationsElement}
										orientation="horizontal"
										showStart={stationsShowStart}
										showEnd={stationsShowEnd}
										fadeSize="2rem"
										class="mt-4 overflow-x-auto"
										onscroll={updateStationsFade}
										onwheel={handleStationsWheel}
									>
										<div class="flex w-max gap-3 py-2 pr-1">
											{#each selectedLineStations as station (station.name)}
												{@const preset = findMtrStation(station.name, themeState.isDark)}
												{#if preset}
													{@const selected = activeStation.name === station.name}
													<button
														type="button"
														data-station-name={station.name}
														onclick={() => selectStation(station.name)}
														class="flex min-h-[76px] w-[172px] shrink-0 cursor-pointer items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-[border-color,background-color] hover:bg-secondary/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary/60 sm:w-[190px] {selected
															? 'bg-secondary/55'
															: 'border-border/45 bg-background/45'}"
														style:border-color={selected ? selectedLine.color : undefined}
														aria-pressed={selected}
														title={$t('background.select_station', {
															station: `${preset.nameZh} ${preset.name}`
														})}
													>
														<span
															class="h-10 w-1.5 shrink-0 rounded-full"
															style:background={preset.isRainbow
																? 'linear-gradient(180deg, #E44332, #F58536, #F7E94E, #4FA54B, #3366AA, #6B3A74)'
																: preset.color}
															aria-hidden="true"
														></span>
														<span class="min-w-0 flex-1">
															<span class="mtr-zh block truncate text-base">{preset.nameZh}</span>
															<span
																class="mtr-en mt-0.5 block truncate text-xs text-muted-foreground"
																>{preset.name}</span
															>
														</span>
														{#if selected}
															<Check
																class="size-4 shrink-0"
																aria-label={$t('background.selected')}
															/>
														{/if}
													</button>
												{/if}
											{/each}
										</div>
									</FadeEdge>
								</Crossfade>
							</section>
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
				</div>
			</div>
		{:else}
			<div
				class="mx-auto w-full max-w-[1680px] px-[var(--content-inline-inset)] pt-3 pb-[var(--mobile-dock-clearance)] md:px-6 md:pt-4 md:pb-8"
			>
				{@render closeButton()}
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
			</div>
		{/if}
	</div>
	<MobileBottomDock />
	<MobileDrawer />
</div>
