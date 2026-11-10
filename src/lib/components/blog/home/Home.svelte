<script lang="ts">
	/**
	 * 博客 Newsroom 列表。
	 *
	 * 按主报道、两篇次级报道、三篇网格报道和更多信息组织文章，
	 * 支持分类、标签过滤与增量加载。
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

	let paginatedPosts = $derived(filteredPosts.slice(0, displayedCount));
	let hasMore = $derived(displayedCount < filteredPosts.length);

	function onLoadMore() {
		displayedCount += 24;
	}

	function handlePostClick(post: BlogPost) {
		const safePost = { ...post, category: post.category || '' };
		goto(resolve(getPostUrl(safePost, activeCategory)));
	}

	let featuredPost = $derived(paginatedPosts[0]);
	let secondaryGrid = $derived(paginatedPosts.slice(1, 3));
	let latestGrid = $derived(paginatedPosts.slice(3, 6));
	let morePosts = $derived(paginatedPosts.slice(6));
</script>

<div
	class="mx-auto w-full max-w-[980px] font-newsroom text-(--newsroom-foreground) [font-optical-sizing:auto]"
>
	<div class="mb-6 border-b border-(--newsroom-border) pb-5 md:mb-10 md:pb-6">
		<Crossfade key={'latest-' + $locale} class="inline-grid">
			<h2
				class="text-[32px] leading-[38px] font-semibold tracking-[-0.022em] text-balance md:text-[40px] md:leading-[48px]"
			>
				{$t('blog.latest_news')}
			</h2>
		</Crossfade>
	</div>

	{#if activeTag}
		<Crossfade key={activeTag} class="mb-6 md:mb-8">
			<div class="flex min-h-11 flex-wrap items-center gap-2">
				<Crossfade key={$locale} class="inline-grid">
					<span class="text-sm text-(--newsroom-secondary)">{$t('blog.tag_filtering')}</span>
				</Crossfade>
				<TagBadge tag={activeTag} active={true} />
				<button
					type="button"
					class="inline-flex size-11 items-center justify-center rounded-full text-(--newsroom-secondary) transition-colors hover:bg-(--newsroom-interactive) hover:text-(--newsroom-foreground) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--newsroom-link)"
					onclick={() => {
						goto(resolve(getBlogListUrl(activeCategory)), { keepFocus: true, noScroll: true });
					}}
					title={$t('blog.clear_tag')}
					aria-label={$t('blog.clear_tag')}
				>
					<X size={16} />
				</button>
			</div>
		</Crossfade>
	{/if}

	{#if featuredPost}
		<div class="mb-6 md:mb-10">
			<PostCard post={featuredPost} variant="featured" {categories} onclick={handlePostClick} />
		</div>
	{/if}

	{#if secondaryGrid.length > 0}
		<div class="mb-6 grid grid-cols-1 gap-6 md:mb-10 md:grid-cols-2 md:gap-x-10 md:gap-y-12">
			{#each secondaryGrid as post (post.slug)}
				<PostCard {post} variant="secondary" {categories} onclick={handlePostClick} />
			{/each}
		</div>
	{/if}

	{#if latestGrid.length > 0}
		<div
			class="mb-10 grid grid-cols-1 gap-6 border-b border-(--newsroom-border) pb-10 md:mb-14 md:grid-cols-3 md:gap-x-10 md:gap-y-12 md:pb-14"
		>
			{#each latestGrid as post (post.slug)}
				<PostCard {post} variant="grid" {categories} onclick={handlePostClick} />
			{/each}
		</div>
	{/if}

	{#if morePosts.length > 0}
		<div class="mb-5 md:mb-6">
			<h2
				class="text-[28px] leading-[34px] font-semibold tracking-[-0.02em] text-balance md:text-[32px] md:leading-[38px]"
			>
				<Crossfade key={'more-' + $locale} inline class="inline-grid">
					<span>{$t('blog.more_stories')}</span>
				</Crossfade>
			</h2>
		</div>

		<div class="grid grid-cols-1 gap-x-10 md:grid-cols-2">
			{#each morePosts as post (post.slug)}
				<PostCard {post} variant="list" {categories} onclick={handlePostClick} />
			{/each}
		</div>

		{#if hasMore}
			<div class="mt-8 text-center md:mt-10">
				<button
					type="button"
					class="inline-flex min-h-11 cursor-pointer items-center justify-center px-3 text-[17px] font-medium text-(--newsroom-link) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--newsroom-link)"
					onclick={onLoadMore}
				>
					<Crossfade key={'loadmore-' + $locale} inline class="inline-grid">
						<span>{$t('blog.load_more')}</span>
					</Crossfade>
				</button>
			</div>
		{/if}
	{:else if !featuredPost}
		<EmptyState onReset={() => (activeCategory = 'All')} />
	{/if}
</div>
