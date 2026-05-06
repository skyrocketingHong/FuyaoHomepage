import { mount, unmount } from 'svelte';
import MapInfoWindow from '../MapInfoWindow.svelte';
import { getOffsetCenter } from './view';
import type { AMapInstance, AMapInfoWindow, AMapNamespace, MarkerConfig } from '../types';

/**
 * 地图信息窗体控制器
 * 负责管理信息窗体的创建、挂载、显示和关闭
 */
export class MapInfoWindowController {
	private _mapInstance: AMapInstance | null = null;
	private _infoWindowInstance: AMapInfoWindow | null = null;
	private _infoWindowComponentInstance: Record<string, unknown> | null = null;
	private _infoWindowContainer: HTMLDivElement | null = null;
	private _lockInteractionTimeout: ReturnType<typeof setTimeout> | null = null;

	// 外部回调
	private _onCloseCallback: () => void = () => {};
	private _onInteractionChange: (enabled: boolean) => void = () => {};

	constructor(onCloseCallback: () => void, onInteractionChange: (enabled: boolean) => void) {
		this._onCloseCallback = onCloseCallback;
		this._onInteractionChange = onInteractionChange;
	}

	set mapInstance(instance: AMapInstance | null) {
		this._mapInstance = instance;
	}

	/**
	 * 打开信息窗体
	 * @param place 地点数据
	 * @param center 当前地图中心 (用于计算动画)
	 * @param zoom 当前地图缩放 (用于计算动画)
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	openInfoWindow(place: MarkerConfig, center: [number, number], zoom: number) {
		if (!this._mapInstance) return;

		// 1. 准备容器
		if (!this._infoWindowContainer) {
			this._infoWindowContainer = document.createElement('div');
			this._infoWindowContainer.style.background = 'transparent';
			this._infoWindowContainer.style.border = 'none';
		}

		// 2. 挂载 Svelte 组件
		if (this._infoWindowComponentInstance) {
			unmount(this._infoWindowComponentInstance);
			this._infoWindowComponentInstance = null;
		}

		this._infoWindowComponentInstance = mount(MapInfoWindow, {
			target: this._infoWindowContainer,
			props: {
				place: place,
				onClose: () => this.handleInternalClose()
			}
		});

		// 3. 创建或更新 AMap InfoWindow
		if (!this._infoWindowInstance) {
			const AMap = (window as unknown as Window & { AMap: AMapNamespace }).AMap;
			this._infoWindowInstance = new AMap.InfoWindow({
				isCustom: true,
				content: this._infoWindowContainer,
				offset: new AMap.Pixel(0, -20),
				closeWhenClickMap: true,
				anchor: 'bottom-center'
			});

			this._infoWindowInstance.on('close', () => {
				this._onCloseCallback();
				this.cleanupLock();
				this.restoreView();
			});
		} else {
			this._infoWindowInstance.setContent(this._infoWindowContainer);
		}

		this._infoWindowInstance.open(this._mapInstance, place.position);

		// 4. 处理动画锁定逻辑
		this.handleAnimationLock(place, center);
	}

	close() {
		if (this._infoWindowInstance) {
			this._infoWindowInstance.close();
		}
	}

	private handleInternalClose() {
		if (this._infoWindowInstance) {
			this._infoWindowInstance.close();
		}
		// InfoWindow 的 close 事件会触发上面的回调，但在手动调用 close 时也需要确保恢复逻辑执行
		// 不过由于 AMap 事件机制，callback 会被触发，所以这里不需要重复调用 restoreView
	}

	private restoreView() {
		if (this._mapInstance) {
			// 恢复初始视图 (Zoom 4, 中国中心)
			this._mapInstance.setZoomAndCenter(4, getOffsetCenter([105, 35], 4), false, 600);
			this._onInteractionChange(true);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	private handleAnimationLock(place: MarkerConfig, center: [number, number]) {
		const currentCenter = this._mapInstance?.getCenter();
		let duration = 500;

		if (currentCenter) {
			const dx = Math.abs(currentCenter.getLng() - place.position[0]);
			const dy = Math.abs(currentCenter.getLat() - place.position[1]);
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance > 5) {
				duration = 1500;
			}
		}

		this.cleanupLock();
		this._lockInteractionTimeout = setTimeout(() => {
			this._onInteractionChange(false);
			this._lockInteractionTimeout = null;
		}, duration + 100);
	}

	private cleanupLock() {
		if (this._lockInteractionTimeout) {
			clearTimeout(this._lockInteractionTimeout);
			this._lockInteractionTimeout = null;
		}
	}

	destroy() {
		this.cleanupLock();
		if (this._infoWindowComponentInstance) {
			unmount(this._infoWindowComponentInstance);
			this._infoWindowComponentInstance = null;
		}
		if (this._infoWindowInstance) {
			this._infoWindowInstance.close();
			this._infoWindowInstance = null;
		}
		this._mapInstance = null;
	}
}
