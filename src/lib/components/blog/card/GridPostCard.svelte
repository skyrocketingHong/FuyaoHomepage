<script lang="ts">
	/**
	 * 博客文章卡片 - 网格展示
	 *
	 * 用于首页中部的网格布局。
	 */
	import { fly } from 'svelte/transition';
	import { t, locale } from '$lib/i18n/store';
	import { formatDate } from '$lib/utils/datetime/date';
	import { getCategoryVisuals } from '$lib/utils/domain/blog';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import CategoryBadge from '../common/CategoryBadge.svelte';
	import LazyImage from '$lib/components/ui/display/LazyImage.svelte';
	import Marquee from '$lib/components/ui/display/Marquee.svelte';
	import type { BlogPost } from '$lib/utils/domain/blog';

	let {
		post,
		categories = [],
		index = 0,
		onclick
	} = $props<{
		post: BlogPost;
		categories?: { slug: string; title: string }[];
		index?: number;
		onclick: (post: BlogPost) => void;
	}>();

	let visual = $derived(getCategoryVisuals(post.categories?.[0] || post.category || ''));
	let postCategories = $derived(post.categories || [post.category]);

	function handleClick() {
		onclick(post);
	}
</script>

<div class="h-full w-full" in:fly={{ y: 20, duration: 500, delay: index * 50 }}>
	<LiquidGlass
		opaque={true}
		class="flex h-full w-full cursor-pointer flex-col gap-0 !p-0"
		onclick={handleClick}
		onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && handleClick()}
		role="button"
		tabindex="0"
	>
		<div class="flex h-full flex-col">
			<!-- 卡片图片 -->
			<div
				class="relative aspect-[16/10] w-full overflow-hidden rounded-t-[inherit] rounded-b-none bg-card"
			>
				{#if post.cover}
					<LazyImage
						src={post.cover}
						alt={post.title}
						class="h-full w-full transition-transform duration-500 group-hover:scale-[1.02]"
						fill
					/>
				{:else}
					<div class="h-full w-full {visual.gradient} flex items-center justify-center">
						<visual.icon size={48} class="{visual.color} opacity-80" />
					</div>
				{/if}
			</div>

			<!-- 卡片内容 -->
			<div class="flex flex-1 flex-col px-5 pt-4 pb-5">
				<CategoryBadge
					{categories}
					{postCategories}
					class="mb-2 text-[11px] font-bold tracking-widest text-foreground uppercase md:text-[12px]"
				/>

				<div class="mb-4 h-[72px] overflow-hidden md:h-[86px]">
					<Marquee
						text={post.title}
						direction="vertical"
						class="h-full text-[20px] leading-tight font-bold text-foreground md:text-[24px] md:leading-[1.2]"
						fadeSize="15%"
					/>
				</div>

				<div class="mt-auto text-[14px] font-semibold text-muted-foreground md:text-[15px]">
					<Crossfade key={'post-date-' + post.slug + '-' + $locale} class="inline-grid">
						<span>{formatDate(post.date, $locale)}</span>
					</Crossfade>
				</div>
			</div>
		</div>
	</LiquidGlass>
</div>
