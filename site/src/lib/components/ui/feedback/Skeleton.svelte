<script lang="ts">
	/**
	 * 骨架屏组件
	 *
	 * 用于加载状态占位。
	 */
	import { cn } from '$lib/utils/index';

	let { class: className, ...rest } = $props();
</script>

<div class={cn('animate-pulse rounded bg-muted/20', className)} {...rest}></div>
