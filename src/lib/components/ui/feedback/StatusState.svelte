<script lang="ts">
	/**
	 * 统一状态页卡片
	 *
	 * 复用全局错误页的视觉层级，适用于错误、空数据等全尺寸状态。
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
	 * @prop surface - card 显示独立玻璃卡片，embedded 用于已有容器内
	 * @prop class - 状态区域的附加布局类
	 */
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import { cn } from '$lib/utils';
	import type { ComponentType, Snippet } from 'svelte';

	interface Props {
		icon: ComponentType;
		code: string | number;
		title: string;
		description: string;
		transitionKey: unknown;
		detailLabel?: string;
		detailValue?: string;
		action?: Snippet;
		surface?: 'card' | 'embedded';
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
		surface = 'card',
		class: className = ''
	}: Props = $props();
</script>

{#snippet content()}
	<div class="flex flex-col items-center justify-center gap-8 py-4 text-center">
		<Icon class="size-20 opacity-20" strokeWidth={1.5} />

		<div class="flex flex-col items-center gap-2">
			<span class="text-6xl font-black tracking-tighter opacity-90">{code}</span>
			<h1 class="text-2xl font-bold tracking-tight">
				<Crossfade key={`status-title-${String(transitionKey)}`} inline class="inline-grid">
					<span>{title}</span>
				</Crossfade>
			</h1>
		</div>

		<p class="text-sm text-balance text-muted-foreground opacity-70">
			<Crossfade key={`status-description-${String(transitionKey)}`} inline class="inline-grid">
				<span>{description}</span>
			</Crossfade>
		</p>

		{#if detailLabel && detailValue}
			<div
				class="w-full rounded-2xl bg-black/5 p-4 transition-colors group-hover:bg-black/10 dark:bg-white/5 dark:group-hover:bg-white/10"
			>
				<div class="flex items-center justify-between gap-4 text-sm">
					<span class="shrink-0 font-medium opacity-50">
						<Crossfade key={`status-detail-${String(transitionKey)}`} inline class="inline-grid">
							<span>{detailLabel}</span>
						</Crossfade>
					</span>
					<code
						class="truncate rounded-md bg-black/5 px-2 py-1 font-mono text-xs opacity-70 dark:bg-white/5"
					>
						<Crossfade key={`status-value-${String(transitionKey)}`} inline class="inline-grid">
							<span>{detailValue}</span>
						</Crossfade>
					</code>
				</div>
			</div>
		{/if}

		{#if action}
			{@render action()}
		{/if}
	</div>
{/snippet}

<div class={cn('z-content flex h-full w-full flex-col items-center justify-center', className)}>
	{#if surface === 'card'}
		<LiquidGlass class="w-full max-w-lg" tilt={false}>
			{@render content()}
		</LiquidGlass>
	{:else}
		<div class="w-full max-w-lg">
			{@render content()}
		</div>
	{/if}
</div>
