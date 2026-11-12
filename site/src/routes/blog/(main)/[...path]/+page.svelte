<script lang="ts">
	/**
	 * 博客多级动态路由。
	 *
	 * 统一显示任意深度分类、标签筛选和文章详情。
	 */
	import { onDestroy, onMount, untrack } from 'svelte';
	import { page } from '$app/state';
	import Home from '$lib/components/blog/home/Home.svelte';
	import Viewer from '$lib/components/blog/viewer/Viewer.svelte';
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import LoadingState from '$lib/components/ui/feedback/LoadingState.svelte';
	import { useBlogState } from '$lib/hooks/useBlogState.svelte';
	import { t } from '$lib/i18n/store';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();
	const blog = useBlogState(
		untrack(() => data.posts),
		untrack(() => data.categories)
	);
	let currentPost = $derived(blog.selectedPost ?? data.article?.displayPost ?? null);

	onMount(() => {
		void blog.init().then(blog.syncStateFromPath);
	});

	$effect(() => {
		Object.keys(page.params);
		if (!blog.loading && blog.posts.length > 0) blog.syncStateFromPath();
	});

	$effect(() => blog.updateSidebar());
	$effect(() => blog.updateHeader());
	$effect(() => blog.updateBackButton());

	onDestroy(blog.cleanup);
</script>

{#if currentPost}
	<SeoHead
		title={currentPost.title}
		description={currentPost.description}
		keywords={currentPost.tags}
		image={currentPost.cover}
		type="article"
		author={currentPost.author}
		jsonLd={{
			'@context': 'https://schema.org',
			'@type': 'Article',
			headline: currentPost.title,
			image: currentPost.cover ? [currentPost.cover] : [],
			datePublished: currentPost.date,
			dateModified: currentPost.lastmod || currentPost.date,
			author: [
				{
					'@type': 'Person',
					name: currentPost.author || 'skyrocketing Hong',
					url: 'https://fuyaoskyrocket.ing'
				}
			],
			description: currentPost.description
		}}
	/>
{:else if blog.activeTagFromPath}
	<SeoHead
		title={$t('blog.tag_title', { tag: blog.activeTagFromPath })}
		description={$t('blog.tag_description', { tag: blog.activeTagFromPath })}
	/>
{:else}
	<SeoHead
		title={blog.categories.find((category) => category.slug === blog.activeCategory)?.title ??
			blog.activeCategory}
		description={$t('blog.category_description', { category: blog.activeCategory })}
	/>
{/if}

<div class="relative w-full">
	{#if blog.loading || blog.error}
		<div class="flex h-full w-full items-center justify-center">
			<LoadingState loading={blog.loading} error={blog.error} />
		</div>
	{:else if currentPost && data.article}
		<div class="relative w-full">
			<Viewer
				post={currentPost}
				onClose={blog.closePost}
				categories={blog.categories}
				initialArticle={data.article}
			/>
		</div>
	{:else}
		<Home
			posts={blog.posts}
			activeCategory={blog.activeCategory}
			activeTag={blog.activeTagFromPath}
			categories={blog.categories}
		/>
	{/if}
</div>
