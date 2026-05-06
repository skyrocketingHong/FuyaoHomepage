/**
 * 高德地图组件相关类型定义
 *
 * 定义地图组件交互所需的类型接口，
 * 尽量保持与 AMap JS API 的兼容性，同时提供类型提示。
 */

/**
 * 高德地图坐标点接口
 */
export interface AMapLngLat {
	getLng(): number;
	getLat(): number;
}

/**
 * 高德地图实例最小接口
 * 仅声明项目实际使用的方法，避免过度抽象
 */
export interface AMapInstance {
	destroy(): void;
	clearMap(): void;
	add(overlay: unknown): void;
	on(event: string, handler: () => void): void;
	getCenter(): AMapLngLat | null;
	setZoomAndCenter(
		zoom: number,
		center: [number, number],
		immediately: boolean,
		duration: number
	): void;
	setMapStyle(style: string): void;
	setStatus(status: Record<string, boolean>): void;
}

/**
 * AMap InfoWindow 实例接口
 */
export interface AMapInfoWindow {
	open(map: AMapInstance, position: [number, number]): void;
	close(): void;
	setContent(content: HTMLElement): void;
	on(event: string, handler: () => void): void;
}

/**
 * AMap Marker 实例接口
 */
export interface AMapMarker {
	on(event: string, handler: () => void): void;
}

/**
 * AMap 像素偏移类型 (opaque type)
 */
export type AMapPixel = object;

/**
 * AMap 全局命名空间接口 (挂载在 window 上)
 */
export interface AMapNamespace {
	Map: new (container: HTMLElement, opts: Record<string, unknown>) => AMapInstance;
	Marker: new (opts: Record<string, unknown>) => AMapMarker;
	InfoWindow: new (opts: Record<string, unknown>) => AMapInfoWindow;
	Pixel: new (x: number, y: number) => AMapPixel;
	plugin: (plugins: string[], callback: () => void) => void;
}

/**
 * 版权信息数据结构
 */
export interface CopyrightData {
	logoHtml: string;
	copyrightHtml: string;
}

/**
 * 标记点点击事件数据
 */
export interface MarkerClickEvent<T = unknown> {
	/** AMap.Marker 实例 */
	target: AMapMarker;
	/** 原始数据 */
	originData: T;
}

/**
 * 地图标记点配置
 *
 * 用于在 `markers.ts` 中生成 Marker
 */
export interface MarkerConfig {
	position: [number, number];
	title?: string;
	type?: 'city' | 'spot' | string;
	[key: string]: unknown;
}
