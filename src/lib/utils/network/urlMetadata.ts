
/**
 * 链接元数据接口
 */
export interface LinkMetadata {
    title: string;
    description?: string;
    image?: string;
    url: string;
    hostname: string;
}

const CACHE = new Map<string, LinkMetadata>();

// 模拟获取元数据，实际项目中应替换为真实的后端 API 调用
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
        let metadata: LinkMetadata = {
            title: hostname,
            url: url,
            hostname: hostname,
        };

        CACHE.set(url, metadata);
        return metadata;
    } catch (e) {
        console.error('解析 URL 或获取元数据失败', e);
        return null;
    }
}
