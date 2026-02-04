<script lang="ts">
    /**
     * 博客文章卡片 - 列表展示
     * 
     * 用于首页底部的列表布局。
     */
    import { t, locale } from '$lib/i18n/store';
    import { formatDate } from '$lib/utils/datetime/date';
    import { getCategoryVisuals } from '$lib/utils/domain/blog';
    import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
    import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
    import CategoryBadge from '../common/CategoryBadge.svelte';
    import LazyImage from '$lib/components/ui/display/LazyImage.svelte';

    let { 
        post, 
        categories = [],
        onclick
    } = $props<{
        post: any;
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
    class="w-full cursor-pointer !p-0 transition-colors"
    onclick={handleClick}
    onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && handleClick()}
    role="button"
    tabindex="0"
>
    <div class="flex items-stretch gap-0 h-[120px] sm:h-[160px]">
        <!-- 缩略图 -->
        <div class="relative w-[120px] sm:w-[160px] shrink-0 overflow-hidden rounded-l-[inherit] rounded-r-none bg-muted">
            {#if post.cover}
                <LazyImage 
                    src={post.cover} 
                    alt={post.title} 
                    class="h-full w-full transition-transform duration-500 group-hover:scale-[1.02]" 
                    fill
                />
            {:else}
                <div class="w-full h-full {visual.gradient} flex items-center justify-center">
                    <visual.icon size={32} class="{visual.color} opacity-80" />
                </div>
            {/if}
        </div>

        <!-- 内容区 -->
        <div class="flex-1 flex flex-col justify-between py-4 px-5 overflow-hidden">
            <div>
                <CategoryBadge 
                    {categories} 
                    {postCategories} 
                    class="text-[11px] font-bold tracking-widest text-muted-foreground uppercase block mb-1" 
                />
                <h4 class="text-[18px] leading-[1.3] sm:text-[20px] font-bold text-foreground line-clamp-2 sm:line-clamp-3">
                    {post.title}
                </h4>
            </div>
            <span class="text-[13px] sm:text-[14px] text-muted-foreground font-semibold">
                <Crossfade key={'more-date-' + post.slug + '-' + $locale} class="inline-grid">
                    <span>{formatDate(post.date, $locale)}</span>
                </Crossfade>
            </span>
        </div>
    </div>
</LiquidGlass>
