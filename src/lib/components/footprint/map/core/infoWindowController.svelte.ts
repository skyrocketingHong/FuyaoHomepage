/** 为高德默认信息窗挂载地点内容，外框、尾部和关闭按钮由 SDK 提供。 */
import { mount, unmount } from 'svelte';
import MapInfoWindow from '../MapInfoWindow.svelte';
import type { AMapInstance, AMapInfoWindow, AMapNamespace, MarkerConfig } from '../types';

export class MapInfoWindowController {
	mapInstance: AMapInstance | null = null;
	private infoWindow: AMapInfoWindow | null = null;
	private component: Record<string, unknown> | null = null;
	private isOpen = false;
	private updating = false;

	constructor(
		private onClose: () => void,
		private onSelect: (place: MarkerConfig) => void
	) {}

	openInfoWindow(place: MarkerConfig) {
		this.openPlaces([place]);
	}

	openPlaces(places: MarkerConfig[]) {
		const map = this.mapInstance;
		if (!map || places.length === 0) return;
		if (this.component) void unmount(this.component);
		const container = document.createElement('div');
		this.component = mount(MapInfoWindow, {
			target: container,
			props: { places, onSelect: this.onSelect }
		});

		if (!this.infoWindow) {
			const AMap = (window as unknown as Window & { AMap: AMapNamespace }).AMap;
			this.infoWindow = new AMap.InfoWindow({
				isCustom: false,
				autoMove: false,
				closeWhenClickMap: true,
				offset: new AMap.Pixel(0, -32)
			});
			this.infoWindow.on('close', () => {
				if (!this.isOpen || this.updating) return;
				this.isOpen = false;
				this.onClose();
			});
		}
		this.updating = true;
		try {
			this.infoWindow.setContent(container);
			this.infoWindow.open(map, places[0].position);
			this.isOpen = true;
		} finally {
			this.updating = false;
		}
	}

	close() {
		if (this.isOpen) this.infoWindow?.close();
	}

	destroy() {
		this.isOpen = false;
		this.infoWindow?.close();
		this.infoWindow = null;
		if (this.component) void unmount(this.component);
		this.component = null;
		this.mapInstance = null;
	}
}
