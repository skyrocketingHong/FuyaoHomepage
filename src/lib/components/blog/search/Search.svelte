<script lang="ts">
	/**
	 * Newsroom 博客搜索页。
	 *
	 * 使用平面搜索框与分隔式结果列表，保留完整加载、错误和空状态。
	 */
	import { onMount, onDestroy } from 'svelte';
	import { Search as SearchIcon, SearchX, Loader2, FileText } from 'lucide-svelte';
	import { t, locale } from '$lib/i18n/store';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import StatusState from '$lib/components/ui/feedback/StatusState.svelte';
	import { getPostUrl } from '$lib/utils/domain/blog';
	import type { BlogPost } from '$lib/utils/domain/blog';
	import { headerState } from '$lib/stores/app.svelte';
	import BackButton from '../viewer/BackButton.svelte';
	import { BlogSearch } from '$lib/stores/search.svelte';

	let { onClose } = $props<{ onClose: () => void }>();

	const search = new BlogSearch();
	let inputEl: HTMLInputElement;
	let backBtnId = '';

	onMount(() => {
		void search.init();

		backBtnId = headerState.setLeft(
			BackButton,
			{
				onclick: onClose
			},
			'blog-search-back'
		);

		$effect(() => {
			if (!search.loading && inputEl) {
				inputEl.focus();
			}
		});
	});

	onDestroy(() => {
		if (backBtnId) {
			headerState.clearLeft(backBtnId);
		}
	});

	$effect(() => {
		if (search.query || search.fuse) {
			search.handleSearch();
		}
	});

	function goToPost(post: BlogPost) {
		const postObj = {
			...post,
			category: post.categories?.[0] || 'Uncategorized'
		};
		goto(resolve(getPostUrl(postObj, postObj.category)));
	}
</script>

{#snippet retryAction()}
	<button
		type="button"
		class="inline-flex min-h-11 cursor-pointer items-center justify-center px-3 text-[17px] font-medium text-(--newsroom-link) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--newsroom-link)"
		onclick={() => window.location.reload()}
	>
		<Crossfade key={'search-retry-' + $locale} inline class="inline-grid">
			<span>{$t('blog.search.retry')}</span>
		</Crossfade>
	</button>
{/snippet}

<div
	class="mx-auto flex min-h-[60vh] max-w-[980px] flex-col font-newsroom text-(--newsroom-foreground) [font-optical-sizing:auto]"
>
	<div
		class="flex min-h-14 items-center gap-3 rounded-full bg-(--newsroom-interactive) px-5 transition-colors focus-within:bg-(--newsroom-card) focus-within:outline-2 focus-within:outline-(--newsroom-link)"
	>
		<SearchIcon class="shrink-0 text-(--newsroom-secondary)" size={20} />
		<input
			bind:this={inputEl}
			value={search.query}
			oninput={(e) => (search.query = e.currentTarget.value)}
			placeholder={$t('blog.search.placeholder')}
			aria-label={$t('blog.search.placeholder')}
			class="min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-(--newsroom-caption) md:text-[20px]"
			autocomplete="off"
		/>
		{#if search.loading}
			<Loader2 class="shrink-0 animate-spin text-(--newsroom-secondary)" size={20} />
		{/if}
	</div>

	<div class="mt-6 flex-1 md:mt-8">
		{#if search.error}
			<StatusState
				icon={FileText}
				code="!"
				title={$t('blog.search.load_error')}
				description={$t('blog.search.load_error_hint')}
				transitionKey={$locale}
				layout="embedded"
				action={retryAction}
			/>
		{:else if search.loading}
			<div class="flex items-center justify-center py-12 text-(--newsroom-secondary)">
				<Loader2 class="mr-2 animate-spin" size={16} />
				<Crossfade key={'search-loading-' + $locale} inline class="inline-grid">
					<span>{$t('common.loading')}</span>
				</Crossfade>
			</div>
		{:else if search.query && search.results.length === 0}
			<StatusState
				icon={SearchX}
				code={0}
				title={$t('blog.search.no_results', { query: search.query })}
				description={$t('blog.search.try_another_keyword')}
				transitionKey={$locale}
				detailLabel={$t('blog.search.query_label')}
				detailValue={search.query}
				layout="embedded"
			/>
		{:else if search.results.length > 0}
			<div class="border-t border-(--newsroom-border)">
				{#each search.results as post (post.slug)}
					<button
						type="button"
						class="group flex w-full flex-col gap-2 border-b border-(--newsroom-border) px-1 py-5 text-left transition-colors hover:bg-(--newsroom-interactive) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--newsroom-link) md:px-4 md:py-6"
						onclick={() => goToPost(post)}
					>
						<div
							class="flex w-full flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
						>
							<h3
								class="line-clamp-2 text-[19px] leading-[25px] font-semibold text-balance text-(--newsroom-foreground) transition-colors group-hover:text-(--newsroom-link) md:text-[21px] md:leading-[26px]"
							>
								{post.title}
							</h3>
							{#if post.date}
								<span class="shrink-0 text-[13px] whitespace-nowrap text-(--newsroom-secondary)">
									{post.date.substring(0, 10)}
								</span>
							{/if}
						</div>

						{#if post.description}
							<p class="line-clamp-2 text-[15px] leading-[23px] text-(--newsroom-secondary)">
								{post.description}
							</p>
						{/if}

						{#if post.tags && post.tags.length > 0}
							<div class="mt-1 flex flex-wrap gap-x-3 gap-y-1">
								{#each post.tags.slice(0, 5) as tag (tag)}
									<span class="text-[12px] text-(--newsroom-caption)">#{tag}</span>
								{/each}
							</div>
						{/if}
					</button>
				{/each}
			</div>
		{:else}
			<div class="flex flex-col items-center justify-center py-20 text-(--newsroom-caption)">
				<FileText size={48} class="mb-6 opacity-20" />
				<p class="text-[17px]">
					<Crossfade key={'search-placeholder-' + $locale} inline class="inline-grid">
						<span>{$t('blog.search.placeholder')}</span>
					</Crossfade>
				</p>
			</div>
		{/if}
	</div>

	{#if search.results.length > 0}
		<div class="mt-4 flex justify-between text-[13px] text-(--newsroom-secondary)">
			<Crossfade
				key={`search-count-${search.results.length}-${$locale}`}
				inline
				class="inline-grid"
			>
				<span>
					{search.results.length === 1
						? $t('blog.search.result_count_one')
						: $t('blog.search.result_count', { count: String(search.results.length) })}
				</span>
			</Crossfade>
		</div>
	{/if}
</div>
