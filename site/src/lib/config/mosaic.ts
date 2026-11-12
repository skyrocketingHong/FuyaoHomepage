/**
 * 马赛克背景配置与数据
 *
 * 包含 MTR 车站颜色预设、线路区段与邻站查询。
 */

/**
 * 港铁车站接口
 */
export interface MtrStation {
	/** 车站英文名称 */
	name: string;
	/** 车站中文名称 */
	nameZh: string;
	/** 车站代表颜色 (十六进制) */
	color: string;
	/** 是否为彩虹站（启用彩虹站效果） */
	isRainbow?: boolean;
}

/**
 * 马赛克背景配置接口
 */
export interface MosaicConfig {
	/** 基础瓦片尺寸 (像素) */
	baseTileSize: number;
	/** 瓦片间距 */
	gap: number;
	/** 间距颜色 */
	gapColor: string;
	/** 随机性系数 (0~1) */
	randomness: number;
	/** 动画持续时间 (ms) */
	duration: number;
	/** 过渡速度 */
	transitionSpeed: number;
	/** 帧率 */
	fps: number;
}

/**
 * 默认马赛克配置
 */
export const MOSAIC_DEFAULT_CONFIG: MosaicConfig = {
	baseTileSize: 8, // 固定物理大小约 32px
	gap: 0.2, // 较窄的缝隙以增强真实感
	gapColor: '#1111111c',
	randomness: 0.15, // 轻微的变化
	duration: 0,
	transitionSpeed: 0.05,
	fps: 60
};

// 港铁车站颜色预设
// 数据按排版颜色分类：
// 黑色文字 -> 亮色背景 -> 日间模式
// 白色文字 -> 暗色背景 -> 夜间模式

/**
 * 日间模式港铁车站预设
 *
 * 适用于亮色背景，通常搭配黑色文字。
 */
export const MTR_PRESETS_DAY: MtrStation[] = [
	// 荃湾线
	{ name: 'Tsim Sha Tsui', nameZh: '尖沙咀', color: '#FFEF00' },
	{ name: 'Jordan', nameZh: '佐敦', color: '#69B72B' },
	{ name: 'Yau Ma Tei', nameZh: '油麻地', color: '#CCCCCC' },
	{ name: 'Cheung Sha Wan', nameZh: '長沙灣', color: '#B5A265' },
	{ name: 'Kwai Hing', nameZh: '葵興', color: '#F1CC00' },
	// 观塘线
	{ name: 'Whampoa', nameZh: '黃埔', color: '#AECFF0' },
	{ name: 'Ho Man Tin', nameZh: '何文田', color: '#A2CF5A' },
	// 油麻地（重复）
	{ name: 'Lok Fu', nameZh: '樂富', color: '#579E2F' },
	{ name: 'Wong Tai Sin', nameZh: '黃大仙', color: '#FFFF00' },
	{ name: 'Kwun Tong', nameZh: '觀塘', color: '#FFFFFF' },
	{ name: 'Lam Tin', nameZh: '藍田', color: '#0083BE' },
	{ name: 'Yau Tong', nameZh: '油塘', color: '#FFEF00' },
	{ name: 'Tiu Keng Leng', nameZh: '調景嶺', color: '#DCD144' },
	// 港岛线
	{ name: 'Kennedy Town', nameZh: '堅尼地城', color: '#95D0D0' },
	{ name: 'HKU', nameZh: '香港大學', color: '#B8DA89' },
	{ name: 'Sai Ying Pun', nameZh: '西營盤', color: '#8B7BA0' },
	// 上環 #FFD280 #6B4513（棕色文字，视为日间模式）
	{ name: 'Sheung Wan', nameZh: '上環', color: '#FFD280' },
	{ name: 'Wan Chai', nameZh: '灣仔', color: '#E1EB2B' },
	{ name: 'Causeway Bay', nameZh: '銅鑼灣', color: '#C8A2C8' },
	{ name: 'Tin Hau', nameZh: '天后', color: '#FF7D00' },
	{ name: 'North Point', nameZh: '北角', color: '#E86220' },
	{ name: 'Sai Wan Ho', nameZh: '西灣河', color: '#FFCC00' },
	// 将军澳线
	// 北角、油塘、調景嶺（重复）
	{ name: 'Hang Hau', nameZh: '坑口', color: '#2EA9DF' },
	{ name: 'Po Lam', nameZh: '寶琳', color: '#F28500' },
	// 东涌线 & 机场快线
	{ name: 'Hong Kong', nameZh: '香港', color: '#FFFAFA' },
	{ name: 'Kowloon', nameZh: '九龍', color: '#ACA28A' },
	{ name: 'Olympic', nameZh: '奧運', color: '#4584C4' },
	{ name: 'Nam Cheong', nameZh: '南昌', color: '#F0EE86' },
	{ name: 'Tsing Yi', nameZh: '青衣', color: '#A1C6CA' },
	{ name: 'Tung Chung', nameZh: '東涌', color: '#6A5ACD' },
	{ name: 'Airport', nameZh: '機場', color: '#808080' },
	{ name: 'AsiaWorld-Expo', nameZh: '博覽館', color: '#FFFFFF' },
	// 东铁线
	{ name: 'Hung Hom', nameZh: '紅磡', color: '#F08080' },
	// 屯马线
	{ name: 'Ma On Shan', nameZh: '馬鞍山', color: '#E0B0FF' },
	{ name: 'Heng On', nameZh: '恆安', color: '#87CEFA' },
	{ name: 'Tai Shui Hang', nameZh: '大水坑', color: '#48D1CC' },
	{ name: 'Shek Mun', nameZh: '石門', color: '#FBEC5D' },
	{ name: 'City One', nameZh: '第一城', color: '#FFBF00' },
	{ name: 'Sha Tin Wai', nameZh: '沙田圍', color: '#FFC0CB' },
	{ name: 'Che Kung Temple', nameZh: '車公廟', color: '#FFD280' },
	{ name: 'Kai Tak', nameZh: '啟德', color: '#FF8C00' },
	{ name: 'Sung Wong Toi', nameZh: '宋皇臺', color: '#D08A00' },
	{ name: 'To Kwa Wan', nameZh: '土瓜灣', color: '#A9E2F3' },
	{ name: 'East Tsim Sha Tsui', nameZh: '尖東', color: '#FFFF00' },
	{ name: 'Yuen Long', nameZh: '元朗', color: '#40F5F5' },
	{ name: 'Long Ping', nameZh: '朗屏', color: '#FFB3BF' },
	{ name: 'Tin Shui Wai', nameZh: '天水圍', color: '#FC8A17' },
	{ name: 'Siu Hong', nameZh: '兆康', color: '#7FFFD4' },
	// 南港岛线
	{ name: 'Wong Chuk Hang', nameZh: '黃竹坑', color: '#FFFF00' },
	// 广深港
	{ name: 'Hong Kong West Kowloon', nameZh: '香港西九龍', color: '#808080' },

	// 特殊请求：彩虹特效（用于彩虹站）
	{ name: 'Choi Hung', nameZh: '彩虹', color: '#4c717c', isRainbow: true }
];

/**
 * 夜间模式港铁车站预设
 *
 * 适用于暗色背景，通常搭配白色文字。
 */
export const MTR_PRESETS_NIGHT: MtrStation[] = [
	// 荃湾线
	{ name: 'Central', nameZh: '中環', color: '#AA0000' },
	{ name: 'Admiralty', nameZh: '金鐘', color: '#3A86D4' },
	{ name: 'Jordan', nameZh: '佐敦', color: '#69B72B' },
	{ name: 'Mong Kok', nameZh: '旺角', color: '#BE2700' },
	{ name: 'Prince Edward', nameZh: '太子', color: '#8674A1' },
	{ name: 'Sham Shui Po', nameZh: '深水埗', color: '#016258' },
	{ name: 'Lai Chi Kok', nameZh: '荔枝角', color: '#E04300' },
	{ name: 'Mei Foo', nameZh: '美孚', color: '#1E90FF' },
	{ name: 'Lai King', nameZh: '荔景', color: '#BB2200' },
	{ name: 'Kwai Fong', nameZh: '葵芳', color: '#233D3A' },
	{ name: 'Tai Wo Hau', nameZh: '大窩口', color: '#A2B741' },
	{ name: 'Tsuen Wan', nameZh: '荃灣', color: '#BB2200' },
	// 观塘线
	{ name: 'Shek Kip Mei', nameZh: '石硤尾', color: '#669933' },
	{ name: 'Kowloon Tong', nameZh: '九龍塘', color: '#007FFF' },
	{ name: 'Diamond Hill', nameZh: '鑽石山', color: '#241704' },
	{ name: 'Kowloon Bay', nameZh: '九龍灣', color: '#C80815' },
	{ name: 'Ngau Tau Kok', nameZh: '牛頭角', color: '#92B6A3' },
	// 港岛线
	{ name: 'Fortress Hill', nameZh: '炮台山', color: '#4B8842' },
	{ name: 'Quarry Bay', nameZh: '鰂魚涌', color: '#00918C' },
	{ name: 'Tai Koo', nameZh: '太古', color: '#BB2200' },
	{ name: 'Shau Kei Wan', nameZh: '筲箕灣', color: '#191970' },
	{ name: 'Heng Fa Chuen', nameZh: '杏花邨', color: '#C01204' },
	{ name: 'Chai Wan', nameZh: '柴灣', color: '#38510E' },
	// 将军澳线
	{ name: 'Tseung Kwan O', nameZh: '將軍澳', color: '#E60012' },
	{ name: 'LOHAS Park', nameZh: '康城', color: '#826F79' },
	// 迪士尼 & 欣澳
	{ name: 'Sunny Bay', nameZh: '欣澳', color: '#808080' },
	{ name: 'Disneyland Resort', nameZh: '迪士尼', color: '#005533' },
	// 东铁线
	{ name: 'Exhibition Centre', nameZh: '會展', color: '#94A8B0' },
	{ name: 'Mong Kok East', nameZh: '旺角東', color: '#006400' },
	{ name: 'Tai Wai', nameZh: '大圍', color: '#05117E' },
	{ name: 'Sha Tin', nameZh: '沙田', color: '#BB7796' },
	{ name: 'Fo Tan', nameZh: '火炭', color: '#FFA500' },
	{ name: 'Racecourse', nameZh: '馬場', color: '#15AE69' },
	{ name: 'University', nameZh: '大學', color: '#A2D7DD' },
	{ name: 'Tai Po Market', nameZh: '大埔墟', color: '#976E9A' },
	{ name: 'Tai Wo', nameZh: '太和', color: '#C89F05' },
	{ name: 'Fanling', nameZh: '粉嶺', color: '#9ACD32' },
	{ name: 'Sheung Shui', nameZh: '上水', color: '#F6A600' },
	{ name: 'Lo Wu', nameZh: '羅湖', color: '#8DC476' },
	{ name: 'Lok Ma Chau', nameZh: '落馬洲', color: '#009E9B' },
	// 屯马线
	{ name: 'Wu Kai Sha', nameZh: '烏溪沙', color: '#954535' },
	{ name: 'Hin Keng', nameZh: '顯徑', color: '#8FBE6C' },
	{ name: 'Austin', nameZh: '柯士甸', color: '#B45529' },
	{ name: 'Tsuen Wan West', nameZh: '荃灣西', color: '#A81C07' },
	{ name: 'Kam Sheung Road', nameZh: '錦上路', color: '#CC5500' },
	{ name: 'Tuen Mun', nameZh: '屯門', color: '#035F94' },
	// 南港岛线
	{ name: 'Ocean Park', nameZh: '海洋公園', color: '#00BFFF' },
	{ name: 'Lei Tung', nameZh: '利東', color: '#FF7F00' },
	{ name: 'South Horizons', nameZh: '海怡半島', color: '#74B11B' },
	// 昂坪 360
	{ name: 'Tung Chung', nameZh: '東涌', color: '#274060' }
];

/**
 * 彩虹站专用颜色序列
 *
 * 顺序：青绿 -> 红 -> 橙 -> 黄 -> 绿 -> 蓝 -> 紫 -> 青绿
 */
export const RAINBOW_COLORS = [
	'#4c717c', // 顶部青绿色
	'#E44332', // 红色
	'#F58536', // 橙色
	'#F7E94E', // 黄色
	'#4FA54B', // 绿色
	'#3366AA', // 蓝色
	'#6B3A74', // 紫色
	'#4c717c' // 底部青绿色
];

export interface MtrLine {
	id: string;
	name: string;
	nameZh: string;
	color: string;
	/** 每条区段按实际行驶顺序排列；分支使用独立区段。 */
	routes: string[][];
}

export interface MtrStationReference {
	name: string;
	nameZh: string;
}

export interface MtrLineDetails {
	line: MtrLine;
	previous: MtrStationReference[];
	next: MtrStationReference[];
}

export interface MtrStationDetails {
	station: MtrStation;
	lines: MtrLineDetails[];
}

export const MTR_LINES: MtrLine[] = [
	{
		id: 'tsuen-wan',
		name: 'Tsuen Wan Line',
		nameZh: '荃灣綫',
		color: '#E2231A',
		routes: [
			[
				'Central',
				'Admiralty',
				'Tsim Sha Tsui',
				'Jordan',
				'Yau Ma Tei',
				'Mong Kok',
				'Prince Edward',
				'Sham Shui Po',
				'Cheung Sha Wan',
				'Lai Chi Kok',
				'Mei Foo',
				'Lai King',
				'Kwai Fong',
				'Kwai Hing',
				'Tai Wo Hau',
				'Tsuen Wan'
			]
		]
	},
	{
		id: 'kwun-tong',
		name: 'Kwun Tong Line',
		nameZh: '觀塘綫',
		color: '#00AF41',
		routes: [
			[
				'Whampoa',
				'Ho Man Tin',
				'Yau Ma Tei',
				'Mong Kok',
				'Prince Edward',
				'Shek Kip Mei',
				'Kowloon Tong',
				'Lok Fu',
				'Wong Tai Sin',
				'Diamond Hill',
				'Choi Hung',
				'Kowloon Bay',
				'Ngau Tau Kok',
				'Kwun Tong',
				'Lam Tin',
				'Yau Tong',
				'Tiu Keng Leng'
			]
		]
	},
	{
		id: 'island',
		name: 'Island Line',
		nameZh: '港島綫',
		color: '#0071CE',
		routes: [
			[
				'Kennedy Town',
				'HKU',
				'Sai Ying Pun',
				'Sheung Wan',
				'Central',
				'Admiralty',
				'Wan Chai',
				'Causeway Bay',
				'Tin Hau',
				'Fortress Hill',
				'North Point',
				'Quarry Bay',
				'Tai Koo',
				'Sai Wan Ho',
				'Shau Kei Wan',
				'Heng Fa Chuen',
				'Chai Wan'
			]
		]
	},
	{
		id: 'tseung-kwan-o',
		name: 'Tseung Kwan O Line',
		nameZh: '將軍澳綫',
		color: '#6B208E',
		routes: [
			[
				'North Point',
				'Quarry Bay',
				'Yau Tong',
				'Tiu Keng Leng',
				'Tseung Kwan O',
				'Hang Hau',
				'Po Lam'
			],
			['Tseung Kwan O', 'LOHAS Park']
		]
	},
	{
		id: 'tung-chung',
		name: 'Tung Chung Line',
		nameZh: '東涌綫',
		color: '#F39800',
		routes: [
			[
				'Hong Kong',
				'Kowloon',
				'Olympic',
				'Nam Cheong',
				'Lai King',
				'Tsing Yi',
				'Sunny Bay',
				'Tung Chung'
			]
		]
	},
	{
		id: 'airport-express',
		name: 'Airport Express',
		nameZh: '機場快綫',
		color: '#007377',
		routes: [['Hong Kong', 'Kowloon', 'Tsing Yi', 'Airport', 'AsiaWorld-Expo']]
	},
	{
		id: 'disneyland-resort',
		name: 'Disneyland Resort Line',
		nameZh: '迪士尼綫',
		color: '#F550A6',
		routes: [['Sunny Bay', 'Disneyland Resort']]
	},
	{
		id: 'east-rail',
		name: 'East Rail Line',
		nameZh: '東鐵綫',
		color: '#53B7E8',
		routes: [
			[
				'Admiralty',
				'Exhibition Centre',
				'Hung Hom',
				'Mong Kok East',
				'Kowloon Tong',
				'Tai Wai',
				'Sha Tin',
				'Fo Tan',
				'University',
				'Tai Po Market',
				'Tai Wo',
				'Fanling',
				'Sheung Shui',
				'Lo Wu'
			],
			['Sheung Shui', 'Lok Ma Chau'],
			['Sha Tin', 'Racecourse', 'University']
		]
	},
	{
		id: 'tuen-ma',
		name: 'Tuen Ma Line',
		nameZh: '屯馬綫',
		color: '#9A3B26',
		routes: [
			[
				'Wu Kai Sha',
				'Ma On Shan',
				'Heng On',
				'Tai Shui Hang',
				'Shek Mun',
				'City One',
				'Sha Tin Wai',
				'Che Kung Temple',
				'Tai Wai',
				'Hin Keng',
				'Diamond Hill',
				'Kai Tak',
				'Sung Wong Toi',
				'To Kwa Wan',
				'Ho Man Tin',
				'Hung Hom',
				'East Tsim Sha Tsui',
				'Austin',
				'Nam Cheong',
				'Mei Foo',
				'Tsuen Wan West',
				'Kam Sheung Road',
				'Yuen Long',
				'Long Ping',
				'Tin Shui Wai',
				'Siu Hong',
				'Tuen Mun'
			]
		]
	},
	{
		id: 'south-island',
		name: 'South Island Line',
		nameZh: '南港島綫',
		color: '#B5BD00',
		routes: [['Admiralty', 'Ocean Park', 'Wong Chuk Hang', 'Lei Tung', 'South Horizons']]
	},
	{
		id: 'express-rail',
		name: 'Express Rail Link',
		nameZh: '廣深港高速鐵路',
		color: '#8E8E93',
		routes: [['Hong Kong West Kowloon']]
	}
];

/** 按英文站名查找车站；指定主题时优先使用该主题的站台颜色。 */
export function findMtrStation(name: string, isDark?: boolean): MtrStation | undefined {
	const presets =
		isDark === undefined
			? [...MTR_PRESETS_DAY, ...MTR_PRESETS_NIGHT]
			: isDark
				? [...MTR_PRESETS_NIGHT, ...MTR_PRESETS_DAY]
				: [...MTR_PRESETS_DAY, ...MTR_PRESETS_NIGHT];
	return presets.find((station) => station.name === name);
}

function toStationReference(name: string): MtrStationReference {
	const station = findMtrStation(name);
	if (!station) throw new Error(`Unknown station in MTR route data: ${name}`);
	return { name: station.name, nameZh: station.nameZh };
}

/** 获取线路全部区段的去重车站，保留线路行驶顺序。 */
export function getMtrLineStations(line: MtrLine): MtrStationReference[] {
	return [...new Set(line.routes.flat())].map(toStationReference);
}

/** 查询车站所属线路及各线路方向上的相邻车站。 */
export function getMtrStationDetails(name: string): MtrStationDetails | null {
	const station = findMtrStation(name);
	if (!station) return null;

	const lines = MTR_LINES.filter((line) => line.routes.some((route) => route.includes(name))).map(
		(line) => {
			const previous = new Set<string>();
			const next = new Set<string>();
			for (const route of line.routes) {
				for (let index = 0; index < route.length; index++) {
					if (route[index] !== name) continue;
					if (route[index - 1]) previous.add(route[index - 1]);
					if (route[index + 1]) next.add(route[index + 1]);
				}
			}
			return {
				line,
				previous: [...previous].map(toStationReference),
				next: [...next].map(toStationReference)
			};
		}
	);

	return { station, lines };
}
