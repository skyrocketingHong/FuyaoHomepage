<script lang="ts">
	/**
	 * Newsroom 紧凑文章行。
	 *
	 * 用于“更多信息”双列列表，以小缩略图和细分隔线组织内容。
	 */
	import { locale } from '$lib/i18n/store';
	import { formatDate } from '$lib/utils/datetime/date';
	import { getPostVisuals } from '$lib/utils/domain/blog';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import CategoryBadge from '../common/CategoryBadge.svelte';
	import LazyImage from '$lib/components/ui/display/LazyImage.svelte';
	import type { BlogPost } from '$lib/utils/domain/blog';

	let {
		post,
		categories = [],
		onclick
	} = $props<{
		post: BlogPost;
		categories?: { slug: string; title: string }[];
		onclick: (post: BlogPost) => void;
	}>();

	let { visual, postCategories } = $derived(getPostVisuals(post));
</script>

<button
	type="button"
	class="newsroom-card newsroom-card--compact group w-full cursor-pointer"
	onclick={() => onclick(post)}
>
	<div class="flex items-center gap-4 py-5 sm:gap-5 sm:py-6">
		<div
			class="relative size-[96px] shrink-0 overflow-hidden rounded-[12px] bg-(--newsroom-interactive) sm:size-[112px]"
		>
			{#if post.cover}
				<LazyImage src={post.cover} alt={post.title} class="newsroom-image h-full w-full" fill />
			{:else}
				<div class="flex h-full w-full items-center justify-center">
					<visual.icon size={32} class="text-(--newsroom-caption) opacity-70" />
				</div>
			{/if}
		</div>

		<div class="min-w-0 flex-1">
			<CategoryBadge
				{categories}
				{postCategories}
				class="mb-1 block text-[11px] font-semibold tracking-[0.02em] text-(--newsroom-secondary) uppercase sm:text-[12px]"
			/>
			<h4
				class="line-clamp-3 text-[17px] leading-[22px] font-semibold tracking-[-0.01em] text-balance text-(--newsroom-foreground) sm:text-[18px] sm:leading-[24px]"
			>
				{post.title}
			</h4>
			<div class="mt-2 text-[12px] font-medium text-(--newsroom-secondary) sm:text-[13px]">
				<Crossfade key={'more-date-' + post.slug + '-' + $locale} inline class="inline-grid">
					<span>{formatDate(post.date, $locale)}</span>
				</Crossfade>
			</div>
		</div>
	</div>
</button>
