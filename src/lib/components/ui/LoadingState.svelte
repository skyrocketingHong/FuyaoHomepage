<script lang="ts">
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import Crossfade from '$lib/components/ui/crossfade.svelte';
	import { fade } from 'svelte/transition';
	import { t, locale } from '$lib/i18n/store';

	let { loading = false, error = '', class: className = '', children } = $props();
</script>

{#if loading}
	<div class="flex items-center gap-3 text-white/50 {className}" in:fade>
		<LoadingSpinner size="sm" />
		<Crossfade key={$locale} class="inline-grid">
			<span>{$t('common.loading')}</span>
		</Crossfade>
	</div>
{:else if error}
	<div 
		class="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-500 {className}"
		in:fade
	>
		{error}
	</div>
{:else}
	{@render children()}
{/if}
