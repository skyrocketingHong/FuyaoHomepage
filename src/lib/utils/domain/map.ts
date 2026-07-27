/**
 * 地图 URL 工具函数
 *
 * 根据语言返回对应的地图链接，并自动处理坐标系转换。
 * - 简体中文：高德地图（使用 GCJ-02 坐标）
 * - 英文：谷歌地图（使用 WGS-84 坐标）
 *
 * 坐标系说明：
 * - WGS-84：GPS 原始坐标，国际标准，iPhone EXIF 存储的坐标
 * - GCJ-02：火星坐标，中国加密，高德地图、国内安卓手机使用
 */
import type { GpsCoordinate, CoordType } from '$lib/types/album';

export type { GpsCoordinate, CoordType };

// ============================================================
// GCJ-02 ↔ WGS-84 坐标转换算法
// 参考：https://github.com/wandergis/coordtransform
// ============================================================

const PI = Math.PI;
const A = 6378245.0; // 长半轴
const EE = 0.00669342162296594; // 偏心率平方

/**
 * 判断坐标是否在中国大陆境内
 * GCJ-02 转换只对中国大陆有效，港澳台使用 WGS-84
 *
 * 简化判断：排除港澳台地区
 * - 香港：22.15-22.56°N, 113.84-114.40°E
 * - 澳门：22.06-22.23°N, 113.53-113.63°E
 * - 台湾：21.87-25.34°N, 119.53-122.00°E
 */
function isInChinaMainland(lat: number, lng: number): boolean {
	// 基本范围检查
	if (lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271) {
		return false;
	}

	// 排除香港
	if (lat >= 22.15 && lat <= 22.56 && lng >= 113.84 && lng <= 114.4) {
		return false;
	}

	// 排除澳门
	if (lat >= 22.06 && lat <= 22.23 && lng >= 113.53 && lng <= 113.63) {
		return false;
	}

	// 排除台湾
	if (lat >= 21.87 && lat <= 25.34 && lng >= 119.53 && lng <= 122.0) {
		return false;
	}

	return true;
}

/**
 * 转换纬度
 */
function transformLat(x: number, y: number): number {
	let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
	ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
	ret += ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * 2.0) / 3.0;
	ret += ((160.0 * Math.sin((y / 12.0) * PI) + 320.0 * Math.sin((y * PI) / 30.0)) * 2.0) / 3.0;
	return ret;
}

/**
 * 转换经度
 */
function transformLng(x: number, y: number): number {
	let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
	ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
	ret += ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * 2.0) / 3.0;
	ret += ((150.0 * Math.sin((x / 12.0) * PI) + 300.0 * Math.sin((x / 30.0) * PI)) * 2.0) / 3.0;
	return ret;
}

/**
 * WGS-84 转 GCJ-02
 * 高德地图全球都使用 GCJ-02，所以全球坐标都需要转换
 *
 * @param wgsLat - WGS-84 纬度
 * @param wgsLng - WGS-84 经度
 * @returns GCJ-02 坐标
 */
export function wgs84ToGcj02(wgsLat: number, wgsLng: number): GpsCoordinate {
	// 高德全球都用 GCJ-02，不需要地区限制
	if (wgsLat === 0 && wgsLng === 0) {
		return { latitude: wgsLat, longitude: wgsLng };
	}

	let dLat = transformLat(wgsLng - 105.0, wgsLat - 35.0);
	let dLng = transformLng(wgsLng - 105.0, wgsLat - 35.0);
	const radLat = (wgsLat / 180.0) * PI;
	let magic = Math.sin(radLat);
	magic = 1 - EE * magic * magic;
	const sqrtMagic = Math.sqrt(magic);
	dLat = (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI);
	dLng = (dLng * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * PI);

	return {
		latitude: wgsLat + dLat,
		longitude: wgsLng + dLng
	};
}

/**
 * GCJ-02 转 WGS-84
 * 用于谷歌地图海外场景
 *
 * @param gcjLat - GCJ-02 纬度
 * @param gcjLng - GCJ-02 经度
 * @returns WGS-84 坐标
 */
export function gcj02ToWgs84(gcjLat: number, gcjLng: number): GpsCoordinate {
	if (gcjLat === 0 && gcjLng === 0) {
		return { latitude: gcjLat, longitude: gcjLng };
	}

	let dLat = transformLat(gcjLng - 105.0, gcjLat - 35.0);
	let dLng = transformLng(gcjLng - 105.0, gcjLat - 35.0);
	const radLat = (gcjLat / 180.0) * PI;
	let magic = Math.sin(radLat);
	magic = 1 - EE * magic * magic;
	const sqrtMagic = Math.sqrt(magic);
	dLat = (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI);
	dLng = (dLng * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * PI);

	return {
		latitude: gcjLat - dLat,
		longitude: gcjLng - dLng
	};
}

// ============================================================
// 地图 URL 生成
// ============================================================

/**
 * 获取地图 URL
 *
 * 坐标系处理规则：
 * - 高德地图：全球都使用 GCJ-02
 * - Google Maps：中国大陆使用 GCJ-02，海外使用 WGS-84
 *
 * @param gps - GPS 坐标
 * @param locale - 语言代码（zh-CN 或 en-US）
 * @param coordType - 坐标系类型（默认 wgs84）
 * @param zoom - 缩放级别（默认 15）
 * @returns 地图 URL
 */
export function getMapUrl(
	gps: GpsCoordinate,
	locale: string = 'zh-CN',
	coordType: CoordType = 'wgs84',
	zoom: number = 15
): string {
	let lat = gps.latitude;
	let lng = gps.longitude;

	// 判断坐标是否在中国大陆
	const inMainland = isInChinaMainland(lat, lng);

	if (locale === 'zh-CN') {
		// 高德地图：全球都需要 GCJ-02
		if (coordType === 'wgs84') {
			const converted = wgs84ToGcj02(lat, lng);
			lat = converted.latitude;
			lng = converted.longitude;
		}
		return `https://uri.amap.com/marker?position=${lng},${lat}&zoom=${zoom}`;
	} else {
		// Google Maps
		if (inMainland) {
			// 中国大陆：需要 GCJ-02
			if (coordType === 'wgs84') {
				const converted = wgs84ToGcj02(lat, lng);
				lat = converted.latitude;
				lng = converted.longitude;
				return `https://www.google.com/maps?gl=CN&q=${lat},${lng}&z=${zoom}`;
			}
		} else {
			// 海外：需要 WGS-84
			if (coordType === 'gcj02') {
				const converted = gcj02ToWgs84(lat, lng);
				lat = converted.latitude;
				lng = converted.longitude;
			}
		}
		return `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}`;
	}
}

/**
 * 获取地图名称（用于显示）
 *
 * @param locale - 语言代码
 * @returns 地图名称
 */
export function getMapName(locale: string = 'zh-CN'): string {
	return locale === 'zh-CN' ? '高德地图' : 'Google Maps';
}
