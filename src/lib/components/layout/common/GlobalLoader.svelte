<script lang="ts">
	import Crossfade from '$lib/components/ui/crossfade.svelte';
	import LoadingScreen from '$lib/components/layout/common/LoadingScreen.svelte';

	let { showContent } = $props<{ showContent: boolean }>();
</script>

<Crossfade key={showContent} duration={400} class="pointer-events-none fixed inset-0 z-[100]">
	{#if !showContent}
		<div class="pointer-events-auto h-full w-full">
			<LoadingScreen />
		</div>
	{:else}
		<!-- 占位，确保crossfade正常工作 -->
		<div></div>
	{/if}
</Crossfade>
