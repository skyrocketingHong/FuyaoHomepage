<script lang="ts">
	/** 高德默认信息窗内的地点内容及重合地点选择。 */
	import { formatDate } from '$lib/utils/datetime/date';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import type { MarkerConfig } from './types';
	import { locale } from '$lib/i18n/store';

	let { places, onSelect } = $props<{
		places: MarkerConfig[];
		onSelect: (place: MarkerConfig) => void;
	}>();
	const place = $derived(places[0]);
</script>

<div class="max-h-64 w-60 max-w-[calc(100vw-80px)] overflow-y-auto pr-3 text-inherit">
	{#if places.length > 1}
		<ul class="flex flex-col gap-2">
			{#each places as item, index (`${item.id ?? index}`)}
				<li>
					<button type="button" class="text-left underline" onclick={() => onSelect(item)}>
						{item.title}
					</button>
				</li>
			{/each}
		</ul>
	{:else if place}
		<Crossfade key={`${$locale}-${place.title}`}>
			<h3 class="text-base font-semibold">{place.title}</h3>
			{#if place.visitDate}
				<p class="mt-1 text-xs opacity-70">{formatDate(place.visitDate, $locale)}</p>
			{/if}
			{#if place.description}
				<p class="mt-2 text-sm leading-relaxed">{place.description}</p>
			{/if}
		</Crossfade>
	{/if}
</div>
