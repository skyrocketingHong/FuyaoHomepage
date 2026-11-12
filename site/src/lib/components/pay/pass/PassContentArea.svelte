<script lang="ts">
	/**
	 * Pass 可伸缩内容展示区。
	 *
	 * 区域始终使用统一水平内边距和 `min-height: 0`，不建立滚动容器。
	 * `start` 用于顶部说明，`center` 用于二维码或图标，`fill` 用于占满可用区的媒体。
	 * 具体业务内容负责在空间不足时切换紧凑布局，父级负责提供实际可见高度。
	 *
	 * @prop layout - 内容对齐方式：`start`、`center` 或 `fill`。
	 * @prop children - 二维码、图片、图标、文字或混合内容 snippet。
	 * @prop class - 业务内容布局附加类名，不得启用滚动。
	 */
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/index';

	interface Props {
		layout?: 'start' | 'center' | 'fill';
		children: Snippet;
		class?: string;
	}

	let { layout = 'start', children, class: className = '' }: Props = $props();
</script>

<section
	class={cn('pass-content min-h-0 min-w-0', className)}
	class:pass-content--start={layout === 'start'}
	class:pass-content--center={layout === 'center'}
	class:pass-content--fill={layout === 'fill'}
>
	{@render children()}
</section>

<style>
	.pass-content {
		overflow: visible;
		padding: var(--payment-card-content-block) var(--payment-card-content-inline);
	}

	.pass-content--start {
		display: flex;
		align-items: flex-start;
		justify-content: flex-start;
	}

	.pass-content--center {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pass-content--fill {
		display: block;
	}
</style>
