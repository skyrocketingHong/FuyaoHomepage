<script lang="ts">
	import { fade } from 'svelte/transition';
	import { cn } from '$lib/utils';

	/**
	 * 交叉淡入淡出组件
	 *
	 * 使用 CSS Grid 将退出和进入的组件堆叠在一起，实现平滑的淡入淡出切换。
	 *
	 * @prop key - 触发过渡的唯一标识 (通常是路径或派生状态)
	 * @prop children - Svelte Snippet 内容
	 * @prop duration - 过渡持续时间 (毫秒，默认 300)
	 * @prop class - 额外的 CSS 类名
	 */
	let { key, children, duration = 300, class: className = '' } = $props();
</script>

<div class={cn('grid grid-cols-[minmax(0,1fr)]', className)}>
	{#key key}
		<div
			class="col-start-1 row-start-1 size-full"
			in:fade={{ duration }}
			out:fade={{ duration }}
		>
			{@render children()}
		</div>
	{/key}
</div>
