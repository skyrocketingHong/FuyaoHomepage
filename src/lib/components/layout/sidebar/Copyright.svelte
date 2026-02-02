<script lang="ts">
	/**
	 * 版权信息组件
	 *
	 * 展示网站的版权年份和所有者。
	 * 
	 * @prop direction - 排列方向：'vertical' (垂直) | 'horizontal' (水平) | 'auto' (响应式)
	 * @prop background - 当前背景模式
	 * @prop infoComponent - 可选的背景信息展示组件
	 */
	import { t, locale } from '$lib/i18n/store';
	import { SiGithub } from '@icons-pack/svelte-simple-icons';
	import { repoConfig, type BackgroundMode } from '$lib/config';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
    import type { Component } from 'svelte';

	const startYear = Number(import.meta.env.VITE_SITE_START_YEAR);
	const currentYear = new Date().getFullYear();

	let { 
        direction = 'auto',
        background = 'none',
        infoComponent: InfoComponent = null
    } = $props<{
		direction?: 'vertical' | 'horizontal' | 'auto';
        background?: BackgroundMode;
        infoComponent?: Component<any> | null;
	}>();

	// 垂直: flex-col with gap-1
	// 水平: flex-row with gap-2
	// 自动: 响应式
	let containerClass = $derived.by(() => {
		const base = 'flex items-center justify-center transition-opacity duration-300';
		if (direction === 'vertical') return `${base} flex-col gap-1`;
		if (direction === 'horizontal') return `${base} flex-col w-full`;
		return `${base} flex-col gap-1 md:flex-row md:gap-3`;
	});

	let separatorClass = $derived.by(() => {
		if (direction === 'vertical') return 'hidden';
		if (direction === 'horizontal') return 'hidden';
		return 'hidden md:inline';
	});
</script>

{#snippet copyrightText()}
	<span class={separatorClass}><br></span>
	<span>© {$t('common.copyright', { startYear, currentYear })}</span>
	<span class={separatorClass}><br></span>
	<span class="inline-flex items-center gap-1 justify-end">
		<span>Version {__APP_VERSION__} of</span>
		<a
			href={repoConfig.url}
			target="_blank"
			rel="noopener noreferrer"
			class="inline-flex items-center gap-1 hover:text-foreground transition-colors">
			<div class={ 'w-3.5 h-3.5' + ' [&>svg]:w-full [&>svg]:h-full'}>
				<SiGithub />
			</div>
			<span>{repoConfig.name}</span>
		</a>
	</span>
{/snippet}

<div class="w-full flex-none text-center text-xs text-muted-foreground drop-shadow-md opacity-70">
	<Crossfade key={$locale} class={containerClass}>
		{#if direction === 'horizontal'}
			<!-- 移动端水平布局 -->
			{#if InfoComponent}
				<!-- 顶部分隔线 -->
				<div class="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent mt-0 mb-1"></div>
				<div class="flex w-full items-center justify-between">
					<!-- 左侧：背景信息 -->
					<div class="flex items-center gap-2">
						<span class="text-[10px] whitespace-nowrap">{$t('layout.sidebar.background_source')}</span>
						<div class="origin-left">
							<InfoComponent />
						</div>
					</div>
					
					<!-- 右侧：版权信息 -->
					<div class="flex flex-col items-end text-[10px] leading-snug text-right">
						{@render copyrightText()}
					</div>
				</div>
			{:else}
				<!-- 移动端无信息显示时的版权排版 -->
				<div class="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent mt-0 mb-1"></div>
				<div class="flex flex-col w-full items-center justify-center text-[10px]">
					{@render copyrightText()}
				</div>
			{/if}
		{:else}
			<!-- 桌面端/垂直布局 -->
			{#if InfoComponent}
				<!-- 顶部间距 + 背景信息 -->
				<div class="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent my-2 pl-2 pr-2"></div>
				<div class="w-full flex items-center justify-between pl-4 pr-2">
					<span>{$t('layout.sidebar.background_source')}</span>
					<InfoComponent />
				</div>
			{/if}

			<!-- 底部间距（垂直模式逻辑下始终显示） -->
			<div class="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent my-2 pl-2 pr-2"></div>
			
			<!-- 版权文本直接渲染在容器中 -->
			{@render copyrightText()}
		{/if}
	</Crossfade>
</div>

