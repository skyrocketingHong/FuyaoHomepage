<script lang="ts">
	/**
	 * 加载屏幕组件
	 *
	 * 在初始化或资源加载时显示的遮罩层。
	 */
	import LiquidGlass from '$lib/components/ui/liquid-glass.svelte';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';

	// 硬编码文案
	const loadingText = 'Android is starting...';
</script>

<!-- 全屏遮罩 -->
<div class="flex h-full w-full items-center justify-center bg-black">
	<LiquidGlass class="flex w-3/4 flex-row items-center gap-6 p-6 px-10">
		<!-- 旋转加载球 -->
		<LoadingSpinner size="md" />
		<!-- 加载文字 -->
		<span class="text-xs font-medium tracking-widest text-white/80 uppercase">{loadingText}</span>
	</LiquidGlass>
</div>
