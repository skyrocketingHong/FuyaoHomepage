<script lang="ts">
	/**
	 * 足迹页面
	 * 
	 * 展示站长曾到访过的地点，通过 AMap 进行地图可视化，并在侧边栏展示地点列表。
	 */
	import { onMount, onDestroy } from 'svelte';
	import AMap from '$lib/components/map/AMap.svelte';
	import FootprintList from '$lib/components/footprint/FootprintList.svelte';
	import { sidebarState, layoutState } from '$lib/stores/app.svelte';
	import { loadFootprints, type Place } from '$lib/utils/domain/footprints';
	import LoadingState from '$lib/components/ui/feedback/LoadingState.svelte';
	import { t } from '$lib/i18n/store';

	let places = $state<Place[]>([]);
	let loading = $state(true);
	let error = $state('');
	let mapCenter = $state([105, 35]);
	let mapZoom = $state(4);
	let amapKey = import.meta.env.VITE_AMAP_KEY;
	let amapSecurityCode = import.meta.env.VITE_AMAP_SECURITY_CODE;
	let sidebarListId = '';

	onMount(async () => {
		try {
			places = await loadFootprints();
		} catch (e) {
			console.error('加载足迹数据失败', e);
			error = $t('footprint.load_error');
		} finally {
			loading = false;
		}

		// 将列表注入侧边栏
		sidebarListId = sidebarState.setList(FootprintList, {
			places: places,
			onSelect: (place: Place) => {
				handleSelect(place);
			}
		}, 'YEARS');
		// 初始背景设置
		layoutState.setTransparent(true);
	});

	function handleSelect(place: Place) {
		if (place.position) {
			mapCenter = place.position;
			mapZoom = 10;
			// 选择后关闭移动端列表
			sidebarState.closeMobileDrawer();
		}
	}

	onDestroy(() => {
		sidebarState.clearList(sidebarListId);
		layoutState.setTransparent(false);
	});
</script>

<div class="pointer-events-none relative h-full w-full">
	{#if loading || error}
		<div class="flex h-full w-full items-center justify-center">
			<LoadingState {loading} {error} />
		</div>
	{:else}
		<!-- 地图背景 (使用 fixed 定位以覆盖全屏，z-index 低于 Sidebar 但高于 BackgroundLayer) -->
		<div class="pointer-events-auto fixed inset-0 z-0 bg-transparent transition-opacity duration-500">
			<AMap 
				apiKey={amapKey}
				securityCode={amapSecurityCode}
				markers={places}
				center={mapCenter}
				zoom={mapZoom}
			/>
		</div>
	{/if}
</div>
