<script lang="ts">
	/**
	 * 统一状态卡片。
	 *
	 * viewport 模式固定在 Header 与 Bottom Dock 之间的实际可用区域中央，并由
	 * MainContent 通过稳定数据标记关闭当前实例滚动；embedded 模式仅渲染在已有父容器内。
	 * 所有可变文本通过 transitionKey 触发 Crossfade，避免语言切换时直接跳变。
	 *
	 * @prop icon - 状态图标组件
	 * @prop code - 状态数字或短标识
	 * @prop title - 状态标题
	 * @prop description - 状态说明
	 * @prop transitionKey - 文本过渡键，通常为当前 locale
	 * @prop detailLabel - 可选详情标签
	 * @prop detailValue - 可选详情值
	 * @prop action - 可选操作区 snippet
	 * @prop layout - viewport 用于页面级状态，embedded 用于局部父容器
	 * @prop iconClass - 状态图标附加类名
	 * @prop class - 状态区域的附加布局类
	 */
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import { cn } from '$lib/utils';
	import type { ComponentType, Snippet } from 'svelte';

	interface Props {
		icon: ComponentType;
		code?: string | number;
		title: string;
		description: string;
		transitionKey: unknown;
		detailLabel?: string;
		detailValue?: string;
		action?: Snippet;
		layout?: 'viewport' | 'embedded';
		iconClass?: string;
		class?: string;
	}

	let {
		icon: Icon,
		code,
		title,
		description,
		transitionKey,
		detailLabel,
		detailValue,
		action,
		layout = 'viewport',
		iconClass = '',
		class: className = ''
	}: Props = $props();
</script>

{#snippet content()}
	<div class="flex flex-col items-center justify-center gap-4 text-center">
		<Icon class={cn('size-12 opacity-25', iconClass)} strokeWidth={1.5} aria-hidden="true" />

		<div class="flex flex-col items-center gap-2">
			{#if code !== undefined && code !== ''}
				<span class="text-[44px] leading-none font-black tracking-tighter opacity-90">{code}</span>
			{/if}
			<h1 class="text-xl font-bold tracking-tight md:text-2xl">
				<Crossfade key={`status-title-${String(transitionKey)}`} inline class="inline-grid">
					<span>{title}</span>
				</Crossfade>
			</h1>
		</div>

		<p class="max-w-md text-sm leading-5 text-balance text-muted-foreground opacity-75">
			<Crossfade key={`status-description-${String(transitionKey)}`} inline class="inline-grid">
				<span>{description}</span>
			</Crossfade>
		</p>

		{#if detailLabel && detailValue}
			<div
				class="inline-flex max-w-full items-center justify-center gap-2 rounded-xl bg-black/5 px-3 py-2 text-sm transition-colors dark:bg-white/5"
			>
				<span class="shrink-0 font-medium opacity-55">
					<Crossfade key={`status-detail-${String(transitionKey)}`} inline class="inline-grid">
						<span>{detailLabel}</span>
					</Crossfade>
				</span>
				<code
					class="min-w-0 truncate rounded-md bg-black/5 px-2 py-1 font-mono text-xs opacity-75 dark:bg-white/5"
					title={detailValue}
				>
					<Crossfade key={`status-value-${String(transitionKey)}`} inline class="inline-grid">
						<span class="truncate">{detailValue}</span>
					</Crossfade>
				</code>
			</div>
		{/if}

		{#if action}
			{@render action()}
		{/if}
	</div>
{/snippet}

<div
	data-status-layout={layout}
	class={cn(
		layout === 'viewport'
			? 'viewport-state-region z-content'
			: 'flex w-full min-w-0 items-center justify-center',
		className
	)}
>
	{#if layout === 'viewport'}
		<LiquidGlass class="w-full max-w-[520px] rounded-[24px] !p-5 md:!p-6" tilt={false}>
			{@render content()}
		</LiquidGlass>
	{:else}
		<div class="w-full max-w-[520px] px-5 py-5 md:px-6 md:py-6">
			{@render content()}
		</div>
	{/if}
</div>
