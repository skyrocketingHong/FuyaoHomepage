<script lang="ts">
	/**
	 * 博客文章头部组件
	 *
	 * 展示文章标题、发布/更新时间、分类标签、摘要及标签贴纸。
	 * 渲染于透明阅读容器 (.article-surface) 内，文字颜色使用 --reader-* 阅读语义
	 * token，随日夜模式切换；阅读背景由 BackgroundLayer 统一绘制。
	 *
	 * @prop title - 文章标题
	 * @prop date - 发布日期
	 * @prop lastmod - 最后修改日期
	 * @prop categories - 包含 slug 和 title 的分类对象数组
	 * @prop subtitle - 文章副标题/摘要
	 * @prop tags - 文章标签数组
	 */
	import { formatDate, fromNow } from '$lib/utils/datetime/date';
	import { t, locale } from '$lib/i18n/store';
	import { Link as LinkIcon } from 'lucide-svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import CategoryBadge from '../common/CategoryBadge.svelte';
	import { getBlogListUrl } from '$lib/utils/domain/blog';
	import TagBadge from '../common/TagBadge.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import LazyImage from '$lib/components/ui/display/LazyImage.svelte';

	let {
		title,
		date,
		lastmod,
		categories = [],
		subtitle = '',
		tags = [],
		cover = ''
	}: {
		title: string;
		date: string | Date;
		lastmod: string | Date;
		categories?: { slug: string; title: string }[];
		subtitle?: string;
		tags?: string[];
		cover?: string;
	} = $props();

	let formattedDate = $derived(formatDate(date, $locale));
	let formattedLastmod = $derived(lastmod ? formatDate(lastmod, $locale) : '');
	let relativeDate = $derived(fromNow(date, $locale));
	let relativeLastmod = $derived(lastmod ? fromNow(lastmod, $locale) : '');

	let hasUpdated = $derived.by(() => {
		if (!lastmod || !date) return false;
		const d1 = new Date(date).toISOString().split('T')[0];
		const d2 = new Date(lastmod).toISOString().split('T')[0];
		return d2 > d1;
	});

	let showCopied = $state(false);
	function copyLink() {
		if (typeof window !== 'undefined') {
			navigator.clipboard.writeText(window.location.href);
			showCopied = true;
			setTimeout(() => (showCopied = false), 2000);
		}
	}
</script>

<header class="mb-10 w-full px-0 min-[980px]:pt-10">
	<div class="mx-auto w-full max-w-[653px]">
		<div class="mb-4 flex flex-col items-start gap-1">
			<CategoryBadge
				{categories}
				postCategories={categories.map((c) => c.slug)}
				class="text-[12px] font-bold tracking-wider text-(--reader-secondary) uppercase"
			/>
			<div class="text-[14px] font-semibold text-(--reader-secondary)">
				<Crossfade key={'header-date-' + $locale} class="flex flex-col items-start gap-1">
					<span class="flex items-center gap-1.5">
						<span class="opacity-80">{$t('blog.published_at')}</span>
						<span>{formattedDate}</span>
						<span class="font-normal opacity-40">({relativeDate})</span>
					</span>
					{#if hasUpdated}
						<span class="flex items-center gap-1.5 text-orange-500/80">
							<span class="opacity-80">{$t('blog.updated_at')}</span>
							<span>{formattedLastmod}</span>
							<span class="font-normal opacity-60">({relativeLastmod})</span>
						</span>
					{/if}
				</Crossfade>
			</div>
		</div>

		<h1
			class="mb-0 text-[32px] leading-[36px] font-bold tracking-tight text-balance text-(--reader-foreground) md:text-[40px] md:leading-[44px] lg:text-[48px] lg:leading-[52px]"
		>
			{title}
		</h1>

		{#if subtitle}
			<p
				class="mt-5 text-[21px] leading-[25px] font-medium text-(--reader-foreground) lg:text-[24px] lg:leading-[28px]"
			>
				{subtitle}
			</p>
		{/if}

		{#if tags && tags.length > 0}
			<div class="mt-4 flex flex-wrap gap-2 text-[12px] font-medium text-(--reader-secondary)">
				{#each tags as tag (tag)}
					<TagBadge
						{tag}
						onclick={(selectedTag) => goto(resolve(getBlogListUrl('All', selectedTag)))}
					/>
				{/each}
			</div>
		{/if}

		<div class="mt-4 flex items-center gap-3">
			<div class="relative">
				<button
					class="p-1 text-(--reader-secondary) transition-colors hover:text-(--reader-foreground)"
					aria-label={$t('common.copy_link')}
					onclick={copyLink}
				>
					<LinkIcon size={18} />
				</button>
				{#if showCopied}
					<span
						class="absolute -top-8 left-1/2 -translate-x-1/2 animate-in rounded bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background shadow-sm fade-in zoom-in"
					>
						<Crossfade key={$locale} inline class="inline-grid"
							><span>{$t('common.copied')}</span></Crossfade
						>
					</span>
				{/if}
			</div>
		</div>
	</div>

	{#if cover}
		<LazyImage
			src={cover}
			alt={title}
			class="mx-auto mt-[14px] block h-auto w-full max-w-[850px] rounded-[10px]"
			width="100%"
			height="auto"
			imgClass="w-full h-auto block"
		/>
	{/if}
</header>
