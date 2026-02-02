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
	import BlogSidebar from '$lib/components/blog/sidebar/BlogSidebar.svelte';
	import BlogHome from '$lib/components/blog/home/BlogHome.svelte';
	import BlogViewer from '$lib/components/blog/viewer/BlogViewer.svelte';
	import CategoryNav from '$lib/components/layout/header/nav/CategoryNav.svelte';
    import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import { sidebarState, layoutState, headerState } from '$lib/state.svelte';
	import LoadingState from '$lib/components/ui/feedback/LoadingState.svelte';
	import { loadJson } from '$lib/utils/network/loading';
	import { t, locale } from '$lib/i18n/store';
	import BackButton from '$lib/components/blog/viewer/BackButton.svelte';
	import HeaderRssButton from '$lib/components/blog/header/HeaderRssButton.svelte';
	import { Calendar, Tag } from 'lucide-svelte';

	let { data } = $props<{ data: any }>();

	let posts = $state<any[]>([]);
	let fetchedCategories = $state<{ slug: string, title: string }[]>([]);

	$effect(() => {
		if (data.posts) posts = data.posts;
		if (data.categories) fetchedCategories = data.categories;
	});
	
	// 根据当前激活分类计算要显示的分类列表
	// 默认显示一级分类，如果当前分类有子分类则显示子分类
	let categoryList = $derived.by(() => {
		const allCategories = fetchedCategories.filter(c => c.slug !== 'All');
		
		// 获取分类标题的辅助函数
		const getCategoryTitle = (slug: string) => {
			const cat = fetchedCategories.find(c => c.slug === slug);
			return cat ? cat.title : slug;
		};

		// 判断是否为当前分类的子分类
		const getChildCategories = (parentSlug: string) => {
			return allCategories.filter(c => 
				c.slug.startsWith(parentSlug + '/') && 
				!c.slug.substring(parentSlug.length + 1).includes('/')
			);
		};
		
		// 获取一级分类（不含 /）
		const topLevelCategories = allCategories.filter(c => !c.slug.includes('/'));
		
		// 如果当前激活的是一级分类，检查是否有子分类
		if (activeCategory && activeCategory !== 'All') {
			const childCats = getChildCategories(activeCategory);
			if (childCats.length > 0) {
				// 有子分类：显示父级分类名称（作为返回项）+ 子分类
				return [
					{ slug: activeCategory, title: getCategoryTitle(activeCategory) },
					...childCats
				];
			}
		}
		
		// 如果当前激活的是二级分类，显示同级分类
		if (activeCategory && activeCategory.includes('/')) {
			const parentSlug = activeCategory.substring(0, activeCategory.lastIndexOf('/'));
			const siblingCats = getChildCategories(parentSlug);
			return [
				{ slug: parentSlug, title: getCategoryTitle(parentSlug) },
				...siblingCats
			];
		}
		
		// 默认：显示 "全部" + 一级分类
		return [
			{ slug: 'All', title: $t('blog.all') },
			...topLevelCategories
		];
	});
	let postMap = $state<Record<string, any>>({});
	
	let selectedPost = $state<any>(null);
	let activeCategory = $state('All'); // 当前激活的分类 slug
	let activeTagFromPath = $state(''); // 从路径中解析出的标签
	let loading = $state(true);
	let error = $state('');
	
	let sidebarListId = '';
    let navId = '';
    let backBtnId = '';
    let rssBtnId = '';

	onMount(async () => {
		try {
			// 如果数据还没在 load 函数中加载（例如直接从其他页面 client-side 导航过来且 load 没被预执行）
			// 或者我们需要确保最新数据
			if (posts.length === 0) {
				const [cats, allPosts] = await Promise.all([
					loadJson<{ slug: string, title: string }[]>('/posts/categories.json').catch(() => []),
					loadJson<any[]>('/posts/all.json')
				]);
				
				fetchedCategories = cats;
				posts = allPosts;
			}
			
			// 生成内存中的文章映射
			const map: Record<string, any> = {};
			posts.forEach(p => {
				const fullPath = p.category === 'Uncategorized' ? p.slug : `${p.category}/${p.slug}`;
				map[fullPath] = p;
				if (!map[p.slug]) map[p.slug] = p;
			});
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
                 const target = catSlug === 'All' ? '/blog/' : `/blog/${catSlug}/`;
                 goto(target);
            }
        }, 'blog-main-nav');

        // 将 RSS 按钮注入 Header 右侧
        rssBtnId = headerState.setRight(HeaderRssButton, {}, 'blog-rss');
	});

    // 监听状态变化，维护侧边栏列表显示
    $effect(() => {
        // 当处于列表模式（无选定文章）时，确保侧边栏初始化显示
        if (!selectedPost) {
            // 定义模式常量给 Sidebar 初始化使用
            const BLOG_MODES = [
                { id: 'year', label: 'blog.year', icon: Calendar },
                { id: 'tag', label: 'blog.tag', icon: Tag }
            ];

            // 如果我们也拥有当前的 sidebar，则更新参数
            if (sidebarListId && sidebarState.currentListId === sidebarListId) {
                sidebarState.updateList(sidebarListId, {
                    posts: posts,
                    activeCategory: activeCategory,
                    onSelect: (post: any) => selectPost(post)
                });
            } else {
                // 否则设置 list，并注入模式以保证切换按钮立即可用
                sidebarListId = sidebarState.setList(BlogSidebar, {
                    posts: posts,
                    activeCategory: activeCategory,
                    onSelect: (post: any) => selectPost(post)
                }, 'nav.list', BLOG_MODES);
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
                     const target = catSlug === 'All' ? '/blog/' : `/blog/${catSlug}/`;
                     goto(target);
                }
            };
        }
    });

    // 二级分类时显示返回按钮
    $effect(() => {
        const isInSubCategory = activeCategory && activeCategory !== 'All' && (
            activeCategory.includes('/') || 
            fetchedCategories.some(c => c.slug.startsWith(activeCategory + '/'))
        );
        
        if (isInSubCategory && !selectedPost) {
            // 在二级分类，注入返回按钮
            if (!backBtnId) {
                backBtnId = headerState.setLeft(BackButton, { 
                    onclick: () => goto('/blog/') 
                }, 'blog-back-nav');
            }
        } else {
            // 不在二级分类，清除返回按钮
            if (backBtnId) {
                headerState.clearLeft(backBtnId);
                backBtnId = '';
            }
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


	async function syncStateFromPath() {
		// 归一化路径，去除末尾斜杠以匹配数据中的 slug
		const currentPath = (page.params.path || '').replace(/\/$/, '');
		
		if (!currentPath) {
			// 根路径 /blog
			selectedPost = null;
			activeCategory = 'All';
			activeTagFromPath = '';
			return;
		}

		// 解析标签路径 (格式：tag/[tagSlug] 或 [category]/tag/[tagSlug])
		let tagFromUrl = '';
		let cleanPath = currentPath;
		if (currentPath.includes('/tag/')) {
			const parts = currentPath.split('/tag/');
			cleanPath = parts[0];
			// 确保移除标签后的末尾斜杠
			tagFromUrl = decodeURIComponent(parts[parts.length - 1]).replace(/\/$/, '');
		} else if (currentPath.startsWith('tag/')) {
			cleanPath = '';
			tagFromUrl = decodeURIComponent(currentPath.replace('tag/', '')).replace(/\/$/, '');
		}
		activeTagFromPath = tagFromUrl;

		// 检查是否为当前已加载的文章
		// 路径可能是 "category/slug" 或 "slug"
		// 我们的映射键严格为 "category/slug" 或 "slug"
		
			// 1. 尝试在 `posts` (最新 + 归档) 中查找
		// 支持多分类：检查文章的所有分类路径
		let foundPost: any = null;
		let matchedCategory = '';
		
		for (const p of posts) {
			const cats = p.categories || (p.category ? [p.category] : []);
			
			// 检查是否匹配任意一个分类路径
			for (const cat of cats) {
				const postPath = !cat || cat === 'Uncategorized' ? p.slug : `${cat}/${p.slug}`;
				if (postPath === cleanPath) {
					foundPost = p;
					matchedCategory = cat;
					break;
				}
			}
			
			// 也检查仅 slug 匹配（短链接）
			if (!foundPost && p.slug === cleanPath) {
				foundPost = p;
				matchedCategory = cats[0] || '';
			}
			
			if (foundPost) break;
		}

		// 2. 如果未找到，检查映射（旧文章的深层链接）
		if (!foundPost && postMap[currentPath]) {
			// 存在但未加载。由于现在初始加载 all.json，这不应该发生。
			// 如果由于某种原因还没加载到，可能需要等待或忽略。
			// BlogViewer 需要内容，通过 `post.file` 获取。
			// 处理元数据并确保 slug 正确。
			// 如果我们只是想查看它，可以构建一个临时对象。
			// 但“返回”按钮等的正确行为意味着我们要保持一致的状态。
			// 加载归档对侧边栏等更安全。
		}

		if (foundPost) {
			// 是一篇文章
			selectedPost = foundPost;
			// 使用 URL 中匹配的分类，保持 URL 不变
			activeCategory = matchedCategory || foundPost.categories?.[0] || foundPost.category || 'All';
		} else {
			// 是一个分类（或标签列表页）
			selectedPost = null;
			
			// 检查是否为有效的分类 slug (使用去除了 tag 段的路径)
			const catExists = categoryList.some(c => c.slug === cleanPath) || cleanPath === '' || cleanPath === 'All';
			if (catExists) {
				activeCategory = cleanPath || 'All';
			} else {
				activeCategory = cleanPath || 'All';
			}
		}
	}

	function selectPost(post: any) {
		selectedPost = post;
		const primaryCategory = post.categories?.[0] || post.category;
		const postPath = !primaryCategory || primaryCategory === 'Uncategorized' 
			? post.slug 
			: `${primaryCategory}/${post.slug}`;
		
		goto(`/blog/${postPath}/`, { 
			keepFocus: true, 
			noScroll: true,
			replaceState: false 
		});
		
		sidebarState.closeMobileDrawer();
	}

	function closePost() {
		selectedPost = null;
		// 如果可能，主要返回分类，否则返回根路径
		const target = activeCategory && activeCategory !== 'All' ? `/blog/${activeCategory}/` : '/blog/';
		goto(target, { keepFocus: true, noScroll: true });
	}

	beforeNavigate(({ to }) => {
		// 如果导航离开博客部分，立即清除导航
		// 以允许 Crossfade 与内容同步退出
		if (to && !to.url.pathname.startsWith('/blog')) {
            if (navId) {
                headerState.clearMiddle(navId);
                navId = ''; 
            }
            if (backBtnId) {
                headerState.clearLeft(backBtnId);
                backBtnId = '';
            }
            if (rssBtnId) {
                headerState.clearRight(rssBtnId);
                rssBtnId = '';
            }
		}
	});

	onDestroy(() => {
		// 只有当我们仍然拥有 sidebar 时才清除
		if (sidebarListId && sidebarState.currentListId === sidebarListId) {
			sidebarState.clearList(sidebarListId);
		}
        if (navId) headerState.clearMiddle(navId);
        if (backBtnId) headerState.clearLeft(backBtnId);
        if (rssBtnId) headerState.clearRight(rssBtnId);
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
                "name": selectedPost.author || "skyrocketing Hong",
                "url": "https://fuyaoskyrocket.ing" 
            }],
            "description": selectedPost.description
        }}
    />
{:else if activeCategory !== 'All'}
    <!-- 分类列表页 SEO -->
     <SeoHead 
        title={`${fetchedCategories.find(c => c.slug === activeCategory)?.title || activeCategory}`}
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
			activeTag={activeTagFromPath}
			categories={fetchedCategories}
		/>
	{/if}

	{#if selectedPost}
		<div class="relative w-full h-full overflow-hidden">
			<BlogViewer 
				post={selectedPost} 
				onClose={closePost} 
				categories={fetchedCategories}
			/>
		</div>
	{/if}
</div>

