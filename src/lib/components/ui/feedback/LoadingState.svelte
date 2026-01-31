<script lang="ts">
	/**
	 * 加载状态管理器
	 *
	 * 统一管理加载中、错误及正常内容三种状态的切换。
	 * 支持内联 (inline) 和全屏 (fullscreen) 布局模式。
	 * 
	 * @prop loading - 是否处于加载状态 (默认 false)
	 * @prop error - 错误信息内容 (默认 '')
	 * @prop variant - 布局模式：'inline' | 'fullscreen' (默认 'inline')
	 * @prop text - 自定义加载文案
	 * @prop showText - 是否显示文字 (默认 true)
	 * @prop class - 额外的 CSS 类名
	 * @prop children - Svelte Snippet 正常显示的内容
	 */
	import LoadingSpinner from '$lib/components/ui/feedback/LoadingSpinner.svelte';
	import Copyright from '$lib/components/layout/sidebar/Copyright.svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
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
		<div class="relative flex h-full w-full flex-col items-center justify-center bg-background {className}">
			<div class="flex flex-row items-center justify-center gap-4">
				<LoadingSpinner size="md" />
				{#if showText}
					<span class="text-xs font-medium tracking-widest text-muted-foreground">
						{displayText}
					</span>
				{/if}
			</div>

			{#if showText}
				<div class="absolute bottom-2 md:bottom-4 flex w-full justify-center">
					<Copyright direction="vertical" />
				</div>
			{/if}
		</div>
	{:else}
		<!-- 内联模式 -->
		<div class="inline-flex items-center gap-3 text-muted-foreground {className}" in:fade>
			<LoadingSpinner size="sm" />
			{#if showText}
				<Crossfade key={$locale} class="inline-grid items-center">
					<span>{displayText}</span>
				</Crossfade>
			{/if}
		</div>
	{/if}
{:else if error}
	<div
		class="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive {className}"
		in:fade
	>
		{error}
	</div>
{:else if children}
	{@render children()}
{/if}
