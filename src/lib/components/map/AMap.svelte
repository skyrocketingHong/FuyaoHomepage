<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	// Map configuration props
	let { apiKey = '', securityCode = '', markers = [], center = [105, 35], zoom = 4 } = $props();

	let mapContainer: HTMLDivElement;
	let mapInstance: any = null;

	onMount(async () => {
		if (!browser) return;

		// Inject Security Code
		if (securityCode) {
			(window as any)._AMapSecurityConfig = {
				securityJsCode: securityCode
			};
		}

		// Load AMap Script
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

		// Initialize Map
		mapInstance = new (window as any).AMap.Map(mapContainer, {
			viewMode: '2D', // 3D mode might need detailed styling
			zoom: zoom,
			center: center,
			mapStyle: 'amap://styles/whitesmoke' // Or dark based on theme
		});

		// Add Markers
		// This is a simplified implementation. Real implementation would update markers reactively.
		updateMarkers(markers);
	});

	function updateMarkers(newMarkers: any[]) {
		if (!mapInstance) return;
		mapInstance.clearMap();

		newMarkers.forEach((markerData) => {
			// Create marker
			const marker = new (window as any).AMap.Marker({
				position: markerData.position,
				title: markerData.title
				// content: ... custom content if needed
			});
			mapInstance.add(marker);
		});

		// fit view if needed
		if (newMarkers.length > 0) {
			mapInstance.setFitView();
		}
	}

	// Reactive updates
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
	:global(.amap-logo) {
		display: none !important; /* Hide logo for cleaner look if allowed, else remove */
	}
	:global(.amap-copyright) {
		display: none !important;
	}
</style>
