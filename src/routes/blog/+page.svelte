<script lang="ts">
	import LiquidGlass from '$lib/components/ui/liquid-glass.svelte';
</script>

<!-- Empty content as the iframe is in the background -->
<LiquidGlass class="min-h-[calc(100vh-12rem)] w-full p-0 md:h-full md:min-h-0">
	<iframe
		src="https://blog.fuyaoskyrocket.ing"
		frameborder="0"
		title="Blog"
		class="min-h-[calc(100vh-11rem)] w-[calc(100%+20px)] rounded-2xl md:h-full md:min-h-0"
	></iframe>
</LiquidGlass>
