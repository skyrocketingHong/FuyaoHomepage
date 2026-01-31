<script lang="ts">
	/**
	 * 博客主入口及详情页面 (多级动态路由)
	 * 
	 * 负责处理 /blog 下的所有路径：
	 * - /blog: 全部文章列表
	 * - /blog/[category]: 特定分类文章列表
	 * - /blog/[category]/[slug]: 文章详情页
	 * 
	 * 集成了 CategoryNav, BlogSidebar, BlogHome 和 BlogViewer 等业务组件。
	 */
	import { onMount, onDestroy, untrack } from 'svelte';
	import { page } from '$app/state';
	import { goto, beforeNavigate } from '$app/navigation';
	import BlogSidebar from '$lib/components/blog/List.svelte';
	import BlogHome from '$lib/components/blog/Home.svelte';
	import BlogViewer from '$lib/components/blog/Content.svelte';
	import CategoryNav from '$lib/components/layout/header/nav/CategoryNav.svelte';
    import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import { sidebarState, layoutState, headerState } from '$lib/state.svelte';
	import LoadingState from '$lib/components/ui/feedback/LoadingState.svelte';
	import { loadJson } from '$lib/utils/network/loading';
	import { t } from '$lib/i18n/store';

	let posts = $state<any[]>([]);
	let fetchedCategories = $state<{ slug: string, title: string }[]>([]);
	let categoryList = $derived([
		{ slug: 'All', title: $t('blog.all') },
		...fetchedCategories.filter(c => c.slug !== 'All')
	]);
	let postMap = $state<Record<string, any>>({});
	
	let selectedPost = $state<any>(null);
	let activeCategory = $state('All'); // 当前激活的分类 slug
	let loading = $state(true);
	let error = $state('');
	
	// 标志位
	let archiveLoaded = $state(false);
	
	let sidebarListId = '';
    let navId = '';

	onMount(async () => {
		try {
			// 1. 并行加载分类、最新文章及文章映射
			const [cats, latest, map] = await Promise.all([
				loadJson<{ slug: string, title: string }[]>('/posts/categories.json').catch(() => []),
				loadJson<any[]>('/posts/latest.json'),
				loadJson<Record<string, any>>('/posts/map.json').catch(() => ({}))
			]);
			
			fetchedCategories = cats;
			posts = latest;
			postMap = map;
			
			syncStateFromPath();
		} catch (e) {
			console.error('Failed to load blog data', e);
			error = 'Failed to load blog posts';
		} finally {
			loading = false;
		}

        // 将 CategoryNav 注入 Header（从子组件提升）
        navId = headerState.setMiddle(CategoryNav, {
            categories: categoryList,
            activeCategory: activeCategory, // slug
            onSelect: (catSlug: string) => {
                 const target = catSlug === 'All' ? '/blog' : `/blog/${catSlug}`;
                 goto(target);
            }
        }, 'blog-main-nav');
	});

    // 监听状态变化，维护侧边栏列表显示
    $effect(() => {
        // 当处于列表模式（无选定文章）且数据已加载时，确保侧边栏显示文章列表
        if (!loading && !selectedPost && posts.length > 0) {
            // 如果我们也拥有当前的 sidebar，则更新数据而不是重建
            if (sidebarListId && sidebarState.currentListId === sidebarListId) {
                sidebarState.updateList(sidebarListId, {
                    posts: posts,
                    onSelect: (post: any) => selectPost(post)
                });
            } else {
                // 否则重新设置 list
                sidebarListId = sidebarState.setList(BlogSidebar, {
                    posts: posts,
                    onSelect: (post: any) => selectPost(post)
                }, 'nav.list');
            }
        }
    });

    // 状态变更时更新 Header 属性
    $effect(() => {
        if (navId) {
            headerState.middleProps = {
                categories: categoryList,
                activeCategory: activeCategory,
                onSelect: (catSlug: string) => {
                     const target = catSlug === 'All' ? '/blog' : `/blog/${catSlug}`;
                     goto(target);
                }
            };
        }
    });

	// 响应 URL 变化
	$effect(() => {
		const currentPath = page.params.path;
		// 确保初始加载完成
		if (!loading && posts.length > 0) {
			untrack(() => {
				syncStateFromPath();
			});
		}
	});

	// 控制可滚动状态 和 Header 扩展状态
	$effect(() => {
		layoutState.setScrollable(true);
        // Blog 页面有 CategoryNav，在移动端会挤占头部空间，自动逻辑 MainContent 会处理
		
        return () => {
            layoutState.setScrollable(true);
        };
	});

	async function loadArchive() {
		if (archiveLoaded) return;
		try {
			const archive = await loadJson<any[]>('/posts/archive.json');
			posts = [...posts, ...archive];
			archiveLoaded = true;
			// 使用完整列表更新侧边栏
			// 可以进一步优化，但重新注入是安全的
			sidebarState.updateList(sidebarListId, { posts: posts });
		} catch (e) {
			console.error('Failed to load archive', e);
		}
	}

	async function syncStateFromPath() {
		const currentPath = page.params.path;
		
		if (!currentPath) {
			// 根路径 /blog
			selectedPost = null;
			activeCategory = 'All';
			return;
		}

		// 检查是否为当前已加载的文章
		// 路径可能是 "category/slug" 或 "slug"
		// 我们的映射键严格为 "category/slug" 或 "slug"
		
		// 1. 尝试在 `posts` (最新 + 归档) 中查找
		let foundPost = posts.find(p => {
			const postPath = p.category === 'Uncategorized' ? p.slug : `${p.category}/${p.slug}`;
			// 如果用户通过短链接导航，也要检查严格 slug 匹配（尽管我们要首选规范路径）
			return postPath === currentPath || p.slug === currentPath;
		});

		// 2. 如果未找到，检查映射（旧文章的深层链接）
		if (!foundPost && postMap[currentPath]) {
			// 存在但未加载。
			// 选项 A：立即加载归档
			await loadArchive();
			// 重新查找
			foundPost = posts.find(p => {
				const postPath = p.category === 'Uncategorized' ? p.slug : `${p.category}/${p.slug}`;
				return postPath === currentPath || p.slug === currentPath;
			});
			
			// 选项 B：使用映射中的最小数据？
			// BlogViewer 需要内容，通过 `post.file` 获取。
			// `map.json` 包含 `file`。
			// 如果我们只是想查看它，可以构建一个临时对象。
			// 但“返回”按钮等的正确行为意味着我们要保持一致的状态。
			// 加载归档对侧边栏等更安全。
		}

		if (foundPost) {
			// 是一篇文章
			selectedPost = foundPost;
			activeCategory = foundPost.category || 'All';
		} else {
			// 是一个分类（或无效）
			selectedPost = null;
			
			// 检查是否为有效的分类 slug
			const catExists = categoryList.some(c => c.slug === currentPath);
			if (catExists) {
				activeCategory = currentPath;
			} else {
				// 无效路径或未知分类，默认为 全部/主页
				// 或者处理 404？
				// 暂时回退到 全部
				// 但让我们保持原样以允许“虚拟”分类（如果有）
				activeCategory = currentPath;
			}
		}
	}

	function selectPost(post: any) {
		selectedPost = post;
		const postPath = post.category === 'Uncategorized' 
			? post.slug 
			: `${post.category}/${post.slug}`;
		
		goto(`/blog/${postPath}`, { 
			keepFocus: true, 
			noScroll: true,
			replaceState: false 
		});
		
		sidebarState.closeMobileDrawer();
	}

	function closePost() {
		selectedPost = null;
		// 如果可能，主要返回分类，否则返回根路径
		const target = activeCategory && activeCategory !== 'All' ? `/blog/${activeCategory}` : '/blog';
		goto(target, { keepFocus: true, noScroll: true });
	}

	beforeNavigate(({ to }) => {
		// 如果导航离开博客部分，立即清除导航
		// 以允许 Crossfade 与内容同步退出
		if (to && !to.url.pathname.startsWith('/blog')) {
            if (navId) {
                headerState.clearMiddle(navId);
                // 重置 navId 以便 onDestroy 不会再次尝试清除（尽管是安全的）
                navId = ''; 
            }
		}
	});

	onDestroy(() => {
		sidebarState.clearList(sidebarListId);
        if (navId) headerState.clearMiddle(navId);
	});
</script>

   {#if selectedPost}
    <!-- 文章详情页 SEO -->
    <SeoHead 
        title={selectedPost.title}
        description={selectedPost.description}
        keywords={selectedPost.tags}
        image={selectedPost.cover}
        type="article"
        author={selectedPost.author}
        jsonLd={{
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": selectedPost.title,
            "image": selectedPost.cover ? [selectedPost.cover] : [],
            "datePublished": selectedPost.date,
            "dateModified": selectedPost.lastmod || selectedPost.date,
            "author": [{
                "@type": "Person",
                "name": selectedPost.author || "Skyrocketing Hong",
                "url": "https://fuyaoskyrocket.ing" 
            }],
            "description": selectedPost.description
        }}
    />
{:else if activeCategory !== 'All'}
    <!-- 分类列表页 SEO -->
     <SeoHead 
        title={`${categoryList.find(c => c.slug === activeCategory)?.title || activeCategory}`}
        description={`Posts in category ${activeCategory}`}
     />
{/if}

<div class="relative w-full">
	{#if loading || error}
		<div class="flex h-full w-full items-center justify-center">
			<LoadingState {loading} {error} />
		</div>
	{:else if !selectedPost}
		<!-- 博客主页视图 (Apple Newsroom 风格) -->
		<BlogHome 
			{posts} 
			{activeCategory} 
			hasMore={!archiveLoaded}
			onLoadMore={loadArchive}
		/>
	{/if}

	{#if selectedPost}
		<div class="relative w-full h-full overflow-hidden">
			<BlogViewer 
				post={selectedPost} 
				onClose={closePost} 
			/>
		</div>
	{/if}
</div>

