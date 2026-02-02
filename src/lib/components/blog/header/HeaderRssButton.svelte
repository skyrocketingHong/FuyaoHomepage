<script lang="ts">
	/**
	 * 博客 RSS 订阅按钮
	 */
	import HeaderActionButton from '$lib/components/layout/header/button/HeaderActionButton.svelte';
	import { Rss } from 'lucide-svelte';
	import { t } from '$lib/i18n/store';

	function goToRss() {
		window.open('/blog/rss.xml', '_blank');
	}
</script>

<HeaderActionButton
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
