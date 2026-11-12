/**
 * 博客布局组
 *
 * 为所有博客相关页面提供共享的状态管理和布局。
 */
import type { LayoutLoad } from './$types';
import type { BlogPost } from '$lib/utils/domain/blog';

export const load: LayoutLoad = async ({ fetch }) => {
	const { loadJson } = await import('$lib/utils/network/loading');

	const [categories, posts] = await Promise.all([
		loadJson<{ slug: string; title: string }[]>('/posts/categories.json', {
			customFetch: fetch
		}).catch(() => []),
		loadJson<BlogPost[]>('/posts/all.json', { customFetch: fetch }).catch(() => [])
	]);

	return { posts, categories };
};
