<script lang="ts">
	/**
	 * 通用区块标题组件
	 *
	 * 统一展示区块的图标、标题、副标题以及右侧的额外信息。
	 * 支持 Crossfade 动画。
	 */
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import { t, locale } from '$lib/i18n/store';
	import type { ComponentType } from 'svelte';

	interface Props {
		/** 图标组件 (Lucide Svelte) */
		icon: ComponentType;
		/** 图标背景色类名 (e.g. "bg-sky-500/20") */
		iconBgColor: string;
		/** 图标颜色类名 (e.g. "text-sky-400") */
		iconColor: string;
		/** 标题 i18n key */
		titleKey: string;
		/** 副标题 i18n key (可选) */
		subtitleKey?: string;
		/** 右侧文本 i18n key (可选) */
		rightKey?: string;
		/** 右侧插槽 (替代 rightKey) */
		rightSection?: import('svelte').Snippet;
		/** 自定义类名 */
		class?: string;
	}

	let {
		icon: Icon,
		iconBgColor,
		iconColor,
		titleKey,
		subtitleKey,
		rightKey,
		rightSection
	}: Props = $props();
</script>

<div class="mb-4 flex items-center justify-between" style="text-shadow: 0 1px 6px rgba(0,0,0,0.35)">
	<div class="flex items-center gap-4">
		<LiquidGlass class={`h-12 w-12 rounded-2xl p-3 ${iconBgColor} ${iconColor}`}>
			<Icon size={24} />
		</LiquidGlass>
		<div>
			<h2 class="text-2xl font-bold text-foreground">
				<Crossfade key={$locale} class="inline-grid"><span>{$t(titleKey)}</span></Crossfade>
			</h2>
			{#if subtitleKey}
				<p class="text-[10px] text-foreground/90">
					<Crossfade key={$locale} class="inline-grid"><span>{$t(subtitleKey)}</span></Crossfade>
				</p>
			{/if}
		</div>
	</div>
	{#if rightSection}
		{@render rightSection()}
	{:else if rightKey}
		<span class="text-xs text-foreground/90">
			<Crossfade key={$locale} class="inline-grid"><span>{$t(rightKey)}</span></Crossfade>
		</span>
	{/if}
</div>
