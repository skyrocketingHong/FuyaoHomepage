<script lang="ts">
	/**
	 * 博客搜索主界面 (Content View)
	 *
	 * 替代 SearchModal，嵌入在页面主体内容区域。
	 * 负责处理搜索逻辑并注入 Header 返回按钮。
	 */
	import { onMount, onDestroy } from 'svelte';
	import { Search as SearchIcon, Loader2, FileText, Calendar } from 'lucide-svelte';
	import { t } from '$lib/i18n/store';
	import { goto } from '$app/navigation';
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
    import { getPostUrl } from '$lib/utils/domain/blog';
    import { headerState } from '$lib/stores/app.svelte';
    import BackButton from '../viewer/BackButton.svelte';
    import { BlogSearch } from '$lib/stores/search.svelte';

	let { onClose } = $props<{ onClose: () => void }>();

    // 实例化搜索逻辑
    const search = new BlogSearch();
	let inputEl: HTMLInputElement;
    let backBtnId = '';

	onMount(() => {
		// 注入返回按钮到 Header Left
        backBtnId = headerState.setLeft(BackButton, { 
            onclick: onClose 
        }, 'blog-search-back');
        
        // 自动聚焦输入框 (等待 loading 结束或直接聚焦)
        $effect(() => {
            if (!search.loading && inputEl) {
                inputEl.focus();
            }
        });
	});

    onDestroy(() => {
        if (backBtnId) {
            headerState.clearLeft(backBtnId);
        }
    });

    // 监听 query 变化触发搜索
    $effect(() => {
        if (search.query || search.fuse) {
            search.handleSearch();
        }
    });

	function goToPost(post: any) {
        const postObj = {
            ...post,
            category: post.categories?.[0] || 'Uncategorized'
        }
		goto(getPostUrl(postObj, postObj.category));
	}
</script>

<div class="mx-auto max-w-[980px] xl:max-w-[1100px] flex flex-col min-h-[60vh]">
    <LiquidGlass class="w-full flex flex-col !p-0" showLighting={false}>
        <!-- 搜索头部 -->
        <div class="flex items-center gap-3 px-6 py-6 border-b border-white/10 bg-white/50 dark:bg-black/50 backdrop-blur-md">
            <SearchIcon class="text-muted-foreground shrink-0" size={24} />
            <input
                bind:this={inputEl}
                value={search.query}
                oninput={(e) => search.query = e.currentTarget.value}
                placeholder={$t('blog.search.placeholder')}
                class="flex-1 bg-transparent text-2xl outline-none placeholder:text-muted-foreground/60 font-medium"
                autocomplete="off"
            />
            {#if search.loading}
                <Loader2 class="animate-spin text-muted-foreground" size={24} />
            {/if}
        </div>

            <!-- 结果列表 -->
        <div class="flex-1 p-4">
            {#if search.error}
                <div class="flex flex-col items-center justify-center py-12 text-destructive">
                    <FileText size={48} class="mb-4 opacity-50" />
                    <p class="text-lg font-medium">Data Load Error</p>
                    <p class="text-sm opacity-80">{search.error}</p>
                    <button 
                        class="mt-4 px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-full text-sm font-medium transition-colors"
                        onclick={() => window.location.reload()}
                    >
                        Retry
                    </button>
                </div>
            {:else if search.loading}
                <div class="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 class="animate-spin mr-2" size={16} />
                    {$t('common.loading')}
                </div>
            {:else if search.query && search.results.length === 0}
                <div class="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <SearchIcon size={64} class="mb-4 opacity-20" />
                    <p class="text-lg">{$t('blog.search.no_results', { query: search.query })}</p>
                </div>
            {:else if search.results.length > 0}
                <div class="space-y-2">
                    {#each search.results as post}
                        <button
                            class="w-full text-left group flex flex-col gap-2 p-4 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                            onclick={() => goToPost(post)}
                        >
                            <div class="flex items-center justify-between w-full">
                                <h3 class="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                    {post.title}
                                </h3>
                                {#if post.date}
                                    <span class="text-sm text-muted-foreground flex items-center gap-1 shrink-0">
                                        <Calendar size={14} />
                                        {post.date.substring(0, 10)}
                                    </span>
                                {/if}
                            </div>

                            {#if post.description}
                                <p class="text-base text-muted-foreground line-clamp-2">
                                    {post.description}
                                </p>
                            {/if}

                            {#if post.tags && post.tags.length > 0}
                                <div class="flex flex-wrap gap-1.5 mt-1">
                                    {#each post.tags.slice(0, 5) as tag}
                                        <span class="text-xs px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-muted-foreground">
                                            #{tag}
                                        </span>
                                    {/each}
                                </div>
                            {/if}
                        </button>
                    {/each}
                </div>
            {:else}
                <!-- 默认空状态 / 初始状态 -->
                <div class="flex flex-col items-center justify-center py-20 text-muted-foreground/50">
                    <FileText size={64} class="mb-6 opacity-10" />
                    <p class="text-lg">{$t('blog.search.placeholder')}</p>
                </div>
            {/if}
        </div>

        <!-- 底部状态栏 -->
        {#if search.results.length > 0}
                <div class="px-6 py-3 border-t border-white/10 bg-white/30 dark:bg-black/30 backdrop-blur-md text-sm text-muted-foreground flex justify-between">
                <span>{search.results.length} results</span>
            </div>
        {/if}
    </LiquidGlass>
</div>
