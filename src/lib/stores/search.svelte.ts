import Fuse from 'fuse.js';
import { loadJson } from '$lib/utils/network/loading';

/**
 * 博客搜索逻辑封装
 */
export class BlogSearch {
    query = $state('');
    results = $state<any[]>([]);
    loading = $state(true);
    error = $state('');
    fuse = $state<Fuse<any> | null>(null);
    searchIndex = $state<any[]>([]);

    constructor() {
        this.init();
    }

    async init() {
        try {
            this.loading = true;
            // 延迟加载搜索索引
            this.searchIndex = await loadJson<any[]>('/posts/search.json?t=' + Date.now());

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

    handleSearch() {
        if (!this.fuse || !this.query.trim()) {
            this.results = [];
            return;
        }

        const searchResults = this.fuse.search(this.query);
        this.results = searchResults.map(result => result.item);
    }
}
