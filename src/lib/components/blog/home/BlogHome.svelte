<script lang="ts">
	/**
	 * 博客首页组件
	 * 
	 * 展示博客文章列表，包含 Hero 特色文章展示、网格布局以及按分类过滤功能。
	 * 已重构：提取 PostCard, EmptyState 逻辑并归入 home/ 子目录。
	 * 
	 * @prop posts - 博客文章列表
	 * @prop activeCategory - 当前选中的分类
	 * @prop categories - 分类映射列表
	 */
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { t, locale } from '$lib/i18n/store';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import { X } from 'lucide-svelte';
    import PostCard from '../card/PostCard.svelte';
    import EmptyState from './EmptyState.svelte';
	import TagBadge from '../common/TagBadge.svelte';
    import { getPostUrl, getBlogListUrl } from '$lib/utils/domain/blog';

	let { posts = [], activeCategory = 'All', activeTag = '', categories = [] } = $props<{
		posts: any[];
		activeCategory: string;
		activeTag?: string;
		categories: { slug: string; title: string }[];
	}>();

	let displayedCount = $state(24);

	let filteredPosts = $derived.by(() => {
		let result = activeCategory === 'All' 
			? posts 
			: posts.filter((p: any) => {
				const cats = p.categories || [p.category];
				return cats.some((c: string) => 
					c === activeCategory || c.startsWith(activeCategory + '/')
				);
			});
		
		if (activeTag) {
			result = result.filter((p: any) => p.tags && p.tags.includes(activeTag));
		}
		
		return result;
	});

	// 分页后的文章
	let paginatedPosts = $derived(filteredPosts.slice(0, displayedCount));
	let hasMore = $derived(displayedCount < filteredPosts.length);

	function onLoadMore() {
		displayedCount += 24;
	}

	function handlePostClick(post: any) {
		goto(getPostUrl(post, activeCategory));
	}

	// 布局分段
	let featuredPost = $derived(paginatedPosts[0]);
	let latestGrid = $derived(paginatedPosts.slice(1, 4));
	let morePosts = $derived(paginatedPosts.slice(4));

</script>

<div class="mx-auto max-w-[980px] xl:max-w-[1100px]">
	<h2 class="sr-only">{$t('blog.latest_news')}</h2>

	{#if activeTag}
		<Crossfade key={activeTag} class="mb-6">
			<div class="flex items-center gap-2">
				<span class="text-sm text-muted-foreground">{$t('blog.tag_filtering')}</span>
				<TagBadge tag={activeTag} active={true} />
				<button 
					class="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-muted-foreground transition-colors"
					onclick={() => {
						goto(getBlogListUrl(activeCategory), { keepFocus: true, noScroll: true });
					}}
					title={$t('blog.clear_tag')}
				>
					<X size={14} />
				</button>
			</div>
		</Crossfade>
	{/if}

	{#if featuredPost}
		<PostCard 
            post={featuredPost} 
            variant="featured" 
            {activeCategory} 
            {categories} 
            onclick={handlePostClick} 
        />
	{/if}

	{#if latestGrid.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-4 mb-4 border-b border-border/40">
			{#each latestGrid as post, i}
				<PostCard 
                    {post} 
                    variant="grid" 
                    {activeCategory} 
                    {categories} 
                    index={i} 
                    onclick={handlePostClick} 
                />
			{/each}
		</div>
	{/if}

	{#if morePosts.length > 0}
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-[28px] md:text-[32px] font-bold text-foreground">
				<Crossfade key={'more-' + $locale} class="inline-grid">
					<span>{$t('blog.more_stories')}</span>
				</Crossfade>
			</h2>
		</div>
		
		<div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
			{#each morePosts as post}
				<PostCard 
                    {post} 
                    variant="list" 
                    {activeCategory} 
                    {categories} 
                    onclick={handlePostClick} 
                />
			{/each}
		</div>
		
		{#if hasMore}
			<div class="mt-6 text-center">
				<LiquidGlass 
					tag="button"
					class="!w-auto inline-flex px-4 py-2 rounded-full text-foreground transition-colors"
					onclick={onLoadMore}
				>
					<Crossfade key={'loadmore-' + $locale} class="inline-grid">
						<span>{$t('blog.load_more')}</span>
					</Crossfade>
				</LiquidGlass>
			</div>
		{/if}
	{:else if !featuredPost}
		<EmptyState onReset={() => (activeCategory = 'All')} />
	{/if}
</div>
