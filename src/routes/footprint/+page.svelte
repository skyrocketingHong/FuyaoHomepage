<!-- <script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import AMap from '$lib/components/map/AMap.svelte';
	import FootprintList from '$lib/components/footprint/FootprintList.svelte';
	import { sidebarState, backgroundState } from '$lib/state.svelte';
	import { loadFootprints, type Place } from '$lib/utils/footprints';
	import LoadingState from '$lib/components/ui/LoadingState.svelte';

	let places = $state<Place[]>([]);
	let loading = $state(true);
	let error = $state('');
	let mapCenter = $state([105, 35]);
	let mapZoom = $state(4);
	let amapKey = import.meta.env.VITE_AMAP_KEY;
	let amapSecurityCode = import.meta.env.VITE_AMAP_SECURITY_CODE;

	onMount(async () => {
		try {
			places = await loadFootprints();
		} catch (e) {
			console.error('Failed to load footprints', e);
			error = 'Failed to load footprints';
		} finally {
			loading = false;
		}

		// Inject List into Sidebar
		sidebarState.setList(FootprintList, {
			places: places,
			onSelect: (place: Place) => {
				handleSelect(place);
			}
		});

		// Initial Background Set
		updateBackground();
	});

	// Sync reactive state to background
	$effect(() => {
		if (!loading) updateBackground();
	});

	function handleSelect(place: Place) {
		if (place.position) {
			mapCenter = place.position;
			mapZoom = 10;
			// Close mobile list on select
			sidebarState.closeMobileDrawer();
		}
	}

	function updateBackground() {
		backgroundState.set(AMap, {
			apiKey: amapKey,
			securityCode: amapSecurityCode,
			markers: places,
			center: mapCenter,
			zoom: mapZoom
		});
	}

	onDestroy(() => {
		sidebarState.clearList();
		backgroundState.clear();
	});
</script>

<div class="relative h-full w-full">
	{#if loading || error}
		<LoadingState {loading} {error} />
	{/if}
</div> -->
