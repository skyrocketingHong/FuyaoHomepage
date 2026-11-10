<script lang="ts">
	/**
	 * Newsroom 文章头部。
	 *
	 * 在 653px 阅读栏中展示分类、日期、标题、摘要和辅助操作，
	 * 封面使用独立宽媒体栏，阅读背景由 BackgroundLayer 统一绘制。
	 *
	 * @prop title - 文章标题
	 * @prop date - 发布日期
	 * @prop lastmod - 最后修改日期
	 * @prop categories - 包含 slug 和 title 的分类对象数组
	 * @prop subtitle - 文章副标题/摘要
	 * @prop tags - 文章标签数组
	 * @prop cover - 文章封面地址
	 */
	import { formatDate } from '$lib/utils/datetime/date';
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

	let hasUpdated = $derived.by(() => {
		if (!lastmod || !date) return false;
		const d1 = new Date(date).toISOString().split('T')[0];
		const d2 = new Date(lastmod).toISOString().split('T')[0];
		return d2 > d1;
	});

	let showCopied = $state(false);
	async function copyLink() {
		if (typeof window === 'undefined') return;
		try {
			await navigator.clipboard.writeText(window.location.href);
			showCopied = true;
			setTimeout(() => (showCopied = false), 2000);
		} catch {
			showCopied = false;
		}
	}
</script>

<header class="mb-8 w-full font-newsroom [font-optical-sizing:auto] md:mb-12">
	<div class="mx-auto w-full max-w-[653px]">
		<div class="mb-5 flex flex-col items-start gap-1 md:mb-6">
			<CategoryBadge
				{categories}
				postCategories={categories.map((c) => c.slug)}
				class="text-[12px] font-semibold tracking-[0.02em] text-(--reader-secondary) uppercase"
			/>
			<div class="text-[14px] font-semibold text-(--reader-secondary)">
				<Crossfade key={'header-date-' + $locale} class="flex flex-col items-start gap-1">
					<span>{formattedDate}</span>
					{#if hasUpdated}
						<span>{$t('blog.updated_at')} {formattedLastmod}</span>
					{/if}
				</Crossfade>
			</div>
		</div>

		<h1
			class="text-[32px] leading-[36px] font-bold tracking-[-0.028em] text-balance text-(--reader-foreground) md:text-[40px] md:leading-[44px] lg:text-[48px] lg:leading-[52px]"
		>
			{title}
		</h1>

		{#if subtitle}
			<p
				class="mt-5 text-[21px] leading-[25px] font-medium text-pretty text-(--reader-foreground) md:mt-6 lg:text-[24px] lg:leading-[28px]"
			>
				{subtitle}
			</p>
		{/if}

		{#if tags && tags.length > 0}
			<div class="mt-6 flex flex-wrap gap-2 text-[12px] font-medium">
				{#each tags as tag (tag)}
					<TagBadge
						{tag}
						onclick={(selectedTag) => goto(resolve(getBlogListUrl('All', selectedTag)))}
					/>
				{/each}
			</div>
		{/if}

		<div class="mt-8 flex items-center md:mt-10">
			<div class="relative">
				<button
					type="button"
					class="-ml-3 inline-flex size-11 items-center justify-center rounded-full text-(--reader-secondary) transition-colors hover:bg-(--reader-interactive) hover:text-(--reader-foreground) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--newsroom-link)"
					aria-label={$t('common.copy_link')}
					title={$t('common.copy_link')}
					onclick={copyLink}
				>
					<LinkIcon size={20} />
				</button>
				<span
					class="absolute top-full left-0 mt-1 text-xs whitespace-nowrap text-(--reader-secondary)"
					role="status"
					aria-live="polite"
				>
					{#if showCopied}
						<Crossfade key={$locale} inline class="inline-grid">
							<span>{$t('common.copied')}</span>
						</Crossfade>
					{/if}
				</span>
			</div>
		</div>
	</div>

	{#if cover}
		<div class="mx-auto mt-8 w-full max-w-[980px] md:mt-12">
			<LazyImage
				src={cover}
				alt={title}
				class="block h-auto w-full"
				width="100%"
				height="auto"
				imgClass="block h-auto w-full"
				loading="eager"
				fetchpriority="high"
			/>
		</div>
	{/if}

	<div class="mx-auto mt-8 w-full max-w-[653px] border-b border-(--reader-border) md:mt-12"></div>
</header>
