<script lang="ts">
	/**
	 * 博客列表页
	 *
	 * 显示文章列表，支持分类和标签过滤。
	 */
	import { onMount, onDestroy, untrack } from 'svelte';
	import { page } from '$app/state';
	import Home from '$lib/components/blog/home/Home.svelte';
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import LoadingState from '$lib/components/ui/feedback/LoadingState.svelte';
	import { t } from '$lib/i18n/store';
	import { useBlogState } from '$lib/hooks/useBlogState.svelte';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	const blog = useBlogState(
		untrack(() => data.posts),
		untrack(() => data.categories)
	);

	onMount(() => {
		void blog.init().then(() => {
			// 初始化完成后立即同步路由状态
			blog.syncStateFromPath();
		});
	});

	// 监听路由变化
	$effect(() => {
		// 依赖 page.params 的变化
		Object.keys(page.params);
		if (!blog.loading && blog.posts.length > 0) {
			blog.syncStateFromPath();
		}
	});

	$effect(() => {
		blog.updateSidebar();
	});

	$effect(() => {
		blog.updateHeader();
	});

	$effect(() => {
		blog.updateBackButton();
	});

	onDestroy(() => {
		blog.cleanup();
	});
</script>

{#if blog.activeCategory !== 'All'}
	<SeoHead
		title={`${blog.categories.find((c) => c.slug === blog.activeCategory)?.title || blog.activeCategory}`}
		description={$t('blog.category_description', { category: blog.activeCategory })}
	/>
{/if}

<div class="relative w-full">
	{#if blog.loading || blog.error}
		<div class="flex h-full w-full items-center justify-center">
			<LoadingState loading={blog.loading} error={blog.error} />
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
