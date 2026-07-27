import type { PageLoad } from './$types';

/** 为根布局提供 SSR 与客户端导航一致的博客页面类型。 */
export const load = (() => ({ blogPageKind: 'blog-search' as const })) satisfies PageLoad;
