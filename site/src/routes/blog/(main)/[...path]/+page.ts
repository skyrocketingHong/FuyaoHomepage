import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { BlogPost } from '$lib/utils/domain/blog';
import { resolveBlogRoute } from '$lib/utils/domain/blogRoute';
import { loadPostContent } from '$lib/utils/domain/loader';
import { renderMarkdown } from '$lib/utils/domain/markdown';

export const prerender = true;
export const trailingSlash = 'always';

interface Category {
	slug: string;
	title: string;
}

/**
 * 解析任意深度的博客分类、标签和文章路径。
 *
 * 分类可包含 `/`，文章路径固定为 `<category>/<slug>`；无分类文章同时支持短 slug。
 */
export const load: PageLoad = async ({ params, parent, fetch }) => {
	const { posts, categories } = (await parent()) as {
		posts: BlogPost[];
		categories: Category[];
	};
	const match = resolveBlogRoute(params.path || '', posts, categories);

	if (match.blogPageKind === 'blog-tag') {
		return { article: null, blogPageKind: 'blog-tag' as const };
	}

	if (match.blogPageKind === 'blog-category') {
		return { article: null, blogPageKind: 'blog-category' as const };
	}

	if (match.blogPageKind !== 'blog-article') throw error(404, 'Blog route not found');

	const article = await loadPostContent(match.post, categories, { customFetch: fetch });
	const rendered = await renderMarkdown(article.content, { copyLabel: '复制' });

	return {
		blogPageKind: 'blog-article' as const,
		article: {
			...article,
			html: rendered.html,
			toc: rendered.toc
		}
	};
};
