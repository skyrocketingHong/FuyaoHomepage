<script lang="ts">
	/**
	 * 时光相册页面
	 *
	 * 灯箱通过 replaceState 只替换当前历史记录，不新增历史条目，
	 * 不触发 SvelteKit 的 load 函数，避免网格状态被重置。
	 * 关闭时使用打开前保存的 returnUrl 恢复相册 URL，禁止 history.back()。
	 * 月份筛选通过 pushState 映射到 URL。
	 *
	 * URL 格式：
	 * - /albums        → 最新年份网格
	 * - /albums/2025   → 指定年份网格
	 * - /albums/2025/03 → 指定年份+月份网格
	 * - /albums/2025/03/15/d4f8e2a1 → 灯箱
	 */
	import { onMount, onDestroy } from 'svelte';
	import { goto, pushState, replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { sidebarState, headerState } from '$lib/stores/app.svelte';
	import { t, locale } from '$lib/i18n/store';
	import AlbumSidebar from '$lib/components/albums/AlbumSidebar.svelte';
	import AlbumGrid from '$lib/components/albums/AlbumGrid.svelte';
	import YearNav from '$lib/components/albums/YearNav.svelte';
	import StatusState from '$lib/components/ui/feedback/StatusState.svelte';
	import { lightboxState } from '$lib/stores/lightbox.svelte';
	import type { Photo } from '$lib/types/album';
	import type { SidebarViewMode } from '$lib/types/sidebar';
	import type { PageData } from './$types';
	import { Calendar, Camera, Images } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const ALBUM_MODES: SidebarViewMode[] = [
		{ id: 'date', label: 'album.date', icon: Calendar },
		{ id: 'device', label: 'album.device', icon: Camera }
	];

	let sidebarListId = $state('');
	let headerNavId = $state('');

	let activeMonthId = $state('');
	let activeDevice = $state('');
	let activeDeviceMonth = $state('');
	let filterDevice = $state('');

	// 从 load 函数初始化月份
	$effect.pre(() => {
		if (data.activeMonthId && data.activeMonthId !== activeMonthId) {
			activeMonthId = data.activeMonthId;
			sidebarState.setFilter(data.activeMonthId, () => clearMonthFilter());
		}
	});

	let allPhotos = $derived.by(() => {
		const photos: Photo[] = [];
		for (const yearGroup of data.yearGroups) {
			for (const month of yearGroup.months) {
				photos.push(...month.photos);
			}
		}
		return photos;
	});

	let filteredPhotos = $derived(
		filterDevice ? allPhotos.filter((p) => (p.model || 'Unknown') === filterDevice) : allPhotos
	);

	let filteredYearGroups = $derived.by(() => {
		if (!filterDevice) return data.yearGroups;
		return data.yearGroups
			.map((yg) => ({
				...yg,
				months: yg.months
					.map((m) => ({
						...m,
						photos: m.photos.filter((p) => (p.model || 'Unknown') === filterDevice)
					}))
					.filter((m) => m.photos.length > 0)
			}))
			.filter((yg) => yg.months.length > 0);
	});

	// --- URL 构建 ---
	function pad(n: number): string {
		return String(n).padStart(2, '0');
	}

	function getPhotoUrl(photo: Photo): `/albums/${string}` {
		const d = new Date(photo.date);
		return `/albums/${d.getUTCFullYear()}/${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())}/${photo.filename}`;
	}

	function getYearUrl(year: number): `/albums/${string}` {
		return `/albums/${year}`;
	}

	function getMonthUrl(year: number, monthId: string): `/albums/${string}` {
		const month = monthId.split('-')[1];
		return `/albums/${year}/${month}`;
	}

	function getPhotoPageTitle(photo: Photo): string {
		const d = new Date(photo.date);
		return `${d.getUTCFullYear()}.${pad(d.getUTCMonth() + 1)}.${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} | ${$t('nav.album')}`;
	}

	/** 选择设备的回调（sidebar setList/updateList 共用） */
	function handleSelectDevice(device: string, monthId?: string) {
		activeDevice = device;
		activeDeviceMonth = monthId || '';
		filterDevice = device;
		sidebarState.setFilter(device, () => {
			activeDevice = '';
			activeDeviceMonth = '';
			filterDevice = '';
			sidebarState.clearFilter();
		});
	}

	function clearMonthFilter() {
		activeMonthId = '';
		sidebarState.clearFilter();
		replaceState(resolve(getYearUrl(data.currentYear)), {});
	}

	function selectMonth(monthId: string) {
		activeMonthId = monthId;
		activeDevice = '';
		activeDeviceMonth = '';
		filterDevice = '';
		sidebarState.setFilter(monthId, () => clearMonthFilter());
		pushState(resolve(getMonthUrl(data.currentYear, monthId)), {});
	}

	// --- 灯箱（replaceState 替换当前记录，不触发 load） ---
	function openLightbox(photo: Photo, index: number) {
		// 保存打开前的完整 URL（含年份、月份筛选与查询参数）
		lightboxState.returnUrl = page.url.pathname + page.url.search;
		lightboxState.pageTitle = getPhotoPageTitle(photo);
		lightboxState.open(filteredPhotos, index);
		// 只替换当前历史记录，不新增条目
		replaceState(resolve(getPhotoUrl(photo)), { albumLightbox: true, photoId: photo.filename });
	}

	function closeLightbox() {
		// 幂等保护：同一轮事件只执行一次
		if (!lightboxState.isOpen) return;
		const returnUrl = lightboxState.returnUrl || getYearUrl(data.currentYear);
		lightboxState.close();
		// 只替换当前历史记录恢复相册 URL，禁止 history.back()
		replaceState(resolve(returnUrl as `/albums/${string}`), {});
	}

	function handleLightboxNavigate(index: number) {
		lightboxState.navigate(index);
		const photo = lightboxState.photos[index];
		if (photo) {
			lightboxState.pageTitle = getPhotoPageTitle(photo);
			replaceState(resolve(getPhotoUrl(photo)), { albumLightbox: true, photoId: photo.filename });
		}
	}

	// 注册回调到 store 供 layout 调用
	$effect(() => {
		lightboxState.onClose = closeLightbox;
		lightboxState.onNavigate = handleLightboxNavigate;
		return () => {
			if (lightboxState.onClose === closeLightbox) lightboxState.onClose = null;
			if (lightboxState.onNavigate === handleLightboxNavigate) lightboxState.onNavigate = null;
		};
	});

	// 灯箱标题同步
	$effect(() => {
		if (lightboxState.isOpen && lightboxState.photos[lightboxState.currentIndex]) {
			lightboxState.pageTitle = getPhotoPageTitle(lightboxState.photos[lightboxState.currentIndex]);
		}
	});

	// 浏览器前进/后退
	function handlePopstate(e: PopStateEvent) {
		const state = e.state as { photoId?: string } | null;
		if (state?.photoId) {
			const index = filteredPhotos.findIndex((p) => p.filename === state.photoId);
			if (index >= 0) {
				if (!lightboxState.isOpen) {
					lightboxState.returnUrl = getYearUrl(data.currentYear);
					lightboxState.open(filteredPhotos, index);
				} else {
					lightboxState.navigate(index);
				}
			}
		} else if (lightboxState.isOpen) {
			lightboxState.close();
		}
	}

	// 深链接：页面加载时检查 URL 中的 photo 参数，自动打开灯箱
	onMount(() => {
		if (data.deepLinkPhotoId) {
			const photoId = data.deepLinkPhotoId;
			const index = filteredPhotos.findIndex((p) => p.filename === photoId);
			if (index >= 0) {
				// 深链接打开：历史栈中没有相册网格记录，关闭时进入照片所属的月份相册
				const photo = filteredPhotos[index];
				const d = new Date(photo.date);
				lightboxState.returnUrl = `/albums/${d.getUTCFullYear()}/${pad(d.getUTCMonth() + 1)}`;
				lightboxState.open(filteredPhotos, index);
				lightboxState.pageTitle = getPhotoPageTitle(photo);
				replaceState(resolve(page.url.pathname as `/albums/${string}`), {
					albumLightbox: true,
					photoId
				});
			}
		}

		// 从 load 函数初始化的月份，滚动到对应位置
		if (data.activeMonthId) {
			requestAnimationFrame(() => {
				document.getElementById(`month-${data.activeMonthId}`)?.scrollIntoView({ block: 'start' });
			});
		}
	});

	// --- Header 年份导航 ---
	function switchYear(year: number) {
		if (lightboxState.isOpen) lightboxState.close();
		goto(resolve(getYearUrl(year)), { replaceState: true, noScroll: true });
	}

	function initHeaderNav() {
		const years = data.albumIndex?.years || [];
		if (years.length > 1) {
			headerNavId = headerState.setMiddle(
				YearNav,
				{ years, currentYear: data.currentYear, onSelect: switchYear },
				'album-year-nav'
			);
		}
	}

	function updateHeaderNav() {
		const years = data.albumIndex?.years || [];
		if (headerNavId) {
			headerState.updateMiddle(headerNavId, {
				years,
				currentYear: data.currentYear,
				onSelect: switchYear
			});
		}
	}

	onMount(() => {
		initHeaderNav();

		sidebarListId = sidebarState.setList(
			AlbumSidebar,
			{
				yearGroups: data.yearGroups,
				activeMonthId,
				activeDevice,
				activeDeviceMonth,
				onSelectMonth: selectMonth,
				onSelectDevice: handleSelectDevice
			},
			'nav.album',
			ALBUM_MODES
		);

		sidebarState.onViewModeChange = () => {
			activeMonthId = '';
			activeDevice = '';
			activeDeviceMonth = '';
			filterDevice = '';
			replaceState(resolve(getYearUrl(data.currentYear)), {});
		};
	});

	onDestroy(() => {
		sidebarState.clearList(sidebarListId);
		if (headerNavId) headerState.clearMiddle(headerNavId);
		lightboxState.reset();
	});

	$effect(() => {
		if (sidebarListId) {
			sidebarState.updateList(sidebarListId, {
				yearGroups: data.yearGroups,
				activeMonthId,
				activeDevice,
				activeDeviceMonth,
				onSelectMonth: selectMonth,
				onSelectDevice: handleSelectDevice
			});
		}
		updateHeaderNav();
	});

	// 年份切换时重置筛选状态
	$effect(() => {
		void data.currentYear;
		filterDevice = '';
		activeDevice = '';
		activeDeviceMonth = '';
	});
</script>

<svelte:window onpopstate={handlePopstate} />

{#if data.albumIndex?.totalPhotos === 0}
	<StatusState
		icon={Images}
		code={0}
		title={$t('album.no_photos')}
		description={$t('album.upload_hint')}
		transitionKey={$locale}
		detailLabel={$t('album.index_status')}
		detailValue={$t('album.photo_count', { count: '0' })}
	/>
{:else}
	<AlbumGrid yearGroups={filteredYearGroups} onPhotoClick={openLightbox} />
{/if}
