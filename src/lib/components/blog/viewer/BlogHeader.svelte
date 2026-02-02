<script lang="ts">
	/**
	 * 博客文章头部组件
	 * 
	 * 展示文章标题、发布/更新时间、分类标签、摘要及标签贴纸。
	 * 
	 * @prop title - 文章标题
	 * @prop date - 发布日期
	 * @prop lastmod - 最后修改日期
	 * @prop categories - 包含 slug 和 title 的分类对象数组
	 * @prop subtitle - 文章副标题/摘要
	 * @prop tags - 文章标签数组
	 */
	import { formatDate, fromNow } from '$lib/utils/datetime/date';
    import { t, locale } from '$lib/i18n/store';
    import { Link as LinkIcon } from 'lucide-svelte';
    import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
    import CategoryBadge from '../common/CategoryBadge.svelte';
	import { getBlogListUrl } from '$lib/utils/domain/blog';
    import TagBadge from '../common/TagBadge.svelte';
    import { goto } from '$app/navigation';

    let { 
        title, 
        date, 
        lastmod,
        categories = [], 
        subtitle = '',
        tags = []
    }: {
        title: string;
        date: string | Date;
        lastmod: string | Date;
        categories?: { slug: string; title: string }[];
        subtitle?: string;
        tags?: string[];
    } = $props();

    let formattedDate = $derived(formatDate(date, $locale));
    let formattedLastmod = $derived(lastmod ? formatDate(lastmod, $locale) : '');
    let relativeDate = $derived(fromNow(date, $locale));
    let relativeLastmod = $derived(lastmod ? fromNow(lastmod, $locale) : '');

    let hasUpdated = $derived.by(() => {
        if (!lastmod || !date) return false;
        const d1 = new Date(date).toISOString().split('T')[0];
        const d2 = new Date(lastmod).toISOString().split('T')[0];
        return d2 > d1;
    });
    
    let showCopied = $state(false);
    function copyLink() {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.href);
            showCopied = true;
            setTimeout(() => showCopied = false, 2000);
        }
    }
</script>

<header class="w-full max-w-[653px] mx-auto px-0 mb-10 min-[980px]:pt-10">
    <div class="mb-4 flex flex-col items-start gap-1">
        <CategoryBadge 
            {categories} 
            postCategories={categories.map(c => c.slug)} 
            class="text-[12px] font-bold tracking-wider uppercase text-[#6e6e73] dark:text-neutral-400" 
        />
        <div class="text-[14px] font-semibold text-[#6e6e73] dark:text-neutral-400">
            <Crossfade key={'header-date-' + $locale} class="flex flex-col items-start gap-1">
                <span class="flex items-center gap-1.5">
                    <span class="opacity-80">{$t('blog.published_at')}</span>
                    <span>{formattedDate}</span>
                    <span class="opacity-40 font-normal">({relativeDate})</span>
                </span>
                {#if hasUpdated}
                <span class="flex items-center gap-1.5 text-orange-500/80 dark:text-orange-400/70">
                    <span class="opacity-80">{$t('blog.updated_at')}</span>
                    <span>{formattedLastmod}</span>
                    <span class="opacity-60 font-normal">({relativeLastmod})</span>
                </span>
                {/if}
            </Crossfade>
        </div>
    </div>

    <h1 class="text-[32px] leading-[36px] md:text-[40px] md:leading-[44px] lg:text-[48px] lg:leading-[52px] font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7] mb-0 text-balance">
        {title}
    </h1>

    {#if subtitle}
        <p class="text-[21px] leading-[25px] lg:text-[24px] lg:leading-[28px] text-[#1d1d1f] dark:text-[#f5f5f7] font-medium mt-5 text-balance">
            {subtitle}
        </p>
    {/if}

    {#if tags && tags.length > 0}
        <div class="flex flex-wrap gap-2 mt-4 text-[12px] font-medium text-[#6e6e73] dark:text-neutral-400">
            {#each tags as tag}
                <TagBadge 
                    {tag} 
                    onclick={(t) => goto(getBlogListUrl('All', t))} 
                />
            {/each}
        </div>
    {/if}

    <div class="flex items-center gap-3 mt-4">
        <div class="relative">
            <button 
                class="text-[#6e6e73] hover:text-[#1d1d1f] dark:text-neutral-400 dark:hover:text-[#f5f5f7] transition-colors p-1" 
                aria-label="Copy Link"
                onclick={copyLink}
            >
                <LinkIcon size={18} />
            </button>
            {#if showCopied}
                <span class="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-foreground text-background px-2 py-1 rounded shadow-sm whitespace-nowrap animate-in fade-in zoom-in">
                    {$t('common.copied')}
                </span>
            {/if}
        </div>
    </div>
</header>
