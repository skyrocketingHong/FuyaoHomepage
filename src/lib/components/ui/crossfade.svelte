<script lang="ts">
	import { fade } from 'svelte/transition';
	import { cn } from '$lib/utils';

	/**
	 * 统一交叉渐变组件
	 * Unified Crossfade Component
	 *
	 * 使用 CSS Grid 将退出和进入的组件堆叠在一起，实现平滑的淡入淡出切换。
	 * Uses CSS Grid to stack exiting and entering components on top of each other.
	 *
	 * @prop key - 触发过渡的唯一键 (Trigger key, usually path or derived value)
	 * @prop duration - 过渡持续时间 (Transition duration in ms, default: 300)
	 * @prop class - 包装器的额外类名 (Additional classes)
	 */
	let { key, children, duration = 300, class: className = '' } = $props();
</script>

<div class={cn('grid', className)}>
	{#key key}
		<div
			class="col-start-1 row-start-1"
			in:fade={{ duration }}
			out:fade={{ duration }}
		>
			{@render children()}
		</div>
	{/key}
</div>
