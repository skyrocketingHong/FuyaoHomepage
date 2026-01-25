<script lang="ts">
	import Crossfade from '$lib/components/ui/Crossfade.svelte';
	import type { Snippet } from 'svelte';

	let { children, pathname } = $props<{ children: Snippet; pathname: string }>();
</script>

<div class="h-full w-full overflow-y-auto scroll-smooth pt-16 pr-4 pb-4 pl-4">
	<Crossfade key={pathname} class="min-h-full w-full">
		{@render children()}
	</Crossfade>
</div>
