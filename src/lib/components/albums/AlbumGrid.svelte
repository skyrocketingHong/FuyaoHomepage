<script lang="ts">
	/**
	 * 相册网格组件
	 *
	 * 展示照片网格，按月份分组，支持点击放大预览。
	 * 使用 justified gallery 布局：每行根据照片比例自适应高度，铺满整行。
	 */
	import type { YearGroup, Photo } from '$lib/types/album';
	import LazyImage from '$lib/components/ui/display/LazyImage.svelte';
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import StatusState from '$lib/components/ui/feedback/StatusState.svelte';
	import BrandIcon from './BrandIcon.svelte';
	import { locale, t } from '$lib/i18n/store';
	import { SearchX } from 'lucide-svelte';
	import { formatDate, getMonthLabel } from '$lib/utils/datetime/date';
	import {
		formatDeviceName,
		formatAperture,
		formatFocalLength,
		formatExposureTime,
		formatDMS
	} from '$lib/utils/domain/exif';
	import { publicContentPaths } from '$lib/config/public';

	interface Props {
		yearGroups: YearGroup[];
		onPhotoClick?: (photo: Photo, index: number) => void;
	}

	let { yearGroups, onPhotoClick }: Props = $props();

	function getGlobalIndex(yearIdx: number, monthIdx: number, photoIdx: number): number {
		let index = 0;
		for (let yi = 0; yi < yearIdx; yi++) {
			for (const month of yearGroups[yi].months) {
				index += month.photos.length;
			}
		}
		for (let mi = 0; mi < monthIdx; mi++) {
			index += yearGroups[yearIdx].months[mi].photos.length;
		}
		return index + photoIdx;
	}

	let shortDateFormat = $derived('YYYY.MM.DD HH:mm');

	/** 根据 locale 生成月份标题 */
	function getMonthLabelLocal(year: number, month: number): string {
		return getMonthLabel(year, month, $locale);
	}

	function handlePhotoClick(photo: Photo, yearIdx: number, monthIdx: number, photoIdx: number) {
		const globalIndex = getGlobalIndex(yearIdx, monthIdx, photoIdx);
		onPhotoClick?.(photo, globalIndex);
	}

	function getThumbnailSrc(photo: Photo): string {
		const smallest = photo.variants?.[0];
		return smallest
			? `${publicContentPaths.albumMedia}/thumbnails/${smallest.path}`
			: `${publicContentPaths.albumMedia}/photos/${photo.path}`;
	}

	function getThumbnailSrcset(photo: Photo): string | undefined {
		if (!photo.variants?.length) return undefined;
		return photo.variants
			.map(
				(variant) => `${publicContentPaths.albumMedia}/thumbnails/${variant.path} ${variant.width}w`
			)
			.join(', ');
	}

	let containerWidth = $state(0);
	const GAP = 8;
	const TARGET_HEIGHT = 260;
	const MAX_HEIGHT = 400;

	interface Row {
		photos: Photo[];
		height: number;
	}

	function getRows(photos: Photo[], width: number): Row[] {
		if (!width || photos.length === 0) return [];
		const rows: Row[] = [];
		let currentPhotos: Photo[] = [];
		let currentRatioSum = 0;

		for (const photo of photos) {
			const ratio = photo.width && photo.height ? photo.width / photo.height : 4 / 3;
			const nextSum = currentRatioSum + ratio;
			const nextN = currentPhotos.length + 1;
			const rowHeight = (width - (nextN - 1) * GAP) / nextSum;

			if (currentPhotos.length > 0 && rowHeight < TARGET_HEIGHT * 0.5) {
				const n = currentPhotos.length;
				const h = (width - (n - 1) * GAP) / currentRatioSum;
				rows.push({ photos: currentPhotos, height: Math.min(h, MAX_HEIGHT) });
				currentPhotos = [photo];
				currentRatioSum = ratio;
			} else {
				currentPhotos.push(photo);
				currentRatioSum = nextSum;
			}
		}

		if (currentPhotos.length > 0) {
			const n = currentPhotos.length;
			const h = (width - (n - 1) * GAP) / currentRatioSum;
			rows.push({ photos: currentPhotos, height: Math.min(h, MAX_HEIGHT) });
		}

		return rows;
	}

	function getPhotoWidth(photo: Photo, rowHeight: number): number {
		const ratio = photo.width && photo.height ? photo.width / photo.height : 4 / 3;
		return ratio * rowHeight;
	}
</script>

<div class="space-y-8">
	{#if yearGroups.length === 0}
		<StatusState
			icon={SearchX}
			code={0}
			title={$t('album.no_filter_results')}
			description={$t('album.no_filter_results_hint')}
			transitionKey={$locale}
			detailLabel={$t('album.filter_status')}
			detailValue={$t('album.photo_count', { count: '0' })}
			class="min-h-[28rem] py-8"
		/>
	{:else}
		{#each yearGroups as yearGroup, yearIdx (yearGroup.year)}
			{#each yearGroup.months as month, monthIdx (month.month)}
				{@const monthId = `${month.year}-${String(month.month).padStart(2, '0')}`}
				<section id="month-{monthId}" class="scroll-mt-20">
					<h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
						<span>{getMonthLabelLocal(month.year, month.month)}</span>
						<span class="text-sm font-normal text-muted-foreground">
							{month.photos.length === 1
								? $t('album.photo_count_one')
								: $t('album.photo_count', { count: String(month.photos.length) })}
						</span>
					</h2>

					<div class="flex flex-col" style="gap: {GAP}px;" bind:clientWidth={containerWidth}>
						{#each getRows(month.photos, containerWidth) as row (row.photos
							.map((photo) => photo.path)
							.join('|'))}
							<div class="flex" style="height: {row.height}px; gap: {GAP}px;">
								{#each row.photos as photo (photo.path)}
									{@const origIdx = month.photos.findIndex((p) => p.path === photo.path)}
									<LiquidGlass
										tag="button"
										opaque={true}
										tilt
										flat
										showLighting={false}
										showGloss={false}
										class="shrink-0 cursor-pointer !p-0"
										style="width: {getPhotoWidth(photo, row.height)}px; height: {row.height}px;"
										onclick={() => handlePhotoClick(photo, yearIdx, monthIdx, origIdx)}
									>
										<LazyImage
											src={getThumbnailSrc(photo)}
											srcset={getThumbnailSrcset(photo)}
											sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
											alt={photo.description || photo.filename}
											fit="cover"
											fill
											class="h-full w-full"
										/>

										<!-- 悬浮信息层：button 内部只能使用 phrasing content，统一使用 span -->
										<span
											class="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
										>
											<span class="flex flex-col items-start p-3">
												<!-- 设备名称 -->
												{#if photo.model || photo.make}
													<span class="truncate text-xs font-medium text-white/90">
														{formatDeviceName(photo.make, photo.model)}
													</span>
												{/if}

												<!-- 设备 logo -->
												{#if photo.model || photo.make}
													<span class="mt-0.5 flex items-center gap-1 text-white">
														<BrandIcon make={photo.make} model={photo.model} size="size-3.5" />
													</span>
												{/if}

												<!-- 拍摄参数 -->
												<span
													class="mt-1 flex items-center gap-2 font-mono text-[11px] text-white/90"
												>
													{#if photo.focalLengthIn35mm}
														<span>{formatFocalLength(photo.focalLengthIn35mm)}</span>
													{/if}
													{#if photo.aperture}
														<span>ƒ/{formatAperture(photo.aperture).slice(2)}</span>
													{/if}
													{#if photo.exposureTime}
														<span>{formatExposureTime(photo.exposureTime)}</span>
													{/if}
													{#if photo.iso}
														<span>ISO {photo.iso}</span>
													{/if}
												</span>

												<!-- 经纬度 -->
												{#if photo.gps}
													<span class="mt-1 font-mono text-[11px] text-white/90">
														{formatDMS(photo.gps.latitude, true)}
														{formatDMS(photo.gps.longitude, false)}
													</span>
												{/if}

												<!-- 日期时间 -->
												<span class="mt-1 font-mono text-[11px] text-white/90">
													{formatDate(photo.date, $locale, shortDateFormat)}
												</span>
											</span>
										</span>
									</LiquidGlass>
								{/each}
							</div>
						{/each}
					</div>
				</section>
			{/each}
		{/each}
	{/if}
</div>
