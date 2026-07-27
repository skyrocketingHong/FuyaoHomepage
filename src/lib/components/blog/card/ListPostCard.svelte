<script lang="ts">
	/**
	 * 博客文章卡片 - 列表展示
	 *
	 * 用于首页底部的列表布局。
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

	function handleClick() {
		onclick(post);
	}
</script>

<button
	type="button"
	class="newsroom-card newsroom-card--compact group w-full cursor-pointer overflow-hidden"
	onclick={handleClick}
>
	<div class="flex h-[120px] items-stretch gap-0 sm:h-[160px]">
		<!-- 缩略图 -->
		<div class="relative w-[120px] shrink-0 overflow-hidden bg-muted sm:w-[160px]">
			{#if post.cover}
				<LazyImage
					src={post.cover}
					alt={post.title}
					class="h-full w-full transition-transform duration-500 group-hover:scale-[1.02]"
					fill
				/>
			{:else}
				<div class="h-full w-full {visual.gradient} flex items-center justify-center">
					<visual.icon size={32} class="{visual.color} opacity-80" />
				</div>
			{/if}
		</div>

		<!-- 内容区 -->
		<div class="flex flex-1 flex-col justify-between overflow-hidden px-5 py-4 sm:px-6 sm:py-5">
			<div>
				<CategoryBadge
					{categories}
					{postCategories}
					class="mb-1 block text-[11px] font-bold tracking-widest text-muted-foreground uppercase"
				/>
				<h4
					class="line-clamp-2 text-[18px] leading-[1.22] font-semibold tracking-[-0.01em] text-foreground sm:line-clamp-3 sm:text-[21px]"
				>
					{post.title}
				</h4>
			</div>
			<span class="text-[13px] font-semibold text-muted-foreground sm:text-[14px]">
				<Crossfade key={'more-date-' + post.slug + '-' + $locale} inline class="inline-grid">
					<span>{formatDate(post.date, $locale)}</span>
				</Crossfade>
			</span>
		</div>
	</div>
</button>
