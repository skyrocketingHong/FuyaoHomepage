import { getOffsetCenter } from './view';
import type { AMapInstance } from '../types';

/**
 * 地图视图控制器
 * 负责管理地图的视图更新、缩放动画和交互状态
 */
export class MapViewController {
	// 依赖注入 mapInstance (由于 AMap 实例非响应式，我们通过 getter/setter 或方法传递)
	private _mapInstance: AMapInstance | null = null;
	private _transitionTimeout: ReturnType<typeof setTimeout> | null = null;

	constructor() {}

	set mapInstance(instance: AMapInstance | null) {
		this._mapInstance = instance;
	}

	get mapInstance() {
		return this._mapInstance;
	}

	/**
	 * 更新地图视图 (平滑移动/缩放)
	 * @param center 目标中心点
	 * @param zoom 目标缩放层级
	 */
	updateMapView(center: [number, number], zoom: number) {
		if (!this._mapInstance) return;

		// 清除未完成的动画
		if (this._transitionTimeout) {
			clearTimeout(this._transitionTimeout);
			this._transitionTimeout = null;
		}

		const currentCenter = this._mapInstance.getCenter();
		if (!currentCenter) return;

		// 计算考虑侧边栏遮挡的实际目标中心
		const targetOffsetCenter = getOffsetCenter(center, zoom);

		// 计算距离差异
		const dx = Math.abs(currentCenter.getLng() - targetOffsetCenter[0]);
		const dy = Math.abs(currentCenter.getLat() - targetOffsetCenter[1]);
		const distance = Math.sqrt(dx * dx + dy * dy);

		// 阈值设为 5 度，决定是否使用两段式跳转
		if (distance > 5) {
			// 远距离：先缩略预览 (Zoom 4)
			const durationOut = 600;
			const overviewCenter = getOffsetCenter([105, 35], 4);

			this._mapInstance.setZoomAndCenter(4, overviewCenter, false, durationOut);

			// 延迟后放大到目标
			this._transitionTimeout = setTimeout(() => {
				this._mapInstance?.setZoomAndCenter(zoom, targetOffsetCenter, false, 800);
				this._transitionTimeout = null;
			}, durationOut + 100);
		} else if (distance > 0.0001) {
			// 近距离：直接平滑过渡 (仅当有实质性移动时)
			this._mapInstance.setZoomAndCenter(zoom, targetOffsetCenter, false, 500);
		}
	}

	/**
	 * 设置地图交互状态
	 * @param enabled 是否允许交互
	 */
	setMapInteraction(enabled: boolean) {
		if (!this._mapInstance) return;

		const status = {
			zoomEnable: enabled,
			dragEnable: enabled,
			scrollWheel: enabled,
			doubleClickZoom: enabled,
			keyboardEnable: enabled,
			touchZoom: enabled
		};

		this._mapInstance.setStatus(status);
	}

	destroy() {
		if (this._transitionTimeout) {
			clearTimeout(this._transitionTimeout);
			this._transitionTimeout = null;
		}
		this._mapInstance = null;
	}
}
