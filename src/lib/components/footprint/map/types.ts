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
	on(event: string, handler: () => void): void;
	plugin(plugins: string[], callback: () => void): void;
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
	getPosition(): AMapLngLat | null;
	setContent(content: string | HTMLElement): void;
	setOffset(offset: AMapPixel): void;
	setTitle(title: string): void;
	setExtData(data: unknown): void;
	getExtData(): unknown;
}

/** 高德官方 MarkerCluster 实例的项目内最小接口。 */
export interface AMapMarkerCluster {
	/** 替换当前聚合数据。 */
	setData(data: AMapClusterPoint[]): void;
	/** 将聚合图层挂载到地图，传入 `null` 时移除。 */
	setMap(map: AMapInstance | null): void;
}

/** 高德点聚合所需的数据结构。 */
export interface AMapClusterPoint {
	/** 经纬度坐标。 */
	lnglat: [number, number];
	/** 聚合中心权重。 */
	weight?: number;
}

/** MarkerCluster 自定义渲染回调参数。 */
export interface AMapClusterRenderContext {
	/** 当前聚合包含的点数，仅聚合点回调提供。 */
	count?: number;
	/** 由高德创建的标记实例。 */
	marker: AMapMarker;
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
	MarkerCluster: new (
		map: AMapInstance,
		data: AMapClusterPoint[],
		opts: {
			gridSize?: number;
			maxZoom?: number;
			averageCenter?: boolean;
			renderClusterMarker?: (context: AMapClusterRenderContext) => void;
			renderMarker?: (context: AMapClusterRenderContext) => void;
		}
	) => AMapMarkerCluster;
	InfoWindow: new (opts: Record<string, unknown>) => AMapInfoWindow;
	Pixel: new (x: number, y: number) => AMapPixel;
	plugin: (plugins: string[], callback: () => void) => void;
}

/**
 * 版权信息数据结构
 */
export interface CopyrightData {
	logoUrl: string;
	logoAlt: string;
	copyrightText: string;
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
	cover?: string;
	visitDate?: string;
	description?: string;
	type?: 'city' | 'spot' | string;
	[key: string]: unknown;
}
