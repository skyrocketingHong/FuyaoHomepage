<script lang="ts">
	/**
	 * 博客 RSS 订阅按钮
	 *
	 * @prop bare - 是否以分段胶囊内透明按钮渲染 (默认 false)
	 */
	import HeaderActionButton from '$lib/components/layout/header/ActionButton.svelte';
	import { Rss } from 'lucide-svelte';
	import { t } from '$lib/i18n/store';

	let { bare = false } = $props<{ bare?: boolean }>();

	function goToRss() {
		window.open('/blog/rss.xml', '_blank');
	}
</script>

<HeaderActionButton
	{bare}
	onclick={goToRss}
	title={$t('blog.rss_subscribe') || 'RSS Subscribe'}
	crossfadeKey="blog-rss-button"
>
	{#snippet text()}
		{$t('blog.rss') || 'RSS'}
	{/snippet}
	{#snippet icon()}
		<Rss size={20} class="shrink-0" />
	{/snippet}
</HeaderActionButton>
