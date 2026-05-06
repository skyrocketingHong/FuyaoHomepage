<script lang="ts">
	/**
	 * 高德地图 (AMap) 组件
	 *
	 * 负责动态加载高德地图 JS API 并渲染可交互地图。
	 *
	 * 功能特性：
	 * 1. 自动注入安全密钥 (SecurityJSCode) 并加载脚本。
	 * 2. 响应式渲染标记点 (Markers)，支持城市和景点不同样式。
	 * 3. 视图自适应：考虑侧边栏遮挡，自动计算可视中心。
	 * 4. 平滑过渡：支持长距离跳转的两段式动画和短距离平滑移动。
	 * 5. 版权提取：提取地图 Logo 和版权信息供外部展示。
	 */
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { themeState } from '$lib/stores/app.svelte';
	import { loadAMapScript } from './core/loader';
	import { createMarker } from './core/markers';
	import { extractCopyright } from './core/copyright';
	import type { CopyrightData, MarkerConfig, AMapInstance, AMapNamespace } from './types';
	import { MapViewController } from './core/viewController.svelte';
	import { MapInfoWindowController } from './core/infoWindowController.svelte';
	import { getOffsetCenter } from './core/view';

	// ==========================================
	// Props 定义
	// ==========================================
	let props = $props<{
		apiKey?: string; // API Key
		securityCode?: string; // 安全密钥
		markers?: MarkerConfig[]; // 标记点数据
		center?: [number, number]; // 地图中心 [lng, lat]
		zoom?: number; // 缩放层级
		zooms?: [number, number]; // 缩放范围 [min, max]
		selectedPlace?: MarkerConfig | null; // 当前选中地点
		onMarkerClick?: (place: MarkerConfig) => void; // 点击回调
		onInfoWindowClose?: () => void; // 信息窗关闭回调
		onCopyrightLoad?: (data: CopyrightData) => void; // 版权加载回调
		onMapLoad?: () => void; // 地图加载完成回调
	}>();

	// Props 默认值处理
	const apiKey = $derived(props.apiKey ?? '');
	const securityCode = $derived(props.securityCode ?? '');
	const markers = $derived(props.markers ?? []);
	const center = $derived(props.center ?? [105, 35]);
	const zoom = $derived(props.zoom ?? 4);
	const zooms = $derived(props.zooms ?? [2, 20]);
	const selectedPlace = $derived(props.selectedPlace ?? null);
	const onMarkerClick = $derived(props.onMarkerClick ?? (() => {}));
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const onInfoWindowClose = $derived(props.onInfoWindowClose ?? (() => {}));
	const onCopyrightLoad = $derived(props.onCopyrightLoad ?? (() => {}));
	const onMapLoad = $derived(props.onMapLoad ?? (() => {}));

	// ==========================================
	// 状态管理
	// ==========================================
	let mapContainer: HTMLDivElement;
	let mapInstance: AMapInstance | null = null; // 保持非响应式，避免 Proxy 问题
	let mapReady = $state(false); // 引入明确的就绪状态用于 Effect 依赖

	// 控制器实例
	let viewController = new MapViewController();
	let infoWindowController = new MapInfoWindowController(
		props.onInfoWindowClose || (() => {}), // Close callback
		(enabled) => viewController.setMapInteraction(enabled) // Interaction callback
	);

	// 派生当前地图样式 (响应主题变化)
	let mapStyle = $derived(themeState.isDark ? 'amap://styles/grey' : 'amap://styles/macaron');

	// ==========================================
	// 生命周期
	// ==========================================
	onMount(async () => {
		if (!browser) return;

		try {
			// 1. 加载 AMap 脚本
			await loadAMapScript(apiKey, securityCode);

			// 2. 初始化地图实例
			initMap();

			// 3. 初始化标记点
			updateMarkers(markers);

			// 4. 提取版权信息
			const copyrightData = await extractCopyright(mapContainer);
			onCopyrightLoad(copyrightData);
		} catch (e) {
			console.error('高德地图初始化失败:', e);
		}
	});

	onDestroy(() => {
		// 销毁控制器
		viewController.destroy();
		infoWindowController.destroy();

		if (mapInstance) {
			mapInstance.destroy();
			mapInstance = null;
			mapReady = false;
		}
	});

	// ==========================================
	// 响应式 Effects
	// ==========================================

	// 1. 监听主题变化更新地图样式
	$effect(() => {
		if (mapReady && mapInstance && mapStyle) {
			mapInstance.setMapStyle(mapStyle);
			// 主题变化时重新渲染 Markers 以更新颜色
			updateMarkers(markers);
		}
	});

	// 2. 监听标记点数据变化
	$effect(() => {
		// 注意：这里的 markers 依赖已经在 updateMarkers 内部使用
		// 但为了确保响应式触发，我们需要明确调用
		if (mapReady && mapInstance && markers) {
			updateMarkers(markers);
		}
	});

	// 3. 监听选中地点变化 (信息窗体)
	$effect(() => {
		if (
			mapReady &&
			mapInstance &&
			typeof (window as unknown as Record<string, unknown>).AMap !== 'undefined'
		) {
			if (selectedPlace) {
				infoWindowController.openInfoWindow(selectedPlace, center, zoom);
			} else {
				infoWindowController.close();
			}
		}
	});

	// 4. 监听视图变化 (中心点和缩放)
	$effect(() => {
		// 依赖 mapReady, center, zoom
		if (mapReady && mapInstance) {
			// 委托给控制器处理
			viewController.updateMapView(center, zoom);
		}
	});

	// ==========================================
	// 内部逻辑
	// ==========================================

	/**
	 * 初始化地图实例
	 */
	function initMap() {
		const AMap = (window as unknown as Window & { AMap?: AMapNamespace }).AMap;
		if (!mapContainer || !AMap) return;

		// 计算初始偏移中心，确保地图直接渲染在正确位置，避免初始动画
		const initialCenter = getOffsetCenter(center, zoom);

		mapInstance = new AMap.Map(mapContainer, {
			viewMode: '2D',
			zoom: zoom,
			center: initialCenter,
			mapStyle: mapStyle,
			zooms: zooms
		});

		// 注入 mapInstance 到控制器
		viewController.mapInstance = mapInstance;
		infoWindowController.mapInstance = mapInstance;

		mapInstance.on('complete', () => {
			mapReady = true; // 标记地图就绪，触发依赖 Effect
			onMapLoad();
		});
	}

	/**
	 * 更新地图标记点
	 */
	function updateMarkers(newMarkers: MarkerConfig[]) {
		if (!mapInstance) return;
		mapInstance.clearMap();

		newMarkers.forEach((markerData) => {
			const marker = createMarker(markerData, themeState.isDark);

			// 绑定点击事件
			marker.on('click', () => {
				onMarkerClick(markerData);
			});

			if (mapInstance) {
				mapInstance.add(marker);
			}
		});
	}
</script>

<div bind:this={mapContainer} class="amap-hide-ui absolute top-0 left-0 h-full w-full"></div>
