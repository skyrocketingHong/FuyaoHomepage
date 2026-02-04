<script lang="ts">
    /**
     * 博客文章卡片分发组件
     * 
     * 根据 variant 属性分发到具体的子组件。
     */
    import FeaturedPostCard from './FeaturedPostCard.svelte';
    import GridPostCard from './GridPostCard.svelte';
    import ListPostCard from './ListPostCard.svelte';

    let { 
        post, 
        variant = 'grid', 
        activeCategory = 'All',
        categories = [],
        index = 0,
        onclick
    } = $props<{
        post: any;
        variant?: 'featured' | 'grid' | 'list';
        activeCategory?: string;
        categories?: any[];
        index?: number;
        onclick: (post: any) => void;
    }>();
</script>

{#if variant === 'featured'}
    <FeaturedPostCard {post} {activeCategory} {categories} {onclick} />
{:else if variant === 'grid'}
    <GridPostCard {post} {categories} {index} {onclick} />
{:else if variant === 'list'}
    <ListPostCard {post} {categories} {onclick} />
{/if}
