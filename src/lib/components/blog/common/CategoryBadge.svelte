<script lang="ts">
    /**
     * 博客分类标签组件
     * 
     * 用于统一展示文章所属的一个或多个分类，支持多分类间的垂直分隔。
     * 
     * @prop categories - 全部分类配置列表（用于查找标题）
     * @prop postCategories - 文章持有的分类 slug 数组
     * @prop class - 外部 CSS 类名
     */
    import { getCategoryTitle } from '$lib/utils/domain/blog';
    import { t } from '$lib/i18n/store';

    let { 
        categories = [], 
        postCategories = [], 
        class: className = "" 
    } = $props<{
        categories: { slug: string; title: string }[];
        postCategories: string[];
        class?: string;
    }>();

    // 过滤掉无效分类
    let validCats = $derived(postCategories.filter(Boolean));
</script>

<div class="flex items-center gap-1.5 {className}">
    {#each validCats as cat, i}
        <span class="inline-flex items-center">
            {getCategoryTitle(cat, categories)}
            {#if i < validCats.length - 1}
                <span class="opacity-50 mx-1">|</span>
            {/if}
        </span>
    {:else}
        <span>{$t('blog.update')}</span>
    {/each}
</div>
