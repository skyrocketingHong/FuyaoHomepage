<script lang="ts">
	/**
	 * 博客首页组件
	 * 
	 * 展示博客文章列表，包含 Hero 特色文章展示、网格布局以及按分类过滤功能。
	 * 
	 * @prop posts - 博客文章列表
	 * @prop activeCategory - 当前选中的分类
	 * @prop onLoadMore - 加载更多文章的回调
	 * @prop hasMore - 是否还有更多文章
	 */
	import { goto } from '$app/navigation';
	import { fly } from 'svelte/transition';
	import { t } from '$lib/i18n/store';
	import { formatDate, isRecent } from '$lib/utils/datetime/date';
	import { locale } from '$lib/i18n/store';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';

	let { posts = [], activeCategory = 'All', onLoadMore = undefined, hasMore = false } = $props<{
		posts: any[];
		activeCategory: string;
		onLoadMore?: () => void;
		hasMore?: boolean;
	}>();

	// Computed properties
	let filteredPosts = $derived(
		activeCategory === 'All' 
			? posts 
			: posts.filter((p: any) => p.category === activeCategory)
	);

	// Featured post (Hero) - Index 0
	let featuredPost = $derived(filteredPosts[0]);
	// Next 3 posts for the "Latest Stories" grid - Index 1, 2, 3
	let latestGrid = $derived(filteredPosts.slice(1, 4));
	// Remaining posts for "More from Blog" - Index 4+
	let morePosts = $derived(filteredPosts.slice(4));

	function handleCategoryClick(cat: string) {
		const target = cat === 'All' ? '/blog' : `/blog/${cat}`;
		goto(target);
	}

	function handlePostClick(post: any) {
		const postPath = post.category === 'Uncategorized' 
			? post.slug 
			: `${post.category}/${post.slug}`;
		goto(`/blog/${postPath}`);
	}

    import { Code, Cpu, FileText, Coffee, Newspaper, Terminal, BookOpen, Layers, Hash, Zap, Globe, Sparkles, PenTool } from 'lucide-svelte';

    const THEMES = [
        { gradient: 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-400/20 dark:to-cyan-400/20', color: 'text-blue-600 dark:text-blue-400' },
        { gradient: 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-400/20 dark:to-pink-400/20', color: 'text-purple-600 dark:text-purple-400' },
        { gradient: 'bg-gradient-to-br from-orange-500/10 to-amber-500/10 dark:from-orange-400/20 dark:to-amber-400/20', color: 'text-orange-600 dark:text-orange-400' },
        { gradient: 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-400/20 dark:to-teal-400/20', color: 'text-emerald-600 dark:text-emerald-400' },
        { gradient: 'bg-gradient-to-br from-rose-500/10 to-red-500/10 dark:from-rose-400/20 dark:to-red-400/20', color: 'text-rose-600 dark:text-rose-400' },
        { gradient: 'bg-gradient-to-br from-indigo-500/10 to-violet-500/10 dark:from-indigo-400/20 dark:to-violet-400/20', color: 'text-indigo-600 dark:text-indigo-400' },
    ];

    function getCategoryVisuals(category: string) {
        const cat = (category || 'uncategorized').toLowerCase();
        
        // 1. 图标选择 (基于关键字的模糊匹配)
        let icon = Hash; // 默认占位符
        
        if (cat.includes('code') || cat.includes('dev') || cat.includes('git')) icon = Code;
        else if (cat.includes('beta') || cat.includes('tech') || cat.includes('ai') || cat.includes('mac')) icon = Cpu;
        else if (cat.includes('resource') || cat.includes('file') || cat.includes('doc')) icon = FileText;
        else if (cat.includes('learn') || cat.includes('read') || cat.includes('book')) icon = BookOpen;
        else if (cat.includes('life') || cat.includes('think') || cat.includes('me')) icon = Coffee;
        else if (cat.includes('web') || cat.includes('net')) icon = Globe;
        else if (cat.includes('game') || cat.includes('play')) icon = Zap;
        else if (cat.includes('design') || cat.includes('art') || cat.includes('ui')) icon = PenTool;
        else if (cat.includes('news') || cat.includes('update')) icon = Newspaper;
        else if (cat.includes('star') || cat.includes('best')) icon = Sparkles;

        // 2. 颜色选择 (确定性哈希)
        // 使用字符编码之和来确定主题索引
        let hash = 0;
        for (let i = 0; i < cat.length; i++) {
            hash += cat.charCodeAt(i);
        }
        const theme = THEMES[hash % THEMES.length];

        return {
            gradient: theme.gradient,
            color: theme.color,
            icon: icon
        };
    }
</script>

<div class="mx-auto max-w-[980px] xl:max-w-[1100px]">
	<h2 class="sr-only">{$t('blog.latest_news')}</h2>

	{#if featuredPost}
		<!-- Hero Card -->
		<!-- Apple Style: Wrapped in LiquidGlass, Image Flush Top, Pinned Date -->
		<LiquidGlass 
			opaque={true}
			class="w-full mb-4 cursor-pointer flex flex-col gap-0 !p-0"
			onclick={() => handlePostClick(featuredPost)}
			onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && handlePostClick(featuredPost)}
			role="button"
			tabindex="0"
		>
			<!-- Image Container -->
			<div class="w-full aspect-[16/9] md:aspect-[2/1] overflow-hidden rounded-t-[inherit] rounded-b-none bg-card h-auto">
				{#if featuredPost.cover}
					<img 
						src={featuredPost.cover} 
						alt={featuredPost.title} 
						class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" 
					/>
				{:else}
					{@const visual = getCategoryVisuals(featuredPost.category || '')}
					<div class="w-full h-full {visual.gradient} flex items-center justify-center">
						<visual.icon size={80} class="{visual.color} opacity-80" />
					</div>
				{/if}
			</div>

			<!-- Content -->
			<div class="flex flex-col items-start px-6 pt-4 pb-6 flex-1">
				<div class="flex items-center gap-3 mb-3">
					<span class="text-[12px] md:text-[14px] font-bold tracking-widest uppercase text-foreground">
						{featuredPost.categoryTitle || featuredPost.category || $t('blog.update')}
					</span>
					{#if isRecent(featuredPost.date)}
						<span class="text-[12px] font-bold uppercase tracking-widest text-[#ff8800]">
							<Crossfade key={'new-' + $locale} class="inline-grid">
								<span>{$t('blog.new')}</span>
							</Crossfade>
						</span>
					{/if}
				</div>
				
				<h3 class="text-[28px] leading-[1.1] sm:text-[32px] md:text-[40px] md:leading-[1.1] font-bold text-foreground mb-4">
					{featuredPost.title}
				</h3>
				
				<div class="mt-auto text-[15px] sm:text-[17px] font-semibold text-muted-foreground">
					<Crossfade key={'featured-date-' + featuredPost.slug + '-' + $locale} class="inline-grid">
						<span>{formatDate(featuredPost.date, $locale)}</span>
					</Crossfade>
				</div>
			</div>
		</LiquidGlass>
	{/if}

	{#if latestGrid.length > 0}
		<!-- Grid Section: Responsive 1 -> 2 -> 3 columns -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-4 mb-4 border-b border-border/40">
			{#each latestGrid as post, i}
				<div 
					class="w-full h-full"
					in:fly={{ y: 20, duration: 500, delay: i * 50 }} 
				>
					<LiquidGlass 
						opaque={true}
						class="w-full h-full flex flex-col gap-0 cursor-pointer !p-0"
						onclick={() => handlePostClick(post)}
						onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && handlePostClick(post)}
						role="button"
						tabindex="0"
					>
						<div class="flex flex-col h-full">
							<!-- Card Image: Rounded Top only, flush -->
							<div class="aspect-[16/10] w-full overflow-hidden rounded-t-[inherit] rounded-b-none bg-card">
								{#if post.cover}
									<img 
										src={post.cover} 
										alt={post.title} 
										class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" 
									/>
								{:else}
									{@const visual = getCategoryVisuals(post.category || '')}
									<div class="w-full h-full {visual.gradient} flex items-center justify-center">
										<visual.icon size={48} class="{visual.color} opacity-80" />
									</div>
								{/if}
							</div>

							<!-- Card Content -->
							<div class="flex flex-col px-5 pt-4 pb-5 flex-1">
								<span class="text-[11px] md:text-[12px] font-bold tracking-widest text-foreground uppercase mb-2">
									{post.categoryTitle || post.category || $t('blog.update')}
								</span>

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
			{/each}
		</div>
	{/if}

	{#if morePosts.length > 0}
		<!-- More Section: 2-Column Grid on Desktop -->
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-[28px] md:text-[32px] font-bold text-foreground">
				<Crossfade key={'more-' + $locale} class="inline-grid">
					<span>{$t('blog.more_stories')}</span>
				</Crossfade>
			</h2>
		</div>
		
		<div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
			{#each morePosts as post}
				<LiquidGlass 
					opaque={true}
					class="w-full cursor-pointer !p-0 transition-colors"
					onclick={() => handlePostClick(post)}
					onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && handlePostClick(post)}
					role="button"
					tabindex="0"
				>
					<div class="flex items-stretch gap-0 h-[120px] sm:h-[160px]">
						<!-- Thumbnail: Flush Left, Fixed W/H equal (1:1), Full Height -->
						<div class="w-[120px] sm:w-[160px] shrink-0 overflow-hidden rounded-l-[inherit] rounded-r-none bg-muted">
							{#if post.cover}
								<img 
									src={post.cover} 
									alt={post.title} 
									class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" 
								/>
							{:else}
								{@const visual = getCategoryVisuals(post.category || '')}
								<div class="w-full h-full {visual.gradient} flex items-center justify-center">
									<visual.icon size={32} class="{visual.color} opacity-80" />
								</div>
							{/if}
						</div>

						<!-- Content -->
						<div class="flex-1 flex flex-col justify-between py-4 px-5 overflow-hidden">
							<div>
								<span class="text-[11px] font-bold tracking-widest text-muted-foreground uppercase block mb-1">
									{post.categoryTitle || post.category || $t('blog.article')}
								</span>
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
			{/each}
		</div>
		
		{#if hasMore && onLoadMore}
			<div class="mt-6 text-center">
				<LiquidGlass 
					tag="button"
					class="group px-2 py-2 rounded-full font-bold text-foreground transition-colors"
					onclick={onLoadMore}
				>
					<Crossfade key={'loadmore-' + $locale} class="inline-grid">
						<span>{$t('blog.load_more')}</span>
					</Crossfade>
				</LiquidGlass>
			</div>
		{/if}
	{:else if !featuredPost}
		<!-- Empty State -->
		<div class="text-center py-24">
			<div class="inline-block p-6 rounded-full bg-muted/50 mb-6">
				<span class="text-4xl">📭</span>
			</div>
			<h3 class="text-2xl font-bold text-foreground mb-3">
				<Crossfade key={'nostories-' + $locale} class="inline-grid">
					<span>{$t('blog.no_stories')}</span>
				</Crossfade>
			</h3>
			<p class="text-muted-foreground text-lg mb-8">
				<Crossfade key={'noposts-' + $locale} class="inline-grid">
					<span>{$t('blog.no_posts_in_category')}</span>
				</Crossfade>
			</p>
			<div class="text-center w-auto">
				<LiquidGlass 
					tag="button"
					class="w-auto inline-block group px-4 py-2 rounded-full font-bold text-foreground transition-colors"
					onclick={() => activeCategory = 'All'}
				>
					<Crossfade key={'viewall-' + $locale} class="inline-grid">
						<span>{$t('blog.view_all')}</span>
					</Crossfade>
				</LiquidGlass>
			</div>
		</div>
	{/if}
</div>
