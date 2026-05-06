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

	let { onReset } = $props<{ onReset: () => void }>();
</script>

<div class="py-24 text-center">
	<div class="mb-6 inline-block rounded-full bg-muted/50 p-6">
		<span class="text-4xl">📭</span>
	</div>
	<h3 class="mb-3 text-2xl font-bold text-foreground">
		<Crossfade key={'nostories-' + $locale} class="inline-grid">
			<span>{$t('blog.no_stories')}</span>
		</Crossfade>
	</h3>
	<p class="mb-8 text-lg text-muted-foreground">
		<Crossfade key={'noposts-' + $locale} class="inline-grid">
			<span>{$t('blog.no_posts_in_category')}</span>
		</Crossfade>
	</p>
	<div class="text-center">
		<LiquidGlass
			tag="button"
			class="inline-flex !w-auto rounded-full px-4 py-2 text-foreground transition-colors"
			onclick={onReset}
		>
			<Crossfade key={'viewall-' + $locale} class="inline-grid">
				<span>{$t('blog.view_all')}</span>
			</Crossfade>
		</LiquidGlass>
	</div>
</div>
