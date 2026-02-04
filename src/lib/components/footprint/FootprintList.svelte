<script lang="ts">
	/**
	 * 足迹列表组件
	 *
	 * 将足迹地点按年份分组并以树形结构展示。
	 * 
	 * @prop places - 足迹地点数组
	 * @prop onSelect - 选择地点时的回调函数
	 */
	import SidebarTree from '$lib/components/layout/sidebar/SidebarTree.svelte';
	import type { SidebarItemType } from '$lib/types/sidebar';

	let { places = [], onSelect } = $props();

	// 转换为侧边栏树形结构 (SidebarTree)
	let treeItems = $derived.by(() => {
		const groups: Record<string, typeof places> = {};
		places.forEach((place) => {
			const year = place.visitDate ? place.visitDate.substring(0, 4) : 'Unknown';
			if (!groups[year]) groups[year] = [];
			groups[year].push(place);
		});
		
		const sortedYears = Object.keys(groups).sort((a, b) => b[0].localeCompare(a[0]));

		return sortedYears.map(year => {
			const yearPlaces = groups[year];
			const count = yearPlaces.length;
			
			const items: SidebarItemType[] = yearPlaces.map(place => ({
				label: place.title,
				onClick: () => onSelect(place),
				// 如果需要可以通过此处添加 isActive 逻辑
			}));

			return {
				label: `${year} (${count})`,
				items: items,
				defaultExpanded: year === sortedYears[0]
			} as SidebarItemType;
		});
	});
</script>

<div class="flex flex-col gap-0.5">
	{#each treeItems as item (item.label)}
		<SidebarTree {item} />
	{/each}
</div>

