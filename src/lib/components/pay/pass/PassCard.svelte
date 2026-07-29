<script lang="ts">
	/**
	 * 通用 Pass 卡片外壳。
	 *
	 * 组件只负责统一宽高、圆角、表面、前景、阴影及“身份条—内容区—操作区”三段布局。
	 * 当前卡片自身保留圆角裁切；未选中卡片的详情区保持完整渲染，但从键盘和辅助技术中停用。
	 * 卡片堆叠坐标、固定层级、底部 Dock 避让和整体位移动画均由父级控制。
	 *
	 * @prop identity - 身份条 snippet，通常渲染 PassIdentityBar。
	 * @prop content - 可伸缩内容区 snippet，通常渲染 PassContentArea。
	 * @prop action - 固定高度操作区 snippet，通常渲染 PassActionArea。
	 * @prop panelId - 身份条 `aria-controls` 对应的详情区 ID。
	 * @prop selected - 当前卡片是否选中；选中状态同时决定详情区的可交互性。
	 * @prop surface - 完全不透明的卡片表面颜色。
	 * @prop foreground - 卡片前景颜色。
	 * @prop labelledBy - 为卡片提供名称的身份条标题 ID。
	 * @prop cardKey - 供调试与验收识别卡片的数据标识，不参与布局或交互。
	 * @prop class - 业务卡片附加类名；不得用于计算堆叠位置。
	 */
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/index';

	interface Props {
		identity: Snippet;
		content: Snippet;
		action: Snippet;
		panelId: string;
		selected?: boolean;
		surface?: string;
		foreground?: string;
		labelledBy?: string;
		cardKey?: string;
		class?: string;
	}

	let {
		identity,
		content,
		action,
		panelId,
		selected = false,
		surface = '#ffffff',
		foreground = '#111827',
		labelledBy,
		cardKey,
		class: className = ''
	}: Props = $props();

	let surfaceStyle = $derived(
		`--pass-card-surface: ${surface}; --pass-card-foreground: ${foreground};`
	);
</script>

<article
	class={cn('pass-card min-h-0 w-full min-w-0', className)}
	class:pass-card--selected={selected}
	style={surfaceStyle}
	aria-labelledby={labelledBy}
	data-card-key={cardKey}
	data-selected={selected ? 'true' : 'false'}
>
	<div class="pass-card__layout grid min-h-0 min-w-0">
		{@render identity()}

		<div
			id={panelId}
			class="pass-card__details grid min-h-0 min-w-0"
			inert={!selected}
			aria-hidden={!selected}
		>
			{@render content()}
			{@render action()}
		</div>
	</div>
</article>

<style>
	.pass-card {
		height: var(--payment-card-visual-height, 100%);
		overflow: hidden;
		color: var(--pass-card-foreground);
		background: var(--pass-card-surface);
		border: 1px solid var(--payment-card-border-color);
		border-radius: var(--payment-card-radius);
		box-shadow: var(--payment-card-shadow);
		color-scheme: light;
	}

	.pass-card__layout {
		width: 100%;
		height: 100%;
		grid-template-rows: var(--payment-card-header-height) minmax(0, 1fr);
	}

	.pass-card--selected .pass-card__layout {
		height: min(100%, var(--payment-interactive-card-height, 100%));
	}

	.pass-card__details {
		grid-template-rows: minmax(0, 1fr) var(--payment-action-height);
	}
</style>
