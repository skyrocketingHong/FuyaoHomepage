<script lang="ts">
	/**
	 * 博客搜索按钮
	 */
	import HeaderActionButton from '$lib/components/layout/header/ActionButton.svelte';
	import { Search } from 'lucide-svelte';
	import { t } from '$lib/i18n/store';

    let { onclick } = $props<{ onclick: () => void }>();
</script>

<HeaderActionButton
	{onclick}
	title={$t('blog.search.title')}
	crossfadeKey="blog-search-button"
>
	{#snippet text()}
		{$t('blog.search.open')}
	{/snippet}
	{#snippet icon()}
		<Search size={20} class="shrink-0" />
	{/snippet}
</HeaderActionButton>
