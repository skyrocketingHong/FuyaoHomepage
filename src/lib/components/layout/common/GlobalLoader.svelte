<script lang="ts">
	/**
	 * 全局加载器组件
	 *
	 * 在初始化或资源加载时显示的遮罩层。
	 */
	import Crossfade from '$lib/components/ui/Crossfade.svelte';
	import LoadingState from '$lib/components/ui/LoadingState.svelte';
	import { getTranslation } from '$lib/i18n/store';
	
	const VITE_SITE_NAME = import.meta.env.VITE_SITE_NAME;
	const loadingText = `${getTranslation('common.travingto')}${getTranslation('common.colon')}${VITE_SITE_NAME}`;

	let { showContent } = $props<{ showContent: boolean }>();
</script>

<Crossfade key={showContent} duration={400} class="pointer-events-none fixed inset-0 z-[100]">
	{#if !showContent}
		<div class="pointer-events-auto h-full w-full">
			<LoadingState loading={true} variant="fullscreen" text={loadingText}/>
		</div>
	{:else}
		<!-- 占位，确保crossfade正常工作 -->
		<div></div>
	{/if}
</Crossfade>
