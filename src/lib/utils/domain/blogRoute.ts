/** 最小文章字段，用于统一 catch-all 路由匹配。 */
export interface BlogRoutePost {
	slug: string;
	category?: string;
	categories?: string[];
}

export interface BlogRouteCategory {
	slug: string;
}

export type BlogRouteMatch<TPost extends BlogRoutePost> =
	| { blogPageKind: 'blog-category'; category: string }
	| { blogPageKind: 'blog-tag'; category: string; tag: string }
	| { blogPageKind: 'blog-article'; post: TPost }
	| { blogPageKind: null };

export function normalizeBlogPath(path: string): string {
	return path.replace(/^\/+|\/+$/g, '');
}

export function getBlogPostCategories(post: BlogRoutePost): string[] {
	return post.categories ?? (post.category ? [post.category] : []);
}

/** 按完整分类路径或短 slug 查找文章，不依赖路径深度。 */
export function findBlogPostForPath<TPost extends BlogRoutePost>(
	currentPath: string,
	posts: TPost[]
): TPost | undefined {
	return posts.find((post) => {
		const categories = getBlogPostCategories(post);
		return (
			post.slug === currentPath ||
			categories.some((category) => `${category}/${post.slug}` === currentPath)
		);
	});
}

/**
 * 解析分类、标签和文章路由。分类与标签优先，避免同名短 slug 抢占列表页。
 */
export function resolveBlogRoute<TPost extends BlogRoutePost>(
	path: string,
	posts: TPost[],
	categories: BlogRouteCategory[]
): BlogRouteMatch<TPost> {
	const currentPath = normalizeBlogPath(path);
	const categorySlugs = new Set(categories.map((category) => category.slug));
	const tagMarker = '/tag/';
	const tagIndex = currentPath.lastIndexOf(tagMarker);
	const isRootTag = currentPath.startsWith('tag/');

	if (tagIndex >= 0 || isRootTag) {
		const category = isRootTag ? '' : currentPath.slice(0, tagIndex);
		const tag = decodeURIComponent(
			isRootTag ? currentPath.slice('tag/'.length) : currentPath.slice(tagIndex + tagMarker.length)
		);
		if (!tag || (category && !categorySlugs.has(category))) return { blogPageKind: null };
		return { blogPageKind: 'blog-tag', category, tag };
	}

	if (currentPath === 'All' || categorySlugs.has(currentPath)) {
		return { blogPageKind: 'blog-category', category: currentPath };
	}

	const post = findBlogPostForPath(currentPath, posts);
	return post ? { blogPageKind: 'blog-article', post } : { blogPageKind: null };
}
