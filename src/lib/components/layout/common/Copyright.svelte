<script lang="ts">
	/**
	 * 版权信息组件
	 * Copyright Component
	 *
	 * 展示网站的版权年份和所有者。
	 * Displays website copyright year and owner.
	 */
	import { t, locale } from '$lib/i18n/store';
	import Crossfade from '$lib/components/ui/crossfade.svelte';

	const startYear = 2016;
	const currentYear = new Date().getFullYear();
</script>

<div
	class="w-full flex-none border-t border-white/5 pt-2 text-center text-xs text-white/40 md:whitespace-pre-line"
>
	<p>
		<Crossfade key={$locale} class="inline-grid"
			><span>{$t('common.copyright', { startYear, currentYear })}</span></Crossfade
		>
	</p>
</div>
