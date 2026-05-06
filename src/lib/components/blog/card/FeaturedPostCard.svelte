<script lang="ts">
	/**
	 * 博客文章卡片 - 特色展示 (Hero)
	 *
	 * 用于首页顶部的大图展示。
	 */
	import { t, locale } from '$lib/i18n/store';
	import { formatDate, isRecent } from '$lib/utils/datetime/date';
	import { getCategoryVisuals, getPostUrl } from '$lib/utils/domain/blog';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import CategoryBadge from '../common/CategoryBadge.svelte';
	import LazyImage from '$lib/components/ui/display/LazyImage.svelte';
	import type { BlogPost } from '$lib/utils/domain/blog';

	let {
		post,
		activeCategory = 'All',
		categories = [],
		onclick
	} = $props<{
		post: BlogPost;
		activeCategory?: string;
		categories?: { slug: string; title: string }[];
		onclick: (post: BlogPost) => void;
	}>();

	let visual = $derived(getCategoryVisuals(post.categories?.[0] || post.category || ''));
	let postCategories = $derived(post.categories || [post.category]);

	function handleClick() {
		onclick(post);
	}
</script>

<LiquidGlass
	opaque={true}
	class="mb-4 flex w-full cursor-pointer flex-col gap-0 !p-0"
	onclick={handleClick}
	onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && handleClick()}
	role="button"
	tabindex="0"
>
	<!-- 图片容器 -->
	<div
		class="relative aspect-[16/9] h-auto w-full overflow-hidden rounded-t-[inherit] rounded-b-none bg-card md:aspect-[2/1]"
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
	<div class="flex flex-1 flex-col items-start px-6 pt-4 pb-6">
		<div class="mb-3 flex items-center gap-3">
			<CategoryBadge
				{categories}
				{postCategories}
				class="text-[12px] font-bold tracking-widest text-foreground uppercase md:text-[14px]"
			/>
			{#if isRecent(post.date)}
				<span class="text-[12px] font-bold tracking-widest text-[#ff8800] uppercase">
					<Crossfade key={'new-' + $locale} class="inline-grid">
						<span>{$t('blog.new')}</span>
					</Crossfade>
				</span>
			{/if}
		</div>

		<h3
			class="mb-4 text-[28px] leading-[1.1] font-bold text-foreground sm:text-[32px] md:text-[40px] md:leading-[1.1]"
		>
			{post.title}
		</h3>

		<div class="mt-auto text-[15px] font-semibold text-muted-foreground sm:text-[17px]">
			<Crossfade key={'featured-date-' + post.slug + '-' + $locale} class="inline-grid">
				<span>{formatDate(post.date, $locale)}</span>
			</Crossfade>
		</div>
	</div>
</LiquidGlass>
