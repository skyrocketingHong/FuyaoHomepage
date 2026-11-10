<script lang="ts">
	/**
	 * Newsroom 网格文章卡片。
	 *
	 * large 用于两篇次级报道，regular 用于三篇标准网格报道。
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
		size = 'regular',
		onclick
	} = $props<{
		post: BlogPost;
		categories?: { slug: string; title: string }[];
		size?: 'large' | 'regular';
		onclick: (post: BlogPost) => void;
	}>();

	let { visual, postCategories } = $derived(getPostVisuals(post));
</script>

<div class="h-full w-full">
	<button
		type="button"
		class="newsroom-card group flex h-full w-full cursor-pointer flex-col overflow-hidden {size ===
		'large'
			? 'newsroom-card--secondary'
			: ''}"
		onclick={() => onclick(post)}
	>
		<div
			class="relative w-full overflow-hidden bg-(--newsroom-interactive) {size === 'large'
				? 'aspect-[16/9]'
				: 'aspect-[16/10]'}"
		>
			{#if post.cover}
				<LazyImage src={post.cover} alt={post.title} class="newsroom-image h-full w-full" fill />
			{:else}
				<div class="flex h-full w-full items-center justify-center">
					<visual.icon
						size={size === 'large' ? 64 : 48}
						class="text-(--newsroom-caption) opacity-70"
					/>
				</div>
			{/if}
		</div>

		<div
			class="flex flex-1 flex-col {size === 'large'
				? 'px-6 pt-6 pb-7 md:px-8 md:pt-7 md:pb-8'
				: 'px-5 pt-5 pb-6 md:px-6'}"
		>
			<CategoryBadge
				{categories}
				{postCategories}
				class="mb-2 text-[12px] font-semibold tracking-[0.02em] text-(--newsroom-secondary) uppercase md:text-[13px]"
			/>

			<h3
				class="line-clamp-3 font-semibold text-balance text-(--newsroom-foreground) {size ===
				'large'
					? 'text-[24px] leading-[30px] tracking-[-0.02em] md:text-[28px] md:leading-[34px]'
					: 'text-[21px] leading-[26px] tracking-[-0.015em]'}"
			>
				{post.title}
			</h3>

			<div class="mt-auto pt-5 text-[13px] font-medium text-(--newsroom-secondary) md:text-[14px]">
				<Crossfade key={'post-date-' + post.slug + '-' + $locale} inline class="inline-grid">
					<span>{formatDate(post.date, $locale)}</span>
				</Crossfade>
			</div>
		</div>
	</button>
</div>
