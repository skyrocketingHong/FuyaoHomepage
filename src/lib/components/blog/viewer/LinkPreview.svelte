<script lang="ts">
	/**
	 * 外部链接预览卡片
	 * 
	 * 自动获取 URL 元数据（标题、图标、描述、图片）并渲染为精美卡片。
	 * 
	 * @prop url - 目标链接地址
	 */
	import { onMount } from 'svelte';
	import { fetchLinkMetadata, type LinkMetadata } from '$lib/utils/network/urlMetadata';
	import { ExternalLink } from 'lucide-svelte';
	import LazyImage from '$lib/components/ui/display/LazyImage.svelte';

	let { url } = $props<{ url: string }>();

	let metadata: LinkMetadata | null = $state(null);
	let loading = $state(true);

	onMount(async () => {
		if (url) {
			loading = true;
			metadata = await fetchLinkMetadata(url);
			loading = false;
		}
	});
</script>

{#if loading}
	<a
		href={url}
		target="_blank"
		rel="noopener noreferrer"
		class="inline-flex items-center gap-1 text-blue-400 hover:underline"
	>
		{url} <ExternalLink size={12} />
	</a>
{:else if metadata}
	<a
		href={url}
		target="_blank"
		rel="noopener noreferrer"
		class="group my-6 block overflow-hidden rounded-2xl border border-white/10 bg-white/5 no-underline transition-all hover:bg-white/10"
	>
		{#if metadata.image}
			<div class="h-48 w-full overflow-hidden bg-white/5 relative">
				<LazyImage
					src={metadata.image}
					alt={metadata.title}
					class="h-full w-full transition-transform duration-500 group-hover:scale-105"
					fill
				/>
			</div>
		{/if}
		<div class="p-4">
			<div class="mb-1 text-xs font-medium uppercase tracking-wider text-white/50">
				{metadata.hostname}
			</div>
			<div class="mb-2 text-lg font-bold leading-tight text-white group-hover:text-blue-400">
				{metadata.title}
			</div>
			{#if metadata.description}
				<div class="line-clamp-2 text-sm text-white/70">
					{metadata.description}
				</div>
			{/if}
		</div>
	</a>
{:else}
	<a
		href={url}
		target="_blank"
		rel="noopener noreferrer"
		class="inline-flex items-center gap-1 text-blue-400 hover:underline"
	>
		{url} <ExternalLink size={12} />
	</a>
{/if}
