/**
 * 视图计算工具
 *
 * 负责计算地图的视觉中心偏移，以适应 UI 布局（如侧边栏遮挡）。
 */

/**
 * 计算考虑侧边栏遮挡后的可视中心偏移
 *
 * 当侧边栏在大屏上展开时，地图的几何中心被遮挡，
 * 需要将目标点向左偏移，使其位于剩余可视区域的中心。
 *
 * @param target - 目标经纬度 [lng, lat]
 * @param targetZoom - 目标缩放层级
 * @returns 偏移后的中心点 [lng, lat]
 */
export function getOffsetCenter(target: [number, number], targetZoom: number): [number, number] {
	if (typeof window === 'undefined') return target;

	// 检查是否是大屏设备 (lg: 1024px)
	// 侧边栏宽度通常为 w-72 (18rem = 288px)
	const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
	if (!isDesktop) return target;

	const sidebarWidth = 288;
	const offsetPx = sidebarWidth / 2; // 我们希望目标点向右偏移侧边栏的一半

	// 计算经度偏移量
	// AMap 墨卡托投影近似：360 degrees = 256 * 2^zoom pixels
	// degrees/pixel = 360 / (256 * 2^zoom)
	const degreesPerPixel = 360 / (256 * Math.pow(2, targetZoom));

	// 向左偏移中心点，使目标点出现在右侧可视区域的中心
	// newCenter.lng = target.lng - offsetDegrees
	const lngOffset = offsetPx * degreesPerPixel;

	return [target[0] - lngOffset, target[1]];
}
