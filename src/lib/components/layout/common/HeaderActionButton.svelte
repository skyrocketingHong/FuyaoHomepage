<script lang="ts">
	import LiquidGlass from '$lib/components/ui/LiquidGlass.svelte';
	import Crossfade from '$lib/components/ui/Crossfade.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		onclick: () => void;
		crossfadeKey: any;
		text: Snippet;
		icon: Snippet;
		class?: string;
	}

	let { title, onclick, crossfadeKey, text, icon, class: className }: Props = $props();
</script>

<LiquidGlass
	tag="button"
	{onclick}
	class="group w-auto rounded-full p-2 text-white hover:bg-white/10 {className}"
	{title}
>
	<div class="flex items-center justify-center">
		<div
			class="grid grid-cols-[0fr] transition-[grid-template-columns] duration-300 ease-out group-hover:grid-cols-[1fr] group-data-[interacting=true]:grid-cols-[1fr]"
		>
			<div class="overflow-hidden">
				<Crossfade key={crossfadeKey}>
					<span
						class="block whitespace-nowrap pr-2 text-sm font-medium opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-data-[interacting=true]:opacity-100"
					>
						{@render text()}
					</span>
				</Crossfade>
			</div>
		</div>
		{@render icon()}
	</div>
</LiquidGlass>
