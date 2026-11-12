<script lang="ts">
	import { fade } from 'svelte/transition';
	import { cn } from '$lib/utils/index';
	import type { Snippet } from 'svelte';

	/**
	 * 交叉淡入淡出组件
	 *
	 * 使用 CSS Grid 或 absolute 定位将退出和进入的组件堆叠在一起，实现平滑的淡入淡出切换。
	 *
	 * @prop key - 触发过渡的唯一标识 (通常是路径或派生状态)
	 * @prop children - Svelte Snippet 内容
	 * @prop duration - 过渡持续时间 (毫秒，默认 300)
	 * @prop inDuration - 进入过渡持续时间 (覆盖 duration)
	 * @prop outDuration - 退出过渡持续时间 (覆盖 duration)
	 * @prop class - 额外的 CSS 类名
	 * @prop scrollable - 是否支持子内容滚动 (默认 false)
	 * @prop inline - 行内模式 (默认 false)。为 true 时使用 span 输出，
	 *   用于 p、标题、按钮、文字链接等行内上下文，避免 div 嵌套导致无效 HTML 与水合不一致
	 */
	let {
		key,
		children,
		duration = 300,
		inDuration,
		outDuration,
		class: className = '',
		scrollable = false,
		inline = false
	}: {
		key: unknown;
		children: Snippet;
		duration?: number;
		inDuration?: number;
		outDuration?: number;
		class?: string;
		scrollable?: boolean;
		inline?: boolean;
	} = $props();

	let resolvedInDuration = $derived(inDuration ?? duration);
	let resolvedOutDuration = $derived(outDuration ?? duration);
</script>

{#if scrollable}
	<div class={cn('relative min-h-0', className)}>
		{#key key}
			<div
				class="absolute inset-0"
				in:fade={{ duration: resolvedInDuration }}
				out:fade={{ duration: resolvedOutDuration }}
			>
				{@render children()}
			</div>
		{/key}
	</div>
{:else if inline}
	<span class={cn('inline-grid grid-cols-[minmax(0,1fr)]', className)}>
		{#key key}
			<span
				class="col-start-1 row-start-1"
				in:fade={{ duration: resolvedInDuration }}
				out:fade={{ duration: resolvedOutDuration }}
			>
				{@render children()}
			</span>
		{/key}
	</span>
{:else}
	<div class={cn('grid grid-cols-[minmax(0,1fr)]', className)}>
		{#key key}
			<div
				class="col-start-1 row-start-1 size-full"
				in:fade={{ duration: resolvedInDuration }}
				out:fade={{ duration: resolvedOutDuration }}
			>
				{@render children()}
			</div>
		{/key}
	</div>
{/if}
