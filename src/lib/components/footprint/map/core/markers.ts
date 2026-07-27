/**
 * 标记点工具
 *
 * 负责生成高德官方 MarkerCluster 所需的单点和聚合点 DOM 内容。
 */
import type { MarkerConfig } from '../types';

/**
 * 创建单个足迹点的 DOM 内容。
 *
 * 有封面图时显示照片缩略图；没有封面图时使用克制的系统色圆点，避免伪造照片内容。
 *
 * @param place - 地点数据
 * @param isDark - 是否为暗色模式
 * @returns 可交给 `AMap.Marker#setContent` 的 DOM 元素
 */
export function createFootprintMarkerContent(
	place: MarkerConfig,
	isDark: boolean
): HTMLButtonElement {
	const marker = document.createElement('button');
	marker.type = 'button';
	marker.className = `footprint-marker footprint-marker--${place.type === 'city' ? 'city' : 'spot'}`;
	marker.dataset.theme = isDark ? 'dark' : 'light';
	marker.title = place.title ?? '';
	marker.setAttribute('aria-label', place.title ?? '');

	if (typeof place.cover === 'string' && place.cover.length > 0) {
		const image = document.createElement('img');
		image.src = place.cover;
		image.alt = '';
		image.loading = 'lazy';
		image.decoding = 'async';
		marker.classList.add('footprint-marker--photo');
		marker.append(image);
	} else {
		const dot = document.createElement('span');
		dot.className = 'footprint-marker__dot';
		dot.setAttribute('aria-hidden', 'true');
		marker.append(dot);
	}

	return marker;
}

/**
 * 创建照片地图风格的聚合点内容。
 *
 * @param count - 聚合点包含的地点数量
 * @returns 可交给 `AMap.Marker#setContent` 的 DOM 元素
 */
export function createFootprintClusterContent(count: number): HTMLDivElement {
	const cluster = document.createElement('div');
	cluster.className = 'footprint-cluster';
	cluster.style.setProperty('--cluster-scale', String(Math.min(1.22, 1 + Math.log10(count) * 0.1)));
	cluster.setAttribute('aria-label', String(count));

	const countLabel = document.createElement('span');
	countLabel.className = 'footprint-cluster__count';
	countLabel.textContent = String(count);
	cluster.append(countLabel);
	return cluster;
}

/**
 * 将高德坐标格式化为稳定的查找键。
 *
 * @param position - 经纬度坐标
 * @returns 六位小数的坐标键
 */
export function getPositionKey(position: [number, number]): string {
	return `${position[0].toFixed(6)},${position[1].toFixed(6)}`;
}
