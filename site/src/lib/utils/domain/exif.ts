/**
 * EXIF 参数格式化工具函数
 *
 * 相册网格和灯箱共用，避免重复定义。
 */

/** 判断相机制造商是否为 Apple。 */
export function isApple(make?: string): boolean {
	return !!make && /apple/i.test(make);
}

/** 判断相机制造商是否为小米。 */
export function isXiaomi(make?: string): boolean {
	return !!make && /xiaomi/i.test(make);
}

/** 判断制造商或型号信息中是否包含 Leica 标识。 */
export function hasLeica(make?: string, model?: string): boolean {
	return (!!model && /leica/i.test(model)) || (!!make && /leica/i.test(make));
}

/** 拼接设备名称，去掉与 make 重复的前缀 */
export function formatDeviceName(make?: string, model?: string): string {
	if (model && make && model.startsWith(make)) return model;
	return [make, model].filter(Boolean).join(' ');
}

/** 将光圈值格式化为 EXIF 常用的 `f/x` 表示。 */
export function formatAperture(f: number | undefined): string {
	if (f === undefined || f === null) return '';
	return `f/${f.toFixed(2)}`;
}

/** 将毫米焦距格式化为紧凑文本。 */
export function formatFocalLength(mm: number | undefined): string {
	if (mm === undefined || mm === null) return '';
	return `${mm % 1 === 0 ? mm.toFixed(0) : mm.toFixed(1)}mm`;
}

/** 将秒制曝光时间格式化为秒数或倒数快门。 */
export function formatExposureTime(time: number | undefined): string {
	if (!time) return '';
	if (time >= 1) return `${time}s`;
	return `1/${Math.round(1 / time)}s`;
}

/** 将曝光补偿格式化为带符号的 EV 文本。 */
export function formatExposureComp(ev: number | undefined): string {
	if (ev === undefined || ev === null) return '';
	if (ev === 0) return '0 EV';
	return `${ev > 0 ? '+' : ''}${ev.toFixed(1)} EV`;
}

/** 将十进制度坐标转换为度、分、秒及方位表示。 */
export function formatDMS(decimal: number, isLat: boolean): string {
	const abs = Math.abs(decimal);
	const d = Math.floor(abs);
	const mFloat = (abs - d) * 60;
	const m = Math.floor(mFloat);
	const s = (mFloat - m) * 60;
	const dir = isLat ? (decimal >= 0 ? 'N' : 'S') : decimal >= 0 ? 'E' : 'W';
	return `${String(d).padStart(3, '\u00A0')}° ${String(m).padStart(2, '0')}' ${s.toFixed(3).padStart(6, '0')}" ${dir}`;
}

const ZH_DIRS = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
const EN_DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/** 将方位角转换为本地化的八方向文本。 */
export function formatDirection(deg: number, locale: string): string {
	const idx = Math.round(deg / 45) % 8;
	const dirs = locale === 'zh-CN' ? ZH_DIRS : EN_DIRS;
	return `${dirs[idx]} ${deg.toFixed(1)}°`;
}

/**
 * 计算照片在固定宽高容器内的实际展示尺寸。
 *
 * 横向照片宽度填满容器，纵向或方形照片高度填满容器，始终保持原始比例。
 *
 * @param photoAspect - 照片宽高比
 * @param containerW - 容器宽度
 * @param containerH - 容器高度
 * @param containerAspect - 容器宽高比
 * @returns 照片在容器内的实际展示宽高
 */
export function calcPhotoDisplay(
	photoAspect: number,
	containerW: number,
	containerH: number,
	containerAspect: number
): { width: number; height: number } {
	if (photoAspect > containerAspect) {
		return { width: containerW, height: containerW / photoAspect };
	}
	return { width: containerH * photoAspect, height: containerH };
}
