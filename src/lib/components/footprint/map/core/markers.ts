/** 足迹坐标分组；标点和聚合点的外观由高德 SDK 提供。 */
import type { MarkerConfig } from '../types';

export function getPositionKey(position: [number, number]): string {
	return `${position[0].toFixed(6)},${position[1].toFixed(6)}`;
}

/** 保留同一坐标的所有地点，避免 Map 覆盖使重合足迹无法选择。 */
export function groupMarkersByPosition(markers: MarkerConfig[]): Map<string, MarkerConfig[]> {
	const groups = new Map<string, MarkerConfig[]>();
	for (const place of markers) {
		const key = getPositionKey(place.position);
		const group = groups.get(key) ?? [];
		group.push(place);
		groups.set(key, group);
	}
	return groups;
}
