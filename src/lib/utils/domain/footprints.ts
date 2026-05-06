/**
 * 足迹数据处理工具
 *
 * 提供足迹数据的类型定义、YAML 加载、数据规范化和索引构建功能。
 */
import { loadYaml } from '$lib/utils/network/loading';

/**
 * 基础地点接口
 */
export interface BasePlace {
	/** 唯一标识符 */
	id: string;
	/** 地点名称 (支持多语言对象或纯字符串) */
	name: string | { zh: string; en: string };
	/** 经纬度坐标 */
	coordinates: { lng: number; lat: number };
	/** 访问日期 (格式: YYYYMMDD) */
	visitDate?: string;
	/** 地点描述 */
	description?: string;
	/** 当前语言的显示名称 (加载时生成) */
	title?: string;
	/** 坐标元组 [lng, lat] (加载时生成) */
	position?: [number, number];
}

/**
 * 城市/区域
 */
export interface City extends BasePlace {
	/** 地点类型标识 */
	type: 'city';
	/** 行政区划代码 */
	adcode?: string;
	/** 包含的景点列表 */
	children?: Attraction[];
}

/**
 * 景点/具体地点
 */
export interface Attraction extends BasePlace {
	/** 地点类型标识 */
	type: 'spot';
	/** 所属城市 ID */
	parentCityId?: string;
}

/**
 * 足迹索引接口
 * 用于 O(1) 复杂度快速访问数据
 */
export type FootprintIndices = {
	/** 按名称排序的城市列表 */
	viewByCity: City[];
	/** 按年份分组的城市映射 */
	viewByYear: Record<string, City[]>;
};

/**
 * 足迹数据全集
 * 包含原始列表和预计算索引
 */
export type FootprintData = {
	/** 城市列表 */
	cities: City[];
	/** 景点列表 */
	spots: Attraction[];
	/** 全部地点 (用于地图统一渲染) */
	all: (City | Attraction)[];
	/** 预计算索引 */
	indices: FootprintIndices;
};

/**
 * 加载足迹数据
 *
 * 从 YAML 文件加载数据，并规范化为统一格式。
 * 此时所有坐标应已在 YAML 中预定义，不进行运行时查询。
 * 同时建立索引以优化视图切换性能。
 */
/** YAML 原始景点数据 */
interface RawPlace {
	id: string;
	name: string | { zh: string; en: string };
	coordinates: { lng: number; lat: number };
	[key: string]: unknown;
}

/** YAML 原始城市数据 */
interface RawCity {
	id: string;
	name: string | { zh: string; en: string };
	coordinates: { lng: number; lat: number };
	visitDate?: string;
	places?: RawPlace[];
	[key: string]: unknown;
}

export async function loadFootprints(): Promise<FootprintData> {
	try {
		const data = await loadYaml<{ cities: RawCity[] }>('/data/footprints.yaml');
		const cities: City[] = [];
		const spots: Attraction[] = [];

		// 索引查找映射
		const cityByYear: Record<string, City[]> = {};

		if (data && data.cities) {
			data.cities.forEach((rawCity) => {
				// 处理城市下的景点
				const citySpots: Attraction[] = [];
				if (rawCity.places) {
					rawCity.places.forEach((p) => {
						const spotName =
							typeof p.name === 'object'
								? (p.name as { zh: string; en: string }).zh
								: (p.name as string);
						const spot: Attraction = {
							...p,
							type: 'spot',
							parentCityId: rawCity.id,
							title: spotName,
							position: [p.coordinates.lng, p.coordinates.lat]
						};
						spots.push(spot);
						citySpots.push(spot);
					});
				}

				// 处理城市本身
				const cityName =
					typeof rawCity.name === 'object'
						? (rawCity.name as { zh: string; en: string }).zh
						: (rawCity.name as string);

				// 将 rawCity 转换为 City 类型，先不包含 children
				// 使用解构赋值移除 places 属性
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { places, ...restCity } = rawCity;

				const city: City = {
					...restCity,
					type: 'city',
					children: citySpots,
					title: cityName,
					position: [rawCity.coordinates.lng, rawCity.coordinates.lat]
				};

				cities.push(city);

				// --- 索引逻辑 ---
				const year = city.visitDate ? city.visitDate.substring(0, 4) : 'Unknown';
				if (!cityByYear[year]) cityByYear[year] = [];
				cityByYear[year].push(city);
			});
		}

		// 排序索引
		const sortedCities = [...cities].sort((a, b) => (a.title || '').localeCompare(b.title || ''));

		// 确保年份内部有序（年份键本身的排序在 UI 层处理，这里仅确保每一年内的通过 visitDate 排序）
		Object.keys(cityByYear).forEach((year) => {
			cityByYear[year].sort((a, b) => (a.visitDate || '').localeCompare(b.visitDate || ''));
		});

		return {
			cities,
			spots,
			all: [...cities, ...spots],
			indices: {
				viewByCity: sortedCities,
				viewByYear: cityByYear
			}
		};
	} catch (e) {
		console.error('加载足迹数据失败:', e);
		throw e;
	}
}
