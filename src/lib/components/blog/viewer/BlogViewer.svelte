<script lang="ts">
	/**
	 * 博客文章阅读器组件
	 * 
	 * 负责处理 Markdown 加载、解析、侧边栏 TOC 注入以及滚动监听逻辑。
	 * 
	 * @prop post - 当前展示的文章元数据对象
	 * @prop onClose - 关闭阅读器时的回调
	 * @prop categories - 全部分类配置列表
	 */
	import LoadingState from '$lib/components/ui/feedback/LoadingState.svelte';
	import { slugify } from '$lib/utils/format/slugify';
	import yaml from 'js-yaml';
	import { t } from '$lib/i18n/store';
	import { tick, untrack, onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import { sidebarState, headerState } from '$lib/state.svelte';
	import { loadText } from '$lib/utils/network/loading';
    import { getCategoryTitle } from '$lib/utils/domain/blog';
	
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
    import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	
	import BlogHeader from './BlogHeader.svelte';
    import BlogTOC from './BlogTOC.svelte';
    import BackButton from './BackButton.svelte';
    
    // 异步加载渲染器以优化首屏
    const MarkdownRendererPromise = import('./MarkdownRenderer.svelte');

	let { post, onClose, categories = [] } = $props<{ 
		post: any; 
		onClose: () => void;
		categories: { slug: string; title: string }[];
	}>();

	let content = $state('');
	let loading = $state(true);
	let loadedFile = $state('');
	let toc: { id: string; text: string; depth: number }[] = $state([]);
    let tocListId = '';
    let leftActionId = '';
    let additionalMetadata = $state<any>({});
    
	// 聚合文章元数据
	let displayPost = $derived.by(() => {
        const metadata = additionalMetadata;
        const cats = post.categories || (post.category ? [post.category] : []);
        return {
            ...post,
            ...metadata,
            date: metadata.date ? new Date(metadata.date).toISOString().split('T')[0] : post.date,
            lastmod: metadata.lastmod ? new Date(metadata.lastmod).toISOString().split('T')[0] : (post.lastmod || ''),
            categoryTitles: cats.map((c: string) => ({ slug: c, title: getCategoryTitle(c, categories) })),
            categories: cats,
            tags: metadata.tags || post.tags || []
        };
    });
    
	$effect(() => {
		if (post) {
			loadContent(post);
		}
	});

    // 头部与侧边栏注入
    $effect(() => {
		if (onClose) {
			leftActionId = headerState.setLeft(BackButton, { onclick: onClose }, 'blog-back');
		}
		return () => {
			if (leftActionId) headerState.clearLeft(leftActionId);
		};
    });

    $effect(() => {
        if (toc.length > 0) {
            tocListId = sidebarState.setList(BlogTOC, {
                toc: toc,
                onItemClick: (id: string) => {
                    handleTocClick(id);
                    sidebarState.closeMobileDrawer();
                },
                activeId: activeHeaderId
            }, 'blog.toc');
        } else if (tocListId && sidebarState.currentListId === tocListId) {
            sidebarState.clearList(tocListId);
            tocListId = '';
        }
    });
    
    onDestroy(() => {
        if (tocListId && sidebarState.currentListId === tocListId) {
            sidebarState.clearList(tocListId);
        }
		if (leftActionId) {
			headerState.clearLeft(leftActionId);
		}
    });

	async function loadContent(currentPost: typeof post) {
		if (currentPost.file === loadedFile) {
			const hash = untrack(() => page.url.hash);
			if (hash) {
				await tick();
				handleTocClick(slugify(decodeURIComponent(hash.substring(1))));
			}
			return;
		}

		loading = true;
		if (typeof window !== 'undefined') window.scrollTo(0, 0);
        
		toc = [];
		try {
			const text = await loadText(`/posts/${currentPost.file}`);
			let cleanText = text;
			
			const frontmatterMatch = text.match(/^\uFEFF?---([\s\S]+?)---/);
			if (frontmatterMatch) {
				try {
					additionalMetadata = yaml.load(frontmatterMatch[1]) as any;
					cleanText = text.replace(/^\uFEFF?---[\s\S]+?---\s*/, '');
				} catch (e) {
					additionalMetadata = {};
				}
			} else {
                additionalMetadata = {};
            }

			content = cleanText; 
			loadedFile = currentPost.file;
		} catch (e) {
			content = `<p class="text-red-400">${$t('blog.loading_error')}</p>`;
		} finally {
			loading = false;
			const hash = untrack(() => page.url.hash);
			if (hash) {
				await tick();
				handleTocClick(slugify(decodeURIComponent(hash.substring(1))));
			}
		}
	}

	async function handleTocClick(id: string, retryCount = 0) {
		await tick();
		const el = document.getElementById(id);
		
		if (el) {
            isManualNavigation = true;
			el.scrollIntoView({ behavior: 'smooth', block: 'start' });

			const currentUrl = new URL(window.location.href);
			if (currentUrl.hash !== `#${id}`) {
				currentUrl.hash = `#${id}`;
				replaceState(currentUrl, page.state);
			}
            
            activeHeaderId = id;
            updateSidebar();
            setTimeout(() => { isManualNavigation = false; }, 1000);
		} else if (retryCount < 50) {
			setTimeout(() => handleTocClick(id, retryCount + 1), 100);
		}
	}

    let activeHeaderId = $state('');
    let isManualNavigation = false;
    let observer: IntersectionObserver;

    function updateSidebar() {
        if (tocListId) {
             sidebarState.updateList(tocListId, {
                toc: toc,
                onItemClick: (id: string) => {
                    handleTocClick(id);
                    sidebarState.closeMobileDrawer();
                },
                activeId: activeHeaderId
            });
        }
    }

    $effect(() => {
        if (!toc || toc.length === 0 || typeof window === 'undefined') return;
        
        tick().then(() => {
            if (observer) observer.disconnect();
            observer = new IntersectionObserver((entries) => {
                if (isManualNavigation) return;
                const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
                if (visible.length > 0) {
                     const targetId = visible[0].target.id;
                     if (targetId !== activeHeaderId) {
                         activeHeaderId = targetId;
                         updateSidebar();
                     }
                }
            }, {
                rootMargin: '-10% 0px -80% 0px',
                threshold: 0
            });

            toc.forEach(item => {
                const el = document.getElementById(item.id);
                if (el) observer.observe(el);
            });
        });
        
        return () => { if (observer) observer.disconnect(); };
    });
</script>

<div class="relative flex min-h-0 flex-1 flex-col mx-auto max-w-[980px] xl:max-w-[1100px]"> 
    <div class="relative w-full justify-center">
        <LiquidGlass opaque={true} class="w-full" showLighting={false} showGloss={false}>
            {#if loading}
                <div class="flex h-[50vh] items-center justify-center w-full">
                    <LoadingState loading={true} />
                </div>
            {:else}
                <Crossfade key={displayPost.file} class="w-full">
                    <BlogHeader 
                        title={displayPost.title} 
                        date={displayPost.date} 
                        lastmod={displayPost.lastmod}
                        categories={displayPost.categoryTitles || []} 
                        subtitle={displayPost.description}
                        tags={displayPost.tags}
                    />
                    <div>
                        {#await MarkdownRendererPromise then module}
                            <module.default source={content} bind:toc={toc} />
                        {:catch error}
                            <p class="text-red-400">{$t('blog.renderer_load_error')}</p>
                        {/await}
                    </div>
                </Crossfade>
            {/if}
        </LiquidGlass>
        <div class="mx-auto w-full px-5 md:px-0"> 
            <div class="text-center">
                <LiquidGlass 
                    tag="button"
                    class="!w-auto inline-flex mt-2 px-4 py-2 rounded-full text-foreground transition-colors"
                    onclick={onClose}
                >
                    <span>{$t('blog.back_to_list')}</span>
                </LiquidGlass>
            </div>
        </div>
    </div>
</div>
