<script lang="ts">
	/**
	 * 博客返回按钮
	 * 
	 * 渲染一个带图标和标签的返回动作按钮。
	 */
	import HeaderActionButton from '$lib/components/layout/header/button/HeaderActionButton.svelte';
	import { ArrowLeft } from 'lucide-svelte';
	import { t, locale } from '$lib/i18n/store';

	let { onclick } = $props<{ onclick: () => void }>();
</script>

<HeaderActionButton
	{onclick}
	title={$t('blog.back_to_list')}
	crossfadeKey={"blog-back-button-" + $locale}
>
	{#snippet text()}
		{$t('blog.back_to_list')}
	{/snippet}
	{#snippet icon()}
		<ArrowLeft size={20} class="shrink-0" />
	{/snippet}
</HeaderActionButton>
