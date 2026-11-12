<script lang="ts">
	/**
	 * 博客顶部操作组合组件 (搜索 + RSS)
	 *
	 * 两个页面操作按钮合并为一个分段胶囊 (ActionGroup)，按钮使用 bare 模式，
	 * 材质与边界由胶囊容器统一提供，不再叠加独立玻璃。
	 */
	import ActionGroup from '$lib/components/layout/header/ActionGroup.svelte';
	import RssButton from './RssButton.svelte';
	import SearchButton from './SearchButton.svelte';

	let { onOpenSearch } = $props<{ onOpenSearch: () => void }>();
</script>

<ActionGroup>
	<SearchButton bare onclick={onOpenSearch} />
	<RssButton bare />
</ActionGroup>
