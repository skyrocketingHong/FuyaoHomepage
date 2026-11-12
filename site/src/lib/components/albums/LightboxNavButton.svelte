<script lang="ts">
	/**
	 * 灯箱导航按钮组件
	 *
	 * 灯箱内左右切换照片的导航按钮，使用 LiquidGlass 样式。
	 * 桌面端默认隐藏，hover 照片区域时显示；移动端始终显示。
	 *
	 * @prop icon - 按钮图标 Snippet
	 * @prop onclick - 点击回调
	 * @prop position - 按钮位置 ('left' | 'right')
	 * @prop disabled - 是否禁用（滑动时禁用点击）
	 */
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import type { Snippet } from 'svelte';

	let {
		icon,
		onclick,
		position,
		disabled = false
	}: {
		icon: Snippet;
		onclick: (e: Event) => void;
		position: 'left' | 'right';
		disabled?: boolean;
	} = $props();
</script>

<LiquidGlass
	tag="button"
	variant="control"
	refractive
	blur={8}
	refractionStrength={4}
	contentLayout="center"
	{onclick}
	class="absolute top-1/2 {position === 'left'
		? 'left-2'
		: 'right-2'} z-10 inline-flex min-h-11 !w-auto min-w-11 -translate-y-1/2 rounded-full !p-0 text-white opacity-100 transition-all hover:bg-white/20 md:min-h-9 md:min-w-9 md:opacity-0 md:group-hover/photo:opacity-100 {disabled
		? 'pointer-events-none'
		: ''}"
	tilt={false}
>
	<span class="flex items-center justify-center p-2">
		{@render icon()}
	</span>
</LiquidGlass>
