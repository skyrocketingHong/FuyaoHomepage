<script lang="ts">
	/**
	 * 博客空状态。
	 *
	 * 提供与 Newsroom 链接层级一致的返回全部文章操作。
	 *
	 * @prop onReset - 点击“查看所有文章”时的重置回调
	 */
	import { t, locale } from '$lib/i18n/store';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import StatusState from '$lib/components/ui/feedback/StatusState.svelte';
	import { Newspaper } from 'lucide-svelte';

	let { onReset } = $props<{ onReset: () => void }>();
</script>

{#snippet action()}
	<button
		type="button"
		class="inline-flex min-h-11 cursor-pointer items-center justify-center px-3 text-[17px] font-medium text-(--newsroom-link) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--newsroom-link)"
		onclick={onReset}
	>
		<Crossfade key={'viewall-' + $locale} inline class="inline-grid">
			<span>{$t('blog.view_all')}</span>
		</Crossfade>
	</button>
{/snippet}

<StatusState
	icon={Newspaper}
	code={0}
	title={$t('blog.no_stories')}
	description={$t('blog.no_posts_in_category')}
	transitionKey={$locale}
	detailLabel={$t('blog.article_index')}
	detailValue={$t('blog.article_count', { count: '0' })}
	{action}
	layout="viewport"
/>
