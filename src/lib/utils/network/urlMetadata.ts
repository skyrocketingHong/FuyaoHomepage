/**
 * 链接元数据工具
 *
 * 提供 URL 元信息解析和内存缓存功能，用于链接预览卡片的数据获取。
 */

/**
 * 链接元数据接口
 */
export interface LinkMetadata {
	/** 页面标题 */
	title: string;
	/** 页面描述 */
	description?: string;
	/** 预览图片 URL */
	image?: string;
	/** 原始链接 URL */
	url: string;
	/** 域名 */
	hostname: string;
}

/** 元数据内存缓存 */
const CACHE = new Map<string, LinkMetadata>();

/**
 * 获取链接元数据
 *
 * 模拟获取网页的标题、描述和图片等 OpenGraph 信息。
 * 包含简单的内存缓存机制。
 *
 * @param url - 目标 URL
 * @returns 元数据对象或 null
 */
export async function fetchLinkMetadata(url: string): Promise<LinkMetadata | null> {
	if (CACHE.has(url)) {
		return CACHE.get(url)!;
	}

	try {
		const urlObj = new URL(url);
		const hostname = urlObj.hostname;

		// 简单的模拟逻辑
		const metadata: LinkMetadata = {
			title: hostname,
			url: url,
			hostname: hostname
		};

		CACHE.set(url, metadata);
		return metadata;
	} catch (e) {
		console.error('解析 URL 或获取元数据失败', e);
		return null;
	}
}
