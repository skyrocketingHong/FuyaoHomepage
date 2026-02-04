/**
 * 博客多级动态路由加载脚本
 *
 * 负责 /blog/[[...path]] 的数据预加载与路由合法性校验。
 * 通过校验路径是否属于已知文章或分类，决定是展示内容还是抛出 404 错误。
 */
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const trailingSlash = 'always';

interface Post {
	slug: string;
	category: string;
	categories?: string[];
	[key: string]: unknown;
}

interface Category {
	slug: string;
	title: string;
}

/**
 * 博客路由验证与数据加载函数
 * 
 * @param event - SvelteKit 页面加载事件，包含 params 和 fetch
 * @returns 返回包含 posts 和 categories 的数据对象，供页面组件使用
 * @throws {Error} 如果路径不匹配任何文章或分类，抛出 404 错误
 */
export const load: PageLoad = async ({ params, fetch }) => {
	// 归一化路径，去除末尾斜杠以便后续匹配数据中的 slug
	const currentPath = (params.path || '').replace(/\/$/, '');

	try {
		const [catsRes, postsRes] = await Promise.all([
			fetch('/posts/categories.json'),
			fetch('/posts/all.json')
		]);

		if (!catsRes.ok || !postsRes.ok) return { posts: [], categories: [] };

		const categories: Category[] = await catsRes.json();
		const posts: Post[] = await postsRes.json();

		// 情况 A：根路径 /blog 或手动指定为 All 或 search
		if (currentPath === '' || currentPath === 'All' || currentPath === 'search') {
			return { posts, categories };
		}

		// 情况 B：验证是否为具体文章
		const isPost = posts.some((p: Post) => {
			const cats = p.categories || (p.category ? [p.category] : []);
			return cats.some((cat) => {
				const postPath = !cat || cat === 'Uncategorized' ? p.slug : `${cat}/${p.slug}`;
				return postPath === currentPath;
			}) || p.slug === currentPath;
		});

		if (isPost) return { posts, categories };

		// 情况 C：验证是否为有效的分类 slug 或标签路径
		const isCategory = categories.some((c: Category) => c.slug === currentPath);
		const isTagPath = currentPath.startsWith('tag/') || currentPath.includes('/tag/');
		if (isCategory || isTagPath) return { posts, categories };

		// 情况 D：无匹配项，抛出 404
		throw error(404, 'Not Found');
	} catch (e: unknown) {
		// 如果是 SvelteKit 抛出的 404，继续向上传播
		if (e && typeof e === 'object' && 'status' in e && e.status === 404) {
			throw e;
		}
		console.error('Blog route validation failed:', e);
		return { posts: [], categories: [] };
	}
};
