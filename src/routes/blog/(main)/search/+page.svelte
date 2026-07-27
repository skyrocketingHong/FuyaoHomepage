<script lang="ts">
	/**
	 * 博客搜索页
	 */
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Search from '$lib/components/blog/search/Search.svelte';
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import { t } from '$lib/i18n/store';
</script>

<SeoHead title={$t('blog.search')} />

<div class="relative w-full">
	<Search
		onClose={async () => {
			if (window.history.length > 1) {
				window.history.back();
			} else {
				void goto(resolve('/blog/'));
			}
		}}
	/>
</div>
