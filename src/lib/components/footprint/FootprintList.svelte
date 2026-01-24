<script lang="ts">
	import { onMount } from 'svelte';

	let { places = [], onSelect } = $props();

	// Simple Year Grouping
	let groupedPlaces = $derived.by(() => {
		const groups: Record<string, typeof places> = {};
		places.forEach((place) => {
			const year = place.visitDate ? place.visitDate.substring(0, 4) : 'Unknown';
			if (!groups[year]) groups[year] = [];
			groups[year].push(place);
		});
		return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0])); // Descending years
	});
</script>

<div class="flex flex-col gap-4">
	<div class="px-2">
		<h3 class="text-sm font-bold text-white/60 uppercase">Years</h3>
	</div>

	<div class="flex flex-col gap-6">
		{#each groupedPlaces as [year, yearPlaces]}
			<div class="flex flex-col gap-2">
				<div
					class="sticky top-0 rounded bg-black/20 px-2 py-1 text-xs font-bold text-white/80 backdrop-blur-md"
				>
					{year} ({yearPlaces.length})
				</div>
				<div class="ml-2 flex flex-col gap-1 border-l border-white/10 pl-2">
					{#each yearPlaces as place}
						<button
							class="truncate rounded px-2 py-1 text-left text-sm text-white/70 transition-all hover:bg-white/10 hover:text-white"
							onclick={() => onSelect(place)}
						>
							{place.title}
						</button>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
