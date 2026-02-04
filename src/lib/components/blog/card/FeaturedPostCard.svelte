<script lang="ts">
    /**
     * 博客文章卡片 - 特色展示 (Hero)
     * 
     * 用于首页顶部的大图展示。
     */
    import { t, locale } from '$lib/i18n/store';
    import { formatDate, isRecent } from '$lib/utils/datetime/date';
    import { getCategoryVisuals, getPostUrl } from '$lib/utils/domain/blog';
    import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
    import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
    import CategoryBadge from '../common/CategoryBadge.svelte';
    import LazyImage from '$lib/components/ui/display/LazyImage.svelte';

    let { 
        post, 
        activeCategory = 'All',
        categories = [],
        onclick
    } = $props<{
        post: any;
        activeCategory?: string;
        categories?: any[];
        onclick: (post: any) => void;
    }>();

    let visual = $derived(getCategoryVisuals(post.categories?.[0] || post.category || ''));
    let postCategories = $derived(post.categories || [post.category]);

    function handleClick() {
        onclick(post);
    }
</script>

<LiquidGlass 
    opaque={true}
    class="w-full mb-4 cursor-pointer flex flex-col gap-0 !p-0"
    onclick={handleClick}
    onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && handleClick()}
    role="button"
    tabindex="0"
>
    <!-- 图片容器 -->
    <div class="relative w-full aspect-[16/9] md:aspect-[2/1] overflow-hidden rounded-t-[inherit] rounded-b-none bg-card h-auto">
        {#if post.cover}
            <LazyImage
                src={post.cover} 
                alt={post.title} 
                class="h-full w-full transition-transform duration-700 group-hover:scale-[1.02]"
                fill
            />
        {:else}
            <div class="w-full h-full {visual.gradient} flex items-center justify-center">
                <visual.icon size={80} class="{visual.color} opacity-80" />
            </div>
        {/if}
    </div>

    <!-- 内容区 -->
    <div class="flex flex-col items-start px-6 pt-4 pb-6 flex-1">
        <div class="flex items-center gap-3 mb-3">
            <CategoryBadge 
                {categories} 
                {postCategories} 
                class="text-[12px] md:text-[14px] font-bold tracking-widest uppercase text-foreground" 
            />
            {#if isRecent(post.date)}
                <span class="text-[12px] font-bold uppercase tracking-widest text-[#ff8800]">
                    <Crossfade key={'new-' + $locale} class="inline-grid">
                        <span>{$t('blog.new')}</span>
                    </Crossfade>
                </span>
            {/if}
        </div>
        
        <h3 class="text-[28px] leading-[1.1] sm:text-[32px] md:text-[40px] md:leading-[1.1] font-bold text-foreground mb-4">
            {post.title}
        </h3>
        
        <div class="mt-auto text-[15px] sm:text-[17px] font-semibold text-muted-foreground">
            <Crossfade key={'featured-date-' + post.slug + '-' + $locale} class="inline-grid">
                <span>{formatDate(post.date, $locale)}</span>
            </Crossfade>
        </div>
    </div>
</LiquidGlass>
