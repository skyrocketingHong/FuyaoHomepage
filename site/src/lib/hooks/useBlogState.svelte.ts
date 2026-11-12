/**
 * 博客状态管理 Hook
 *
 * 集中管理博客页面的状态、Header/Sidebar 注入、路由同步等逻辑。
 *
 * 调用示例：
 * ```typescript
 * import { useBlogState } from '$lib/hooks/useBlogState.svelte';
 *
 * const blog = useBlogState();
 *
 * onMount(() => {
 *   blog.setInitialData(data.posts, data.categories);
 *   blog.init().then(() => blog.syncStateFromPath());
 * });
 *
 * $effect(() => {
 *   const _ = page.params;
 *   if (!blog.loading && blog.posts.length > 0) {
 *     blog.syncStateFromPath();
 *   }
 * });
 *
 * onDestroy(() => blog.cleanup());
 * ```
 */
import { page } from '$app/state';
import { goto, beforeNavigate } from '$app/navigation';
import { resolve } from '$app/paths';
import BlogSidebar from '$lib/components/blog/sidebar/Sidebar.svelte';
import CategoryNav from '$lib/components/layout/nav/CategoryNav.svelte';
import BackButton from '$lib/components/blog/viewer/BackButton.svelte';
import HeaderBlogActions from '$lib/components/blog/header/Actions.svelte';
import { sidebarState, headerState } from '$lib/stores/app.svelte';
import { loadJson } from '$lib/utils/network/loading';
import { t } from '$lib/i18n/store';
import { get } from 'svelte/store';
import { Calendar, Tag } from 'lucide-svelte';
import type { SidebarViewMode } from '$lib/types/sidebar';
import { getBlogListUrl, getPostUrl } from '$lib/utils/domain/blog';
import { getBlogPageKind } from '$lib/config/index';
import { findBlogPostForPath, getBlogPostCategories } from '$lib/utils/domain/blogRoute';

export interface BlogPost {
	slug: string;
	title: string;
	date: string;
	lastmod?: string;
	category?: string;
	categories?: string[];
	tags?: string[];
	cover?: string;
	description?: string;
	author?: string;
	[key: string]: unknown;
}

export interface Category {
	slug: string;
	title: string;
}

export function useBlogState(initialPosts: BlogPost[] = [], initialCategories: Category[] = []) {
	let posts = $state<BlogPost[]>(initialPosts);
	let categories = $state<Category[]>(initialCategories);
	let selectedPost = $state<BlogPost | null>(null);
	let activeCategory = $state('All');
	let activeTagFromPath = $state('');
	let loading = $state(initialPosts.length === 0);
	let error = $state('');
	let isSearchOpen = $state(false);

	let sidebarListId = '';
	let navId = '';
	let backBtnId = '';
	let actionsId = '';

	// 分类列表计算属性
	const categoryList = $derived.by(() => {
		const allCategories = categories.filter((c) => c.slug !== 'All');

		const getCategoryTitle = (slug: string) => {
			const cat = categories.find((c) => c.slug === slug);
			return cat ? cat.title : slug;
		};

		const getChildCategories = (parentSlug: string) => {
			return allCategories.filter(
				(c) =>
					c.slug.startsWith(parentSlug + '/') &&
					!c.slug.substring(parentSlug.length + 1).includes('/')
			);
		};

		const topLevelCategories = allCategories.filter((c) => !c.slug.includes('/'));

		if (activeCategory && activeCategory !== 'All') {
			const childCats = getChildCategories(activeCategory);
			if (childCats.length > 0) {
				return [{ slug: activeCategory, title: getCategoryTitle(activeCategory) }, ...childCats];
			}
		}

		if (activeCategory && activeCategory.includes('/')) {
			const parentSlug = activeCategory.substring(0, activeCategory.lastIndexOf('/'));
			const siblingCats = getChildCategories(parentSlug);
			return [{ slug: parentSlug, title: getCategoryTitle(parentSlug) }, ...siblingCats];
		}

		return [{ slug: 'All', title: get(t)('blog.all') }, ...topLevelCategories];
	});

	// 设置初始数据
	function setInitialData(initialPosts: BlogPost[], initialCategories: Category[]) {
		posts = initialPosts;
		categories = initialCategories;
	}

	// 同步路由状态
	function syncStateFromPath() {
		const currentPath = (page.params.path || '').replace(/^\/+|\/+$/g, '');
		const pageKind = getBlogPageKind(page.data, page.route.id);

		if (pageKind === 'blog-search') {
			isSearchOpen = true;
			selectedPost = null;
			activeCategory = 'All';
			activeTagFromPath = '';
			return;
		}
		isSearchOpen = false;

		if (pageKind === 'blog-list' || !currentPath) {
			selectedPost = null;
			activeCategory = 'All';
			activeTagFromPath = '';
			return;
		}

		let tagFromUrl = '';
		let cleanPath = currentPath;
		if (pageKind === 'blog-tag') {
			const markerIndex = currentPath.lastIndexOf('/tag/');
			const rootTag = currentPath.startsWith('tag/');
			cleanPath = rootTag ? '' : currentPath.slice(0, markerIndex);
			tagFromUrl = decodeURIComponent(
				rootTag ? currentPath.slice('tag/'.length) : currentPath.slice(markerIndex + '/tag/'.length)
			);
		}
		activeTagFromPath = tagFromUrl;

		if (pageKind !== 'blog-article') {
			selectedPost = null;
			activeCategory = cleanPath || 'All';
			return;
		}

		const foundPost = findBlogPostForPath(currentPath, posts);

		if (foundPost) {
			const postCategories = getBlogPostCategories(foundPost);
			const matchedCategory =
				postCategories.find((category) => `${category}/${foundPost.slug}` === currentPath) ||
				postCategories[0] ||
				'';
			selectedPost = foundPost;
			activeCategory = matchedCategory || foundPost.categories?.[0] || foundPost.category || 'All';
		} else {
			selectedPost = null;
			activeCategory = cleanPath || 'All';
		}
	}

	// 选择文章
	function selectPost(post: BlogPost) {
		selectedPost = post;
		void goto(resolve(getPostUrl({ ...post, category: post.category ?? '' }, activeCategory)), {
			keepFocus: true,
			noScroll: true,
			replaceState: false
		});

		sidebarState.closeMobileDrawer();
	}

	// 关闭文章
	function closePost() {
		selectedPost = null;
		void goto(resolve(getBlogListUrl(activeCategory)), { keepFocus: true, noScroll: true });
	}

	// 初始化
	async function init() {
		try {
			if (posts.length === 0) {
				const [cats, allPosts] = await Promise.all([
					loadJson<Category[]>('/posts/categories.json').catch(() => []),
					loadJson<BlogPost[]>('/posts/all.json')
				]);

				categories = cats;
				posts = allPosts;
			}

			syncStateFromPath();
		} catch (e) {
			console.error('Failed to load blog data:', e);
			error = get(t)('blog.fetch_error');
		} finally {
			loading = false;
		}

		// 注入 Header 组件
		navId = headerState.setMiddle(
			CategoryNav,
			{
				categories: categoryList,
				activeCategory: activeCategory,
				onSelect: (catSlug: string) => {
					void goto(resolve(getBlogListUrl(catSlug)));
				}
			},
			'blog-main-nav'
		);

		actionsId = headerState.setRight(
			HeaderBlogActions,
			{
				onOpenSearch: () => void goto(resolve('/blog/search/'))
			},
			'blog-actions'
		);
	}

	// 更新侧边栏
	function updateSidebar() {
		if (!selectedPost) {
			const BLOG_MODES = [
				{ id: 'year', label: 'blog.year', icon: Calendar },
				{ id: 'tag', label: 'blog.tag', icon: Tag }
			];

			if (sidebarListId && sidebarState.currentListId === sidebarListId) {
				sidebarState.updateList(sidebarListId, {
					posts: posts,
					activeCategory: activeCategory,
					onSelect: (post: BlogPost) => selectPost(post)
				});
			} else {
				sidebarListId = sidebarState.setList(
					BlogSidebar,
					{
						posts: posts,
						activeCategory: activeCategory,
						onSelect: (post: BlogPost) => selectPost(post)
					},
					'nav.list',
					BLOG_MODES as SidebarViewMode[]
				);
			}
		}
	}

	// 更新 Header
	function updateHeader() {
		if (navId) {
			headerState.updateMiddle(navId, {
				categories: categoryList,
				activeCategory: activeCategory,
				onSelect: (catSlug: string) => {
					void goto(resolve(getBlogListUrl(catSlug)));
				}
			});
		}
	}

	// 更新返回按钮
	function updateBackButton() {
		const isInSubCategory =
			activeCategory &&
			activeCategory !== 'All' &&
			(activeCategory.includes('/') ||
				categories.some((c) => c.slug.startsWith(activeCategory + '/')));

		if (isInSubCategory && !selectedPost) {
			if (!backBtnId) {
				backBtnId = headerState.setLeft(
					BackButton,
					{
						onclick: () => void goto(resolve('/blog/'))
					},
					'blog-back-nav'
				);
			}
		} else {
			if (backBtnId) {
				headerState.clearLeft(backBtnId);
				backBtnId = '';
			}
		}
	}

	// 清理
	function cleanup() {
		if (sidebarListId && sidebarState.currentListId === sidebarListId) {
			sidebarState.clearList(sidebarListId);
		}
		if (navId) headerState.clearMiddle(navId);
		if (backBtnId) headerState.clearLeft(backBtnId);
		if (actionsId) headerState.clearRight(actionsId);
	}

	if (initialPosts.length > 0) {
		syncStateFromPath();
		loading = false;
	}

	// 导航离开博客时清理
	beforeNavigate(({ to }) => {
		if (to && !to.url.pathname.startsWith('/blog')) {
			isSearchOpen = false;
			if (navId) {
				headerState.clearMiddle(navId);
				navId = '';
			}
			if (backBtnId) {
				headerState.clearLeft(backBtnId);
				backBtnId = '';
			}
			if (actionsId) {
				headerState.clearRight(actionsId);
				actionsId = '';
			}
		}
	});

	return {
		// 状态
		get posts() {
			return posts;
		},
		get categories() {
			return categories;
		},
		get selectedPost() {
			return selectedPost;
		},
		get activeCategory() {
			return activeCategory;
		},
		get activeTagFromPath() {
			return activeTagFromPath;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		get isSearchOpen() {
			return isSearchOpen;
		},
		get categoryList() {
			return categoryList;
		},

		// 方法
		setInitialData,
		init,
		syncStateFromPath,
		selectPost,
		closePost,
		updateSidebar,
		updateHeader,
		updateBackButton,
		cleanup
	};
}
