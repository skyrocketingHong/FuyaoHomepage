<script lang="ts">
	/**
	 * 高德地图 (AMap) 组件
	 * 
	 * 动态加载高德地图 JS API 并渲染可交互地图。
	 * 支持自动注入安全密钥、批量添加标记点以及视图自适应。
	 * 
	 * @prop apiKey - 高德地图 Web 端 API Key
	 * @prop securityCode - 安全验证码 (JsCode)
	 * @prop markers - 标记点数组
	 * @prop center - 地图中心点坐标 (默认 [105, 35])
	 * @prop zoom - 初始缩放层级 (默认 4)
	 */
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	// 地图配置 Props
	let { apiKey = '', securityCode = '', markers = [], center = [105, 35], zoom = 4 } = $props();

	let mapContainer: HTMLDivElement;
	let mapInstance: any = null;

	onMount(async () => {
		if (!browser) return;

		// 注入安全配置
		if (securityCode) {
			(window as any)._AMapSecurityConfig = {
				securityJsCode: securityCode
			};
		}

		// 加载高德地图脚本
		if (!(window as any).AMap) {
			await new Promise((resolve, reject) => {
				const script = document.createElement('script');
				script.src = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}`;
				script.async = true;
				script.onload = resolve;
				script.onerror = reject;
				document.head.appendChild(script);
			});
		}

		// 初始化地图实例
		mapInstance = new (window as any).AMap.Map(mapContainer, {
			viewMode: '2D', // 3D 模式可能需要更复杂的样式适配
			zoom: zoom,
			center: center,
			mapStyle: 'amap://styles/whitesmoke' // 或根据主题动态选择
		});

		// 添加标记点
		// 目前为简化实现。生产环境下可考虑标记点的响应式增量更新。
		updateMarkers(markers);
	});

	function updateMarkers(newMarkers: any[]) {
		if (!mapInstance) return;
		mapInstance.clearMap();

		newMarkers.forEach((markerData) => {
			// 创建标记点
			const marker = new (window as any).AMap.Marker({
				position: markerData.position,
				title: markerData.title
				// 如果需要支持自定义内容，可在此添加 content 属性
			});
			mapInstance.add(marker);
		});

		// 自动调整视野以包含所有标记
		if (newMarkers.length > 0) {
			mapInstance.setFitView();
		}
	}

	// 响应式更新标记点
	$effect(() => {
		if (mapInstance && markers) {
			updateMarkers(markers);
		}
	});

	onDestroy(() => {
		if (mapInstance) {
			mapInstance.destroy();
		}
	});
</script>

<div bind:this={mapContainer} class="absolute top-0 left-0 -z-10 h-full w-full"></div>

<style>
	/* 隐藏高德地图 Logo 和版权信息以保持界面简洁 */
	:global(.amap-logo) {
		display: none !important; 
	}
	:global(.amap-copyright) {
		display: none !important;
	}
</style>
