<script lang="ts">
	/**
	 * 加载指示器组件
	 *
	 * 统一的加载动画样式，替代多处重复的 spinner 代码。
	 */
	import { cn } from '$lib/utils';

	interface Props {
		/** 尺寸：sm (16px), md (24px), lg (32px) */
		size?: 'sm' | 'md' | 'lg';
		/** 额外的 CSS 类名 */
		class?: string;
	}

	let { size = 'md', class: className = '' }: Props = $props();

	const sizeClasses = {
		sm: 'h-4 w-4 border-2',
		md: 'h-6 w-6 border-2',
		lg: 'h-8 w-8 border-4'
	};
</script>

<div
	class={cn(
		'animate-spin rounded-full border-white/20 border-t-white',
		sizeClasses[size],
		className
	)}
></div>
