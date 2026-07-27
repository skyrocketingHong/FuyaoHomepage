<script lang="ts">
	/**
	 * 博客首页空状态组件
	 *
	 * 在分类下无文章时显示，提供返回“全部”分类的操作。
	 *
	 * @prop onReset - 点击“查看所有文章”时的重置回调
	 */
	import { t, locale } from '$lib/i18n/store';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import StatusState from '$lib/components/ui/feedback/StatusState.svelte';
	import { Newspaper } from 'lucide-svelte';

	let { onReset } = $props<{ onReset: () => void }>();
</script>

{#snippet action()}
	<LiquidGlass
		tag="button"
		variant="control"
		gpuBlur={false}
		contentLayout="center"
		class="inline-flex !w-auto rounded-full px-4 py-2 text-foreground transition-colors"
		onclick={onReset}
	>
		<Crossfade key={'viewall-' + $locale} inline class="inline-grid">
			<span>{$t('blog.view_all')}</span>
		</Crossfade>
	</LiquidGlass>
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
	class="min-h-[28rem] py-8"
/>
