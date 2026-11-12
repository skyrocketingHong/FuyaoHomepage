<script lang="ts">
	/**
	 * 外部链接预览卡片。
	 *
	 * 使用与 Newsroom 正文一致的平面边界、图片比例和文字层级。
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
		class="inline-flex items-center gap-1 text-(--newsroom-link) hover:underline"
	>
		{url}
		<ExternalLink size={12} />
	</a>
{:else if metadata}
	<a
		href={url}
		target="_blank"
		rel="noopener noreferrer"
		class="group my-8 block overflow-hidden rounded-[12px] border border-(--reader-border) bg-(--reader-card) no-underline transition-colors hover:bg-(--reader-card-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--newsroom-link)"
	>
		{#if metadata.image}
			<div class="relative aspect-[16/9] w-full overflow-hidden bg-(--reader-card)">
				<LazyImage src={metadata.image} alt={metadata.title} class="h-full w-full" fill />
			</div>
		{/if}
		<div class="p-5">
			<div
				class="mb-1 text-[11px] font-medium tracking-[0.02em] text-(--reader-secondary) uppercase"
			>
				{metadata.hostname}
			</div>
			<div
				class="mb-2 text-[18px] leading-[24px] font-semibold text-balance text-(--reader-foreground) group-hover:text-(--newsroom-link)"
			>
				{metadata.title}
			</div>
			{#if metadata.description}
				<div class="line-clamp-2 text-[14px] leading-[21px] text-(--reader-secondary)">
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
		class="inline-flex items-center gap-1 text-(--newsroom-link) hover:underline"
	>
		{url}
		<ExternalLink size={12} />
	</a>
{/if}
