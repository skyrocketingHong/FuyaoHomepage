<script lang="ts">
	/**
	 * Newsroom 主报道卡片。
	 *
	 * 使用整宽 16:9 图片和大号标题，首屏图片优先加载。
	 */
	import { t, locale } from '$lib/i18n/store';
	import { formatDate, isRecent } from '$lib/utils/datetime/date';
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
	class="newsroom-card newsroom-card--featured group flex w-full cursor-pointer flex-col overflow-hidden"
	onclick={() => onclick(post)}
>
	<div class="relative aspect-[16/9] w-full overflow-hidden bg-(--newsroom-interactive)">
		{#if post.cover}
			<LazyImage
				src={post.cover}
				alt={post.title}
				class="newsroom-image h-full w-full"
				fill
				loading="eager"
				fetchpriority="high"
			/>
		{:else}
			<div class="flex h-full w-full items-center justify-center">
				<visual.icon size={80} class="text-(--newsroom-caption) opacity-70" />
			</div>
		{/if}
	</div>

	<div class="flex min-w-0 flex-1 flex-col items-start px-6 pt-6 pb-7 md:px-10 md:pt-8 md:pb-9">
		<div class="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
			<CategoryBadge
				{categories}
				{postCategories}
				class="text-[12px] font-semibold tracking-[0.02em] text-(--newsroom-secondary) uppercase md:text-[14px]"
			/>
			{#if isRecent(post.date)}
				<span class="text-[12px] font-semibold tracking-[0.02em] text-(--theme-color) uppercase">
					<Crossfade key={'new-' + $locale} inline class="inline-grid">
						<span>{$t('blog.new')}</span>
					</Crossfade>
				</span>
			{/if}
		</div>

		<h3
			class="text-[28px] leading-[34px] font-semibold tracking-[-0.022em] text-balance text-(--newsroom-foreground) md:text-[40px] md:leading-[48px]"
		>
			{post.title}
		</h3>

		<div class="mt-6 text-[14px] font-medium text-(--newsroom-secondary) md:mt-8">
			<Crossfade key={'featured-date-' + post.slug + '-' + $locale} inline class="inline-grid">
				<span>{formatDate(post.date, $locale)}</span>
			</Crossfade>
		</div>
	</div>
</button>
