<script lang="ts">
	/**
	 * 博客侧边栏归档列表组件
	 * 
	 * 将文章列表按年份分组并以树形结构展示。
	 * 
	 * @prop posts - 博客文章列表
	 * @prop onSelect - 选中文章时的回调函数
	 */
	import Marquee from '$lib/components/ui/display/Marquee.svelte';
	import SidebarTree from '$lib/components/layout/sidebar/SidebarTree.svelte';
	import type { SidebarItemType } from '$lib/components/layout/sidebar/types';
	import { t } from '$lib/i18n/store';
    import { page } from '$app/state';
	import { getBlogListUrl } from '$lib/utils/domain/blog';

	let { posts = [], activeCategory = 'All', onSelect } = $props<{ 
		posts: any[]; 
		activeCategory?: string;
		onSelect: (post: any) => void 
	}>();

	import { Calendar, Tag } from 'lucide-svelte';
	import { sidebarState } from '$lib/state.svelte';
	import { onMount, untrack } from 'svelte';

	// 定义模式常量
	const BLOG_MODES = [
		{ id: 'year', label: 'blog.year', icon: Calendar },
		{ id: 'tag', label: 'blog.tag', icon: Tag }
	];

	onMount(() => {
		// 注册模式 (如果尚未由父组件注入)
		if (sidebarState.availableModes.length === 0) {
			sidebarState.availableModes = BLOG_MODES;
		}
		
		// 初始模式设置
		const isTagPath = page.url.pathname.includes('/tag/');
		if (isTagPath) {
			sidebarState.viewMode = 'tag';
		} else if (!sidebarState.viewMode) {
			sidebarState.viewMode = 'year';
		}
	});

	// 监听 URL 变化，自动同步模式（仅在标签从无到有时尝试自动切模式）
	let lastTagVal = '';
	$effect(() => {
		const currentTag = activeTag;
		// 仅在从无标签到有标签的变化时自动切换
		if (currentTag && !lastTagVal && sidebarState.viewMode !== 'tag') {
			untrack(() => {
				sidebarState.viewMode = 'tag';
			});
		}
		lastTagVal = currentTag;
	});

	import TagCloud from './TagCloud.svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';

	// 提取所有唯一标签
	let allTags = $derived.by(() => {
		const tagSet = new Set<string>();
		posts.forEach((post: any) => {
			if (post.tags) {
				post.tags.forEach((t: string) => tagSet.add(t));
			}
		});
		return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
	});

	// 计算当前选中的标签 (注意解码以匹配 allTags 中的内容)
	let activeTag = $derived.by(() => {
		const path = page.url.pathname;
		if (path.includes('/tag/')) {
			const parts = path.split('/tag/');
			const tagPart = parts[parts.length - 1].replace(/\/$/, '');
			return decodeURIComponent(tagPart);
		}
		return '';
	});

	let treeItems = $derived.by(() => {
		const currentMode = sidebarState.viewMode || 'year';
		if (currentMode !== 'year') return [];

		const groups: Record<string, typeof posts> = {};
		
		// 如果有激活标签，则年份视图也只展示包含该标签的文章
		const filteredPosts = activeTag 
			? posts.filter((p: any) => p.tags && p.tags.includes(activeTag))
			: posts;

		filteredPosts.forEach((post: any) => {
			const year = post.date ? post.date.substring(0, 4) : 'unknown';
			if (!groups[year]) groups[year] = [];
			groups[year].push(post);
		});

		const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

		return sortedKeys.map(key => {
			const groupPosts = groups[key];
			const items: SidebarItemType[] = groupPosts.map((post: any) => ({
				label: post.title, 
				onClick: () => onSelect(post),
				isActive: page.url.pathname.includes(post.slug),
				component: Marquee,
				componentProps: { text: post.title }
			}));
            
			return {
				id: key,
				label: key === 'unknown' ? $t('blog.unknown_year') : key,
				items: items,
                defaultExpanded: true
			} as SidebarItemType & { id: string };
		});
	});

	function handleTagSelect(tag: string) {
		const isCurrentlySelected = activeTag === tag;
		const newTag = isCurrentlySelected ? '' : tag;
		
		// 总是跳转到全局标签路径以确保内容丰富，取消选中时返回原分类
		const targetUrl = newTag ? getBlogListUrl('All', newTag) : getBlogListUrl(activeCategory, '');
		
		import('$app/navigation').then(({ goto }) => {
			goto(targetUrl, { keepFocus: true, noScroll: true });
		});
	}
</script>

<div class="flex flex-col gap-1">
	<Crossfade key={sidebarState.viewMode}>
		{#if sidebarState.viewMode === 'year'}
			{#each treeItems as item (item.id)}
				<SidebarTree {item} />
			{/each}
		{:else if sidebarState.viewMode === 'tag'}
			<TagCloud 
				tags={allTags} 
				{activeTag} 
				onSelect={handleTagSelect} 
			/>
		{/if}
	</Crossfade>
</div>
