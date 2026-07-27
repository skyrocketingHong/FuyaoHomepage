<script lang="ts">
	/**
	 * 相册侧边栏组件
	 *
	 * 支持按日期/设备两种视图模式切换，使用 SidebarTree 渲染树形结构。
	 * 日期模式：显示当前年份的月份列表（年份切换在 Header 中）。
	 * 设备模式：显示当前年份的设备列表及月份子项。
	 *
	 * @prop yearGroups - 当前年份的按月分组照片数据
	 * @prop activeMonthId - 当前激活的月份 ID (date 模式)
	 * @prop activeDevice - 当前激活的设备 (device 模式)
	 * @prop activeDeviceMonth - 当前激活的设备月份
	 * @prop onSelectMonth - 选择月份的回调
	 * @prop onSelectDevice - 选择设备的回调
	 */
	import type { YearGroup, Photo } from '$lib/types/album';
	import type { SidebarItemType } from '$lib/types/sidebar';
	import SidebarTree from '$lib/components/layout/sidebar/SidebarTree.svelte';
	import { sidebarState } from '$lib/stores/app.svelte';
	import { locale } from '$lib/i18n/store';
	import { getMonthLabel } from '$lib/utils/datetime/date';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import { isApple, isXiaomi, hasLeica } from '$lib/utils/domain/exif';
	import { SiApple, SiXiaomi, SiLeica } from '@icons-pack/svelte-simple-icons';
	import { SvelteMap } from 'svelte/reactivity';

	interface Props {
		yearGroups: YearGroup[];
		activeMonthId?: string;
		activeDevice?: string;
		activeDeviceMonth?: string;
		onSelectMonth?: (monthId: string) => void;
		onSelectDevice?: (device: string, monthId?: string) => void;
	}

	let {
		yearGroups,
		activeMonthId = '',
		activeDevice = '',
		activeDeviceMonth = '',
		onSelectMonth,
		onSelectDevice
	}: Props = $props();

	/** 根据设备型号获取品牌图标（单一主品牌） */
	function getBrandIcon(model: string) {
		if (isApple(model)) return SiApple;
		if (isXiaomi(model)) return SiXiaomi;
		if (hasLeica(undefined, model)) return SiLeica;
		return undefined;
	}

	function getMonthId(year: number, month: number): string {
		return `${year}-${String(month).padStart(2, '0')}`;
	}

	/** 当前年份的设备列表（按模型名分组，按照片数降序） */
	let devices = $derived.by(() => {
		const deviceMap = new SvelteMap<string, Photo[]>();
		for (const yearGroup of yearGroups) {
			for (const month of yearGroup.months) {
				for (const photo of month.photos) {
					const device = photo.model || 'Unknown';
					if (!deviceMap.has(device)) deviceMap.set(device, []);
					deviceMap.get(device)!.push(photo);
				}
			}
		}
		return Array.from(deviceMap.entries()).sort((a, b) => b[1].length - a[1].length);
	});

	/** 日期模式：扁平月份列表 */
	let dateTreeItems = $derived.by(() => {
		if (sidebarState.viewMode !== 'date') return [];

		const items: SidebarItemType[] = [];
		for (const yearGroup of yearGroups) {
			for (const month of yearGroup.months) {
				const monthId = getMonthId(month.year, month.month);
				items.push({
					label: getMonthLabel(month.year, month.month, $locale),
					onClick: () => {
						onSelectMonth?.(monthId);
						document
							.getElementById(`month-${monthId}`)
							?.scrollIntoView({ behavior: 'smooth', block: 'start' });
					},
					isActive: activeMonthId === monthId
				});
			}
		}
		return items;
	});

	/** 设备模式：设备 → 月份子项 */
	let deviceTreeItems = $derived.by(() => {
		if (sidebarState.viewMode !== 'device') return [];

		return devices.map(([device, photos]) => {
			const monthMap = new SvelteMap<string, { year: number; month: number; photos: Photo[] }>();
			for (const photo of photos) {
				const date = new Date(photo.date);
				const year = date.getUTCFullYear();
				const month = date.getUTCMonth() + 1;
				const monthId = getMonthId(year, month);
				if (!monthMap.has(monthId)) monthMap.set(monthId, { year, month, photos: [] });
				monthMap.get(monthId)!.photos.push(photo);
			}

			const sortedMonths = Array.from(monthMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));

			const monthItems: SidebarItemType[] = sortedMonths.map(
				([monthId, { year, month, photos: monthPhotos }]) => {
					const deviceMonthId = `${device}:${monthId}`;
					return {
						label: `${getMonthLabel(year, month, $locale)} (${monthPhotos.length})`,
						onClick: () => {
							onSelectDevice?.(device, deviceMonthId);
							document
								.getElementById(`month-${monthId}`)
								?.scrollIntoView({ behavior: 'smooth', block: 'start' });
						},
						isActive: activeDeviceMonth === deviceMonthId
					};
				}
			);

			return {
				label: `${device} (${photos.length})`,
				icon: getBrandIcon(device),
				iconClass: 'size-3.5 flex-none',
				items: monthItems,
				defaultExpanded: true,
				isActive: activeDevice === device && !activeDeviceMonth
			} as SidebarItemType;
		});
	});
</script>

<div class="flex flex-col gap-1">
	<Crossfade key={sidebarState.viewMode}>
		{#if sidebarState.viewMode === 'date'}
			{#each dateTreeItems as item (item.id ?? item.label)}
				<SidebarTree {item} />
			{/each}
		{:else if sidebarState.viewMode === 'device'}
			{#each deviceTreeItems as item (item.id ?? item.label)}
				<SidebarTree {item} />
			{/each}
		{/if}
	</Crossfade>
</div>
