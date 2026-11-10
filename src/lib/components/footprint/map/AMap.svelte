<script lang="ts">
	/** 高德地图入口；标点、聚合、工具条和信息窗均使用官方默认外观。 */
	import { onMount, onDestroy } from 'svelte';
	import { themeState } from '$lib/stores/app.svelte';
	import { loadAMapScript } from './core/loader';
	import { extractCopyright } from './core/copyright';
	import { groupMarkersByPosition, getPositionKey } from './core/markers';
	import type {
		CopyrightData,
		MarkerConfig,
		AMapClusterPoint,
		AMapInstance,
		AMapMarkerCluster,
		AMapNamespace
	} from './types';
	import { MapViewController } from './core/viewController.svelte';
	import { MapInfoWindowController } from './core/infoWindowController.svelte';
	import { getOffsetCenter } from './core/view';

	let props = $props<{
		apiKey?: string;
		securityCode?: string;
		markers?: MarkerConfig[];
		center?: [number, number];
		zoom?: number;
		zooms?: [number, number];
		selectedPlace?: MarkerConfig | null;
		onMarkerClick?: (place: MarkerConfig) => void;
		onInfoWindowClose?: () => void;
		onMapLoad?: () => void;
		onCopyrightLoad?: (data: CopyrightData) => void;
		onMapError?: (reason: 'configuration_error' | 'load_error') => void;
	}>();

	const markers = $derived(props.markers ?? []);
	const center = $derived(props.center ?? [105, 35]);
	const zoom = $derived(props.zoom ?? 4);
	const selectedPlace = $derived(props.selectedPlace ?? null);
	const mapStyle = $derived(themeState.isDark ? 'amap://styles/grey' : 'amap://styles/whitesmoke');

	let mapContainer: HTMLDivElement;
	let mapInstance: AMapInstance | null = null;
	let mapReady = $state(false);
	let markerCluster: AMapMarkerCluster | null = null;
	let markerRenderVersion = 0;
	let disposed = false;
	let readyTimeout: ReturnType<typeof setTimeout> | undefined;
	let motionQuery: MediaQueryList | undefined;

	const viewController = new MapViewController();
	const infoWindowController = new MapInfoWindowController(
		() => props.onInfoWindowClose?.(),
		(place) => props.onMarkerClick?.(place)
	);
	const updateMotion = () => viewController.setReducedMotion(motionQuery?.matches ?? false);

	onMount(() => {
		motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		motionQuery.addEventListener('change', updateMotion);
		void initialize();
	});

	onDestroy(() => {
		disposed = true;
		clearTimeout(readyTimeout);
		motionQuery?.removeEventListener('change', updateMotion);
		markerRenderVersion += 1;
		markerCluster?.setMap(null);
		markerCluster = null;
		infoWindowController.destroy();
		viewController.destroy();
		mapInstance?.destroy();
		mapInstance = null;
	});

	$effect(() => {
		if (mapReady && mapInstance) mapInstance.setMapStyle(mapStyle);
	});

	$effect(() => {
		if (mapReady && mapInstance) updateMarkers(markers);
	});

	$effect(() => {
		if (!mapReady || !mapInstance) return;
		if (selectedPlace) infoWindowController.openInfoWindow(selectedPlace);
		else infoWindowController.close();
	});

	$effect(() => {
		if (mapReady && mapInstance) viewController.updateMapView(center, zoom);
	});

	async function initialize() {
		if (!props.apiKey?.trim()) {
			props.onMapError?.('configuration_error');
			return;
		}
		try {
			await loadAMapScript(props.apiKey, props.securityCode ?? '');
			if (disposed) return;
			const AMap = (window as unknown as Window & { AMap?: AMapNamespace }).AMap;
			if (!AMap) throw new Error('AMap unavailable');

			mapInstance = new AMap.Map(mapContainer, {
				viewMode: '2D',
				zoom,
				center: getOffsetCenter(center, zoom),
				mapStyle,
				zooms: props.zooms ?? [2, 20],
				showLabel: true,
				animateEnable: !motionQuery?.matches,
				jogEnable: !motionQuery?.matches,
				resizeEnable: true
			});
			viewController.mapInstance = mapInstance;
			infoWindowController.mapInstance = mapInstance;
			updateMotion();

			readyTimeout = setTimeout(() => {
				if (!disposed && !mapReady) props.onMapError?.('load_error');
			}, 20000);
			mapInstance.on('complete', () => {
				if (disposed || mapReady) return;
				clearTimeout(readyTimeout);
				mapReady = true;
				props.onMapLoad?.();
			});

			void extractCopyright(mapContainer).then((data) => {
				if (!disposed) props.onCopyrightLoad?.(data);
			});

			const currentMap = mapInstance;
			currentMap.plugin(['AMap.ToolBar', 'AMap.Scale'], () => {
				if (disposed || mapInstance !== currentMap) return;
				currentMap.addControl(
					new AMap.ToolBar({
						position: { top: 'calc(var(--header-height) + 16px)', right: '16px' }
					})
				);
				currentMap.addControl(
					new AMap.Scale({
						position: { bottom: 'calc(var(--mobile-dock-clearance) + 48px)', right: '16px' }
					})
				);
			});
		} catch {
			if (!disposed) props.onMapError?.('load_error');
		}
	}

	function updateMarkers(newMarkers: MarkerConfig[]) {
		if (!mapInstance) return;
		const currentMap = mapInstance;
		const renderVersion = ++markerRenderVersion;
		markerCluster?.setMap(null);
		markerCluster = null;
		if (newMarkers.length === 0) return;

		const markerLookup = groupMarkersByPosition(newMarkers);
		const points: AMapClusterPoint[] = newMarkers.map((place) => ({
			lnglat: [...place.position],
			weight: place.type === 'city' ? 2 : 1,
			place
		}));

		currentMap.plugin(['AMap.MarkerCluster'], () => {
			if (disposed || renderVersion !== markerRenderVersion || mapInstance !== currentMap) return;
			const AMap = (window as unknown as Window & { AMap: AMapNamespace }).AMap;
			markerCluster = new AMap.MarkerCluster(currentMap, points, {
				gridSize: 68,
				maxZoom: 17,
				averageCenter: true,
				renderMarker: ({ marker }) => {
					const position = marker.getPosition();
					if (!position) return;
					const places = markerLookup.get(getPositionKey([position.getLng(), position.getLat()]));
					if (!places?.length) return;
					marker.setTitle(places.map((place) => place.title ?? '').join('、'));
					marker.setExtData(places);
					marker.on('click', () => {
						if (places.length > 1) infoWindowController.openPlaces(places);
						else props.onMarkerClick?.(places[0]);
					});
				}
			});
			markerCluster.on('click', ({ marker, clusterData }) => {
				// 非聚合图钉已有自己的点击处理，保留插件默认皮肤。
				if (marker.getExtData()) return;
				const places = (clusterData ?? [])
					.flat()
					.flatMap((point) => (point.place ? [point.place] : []));
				if (!places.length) return;
				const key = getPositionKey(places[0].position);
				if (places.every((place) => getPositionKey(place.position) === key)) {
					infoWindowController.openPlaces(places);
				} else {
					const position = marker.getPosition();
					if (position) {
						viewController.updateMapView(
							[position.getLng(), position.getLat()],
							Math.min(currentMap.getZoom() + 2, 18)
						);
					}
				}
			});
		});
	}
</script>

<div bind:this={mapContainer} class="amap-hide-ui absolute top-0 left-0 h-full w-full"></div>
