<script lang="ts">
    /**
     * 博客文章卡片组件
     * 
     * 支持多种视觉变体，用于不同场景下的文章展示。
     * 
     * @prop post - 文章数据对象
     * @prop variant - 视觉模式：'featured' (大图), 'grid' (网格), 'list' (横向)
     * @prop activeCategory - 当前选中的分类 slug
     * @prop categories - 全部分类配置列表
     * @prop index - 在列表中的索引，用于进场动画延迟
     * @prop onclick - 点击回调函数
     */
    import { fly } from 'svelte/transition';
    import { t, locale } from '$lib/i18n/store';
    import { formatDate, isRecent } from '$lib/utils/datetime/date';
    import { getCategoryVisuals, getPostUrl } from '$lib/utils/domain/blog';
    import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
    import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
    import CategoryBadge from '../common/CategoryBadge.svelte';

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

    let postUrl = $derived(getPostUrl(post, activeCategory));
    let visual = $derived(getCategoryVisuals(post.categories?.[0] || post.category || ''));
    let postCategories = $derived(post.categories || [post.category]);

    function handleClick() {
        onclick(post);
    }
</script>

{#if variant === 'featured'}
    <!-- Hero 卡片 (Apple 风格) -->
    <LiquidGlass 
        opaque={true}
        class="w-full mb-4 cursor-pointer flex flex-col gap-0 !p-0"
        onclick={handleClick}
        onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && handleClick()}
        role="button"
        tabindex="0"
    >
        <!-- 图片容器 -->
        <div class="w-full aspect-[16/9] md:aspect-[2/1] overflow-hidden rounded-t-[inherit] rounded-b-none bg-card h-auto">
            {#if post.cover}
                <img 
                    src={post.cover} 
                    alt={post.title} 
                    class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" 
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

{:else if variant === 'grid'}
    <!-- 网格卡片 -->
    <div 
        class="w-full h-full"
        in:fly={{ y: 20, duration: 500, delay: index * 50 }} 
    >
        <LiquidGlass 
            opaque={true}
            class="w-full h-full flex flex-col gap-0 cursor-pointer !p-0"
            onclick={handleClick}
            onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && handleClick()}
            role="button"
            tabindex="0"
        >
            <div class="flex flex-col h-full">
                <!-- 卡片图片 -->
                <div class="aspect-[16/10] w-full overflow-hidden rounded-t-[inherit] rounded-b-none bg-card">
                    {#if post.cover}
                        <img 
                            src={post.cover} 
                            alt={post.title} 
                            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" 
                        />
                    {:else}
                        <div class="w-full h-full {visual.gradient} flex items-center justify-center">
                            <visual.icon size={48} class="{visual.color} opacity-80" />
                        </div>
                    {/if}
                </div>

                <!-- 卡片内容 -->
                <div class="flex flex-col px-5 pt-4 pb-5 flex-1">
                    <CategoryBadge 
                        {categories} 
                        {postCategories} 
                        class="text-[11px] md:text-[12px] font-bold tracking-widest text-foreground uppercase mb-2" 
                    />

                    <h4 class="text-[20px] leading-tight md:text-[24px] md:leading-[1.2] font-bold text-foreground mb-4">
                        {post.title}
                    </h4>
                    
                    <div class="mt-auto text-[14px] md:text-[15px] font-semibold text-muted-foreground">
                        <Crossfade key={'post-date-' + post.slug + '-' + $locale} class="inline-grid">
                            <span>{formatDate(post.date, $locale)}</span>
                        </Crossfade>
                    </div>
                </div>
            </div>
        </LiquidGlass>
    </div>

{:else if variant === 'list'}
    <!-- 横向列表卡片 -->
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
            <div class="w-[120px] sm:w-[160px] shrink-0 overflow-hidden rounded-l-[inherit] rounded-r-none bg-muted">
                {#if post.cover}
                    <img 
                        src={post.cover} 
                        alt={post.title} 
                        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" 
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
{/if}
