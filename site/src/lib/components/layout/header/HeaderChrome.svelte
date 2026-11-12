<script lang="ts">
	/**
	 * 顶栏连续 chrome 背景层组件
	 *
	 * 渲染在 Header 后方、滚动容器之外的独立系统材质层：
	 * 覆盖主内容区顶部完整宽度（桌面端位于侧栏右侧，交界处复用侧栏 border-r 作为垂直分割线），
	 * 内容从顶栏下方滚动经过时由本层实时模糊。
	 *
	 * - 材质：LiquidGlass variant="chrome" + liveBackdrop，不注册 WebGL 合成器
	 * - 边缘：不绘制完整圆角边框；顶部极弱内高光 + 底部 1px 半透明分割线 + 底部柔和阴影
	 * - 高度：移动端覆盖 Header 控件区域及 12px Header-Content 间距 (单行 64px / 双行 108px)，
	 *   底部高光边与分离阴影位于该 12px 间距末端，不紧贴最后一行控件；
	 *   桌面端仅覆盖 64px Header 高度
	 * - 显隐：仅在内容进入 Header 后方时可见，约 180ms 透明度过渡，无位移；
	 *   隐藏后卸载 LiquidGlass liveBackdrop，停止实时模糊合成，不以 opacity:0 空转
	 * - 本层位于 FadeEdge/ScrollContainer 的 mask 之外，自身不参与渐隐
	 *
	 * @prop visible - 是否可见 (由 MainContent 的 headerObscured 驱动)
	 * @prop class - 额外的 CSS 类名
	 */
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import { headerState } from '$lib/stores/app.svelte';
	import { cn } from '$lib/utils/index';
	import { untrack } from 'svelte';

	let { visible = true, class: className = '' } = $props<{ visible?: boolean; class?: string }>();

	// 与 MainContent 的扩展头部判定保持一致：存在中间组件 (CategoryNav) 时移动端为双行
	let isHeaderExtended = $derived(!!headerState.middle.component);

	// 隐藏后延迟卸载 LiquidGlass liveBackdrop：先完成淡出过渡，再停止实时模糊合成
	let rendered = $state(untrack(() => visible));
	let unmountTimer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		clearTimeout(unmountTimer);
		if (visible) {
			rendered = true;
		} else {
			unmountTimer = setTimeout(() => {
				rendered = false;
			}, 200);
		}
		return () => clearTimeout(unmountTimer);
	});
</script>

<div
	class={cn(
		'header-chrome z-controls pointer-events-none absolute inset-x-0 top-0 transition-[height,opacity] duration-200',
		isHeaderExtended
			? 'h-[calc(var(--header-height-extended)+var(--header-content-gap))] lg:h-16'
			: 'h-[calc(var(--header-height)+var(--header-content-gap))] lg:h-16',
		visible ? 'opacity-100' : 'opacity-0',
		className
	)}
	aria-hidden="true"
>
	{#if rendered}
		<LiquidGlass
			variant="chrome"
			liveBackdrop
			showGloss={false}
			class="h-full rounded-none p-0 shadow-none"
		>
			<!-- 空子元素仅用于视觉效果 (LiquidGlass 要求 children) -->
			<div></div>
		</LiquidGlass>
	{/if}
</div>
