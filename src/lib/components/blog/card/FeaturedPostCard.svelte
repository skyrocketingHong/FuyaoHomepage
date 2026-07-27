<script lang="ts">
	/**
	 * 博客文章卡片 - 特色展示 (Hero)
	 *
	 * 用于首页顶部的大图展示。
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

	function handleClick() {
		onclick(post);
	}
</script>

<button
	type="button"
	class="newsroom-card newsroom-card--featured group mb-6 flex w-full cursor-pointer flex-col overflow-hidden md:grid md:grid-cols-[minmax(0,1.85fr)_minmax(280px,1fr)]"
	onclick={handleClick}
>
	<!-- 图片容器 -->
	<div
		class="relative aspect-[16/9] h-auto w-full overflow-hidden bg-card md:aspect-auto md:min-h-[360px]"
	>
		{#if post.cover}
			<LazyImage
				src={post.cover}
				alt={post.title}
				class="h-full w-full transition-transform duration-700 group-hover:scale-[1.02]"
				fill
			/>
		{:else}
			<div class="h-full w-full {visual.gradient} flex items-center justify-center">
				<visual.icon size={80} class="{visual.color} opacity-80" />
			</div>
		{/if}
	</div>

	<!-- 内容区 -->
	<div class="flex min-w-0 flex-1 flex-col items-start px-6 pt-5 pb-7 md:px-8 md:py-8">
		<div class="mb-3 flex items-center gap-3">
			<CategoryBadge
				{categories}
				{postCategories}
				class="text-[12px] font-bold tracking-widest text-foreground uppercase md:text-[14px]"
			/>
			{#if isRecent(post.date)}
				<span class="text-[12px] font-bold tracking-widest text-[#ff8800] uppercase">
					<Crossfade key={'new-' + $locale} inline class="inline-grid">
						<span>{$t('blog.new')}</span>
					</Crossfade>
				</span>
			{/if}
		</div>

		<h3
			class="mb-5 max-w-[900px] text-[30px] leading-[1.08] font-semibold tracking-[-0.025em] text-foreground sm:text-[36px] md:text-[36px] md:leading-[1.08] xl:text-[40px]"
		>
			{post.title}
		</h3>

		<div class="mt-auto text-[14px] font-medium text-muted-foreground sm:text-[16px]">
			<Crossfade key={'featured-date-' + post.slug + '-' + $locale} inline class="inline-grid">
				<span>{formatDate(post.date, $locale)}</span>
			</Crossfade>
		</div>
	</div>
</button>
