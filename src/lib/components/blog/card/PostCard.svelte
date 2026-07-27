<script lang="ts">
	/**
	 * 博客文章卡片分发组件
	 *
	 * 根据 variant 属性分发到具体的子组件。
	 */
	import FeaturedPostCard from './FeaturedPostCard.svelte';
	import GridPostCard from './GridPostCard.svelte';
	import ListPostCard from './ListPostCard.svelte';
	import type { BlogPost } from '$lib/utils/domain/blog';

	let {
		post,
		variant = 'grid',
		categories = [],
		index = 0,
		onclick
	} = $props<{
		post: BlogPost;
		variant?: 'featured' | 'grid' | 'list';
		categories?: { slug: string; title: string }[];
		index?: number;
		onclick: (post: BlogPost) => void;
	}>();
</script>

{#if variant === 'featured'}
	<FeaturedPostCard {post} {categories} {onclick} />
{:else if variant === 'grid'}
	<GridPostCard {post} {categories} {index} {onclick} />
{:else if variant === 'list'}
	<ListPostCard {post} {categories} {onclick} />
{/if}
