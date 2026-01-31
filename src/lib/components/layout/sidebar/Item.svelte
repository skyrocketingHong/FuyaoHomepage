<script lang="ts">
	/**
	 * 侧边栏基础项组件
	 * 
	 * 侧边栏列表中的原子项，可能是链接 (a) 或按钮 (button)。
	 * 
	 * @prop label - 显示的文本标签
	 * @prop icon - 图标组件
	 * @prop href - 跳转链接
	 * @prop onclick - 点击回调
	 * @prop isActive - 是否处于激活状态 (默认 false)
	 * @prop children - Svelte Snippet 内容 (若存在则覆盖 label)
	 * @prop class - 额外的 CSS 类名
	 */
	import type { Component, Snippet } from 'svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';

	let {
		label,
		icon: Icon,
		href,
		onclick,
		isActive = false,
		children,
		class: className = '',
		...rest
	} = $props<{
		label?: string;
		icon?: Component<any>;
		href?: string;
		onclick?: () => void;
		isActive?: boolean;
		children?: Snippet;
		class?: string;
		[key: string]: any;
	}>();

	// 使用来自 app.css 的全局类名以保持一致性
	const baseClasses = "sidebar-item-base";
	const activeClasses = "sidebar-item-active";
	const inactiveClasses = "sidebar-item-inactive";
</script>

{#if href}
	<a
		{href}
		class="{baseClasses} {isActive ? activeClasses : inactiveClasses} {className}"
		{onclick}
		{...rest}
	>
		{#if Icon}
			<Icon class="sidebar-icon" />
		{/if}
		{#if children}
			{@render children()}
		{:else}
			<Crossfade key={label!} class="inline-grid w-full"><span>{label}</span></Crossfade>
		{/if}
	</a>
{:else}
	<button
		class="{baseClasses} {isActive ? activeClasses : inactiveClasses} {className}"
		{onclick}
		{...rest}
	>
		{#if Icon}
			<Icon class="sidebar-icon" />
		{/if}
		{#if children}
			{@render children()}
		{:else}
			<Crossfade key={label!} class="inline-grid w-full"><span>{label}</span></Crossfade>
		{/if}
	</button>
{/if}
