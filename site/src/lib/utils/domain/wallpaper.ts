import type { LocaleKey } from '$lib/i18n';

export interface BingWallpaperMetadata {
	title?: string;
	imageUrl?: string;
	startDate?: string;
	endDate?: string;
	copyright?: string;
	copyrightLink?: string;
}

function text(value: unknown): string | undefined {
	return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function httpUrl(value: unknown): string | undefined {
	const candidate = text(value);
	if (!candidate) return undefined;
	try {
		const url = new URL(candidate, 'https://www.bing.com');
		return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined;
	} catch {
		return undefined;
	}
}

function date(value: unknown): string | undefined {
	const candidate = text(value);
	if (!candidate || !/^\d{8}$/.test(candidate)) return undefined;
	return `${candidate.slice(0, 4)}-${candidate.slice(4, 6)}-${candidate.slice(6, 8)}`;
}

/** 校验并规范化 Bing 壁纸接口的扁平或 images[0] 响应。 */
export function parseBingWallpaperMetadata(value: unknown): BingWallpaperMetadata {
	const root =
		value &&
		typeof value === 'object' &&
		'images' in value &&
		Array.isArray(value.images) &&
		value.images[0] &&
		typeof value.images[0] === 'object'
			? value.images[0]
			: value;
	if (!root || typeof root !== 'object') throw new Error('Invalid Bing wallpaper metadata');
	const record = root as Record<string, unknown>;
	const metadata: BingWallpaperMetadata = {
		title: text(record.title),
		imageUrl: httpUrl(record.url ?? record.imageUrl),
		startDate: date(record.start_date ?? record.startdate),
		endDate: date(record.end_date ?? record.enddate),
		copyright: text(record.copyright),
		copyrightLink: httpUrl(record.copyright_link ?? record.copyrightlink)
	};
	if (!Object.values(metadata).some(Boolean)) throw new Error('Empty Bing wallpaper metadata');
	return metadata;
}

/** 保留既有查询参数，并按界面语言设置 Bing 市场。 */
export function createBingMetadataUrl(apiUrl: string, locale: LocaleKey): string {
	const url = new URL(apiUrl);
	url.searchParams.set('mkt', locale);
	return url.toString();
}
