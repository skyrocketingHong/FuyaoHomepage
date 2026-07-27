/**
 * 相册相关类型定义
 */

/** GPS 坐标 */
export interface GpsCoordinate {
	latitude: number;
	longitude: number;
}

/** 坐标系类型 */
export type CoordType = 'wgs84' | 'gcj02';

/** 响应式图片资源 */
export interface PhotoVariant {
	/** 相对路径（相对于外部持久化相册缩略图目录） */
	path: string;
	/** 实际输出宽度 */
	width: number;
	/** 实际输出高度 */
	height: number;
	/** MIME 类型 */
	type: 'image/webp';
}

/** 照片信息 */
export interface Photo {
	/** 文件名（不含扩展名，nanoid 格式） */
	filename: string;
	/** 相对路径（相对于外部持久化相册原图目录，含扩展名） */
	path: string;
	/** 拍摄日期（ISO 8601 格式） */
	date: string;
	/** GPS 坐标 */
	gps?: GpsCoordinate;
	/** 坐标系类型（默认 wgs84） */
	coordType?: CoordType;
	/** 海拔高度（米） */
	altitude?: number;
	/** 拍摄方向（度，0=北） */
	gpsDirection?: number;
	/** 相机制造商 */
	make?: string;
	/** 相机型号 */
	model?: string;
	/** 镜头型号 */
	lensModel?: string;
	/** 等效 35mm 焦距 */
	focalLengthIn35mm?: number;
	/** 图片宽度 */
	width?: number;
	/** 图片高度 */
	height?: number;
	/** 焦距 */
	focalLength?: number;
	/** 光圈 */
	aperture?: number;
	/** ISO 感光度 */
	iso?: number;
	/** 曝光时间 */
	exposureTime?: number;
	/** 曝光补偿（EV） */
	exposureCompensation?: number;
	/** 曝光程序 */
	exposureProgram?: string;
	/** 测光模式 */
	meteringMode?: string;
	/** 白平衡 */
	whiteBalance?: string;
	/** 闪光灯 */
	flash?: string;
	/** 色彩空间 */
	colorSpace?: string;
	/** 色彩配置文件名 */
	colorProfile?: string;
	/** 照片描述 */
	description?: string;
	/** 网格使用的响应式缩略图 */
	variants?: PhotoVariant[];
}

/** 相册索引数据（轻量索引，不含照片详情） */
export interface AlbumIndex {
	/** 生成时间 */
	generatedAt: string;
	/** 照片总数 */
	totalPhotos: number;
	/** 可用年份列表（降序） */
	years: number[];
	/** 设备列表 */
	devices: AlbumDevice[];
}

/** 设备信息 */
export interface AlbumDevice {
	/** 制造商 */
	make: string;
	/** 型号列表 */
	models: string[];
}

/** 年份照片数据（从 {year}.json 加载） */
export interface AlbumYearData {
	/** 年份 */
	year: number;
	/** 该年照片列表（按日期降序） */
	photos: Photo[];
}

/** 按年月分组的照片 */
export interface MonthGroup {
	/** 年份 */
	year: number;
	/** 月份（1-12） */
	month: number;
	/** 年月显示文本，如 "2024年02月" */
	label: string;
	/** 该月的照片列表 */
	photos: Photo[];
}

/** 按年份分组的照片 */
export interface YearGroup {
	/** 年份 */
	year: number;
	/** 年份显示文本 */
	label: string;
	/** 该年份下的月份分组 */
	months: MonthGroup[];
	/** 该年份的照片总数 */
	totalPhotos: number;
}
