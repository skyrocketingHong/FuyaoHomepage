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
	import { themeState } from '$lib/stores/app.svelte';

	// 地图配置 Props
	let { apiKey = '', securityCode = '', markers = [], center = [105, 35], zoom = 4 } = $props();

	let mapContainer: HTMLDivElement;
	let mapInstance: any = null;

	// 根据主题派生样式
	let mapStyle = $derived(themeState.isDark ? 'amap://styles/dark' : 'amap://styles/whitesmoke');

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
			mapStyle: mapStyle
		});

		// 添加标记点
		updateMarkers(markers);
	});

	// 监听主题变化并动态切换地图样式
	$effect(() => {
		if (mapInstance && mapStyle) {
			mapInstance.setMapStyle(mapStyle);
		}
	});

	// 联动：响应式更新中心点和缩放层级
	$effect(() => {
		if (mapInstance) {
			// 使用 setZoomAndCenter 以获得更平滑的过渡效果
			// 第三个参数为是否立即执行（false 表示开启动画），第四个参数为动画时长
			mapInstance.setZoomAndCenter(zoom, center, false, 500);
		}
	});

	function updateMarkers(newMarkers: any[]) {
		if (!mapInstance) return;
		mapInstance.clearMap();

		newMarkers.forEach((markerData) => {
			// 创建标记点
			const marker = new (window as any).AMap.Marker({
				position: markerData.position,
				title: markerData.title
			});
			mapInstance.add(marker);
		});

		// 只有在初始加载且没有指定特定视角时，才自动调整视野以包含所有标记
		// 如果 markers 长度有很大变化，通常也意味着需要重设视野
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

<div bind:this={mapContainer} class="absolute top-0 left-0 h-full w-full"></div>

<style>
	/* 隐藏高德地图 Logo 和版权信息以保持界面简洁 */
	:global(.amap-logo) {
		display: none !important; 
	}
	:global(.amap-copyright) {
		display: none !important;
	}
</style>
