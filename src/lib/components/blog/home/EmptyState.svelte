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

<div class="text-center py-24">
    <div class="inline-block p-6 rounded-full bg-muted/50 mb-6">
        <span class="text-4xl">📭</span>
    </div>
    <h3 class="text-2xl font-bold text-foreground mb-3">
        <Crossfade key={'nostories-' + $locale} class="inline-grid">
            <span>{$t('blog.no_stories')}</span>
        </Crossfade>
    </h3>
    <p class="text-muted-foreground text-lg mb-8">
        <Crossfade key={'noposts-' + $locale} class="inline-grid">
            <span>{$t('blog.no_posts_in_category')}</span>
        </Crossfade>
    </p>
    <div class="text-center">
        <LiquidGlass 
            tag="button"
            class="!w-auto inline-flex px-4 py-2 rounded-full text-foreground transition-colors"
            onclick={onReset}
        >
            <Crossfade key={'viewall-' + $locale} class="inline-grid">
                <span>{$t('blog.view_all')}</span>
            </Crossfade>
        </LiquidGlass>
    </div>
</div>
