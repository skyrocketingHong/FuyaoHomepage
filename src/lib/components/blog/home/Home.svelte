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
	import { resolve } from '$app/paths';
	import { t, locale } from '$lib/i18n/store';
	import type { BlogPost } from '$lib/utils/domain/blog';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import { X } from 'lucide-svelte';
	import PostCard from '../card/PostCard.svelte';
	import EmptyState from './EmptyState.svelte';
	import TagBadge from '../common/TagBadge.svelte';
	import { getPostUrl, getBlogListUrl } from '$lib/utils/domain/blog';

	let {
		posts = [],
		activeCategory = 'All',
		activeTag = '',
		categories = []
	} = $props<{
		posts: BlogPost[];
		activeCategory: string;
		activeTag?: string;
		categories: { slug: string; title: string }[];
	}>();

	let displayedCount = $state(24);

	let filteredPosts = $derived.by(() => {
		let result =
			activeCategory === 'All'
				? posts
				: posts.filter((p: BlogPost) => {
						const cats = p.categories || (p.category ? [p.category] : []);
						return cats.some(
							(c: string) => c === activeCategory || (c && c.startsWith(activeCategory + '/'))
						);
					});

		if (activeTag) {
			result = result.filter((p: BlogPost) => p.tags && p.tags.includes(activeTag));
		}

		return result;
	});

	// 分页后的文章
	let paginatedPosts = $derived(filteredPosts.slice(0, displayedCount));
	let hasMore = $derived(displayedCount < filteredPosts.length);

	function onLoadMore() {
		displayedCount += 24;
	}

	function handlePostClick(post: BlogPost) {
		// 转换类型以匹配 getPostUrl 的 Post 接口 (category 必填 vs 可选)
		// 实际上 getPostUrl 会处理 undefined，这里强制转换或确保数据完整
		const safePost = { ...post, category: post.category || '' };
		goto(resolve(getPostUrl(safePost, activeCategory)));
	}

	// 布局分段
	let featuredPost = $derived(paginatedPosts[0]);
	let latestGrid = $derived(paginatedPosts.slice(1, 4));
	let morePosts = $derived(paginatedPosts.slice(4));
</script>

<div class="mx-auto max-w-[1100px] xl:max-w-[1180px]">
	<div class="mb-6 flex items-end justify-between border-b border-border/60 pb-4 md:mb-8 md:pb-5">
		<Crossfade key={'latest-' + $locale} class="inline-grid">
			<h2
				class="text-[36px] leading-none font-semibold tracking-[-0.03em] text-foreground md:text-[48px]"
			>
				{$t('blog.latest_news')}
			</h2>
		</Crossfade>
	</div>

	{#if activeTag}
		<Crossfade key={activeTag} class="mb-6">
			<div class="flex items-center gap-2">
				<Crossfade key={$locale} class="inline-grid"
					><span class="text-sm text-muted-foreground">{$t('blog.tag_filtering')}</span></Crossfade
				>
				<TagBadge tag={activeTag} active={true} />
				<button
					class="rounded-full p-1 text-muted-foreground transition-colors hover:bg-black/5 dark:hover:bg-white/5"
					onclick={() => {
						goto(resolve(getBlogListUrl(activeCategory)), { keepFocus: true, noScroll: true });
					}}
					title={$t('blog.clear_tag')}
				>
					<X size={14} />
				</button>
			</div>
		</Crossfade>
	{/if}

	{#if featuredPost}
		<PostCard post={featuredPost} variant="featured" {categories} onclick={handlePostClick} />
	{/if}

	{#if latestGrid.length > 0}
		<div
			class="mb-10 grid grid-cols-1 gap-5 border-b border-border/50 pb-10 md:grid-cols-2 lg:grid-cols-3"
		>
			{#each latestGrid as post, i (post.slug)}
				<PostCard {post} variant="grid" {categories} index={i} onclick={handlePostClick} />
			{/each}
		</div>
	{/if}

	{#if morePosts.length > 0}
		<div class="mb-5 flex items-center justify-between">
			<h2 class="text-[28px] font-semibold tracking-[-0.02em] text-foreground md:text-[34px]">
				<Crossfade key={'more-' + $locale} inline class="inline-grid">
					<span>{$t('blog.more_stories')}</span>
				</Crossfade>
			</h2>
		</div>

		<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
			{#each morePosts as post (post.slug)}
				<PostCard {post} variant="list" {categories} onclick={handlePostClick} />
			{/each}
		</div>

		{#if hasMore}
			<div class="mt-6 text-center">
				<LiquidGlass
					tag="button"
					class="inline-flex !w-auto rounded-full px-4 py-2 text-foreground transition-colors"
					onclick={onLoadMore}
				>
					<Crossfade key={'loadmore-' + $locale} inline class="inline-grid">
						<span>{$t('blog.load_more')}</span>
					</Crossfade>
				</LiquidGlass>
			</div>
		{/if}
	{:else if !featuredPost}
		<EmptyState onReset={() => (activeCategory = 'All')} />
	{/if}
</div>
