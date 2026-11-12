<script lang="ts">
	/**
	 * 博客文章卡片分发组件。
	 *
	 * 提供主报道、次级报道、标准网格和紧凑列表四种 Newsroom 变体。
	 */
	import FeaturedPostCard from './FeaturedPostCard.svelte';
	import GridPostCard from './GridPostCard.svelte';
	import ListPostCard from './ListPostCard.svelte';
	import type { BlogPost } from '$lib/utils/domain/blog';

	let {
		post,
		variant = 'grid',
		categories = [],
		onclick
	} = $props<{
		post: BlogPost;
		variant?: 'featured' | 'secondary' | 'grid' | 'list';
		categories?: { slug: string; title: string }[];
		onclick: (post: BlogPost) => void;
	}>();
</script>

{#if variant === 'featured'}
	<FeaturedPostCard {post} {categories} {onclick} />
{:else if variant === 'secondary'}
	<GridPostCard {post} {categories} size="large" {onclick} />
{:else if variant === 'grid'}
	<GridPostCard {post} {categories} {onclick} />
{:else if variant === 'list'}
	<ListPostCard {post} {categories} {onclick} />
{/if}
