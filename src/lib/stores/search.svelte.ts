/**
 * 博客搜索状态管理
 *
 * 基于 Fuse.js 实现模糊搜索，支持标题、标签、分类、描述和内容的加权匹配。
 * 搜索索引从 `/posts/search.json` 延迟加载。
 */
import Fuse from 'fuse.js';
import { loadJson } from '$lib/utils/network/loading';
import type { BlogPost } from '$lib/utils/domain/blog';

/**
 * 博客搜索逻辑封装
 */
export class BlogSearch {
	/** 当前搜索关键词 */
	query = $state('');
	/** 搜索结果列表 */
	results = $state<BlogPost[]>([]);
	/** 搜索索引是否正在加载 */
	loading = $state(true);
	/** 错误信息 */
	error = $state('');
	/** Fuse.js 实例 */
	fuse = $state<Fuse<BlogPost> | null>(null);
	/** 原始搜索索引数据 */
	searchIndex = $state<BlogPost[]>([]);

	/**
	 * 初始化搜索引擎
	 *
	 * 加载搜索索引并创建 Fuse.js 实例。
	 * 如果初始化时已有关键词输入，会立即执行搜索。
	 */
	async init() {
		try {
			this.loading = true;
			// 延迟加载搜索索引
			this.searchIndex = await loadJson<BlogPost[]>('/posts/search.json');

			// 初始化 Fuse
			this.fuse = new Fuse(this.searchIndex, {
				keys: [
					{ name: 'title', weight: 0.8 },
					{ name: 'tags', weight: 0.5 },
					{ name: 'categories', weight: 0.5 },
					{ name: 'description', weight: 0.4 },
					{ name: 'content', weight: 0.1 }
				],
				threshold: 0.3,
				ignoreLocation: true,
				includeScore: true,
				useExtendedSearch: true,
				minMatchCharLength: 1
			});

			// 如果已有输入，立即搜索
			if (this.query) this.handleSearch();
		} catch (e) {
			console.error('Failed to load search index', e);
			this.error = 'Failed to load search index';
		} finally {
			this.loading = false;
		}
	}

	/**
	 * 执行搜索
	 *
	 * 根据当前 query 值通过 Fuse.js 进行模糊匹配，
	 * 将匹配结果写入 results 状态。
	 */
	handleSearch() {
		if (!this.fuse || !this.query.trim()) {
			this.results = [];
			return;
		}

		const searchResults = this.fuse.search(this.query);
		this.results = searchResults.map((result) => result.item);
	}
}
