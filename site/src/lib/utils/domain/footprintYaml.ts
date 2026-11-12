/**
 * 足迹数据 YAML 生成器
 *
 * 将用户输入的地点信息转换为 YAML 格式字符串。
 */

/**
 * 地点生成参数
 */
export interface PlaceGeneratorInput {
	/** 地点类型 */
	type: 'city' | 'spot';
	/** 中文标题 */
	titleZh: string;
	/** 英文标题 */
	titleEn: string;
	/** 访问日期 (格式: YYYYMMDD) */
	visitDate: string;
	/** 描述 */
	description?: string;
	/** 坐标 */
	coordinates?: {
		lng: number;
		lat: number;
	};
	/** 行政区划代码 */
	adcode?: string;
	/** POI ID (来自高德) */
	poiId?: string;
}

/**
 * 生成足迹数据 YAML
 *
 * @param input - 地点生成参数
 * @returns YAML 格式字符串
 */
export function generatePlaceYaml(input: PlaceGeneratorInput): string {
	const id = input.poiId || `manual-${Date.now()}`;
	const lng = input.coordinates?.lng ?? 0;
	const lat = input.coordinates?.lat ?? 0;
	const titleEn = input.titleEn || 'TODO: English Name';
	const visitDate = input.visitDate || 'TODO: Date';

	// 构建 YAML 字符串
	let yaml = `- id: "${id}"
  name:
    zh: "${input.titleZh}"
    en: "${titleEn}"
  coordinates:
    lng: ${lng}
    lat: ${lat}
  `;

	if (input.type === 'city') {
		yaml += `type: "city"
  adcode: "${input.adcode || ''}"
  places: []`;
	} else {
		yaml += `type: "place"
  parentCityId: "TODO: Parent City ID"`;
	}

	yaml += `
  visitDate: "${visitDate}"`;

	if (input.description) {
		yaml += `
  description: "${input.description}"`;
	}

	return yaml;
}
