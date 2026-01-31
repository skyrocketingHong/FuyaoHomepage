<script lang="ts">
	/**
	 * 博客侧边栏列表组件
	 * 
	 * 将文章列表转换为按年份分组的树形结构，适配侧边栏显示。
	 * 
	 * @prop posts - 博客文章列表
	 * @prop onSelect - 选中文章时的回调
	 */
	import { page } from '$app/state';
	import Marquee from '$lib/components/ui/display/Marquee.svelte';
	import SidebarTree from '$lib/components/layout/sidebar/SidebarTree.svelte';
	import type { SidebarItemType } from '$lib/components/layout/sidebar/types';
	import { t } from '$lib/i18n/store';

	let { posts = [], onSelect } = $props<{ posts: any[]; onSelect: (post: any) => void }>();

	// 将文章转换为 SidebarItemType 树结构（按年份分组）
	let treeItems = $derived.by(() => {
		const groups: Record<string, typeof posts> = {};
		posts.forEach((post: any) => {
			const year = post.date ? post.date.substring(0, 4) : 'unknown';
			if (!groups[year]) groups[year] = [];
			groups[year].push(post);
		});

		// 年份倒序排列
		const sortedYears = Object.keys(groups).sort((a, b) => b.localeCompare(a));

		return sortedYears.map(year => {
			const yearPosts = groups[year];
			
			// 将文章映射为 SidebarItemType
			const items: SidebarItemType[] = yearPosts.map((post: any) => ({
				label: post.title, 
				onClick: () => onSelect(post),
				isActive: isActive(post),
				component: Marquee,
				componentProps: { text: post.title }
			}));
            
            // 返回文件夹项
			return {
				id: year, // 稳定的 ID 键值
				label: year === 'unknown' ? $t('blog.unknown_year') : year,
				items: items,
                // 根据用户要求，博客目录默认展开
                defaultExpanded: true
			} as SidebarItemType & { id: string };
		});
	});

	function isActive(post: any) {
		const path = page.url.pathname;
		return path.includes(post.slug);
	}
</script>

<div>
	{#each treeItems as item (item.id)}
		<SidebarTree {item} />
	{/each}
</div>