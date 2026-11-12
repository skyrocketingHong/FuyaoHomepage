/** 通过高德原生相机过渡更新视图，保留 SDK 的缓动与手势中断行为。 */
import { getOffsetCenter } from './view';
import type { AMapInstance } from '../types';

export class MapViewController {
	mapInstance: AMapInstance | null = null;
	reducedMotion = false;

	updateMapView(center: [number, number], zoom: number) {
		const map = this.mapInstance;
		const current = map?.getCenter();
		if (!map || !current) return;
		const target = getOffsetCenter(center, zoom);
		const distance = Math.hypot(current.getLng() - target[0], current.getLat() - target[1]);
		if (distance < 0.000001 && Math.abs(map.getZoom() - zoom) < 0.001) return;

		// SDK 内部使用 Bézier 插值；新目标会取消旧帧并从当前视图继续。
		map.setZoomAndCenter(zoom, target, this.reducedMotion, distance > 5 ? 450 : 300);
	}

	setReducedMotion(reduced: boolean) {
		const map = this.mapInstance;
		if (map && reduced && !this.reducedMotion) {
			const current = map.getCenter();
			// 在关闭 animateEnable 之前终止当前 SDK 相机动画。
			if (current) {
				map.setZoomAndCenter(map.getZoom(), [current.getLng(), current.getLat()], false, 0);
			}
		}
		this.reducedMotion = reduced;
		map?.setStatus({ animateEnable: !reduced, jogEnable: !reduced });
	}

	destroy() {
		this.mapInstance = null;
	}
}
