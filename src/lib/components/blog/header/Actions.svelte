<script lang="ts">
	/**
	 * 博客顶部操作组合组件 (搜索 + RSS)
	 */
    import RssButton from './RssButton.svelte';
    import SearchButton from './SearchButton.svelte';

    let { onOpenSearch } = $props<{ onOpenSearch: () => void }>();
</script>

<div class="flex items-center gap-2">
    <SearchButton onclick={onOpenSearch} />
    <RssButton />
</div>
