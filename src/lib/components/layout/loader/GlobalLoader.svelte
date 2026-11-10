<script lang="ts">
	/**
	 * 全局加载器组件
	 *
	 * 在初始化或资源加载时显示的全屏遮罩层。
	 *
	 * @prop showContent - 是否显示页面内容 (默认 false)
	 */
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import LoadingState from '$lib/components/ui/feedback/LoadingState.svelte';
	import { getTranslation } from '$lib/i18n/store';
	import { publicConfig } from '$lib/config/public';

	const loadingText = `${getTranslation('common.travingto')}${getTranslation('common.colon')}${publicConfig.site.name}`;
	const transitionDuration = 400;

	let { showContent } = $props<{ showContent: boolean }>();

	/** 供 SPA fallback 的水合实例触发与正常根布局完全相同的 Crossfade 退场。 */
	export function finishLoading(): Promise<void> {
		showContent = true;
		return new Promise((resolve) => window.setTimeout(resolve, transitionDuration));
	}
</script>

<template id="fuyao-global-loader-start"></template>
<Crossfade
	key={showContent}
	duration={transitionDuration}
	class="z-loader pointer-events-none fixed inset-0"
>
	{#if !showContent}
		<div class="pointer-events-auto h-full w-full">
			<LoadingState loading={true} variant="fullscreen" text={loadingText} />
		</div>
	{:else}
		<!-- 占位，确保crossfade正常工作 -->
		<div></div>
	{/if}
</Crossfade>
<template id="fuyao-global-loader-end"></template>
