<script lang="ts">
	import Crossfade from '$lib/components/ui/Crossfade.svelte';
	import type { Snippet } from 'svelte';

	let { children, pathname } = $props<{ children: Snippet; pathname: string }>();
</script>

<main
	class="pointer-events-auto h-full min-h-screen w-full overflow-y-auto scroll-smooth pt-16 pr-2 pb-26 pl-2 md:hidden"
>
	<Crossfade key={pathname} class="min-h-full w-full">
		{@render children()}
	</Crossfade>
</main>
