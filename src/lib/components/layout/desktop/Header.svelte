<script lang="ts">
	import Crossfade from '$lib/components/ui/crossfade.svelte';
	import HeaderActions from '$lib/components/layout/common/HeaderActions.svelte';

	let { pageLabel } = $props<{ pageLabel: string }>();
</script>

<header
	class="pointer-events-auto absolute top-0 right-0 left-0 z-20 flex items-center justify-between pt-4 pl-4"
>
	<h1 class="flex items-center gap-1 text-2xl font-bold tracking-wide text-white">
		<span class="text-gradient-flow">扶摇skyrocketing</span>
		<Crossfade key={pageLabel} class="inline-grid">
			<span>· {pageLabel}</span>
		</Crossfade>
	</h1>

	<div class="pr-4">
		<HeaderActions />
	</div>
</header>
