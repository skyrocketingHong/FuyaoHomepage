<script lang="ts">
	/**
	 * 博客搜索按钮
	 *
	 * @prop onclick - 点击回调函数
	 * @prop bare - 是否以分段胶囊内透明按钮渲染 (默认 false)
	 */
	import HeaderActionButton from '$lib/components/layout/header/ActionButton.svelte';
	import { Search } from 'lucide-svelte';
	import { t } from '$lib/i18n/store';

	let { onclick, bare = false } = $props<{ onclick: () => void; bare?: boolean }>();
</script>

<HeaderActionButton
	{bare}
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
