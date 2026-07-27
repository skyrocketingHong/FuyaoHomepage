<script lang="ts">
	/**
	 * 顶栏分段胶囊容器组件
	 *
	 * 将多个相关操作按钮合并为单一玻璃胶囊，避免多个独立玻璃按钮叠加产生多重边框。
	 * 胶囊外壳使用 .header-control-shell 共享材质 (见 components.css 与 theme.css 的
	 * --header-control-* token)：外壳自行承担一次 control 级原生背景模糊，
	 * 不依赖 HeaderChrome (页面顶部时 Chrome 会隐藏并卸载)，不注册 WebGL 合成器；
	 * 内部按钮应使用 ActionButton 的 bare 模式 (透明背景，不单独模糊/加边框/加阴影，
	 * hover/active 仅改变内部填充)，按钮之间由容器提供低透明度内部竖线 (hairline divider)。
	 *
	 * @prop class - 额外的 CSS 类名
	 * @prop children - 分段按钮内容 (通常为多个 bare 模式的 ActionButton)
	 */
	import { cn } from '$lib/utils/index';
	import type { Snippet } from 'svelte';

	let { children, class: className = '' } = $props<{
		children: Snippet;
		class?: string;
	}>();
</script>

<div
	role="group"
	class={cn(
		'header-control-shell action-group flex h-11 items-center overflow-hidden rounded-full md:h-9',
		className
	)}
>
	{@render children()}
</div>

<style>
	/* 分段之间的内部竖线 (hairline divider)，与 Header 控件共用 token */
	.action-group > :global(* + *) {
		border-left: 1px solid var(--header-control-divider);
	}
</style>
