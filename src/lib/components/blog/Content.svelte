<script lang="ts">
	/**
	 * 博客文章阅读器组件
	 * 
	 * 负责从远程加载文章 Markdown 内容，解析并渲染，同时管理 TOC (目录) 及 Scroll Spy 效果。
	 * 
	 * @prop post - 当前需要显示的文章元数据
	 * @prop onClose - 关闭阅读器并返回列表的回调函数
	 */
	import LoadingState from '$lib/components/ui/feedback/LoadingState.svelte';
	import { slugify } from '$lib/utils/format/slugify';
	import yaml from 'js-yaml';
	import { t, locale } from '$lib/i18n/store';
	import { tick, untrack, onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import { sidebarState, headerState } from '$lib/state.svelte';
	import { loadText } from '$lib/utils/network/loading';
	
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
    import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	
	import BlogHeader from './viewer/Header.svelte';
	import MarkdownRenderer from './viewer/MarkdownRenderer.svelte';
	import BlogTOC from './viewer/TOC.svelte';
	import BackButton from './viewer/Button.svelte';

	let { post, onClose } = $props<{ post: any; onClose: () => void }>();

	let content = $state('');
	let loading = $state(true);
	let loadedFile = $state('');
	// 已移除 scrollContainerRef，因为我们使用窗口滚动
	let toc: { id: string; text: string; depth: number }[] = $state([]);
    let tocListId = '';
    let leftActionId = '';
    
	
	let displayPost = $state({ ...untrack(() => post) });

	$effect(() => {
		if (post) {
			displayPost = post;
			loadContent(post);
		}
	});

    // 将返回按钮注入头部左侧
    $effect(() => {
		if (onClose) {
			leftActionId = headerState.setLeft(BackButton, { onclick: onClose }, 'blog-back');
		}
		return () => {
			if (leftActionId) headerState.clearLeft(leftActionId);
		};
    });

    // 2. 将 TOC 注入侧边栏
    $effect(() => {
        if (toc.length > 0) {
            tocListId = sidebarState.setList(BlogTOC, {
                toc: toc,
                onItemClick: (id: string) => {
                    handleTocClick(id);
                    sidebarState.closeMobileDrawer();
                },
                variant: 'desktop'
            }, 'blog.toc'); // 'blog.toc' 翻译键
        } else {
             if (tocListId) sidebarState.clearList(tocListId);
        }
    });
    
    onDestroy(() => {
        if (tocListId) {
            sidebarState.clearList(tocListId);
        }
		// 左侧按钮清理通过 effect return 处理，但在此处进行健壮性清理也有好处
		if (leftActionId) {
			headerState.clearLeft(leftActionId);
		}
    });

	// Removed MarkdownIt import locally as it is handled in MarkdownRenderer
	
	async function loadContent(currentPost: typeof post) {
		if (currentPost.file === loadedFile) {
			const hash = untrack(() => page.url.hash);
			if (hash) {
				await tick();
				const id = slugify(decodeURIComponent(hash.substring(1)));
				handleTocClick(id);
			}
			return;
		}

		loading = true;
		if (typeof window !== 'undefined') {
			window.scrollTo(0, 0);
		}
        
		toc = [];
		try {
			const text = await loadText(`/posts/${currentPost.file}`);
			let cleanText = text;
			
			// 解析 Frontmatter
			const frontmatterMatch = text.match(/^\uFEFF?---([\s\S]+?)---/);
			let additionalMetadata: any = {};
			if (frontmatterMatch) {
				try {
					additionalMetadata = yaml.load(frontmatterMatch[1]) as any;
					cleanText = text.replace(/^\uFEFF?---[\s\S]+?---\s*/, '');
				} catch (e) {
					console.warn('Failed to parse frontmatter:', e);
					cleanText = text.replace(/^\uFEFF?---[\s\S]+?---\s*/, '');
				}
			}

			// 更新显示状态
			displayPost = {
				...currentPost,
				...additionalMetadata,
				date: additionalMetadata.date ? new Date(additionalMetadata.date).toISOString().split('T')[0] : currentPost.date,
				categoryTitle: currentPost.categoryTitle || currentPost.category,
				category: currentPost.category,
				tags: additionalMetadata.tags || currentPost.tags || []
			};

			// TOC 生成逻辑目前已移交至 MarkdownRenderer 内部处理
			// 这里仅传递原始 Markdown 内容
			content = cleanText; 
			loadedFile = currentPost.file;
		} catch (e) {
			console.error(e);
			content = `<p class="text-red-400">${$t('blog.loading_error')}</p>`;
		} finally {
			loading = false;
			const hash = untrack(() => page.url.hash);
			if (hash) {
				await tick();
				const id = slugify(decodeURIComponent(hash.substring(1)));
				handleTocClick(id);
			}
		}
	}

	async function handleTocClick(id: string, retryCount = 0) {
		await tick();
		const el = document.getElementById(id);
		
		if (el) {
			// 跳转时暂时停用观察者，防止滚动过程中触发其它的激活状态跳变
            isManualNavigation = true;
			el.scrollIntoView({ behavior: 'smooth', block: 'start' });

			const currentUrl = new URL(window.location.href);
			const expectedHash = `#${id}`;
			
			if (currentUrl.hash !== expectedHash) {
				currentUrl.hash = expectedHash;
				replaceState(currentUrl, page.state);
			}
            
            // 手动设置激活状态
            activeHeaderId = id;
            updateSidebar();
            
            // 滚动动画结束后（约 1 秒）重新启用观察者
            setTimeout(() => {
                isManualNavigation = false;
            }, 1000);
		} else if (retryCount < 50) {
			setTimeout(() => handleTocClick(id, retryCount + 1), 100);
		}
	}

    // 滚动监测相关状态
    let activeHeaderId = $state('');
    let isManualNavigation = false;
    let observer: IntersectionObserver;

    function updateSidebar() {
        if (tocListId) {
             sidebarState.updateList(tocListId, {
                toc: toc, // 保持 TOC 同步更新
                onItemClick: (id: string) => {
                    handleTocClick(id);
                    sidebarState.closeMobileDrawer();
                },
                variant: 'desktop',
                activeId: activeHeaderId
            });
        }
    }

    $effect(() => {
        // 当 TOC 改变或内容加载时运行此 effect
        if (!toc || toc.length === 0 || typeof window === 'undefined') return;
        
        // 等待下一帧以确保 DOM 已渲染
        tick().then(() => {
             // 清理之前的观察者
            if (observer) observer.disconnect();

            observer = new IntersectionObserver((entries) => {
                if (isManualNavigation) return;

                // 寻找第一个可见的且相交的目录项
                // 策略：激活正在阅读的标题。
                // 我们在视口顶部 10% 到 20% 的区域创建了一个“扫描线”。
                
                // 简单逻辑：如果有一个条目相交，它就是候选者。
                const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
                
                if (visible.length > 0) {
                     // 获取视口顶部的元素。由于 entries 不一定按 DOM 顺序排列，
                     // 但我们通过 narrow rootMargin 仅捕获当前阅读位置。
                     const targetId = visible[0].target.id;
                     if (targetId !== activeHeaderId) {
                         activeHeaderId = targetId;
                         updateSidebar();
                     }
                }
            }, {
                rootMargin: '-10% 0px -80% 0px', // 激活区域为屏幕顶部 10% 处
                threshold: 0
            });

            toc.forEach(item => {
                const el = document.getElementById(item.id);
                if (el) observer.observe(el);
            });
        });
        
        return () => {
            if (observer) observer.disconnect();
        };
    });
</script>

<div class="relative flex min-h-0 flex-1 flex-col w-full h-full bg-transparent"> 
    <!-- 主要内容区域 -->
    <div class="relative w-full justify-center">
        <!-- 文章内容（流式文档，由 MainContent 滚动） -->
        <!-- 文章内容（流式文档，由 MainContent 滚动） -->
        <div class="mx-auto w-full px-5 md:px-0"> 
            {#if loading}
                <div class="flex h-[50vh] items-center justify-center w-full">
                    <LoadingState loading={true} />
                </div>
            {:else}
                <Crossfade key={displayPost.file} class="w-full">
                    <BlogHeader 
                        title={displayPost.title} 
                        date={displayPost.date} 
                        category={displayPost.categoryTitle || displayPost.category} 
                        subtitle={displayPost.description}
                    />
                    <!-- 水平分隔符由头部或组件处理 -->
                    <div>
                        <MarkdownRenderer source={content} bind:toc={toc} />
                    </div>
                    
                    <!-- 页脚/底部导航可放此处 -->
                    <div class="text-center">
                        <LiquidGlass 
                            tag="button"
                            class="w-auto inline-block group mt-2 px-4 py-2 rounded-full font-bold text-foreground hover:bg-secondary/50 transition-colors"
                            onclick={onClose}
                        >
                            <Crossfade key={'viewall-' + $locale} class="inline-grid">
                                <span>{$t('blog.back_to_list')}</span>
                            </Crossfade>
                        </LiquidGlass>
                    </div>
                </Crossfade>
            {/if}
        </div>
    </div>
</div>
