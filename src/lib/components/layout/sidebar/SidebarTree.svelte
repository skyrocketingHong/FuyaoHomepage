<script lang="ts">
	/**
	 * 递归侧边栏树形组件
	 *
	 * 支持文件夹嵌套、自动展开激活路径，以及隐藏根节点的一级列表。
	 *
	 * @prop item - 树节点数据
	 * @prop depth - 当前嵌套深度（用于计算缩进）
	 * @prop hideRoot - 仅渲染子项，不显示根节点行
	 */
	import { slide } from 'svelte/transition';
	import { Folder, FolderOpen } from 'lucide-svelte';
	import SidebarItem from './Item.svelte';
	import SidebarTree from './SidebarTree.svelte';
	import type { SidebarItemType } from '$lib/types/sidebar';
	import { untrack } from 'svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';

	let {
		item,
		depth = 0,
		hideRoot = false
	} = $props<{
		item: SidebarItemType;
		depth?: number;
		hideRoot?: boolean;
	}>();

	const hasActiveChild = (node: SidebarItemType): boolean => {
		if (node.isActive) return true;
		if (node.items) return node.items.some((child) => hasActiveChild(child));
		return false;
	};

	let isOpen = $state(untrack(() => item.defaultExpanded || hasActiveChild(item)));

	function toggle() {
		isOpen = !isOpen;
	}
</script>

{#if hideRoot && item.items}
	<div class="flex flex-col">
		{#each item.items as child (child.id ?? child.label)}
			<SidebarTree item={child} {depth} />
		{/each}
	</div>
{:else if item.items && item.items.length > 0}
	<div class="flex flex-col select-none">
		<button
			onclick={toggle}
			class="sidebar-item-base {item.isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}"
			style="padding-left: {depth * 12 + 12}px"
			data-id={item.dataId || item.id}
		>
			<span class="flex items-center justify-center">
				{#if item.icon}
					<item.icon class={item.iconClass || 'sidebar-icon'} />
				{:else if isOpen}
					<FolderOpen class="sidebar-icon" />
				{:else}
					<Folder class="sidebar-icon" />
				{/if}
			</span>
			<Crossfade key={item.label} inline class="inline-grid truncate"
				><span>{item.label}</span></Crossfade
			>
		</button>

		{#if isOpen}
			<div
				transition:slide|local={{ duration: 200 }}
				class="ml-[15px] flex flex-col gap-0.5 border-l border-border/40"
			>
				{#each item.items as child (child.id ?? child.label)}
					<SidebarTree item={child} depth={depth + 1} />
				{/each}
			</div>
		{/if}
	</div>
{:else}
	<div style="padding-left: {depth * 12}px" data-id={item.dataId || item.id}>
		{#if item.component}
			<SidebarItem
				label={item.label}
				labelEn={item.labelEn}
				labelClass={item.labelClass}
				labelEnClass={item.labelEnClass}
				color={item.color}
				icon={item.icon}
				href={item.href}
				onclick={item.onClick}
				isActive={item.isActive}
				class={item.class}
			>
				<item.component {...item.componentProps} />
			</SidebarItem>
		{:else}
			<SidebarItem
				label={item.label}
				labelEn={item.labelEn}
				labelClass={item.labelClass}
				labelEnClass={item.labelEnClass}
				color={item.color}
				icon={item.icon}
				href={item.href}
				onclick={item.onClick}
				isActive={item.isActive}
				class={item.class}
			/>
		{/if}
	</div>
{/if}
