<script lang="ts">
	/**
	 * 足迹列表组件
	 *
	 * 将足迹地点按年份分组并以树形结构展示。
	 *
	 * @prop places - 足迹地点数组
	 * @prop onSelect - 选择地点时的回调函数
	 */
	import { onMount } from 'svelte';
	import Marquee from '$lib/components/ui/display/Marquee.svelte';
	import SidebarTree from '$lib/components/layout/sidebar/SidebarTree.svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import type { SidebarItemType } from '$lib/types/sidebar';
	import type { FootprintIndices, City, Attraction, BasePlace } from '$lib/utils/domain/footprints';
	import { sidebarState } from '$lib/stores/app.svelte';
	import { Calendar, MapPin } from 'lucide-svelte';
	import { t } from '$lib/i18n/store';

	let { indices, onSelect } = $props<{
		indices: FootprintIndices;
		onSelect: (place: BasePlace) => void;
	}>();

	// 定义显示模式
	const MODES = [
		{ id: 'year', label: 'footprint.year', icon: Calendar },
		{ id: 'city', label: 'footprint.city', icon: MapPin }
	];

	onMount(() => {
		// 注册模式
		if (sidebarState.availableModes.length === 0) {
			sidebarState.availableModes = MODES;
		}
		// 默认模式
		if (!sidebarState.viewMode) {
			sidebarState.viewMode = 'year';
		}
	});

	// 使用 $state 存储树形数据，配合 $effect 确保更新
	let treeItems = $state<SidebarItemType[]>([]);

	// 监听依赖变化，重新生成树
	$effect(() => {
		if (!indices) return;

		const mode = sidebarState.viewMode || 'year';
		// 直接从 sidebarState 获取 activeId，绕过 props 传递层级
		// 这是一个更稳健的依赖追踪方式，避免中间组件传递导致的信号丢失
		const currentActiveId = String(sidebarState.activeId ?? '');

		if (mode === 'year') {
			// 按年份分组视图
			const groups = indices.viewByYear;
			const sortedYears = Object.keys(groups).sort((a, b) => b.localeCompare(a));

			treeItems = sortedYears.map((year) => {
				const yearPlaces = groups[year];
				const items: SidebarItemType[] = yearPlaces.map((place: City) => ({
					label: place.title || $t('footprint.unknown'),
					onClick: () => onSelect(place),
					isActive: String(place.id) === currentActiveId,
					dataId: String(place.id), // 用于自动滚动匹配
					component: Marquee,
					componentProps: { text: place.title || $t('footprint.unknown') }
				}));

				return {
					id: `year-${year}`,
					label: `${year} (${yearPlaces.length})`,
					items: items,
					defaultExpanded: true
				};
			});
		} else {
			// 城市视图
			const cities = indices.viewByCity;

			treeItems = cities.map((city: City) => {
				const spots = city.children || [];
				const isCityActive = String(city.id) === currentActiveId;

				const spotsByYear: Record<string, Attraction[]> = {};
				spots.forEach((spot) => {
					const year = spot.visitDate ? spot.visitDate.substring(0, 4) : $t('footprint.unknown');
					if (!spotsByYear[year]) spotsByYear[year] = [];
					spotsByYear[year].push(spot);
				});

				const sortedYears = Object.keys(spotsByYear).sort((a, b) => b.localeCompare(a));

				// Create nested items: City -> Year -> Spots
				const yearItems: SidebarItemType[] = sortedYears.map((year) => {
					const yearSpots = spotsByYear[year];
					return {
						id: `city-${city.id}-year-${year}`,
						label: `${year} (${yearSpots.length})`,
						items: yearSpots.map((spot: Attraction) => ({
							label: spot.title || $t('footprint.unknown'),
							onClick: () => onSelect(spot),
							isActive: String(spot.id) === currentActiveId,
							dataId: String(spot.id), // 用于自动滚动匹配
							component: Marquee,
							componentProps: { text: spot.title || $t('footprint.unknown') }
						})),
						defaultExpanded: true
					};
				});

				// 城市本身也可以点击
				return {
					id: `city-${city.id}`,
					label: `${city.title} (${spots.length})`,
					items: yearItems,
					onClick: () => onSelect(city),
					isActive: isCityActive, // 高亮当前选中项
					dataId: String(city.id), // 用于自动滚动匹配
					defaultExpanded: true
				};
			});
		}
	});
</script>

<div class="flex flex-col gap-0.5">
	<Crossfade key={sidebarState.viewMode}>
		{#each treeItems as item (item.id)}
			<SidebarTree {item} />
		{/each}
	</Crossfade>
</div>
