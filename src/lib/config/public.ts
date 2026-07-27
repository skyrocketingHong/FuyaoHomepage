import type { PublicSiteConfig } from './schema';

/**
 * 构建时由 Vite 注入的公开配置。
 * 该对象已经过 Schema 校验和字段白名单筛选，不包含服务端路径或密钥。
 */
export const publicConfig: PublicSiteConfig = __FUYAO_PUBLIC_CONFIG__;

export const publicContentPaths = {
	posts: '/posts',
	data: '/data',
	albumMetadata: '/albums',
	albumMedia: __FUYAO_ALBUM_PUBLIC_BASE__
} as const;
