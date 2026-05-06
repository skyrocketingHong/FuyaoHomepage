/**
 * 标记点工具
 *
 * 负责生成各类标记点的 HTML 内容和 AMap.Marker 实例。
 */
import type { MarkerConfig, AMapMarker, AMapNamespace } from '../types';

/**
 * 获取城市标记点的 HTML 内容
 *
 * @param isDark - 是否为暗色模式
 */
function getCityMarkerContent(isDark: boolean): string {
	const color = isDark ? '#ecc94b' : '#d69e2e';
	return `
        <div style="
            width: 12px; 
            height: 12px; 
            background-color: ${color}; 
            border: 2px solid white; 
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        "></div>
    `;
}

/**
 * 获取景点标记点的 HTML 内容
 *
 * @param isDark - 是否为暗色模式
 */
function getSpotMarkerContent(isDark: boolean): string {
	const color = isDark ? '#4fd1c5' : '#319795';
	return `
        <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px; 
            height: 24px; 
            background-color: ${color}; 
            border: 2px solid white; 
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">
            <div style="width: 6px; height: 6px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
        </div>
    `;
}

/**
 * 创建 AMap 标记点实例
 *
 * @param place - 地点数据
 * @param isDark - 是否为暗色模式
 * @returns AMap.Marker 实例
 */
export function createMarker(place: MarkerConfig, isDark: boolean): AMapMarker {
	if (typeof window === 'undefined' || !(window as Window & { AMap?: AMapNamespace }).AMap) {
		throw new Error('AMap not loaded');
	}

	const AMap = (window as unknown as Window & { AMap: AMapNamespace }).AMap;
	const isCity = place.type === 'city';
	const content = isCity ? getCityMarkerContent(isDark) : getSpotMarkerContent(isDark);

	// 城市 Offset: (-6, -6) (中心对齐 12x12)
	// 景点 Offset: (-12, -24) (底尖对齐，假设宽高 24x24，实际视觉中心可能需要微调，保持原有逻辑)
	const offset = isCity ? new AMap.Pixel(-6, -6) : new AMap.Pixel(-12, -24);

	const marker = new AMap.Marker({
		position: place.position,
		title: place.title,
		content: content,
		offset: offset,
		zIndex: isCity ? 10 : 20, // 景点在上层
		extData: place // 存储原始数据
	});

	return marker;
}
