<script lang="ts">
	/**
	 * Pass 身份条。
	 *
	 * 统一渲染不可压缩图标、左对齐标题与描述。`selectable` 为 true 时使用真实按钮，
	 * 并通过 `aria-expanded`、`aria-controls` 和可读标签表达详情展开状态；普通模式仅展示内容。
	 * 身份条只负责选择当前卡片，传入的文字 snippet 不得包含链接或其他交互元素。
	 *
	 * @prop icon - 单色或品牌图标 snippet。
	 * @prop title - 标题 snippet；在行内容器中使用 Crossfade。
	 * @prop description - 描述 snippet；在行内容器中使用 Crossfade。
	 * @prop titleId - 标题元素 ID，供 PassCard 的 `aria-labelledby` 使用。
	 * @prop selectable - 是否启用语义化选择按钮。
	 * @prop selected - 当前卡片是否选中。
	 * @prop controlsId - 该按钮控制的卡片详情区 ID。
	 * @prop label - 选择按钮的完整可读标签。
	 * @prop onselect - 选择当前卡片的回调。
	 * @prop iconSurface - 图标中性或品牌底板颜色。
	 */
	import type { Snippet } from 'svelte';

	interface Props {
		icon: Snippet;
		title: Snippet;
		description: Snippet;
		titleId: string;
		selectable?: boolean;
		selected?: boolean;
		controlsId?: string;
		label?: string;
		onselect?: () => void;
		iconSurface?: string;
	}

	let {
		icon,
		title,
		description,
		titleId,
		selectable = false,
		selected = false,
		controlsId,
		label,
		onselect,
		iconSurface = 'rgb(255 255 255 / 0.22)'
	}: Props = $props();
</script>

{#snippet identityContent()}
	<span
		class="pass-identity__icon flex size-[var(--payment-card-icon-size)] shrink-0 items-center justify-center rounded-[12px]"
		style={`--pass-identity-icon-surface: ${iconSurface};`}
		aria-hidden="true"
	>
		{@render icon()}
	</span>

	<span class="flex min-w-0 flex-1 flex-col items-start text-left">
		<strong id={titleId} class="max-w-full truncate text-[16px] leading-5 font-semibold">
			{@render title()}
		</strong>
		<span class="mt-0.5 max-w-full truncate text-[12px] leading-4 font-medium opacity-70">
			{@render description()}
		</span>
	</span>
{/snippet}

{#if selectable}
	<button
		type="button"
		class="pass-identity flex h-[var(--payment-card-header-height)] min-h-11 w-full min-w-0 items-center gap-3 px-[var(--payment-card-content-inline)] py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-current"
		onclick={onselect}
		aria-expanded={selected}
		aria-controls={controlsId}
		aria-label={label}
	>
		{@render identityContent()}
	</button>
{:else}
	<div
		class="pass-identity flex h-[var(--payment-card-header-height)] min-w-0 items-center gap-3 px-[var(--payment-card-content-inline)] py-3"
	>
		{@render identityContent()}
	</div>
{/if}

<style>
	.pass-identity__icon {
		background: var(--pass-identity-icon-surface);
	}
</style>
