/**
 * 高德地图地点搜索工具
 *
 * 封装 AMap.PlaceSearch 插件，提供地点搜索能力。
 */

/**
 * 搜索结果 POI 类型
 */
export interface PlaceSearchResult {
	/** POI ID */
	id: string;
	/** 名称 */
	name: string;
	/** 地址 */
	address?: string;
	/** 所属区县 */
	district?: string;
	/** 行政区划代码 */
	adcode?: string;
	/** 坐标 */
	location: {
		lng: number;
		lat: number;
	};
	/** POI 类型 */
	type?: string;
}

/**
 * AMap.PlaceSearch 实例接口
 *
 * 由于高德地图 SDK 不提供官方 TypeScript 类型，
 * 此处定义必要的接口方法以避免 any 类型。
 */
export interface AMapPlaceSearch {
	search: (query: string, callback: (status: string, result: AMapSearchResponse) => void) => void;
}

/**
 * AMap 搜索响应结构
 */
interface AMapSearchResponse {
	info: string;
	poiList?: {
		pois: AMapPOI[];
	};
}

/**
 * AMap POI 原始结构
 */
interface AMapPOI {
	id: string;
	name: string;
	address?: string;
	district?: string;
	adcode?: string;
	location: {
		lng: number;
		lat: number;
	};
	type?: string;
}

/**
 * 初始化高德地点搜索插件
 *
 * @returns Promise<{ placeSearch: AMapPlaceSearch }> - 返回 PlaceSearch 实例
 */
export function initPlaceSearch(): Promise<{ placeSearch: AMapPlaceSearch }> {
	return new Promise((resolve, reject) => {
		if (typeof window === 'undefined') {
			reject(new Error('仅浏览器环境可用'));
			return;
		}

		const AMap = (
			window as Window & {
				AMap?: {
					plugin: (plugins: string[], callback: () => void) => void;
					PlaceSearch: new (opts: { pageSize: number; pageIndex: number }) => AMapPlaceSearch;
				};
			}
		).AMap;
		if (!AMap) {
			reject(new Error('AMap 未加载'));
			return;
		}

		AMap.plugin(['AMap.PlaceSearch'], () => {
			const placeSearch = new AMap.PlaceSearch({
				pageSize: 5,
				pageIndex: 1
			});
			resolve({ placeSearch });
		});
	});
}

/**
 * 执行地点搜索
 *
 * @param placeSearch - AMap.PlaceSearch 实例
 * @param query - 搜索关键词
 * @returns Promise<PlaceSearchResult[]> - 搜索结果
 */
export function searchPlaces(
	placeSearch: AMapPlaceSearch,
	query: string
): Promise<PlaceSearchResult[]> {
	return new Promise((resolve) => {
		if (!query || !placeSearch) {
			resolve([]);
			return;
		}

		placeSearch.search(query, (status: string, result: AMapSearchResponse) => {
			if (status === 'complete' && result.info === 'OK' && result.poiList) {
				const results: PlaceSearchResult[] = result.poiList.pois.map((poi: AMapPOI) => ({
					id: poi.id,
					name: poi.name,
					address: poi.address,
					district: poi.district,
					adcode: poi.adcode,
					location: {
						lng: poi.location.lng,
						lat: poi.location.lat
					},
					type: poi.type
				}));
				resolve(results);
			} else {
				resolve([]);
			}
		});
	});
}
