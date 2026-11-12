<script lang="ts">
	/**
	 * 侧边栏基础项组件
	 *
	 * 支持链接、按钮、可选标识色及双行文本。
	 *
	 * @prop label - 主文本标签
	 * @prop labelEn - 可选第二行文本
	 * @prop labelClass - 主文本样式类
	 * @prop labelEnClass - 第二行文本样式类
	 * @prop color - 可选标识色
	 * @prop icon - 图标组件
	 * @prop href - 跳转链接
	 * @prop onclick - 点击回调
	 * @prop isActive - 是否处于激活状态
	 * @prop children - Svelte Snippet 内容（若存在则覆盖文本）
	 * @prop class - 额外的 CSS 类名
	 */
	import type { ComponentType, Snippet } from 'svelte';
	import type { Pathname } from '$app/types';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import { resolve } from '$app/paths';

	let {
		label,
		labelEn,
		labelClass = '',
		labelEnClass = 'text-muted-foreground',
		color,
		icon: Icon,
		href,
		onclick,
		isActive = false,
		children,
		class: className = '',
		...rest
	} = $props<{
		label?: string;
		labelEn?: string;
		labelClass?: string;
		labelEnClass?: string;
		color?: string;
		icon?: ComponentType;
		href?: Pathname;
		onclick?: () => void;
		isActive?: boolean;
		children?: Snippet;
		class?: string;
		[key: string]: unknown;
	}>();

	const baseClasses = 'sidebar-item-base';
	const activeClasses = 'sidebar-item-active';
	const inactiveClasses = 'sidebar-item-inactive';
</script>

{#snippet content()}
	{#if color}
		<span class="h-7 w-1 shrink-0 rounded-full" style:background-color={color} aria-hidden="true"
		></span>
	{/if}
	{#if Icon}
		<Icon class="sidebar-icon" />
	{/if}
	{#if children}
		{@render children()}
	{:else}
		<Crossfade key={`${label}:${labelEn ?? ''}`} inline class="min-w-0 flex-1">
			<span class="block truncate {labelClass}">{label}</span>
			{#if labelEn}
				<span class="block truncate {labelEnClass}">{labelEn}</span>
			{/if}
		</Crossfade>
	{/if}
{/snippet}

{#if href}
	<a
		href={resolve(href)}
		class="{baseClasses} {isActive ? activeClasses : inactiveClasses} {className}"
		{onclick}
		{...rest}
	>
		{@render content()}
	</a>
{:else}
	<button
		class="{baseClasses} {isActive ? activeClasses : inactiveClasses} {className}"
		{onclick}
		{...rest}
	>
		{@render content()}
	</button>
{/if}
