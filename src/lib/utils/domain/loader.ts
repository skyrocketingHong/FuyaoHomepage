/**
 * 博客文章加载工具
 *
 * 负责 fetching Markdown 文件、解析 Frontmatter 以及聚合文章元数据。
 */
import { loadText, type LoadOptions } from '$lib/utils/network/loading';
import yaml from 'js-yaml';
import { getCategoryTitle } from '$lib/utils/domain/blog';
import type { BlogPost } from '$lib/utils/domain/blog';

/**
 * 博客文章内容接口
 *
 * 包含解析后的正文内容、元数据及来源文件信息。
 */
export interface PostContent {
	content: string;
	metadata: Record<string, unknown>;
	loadedFile: string;
}

/**
 * 加载并解析博客文章内容
 *
 * @param post - 原始文章对象 (列表数据)
 * @param categories - 分类配置列表
 * @returns 解析后的完整文章数据对象
 */
export async function loadPostContent(
	post: BlogPost,
	categories: { slug: string; title: string }[] = [],
	options: LoadOptions = {}
) {
	if (!post || !post.file) {
		throw new Error('Invalid post data');
	}

	const text = await loadText(`/posts/${post.file}`, options);
	let cleanText = text;
	let additionalMetadata: Record<string, unknown> = {};

	// 解析 Frontmatter
	const frontmatterMatch = text.match(/^\uFEFF?---([\s\S]+?)---/);
	if (frontmatterMatch) {
		try {
			additionalMetadata = (yaml.load(frontmatterMatch[1]) as Record<string, unknown>) ?? {};
			cleanText = text.replace(/^\uFEFF?---[\s\S]+?---\s*/, '');
		} catch (e) {
			console.error('Frontmatter parse error', e);
			additionalMetadata = {};
		}
	}

	const cats = (post.categories || (post.category ? [post.category] : [])) as string[];

	// 聚合数据: 优先使用 Frontmatter 中的元数据覆盖列表中的元数据
	const aggregatedPost = {
		...post,
		...additionalMetadata,
		date: additionalMetadata.date
			? new Date(additionalMetadata.date as string).toISOString().split('T')[0]
			: post.date,
		lastmod: additionalMetadata.lastmod
			? new Date(additionalMetadata.lastmod as string).toISOString().split('T')[0]
			: post.lastmod || '',
		categoryTitles: cats.map((c: string) => ({ slug: c, title: getCategoryTitle(c, categories) })),
		categories: cats,
		tags: (additionalMetadata.tags || post.tags || []) as string[]
	};

	return {
		content: cleanText,
		displayPost: aggregatedPost,
		loadedFile: post.file
	};
}
