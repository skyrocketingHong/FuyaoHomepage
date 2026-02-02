<script lang="ts">
    /**
     * 博客文章阅读器返回按钮
     * 
     * 封装了 HeaderActionButton，提供统一的返回列表操作和视觉反馈。
     * 
     * @prop onclick - 点击回调
     */
	import HeaderActionButton from '$lib/components/layout/header/button/HeaderActionButton.svelte';
	import { ChevronLeft } from 'lucide-svelte';
	import { t } from '$lib/i18n/store';

	let { onclick } = $props<{ onclick: () => void }>();
</script>

<HeaderActionButton 
	{onclick} 
	title={$t('blog.back_to_list')} 
	crossfadeKey="blog-back-button"
>
	{#snippet text()}
		{$t('blog.back_to_list')}
	{/snippet}
	{#snippet icon()}
		<ChevronLeft size={20} class="shrink-0" />
	{/snippet}
</HeaderActionButton>
