<script lang="ts">
	/**
	 * 加载状态组件
	 *
	 * 统一管理 loading/error/正常内容 三态切换。
	 * 支持 inline（内联）和 fullscreen（全屏）两种布局模式。
	 */
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import LiquidGlass from '$lib/components/ui/LiquidGlass.svelte';
	import Crossfade from '$lib/components/ui/Crossfade.svelte';
	import { fade } from 'svelte/transition';
	import { t, locale } from '$lib/i18n/store';
	import type { Snippet } from 'svelte';

	interface Props {
		/** 是否处于加载状态 */
		loading?: boolean;
		/** 错误信息 */
		error?: string;
		/** 布局模式：inline (内联) 或 fullscreen (全屏) */
		variant?: 'inline' | 'fullscreen';
		/** 自定义加载文案，默认使用 i18n */
		text?: string;
		/** 是否显示加载文字 */
		showText?: boolean;
		/** 额外的 CSS 类名 */
		class?: string;
		/** 子内容 */
		children?: Snippet;
	}

	let {
		loading = false,
		error = '',
		variant = 'inline',
		text = '',
		showText = true,
		class: className = '',
		children
	}: Props = $props();

	// 获取显示的文案
	const displayText = $derived(text || $t('common.loading'));
</script>

{#if loading}
	{#if variant === 'fullscreen'}
		<!-- 全屏模式 -->
		<div class="flex h-full w-full items-center justify-center bg-black {className}">
			<LiquidGlass class="w-3/4 p-6 px-10">
				<div class="flex flex-row items-center gap-6">
					<LoadingSpinner size="md" />
					{#if showText}
						<span class="text-xs font-medium tracking-widest text-white/80">
							{displayText}
						</span>
					{/if}
				</div>
			</LiquidGlass>
		</div>
	{:else}
		<!-- 内联模式 -->
		<div class="inline-flex items-center gap-3 text-white/50 {className}" in:fade>
			<LoadingSpinner size="sm" />
			{#if showText}
				<Crossfade key={$locale} class="inline-flex items-center">
					<span>{displayText}</span>
				</Crossfade>
			{/if}
		</div>
	{/if}
{:else if error}
	<div
		class="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-500 {className}"
		in:fade
	>
		{error}
	</div>
{:else if children}
	{@render children()}
{/if}
