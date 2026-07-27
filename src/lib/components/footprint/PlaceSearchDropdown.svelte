<script lang="ts">
	/**
	 * 地点搜索下拉组件
	 *
	 * 基于高德地图 PlaceSearch 插件提供地点搜索和选择功能。
	 *
	 * @prop searchQuery - 搜索关键词 (双向绑定)
	 * @prop onSelect - 选择地点时的回调
	 */
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n/store';
	import { Search, Loader2 } from 'lucide-svelte';
	import { initPlaceSearch, searchPlaces, type PlaceSearchResult } from './map/core/placeSearch';

	let { searchQuery = $bindable(''), onSelect } = $props<{
		searchQuery?: string;
		onSelect: (result: PlaceSearchResult) => void;
	}>();

	// 搜索状态
	let isSearching = $state(false);
	let searchResults = $state<PlaceSearchResult[]>([]);
	let placeSearchInstance: Awaited<ReturnType<typeof initPlaceSearch>>['placeSearch'] | null = null;

	onMount(async () => {
		try {
			const { placeSearch } = await initPlaceSearch();
			placeSearchInstance = placeSearch;
		} catch (e) {
			console.error('地点搜索插件初始化失败:', e);
		}
	});

	/**
	 * 执行搜索
	 */
	async function handleSearch() {
		if (!searchQuery || !placeSearchInstance) return;

		isSearching = true;
		searchResults = await searchPlaces(placeSearchInstance, searchQuery);
		isSearching = false;
	}

	/**
	 * 选择搜索结果
	 */
	function handleSelect(result: PlaceSearchResult) {
		searchQuery = result.name;
		searchResults = [];
		onSelect(result);
	}
</script>

<div class="relative space-y-2">
	<label for="place-search" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
		{$t('footprint.generator.search_label')}
	</label>
	<div class="relative">
		<input
			id="place-search"
			type="text"
			bind:value={searchQuery}
			placeholder={$t('footprint.generator.search_placeholder')}
			class="w-full rounded-lg border border-zinc-200 bg-transparent py-2 pr-4 pl-10 outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700"
			onkeydown={(e) => e.key === 'Enter' && handleSearch()}
		/>
		<Search class="absolute top-2.5 left-3 text-zinc-400" size={18} />
		{#if isSearching}
			<Loader2 class="absolute top-2.5 right-3 animate-spin text-blue-500" size={18} />
		{/if}
	</div>

	<!-- 搜索结果下拉 -->
	{#if searchResults.length > 0}
		<div
			class="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
		>
			{#each searchResults as result (`${result.name}-${result.address}-${result.district}`)}
				<button
					class="w-full border-b border-zinc-100 px-4 py-2 text-left text-sm last:border-0 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-700"
					onclick={() => handleSelect(result)}
				>
					<div class="font-medium">{result.name}</div>
					<div class="truncate text-xs text-zinc-500">{result.address || result.district}</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
