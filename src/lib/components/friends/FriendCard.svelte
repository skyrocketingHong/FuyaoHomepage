<script lang="ts">
	/**
	 * 友链卡片组件
	 *
	 * 展示单个友链的卡片，包含头像、名称、描述和链接。
	 */
	import LiquidGlass from '$lib/components/ui/liquid-glass.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';

	interface Friend {
		name: string;
		url: string;
		description: string;
		avatar: string;
	}

	let { friend }: { friend: Friend } = $props();
</script>

<LiquidGlass tilt class="group relative h-full overflow-hidden rounded-2xl p-0">
	<a href={friend.url} target="_blank" rel="noopener noreferrer" class="flex h-full items-center gap-3 p-3">
		<Avatar src={friend.avatar} alt={friend.name} size="md" />

		<div class="flex min-w-0 flex-1 flex-col gap-1">
			<div class="flex items-center gap-2">
				<h3
					class="truncate text-lg font-bold text-white transition-colors duration-300 group-hover:text-amber-200"
				>
					{friend.name}
				</h3>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="size-4 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:text-amber-200 group-hover:opacity-100"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
					<polyline points="15 3 21 3 21 9"></polyline>
					<line x1="10" y1="14" x2="21" y2="3"></line>
				</svg>
			</div>
			<p class="line-clamp-2 text-sm leading-relaxed text-white/70">
				{friend.description}
			</p>
		</div>
	</a>
</LiquidGlass>
