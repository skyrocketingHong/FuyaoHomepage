<script lang="ts">
	/**
	 * 共享玻璃合成器画布组件
	 *
	 * 渲染全页面唯一的 GPU 画布，覆盖在马赛克背景 Canvas 之上：
	 * 先绘制清晰背景，再在注册的玻璃矩形位置叠加圆角模糊区域。
	 * WebGL2 不可用时自动移除画布，玻璃组件回退到 CSS backdrop-filter。
	 *
	 * 渲染按需触发，静止时无 GPU 渲染循环。
	 */
	import { glassCompositor } from '$lib/utils/effect/glassCompositor.svelte';
	import { onMount } from 'svelte';

	let canvas: HTMLCanvasElement | undefined = $state();
	let failed = $state(false);

	onMount(() => {
		if (!canvas) return;
		const ok = glassCompositor.attach(canvas);
		if (!ok) failed = true;
		return () => glassCompositor.detach();
	});
</script>

{#if !failed}
	<!-- ready 之前保持隐藏：alpha:false 的默认帧缓冲为不透明黑色，未完成首帧合成前不能覆盖源画布 -->
	<canvas
		bind:this={canvas}
		class="pointer-events-none absolute inset-0 block h-full w-full"
		style="visibility: {glassCompositor.ready ? 'visible' : 'hidden'};"
		aria-hidden="true"
	></canvas>
{/if}
