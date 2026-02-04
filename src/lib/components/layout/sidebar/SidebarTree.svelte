<script lang="ts">
	/**
	 * 递归侧边栏树形组件
	 * 
	 * 支持文件夹嵌套和自动展开激活路径。
	 * 
	 * @prop item - 树节点数据
	 * @prop depth - 当前嵌套深度（用于计算缩进）
	 */
	import { slide } from 'svelte/transition';
	import { Folder, FolderOpen } from 'lucide-svelte';
	import SidebarItem from './Item.svelte';
	import SidebarTree from './SidebarTree.svelte'; // 递归引用
	import type { SidebarItemType } from '$lib/types/sidebar';
	import { untrack } from 'svelte';

	let { item, depth = 0 } = $props<{
		item: SidebarItemType;
		depth?: number;
	}>();

	// 检查是否有任何子节点处于激活状态以自动展开
	const hasActiveChild = (node: SidebarItemType): boolean => {
		if (node.isActive) return true;
		if (node.items) {
			return node.items.some(child => hasActiveChild(child));
		}
		return false;
	};

	// 在父级使用 key 块，当 item 变化时重置状态
	let isOpen = $state(untrack(() => item.defaultExpanded || hasActiveChild(item)));
	
	function toggle() {
		isOpen = !isOpen;
	}
</script>

{#if item.items && item.items.length > 0}
	<!-- 文件夹节点 -->
	<div class="flex flex-col select-none">
		<button
			onclick={toggle}
			class="sidebar-item-base sidebar-item-inactive"
			style="padding-left: {depth * 12 + 12}px"
		>
			<span class="flex items-center justify-center">
                {#if isOpen}
                    <FolderOpen class="sidebar-icon" />
                {:else}
                    <Folder class="sidebar-icon" />
                {/if}
            </span>
			<span class="truncate">{item.label}</span>
		</button>

		{#if isOpen}
			<div transition:slide|local={{ duration: 200 }} class="flex flex-col gap-0.5 border-l border-border/40 ml-[15px]">
				{#each item.items as child}
					{#key child}
						<SidebarTree item={child} depth={depth + 1} />
					{/key}
				{/each}
			</div>
		{/if}
	</div>
{:else}
	<!-- 叶子节点 -->
	<!-- 我们包装 SidebarItem 或直接使用它，但需要处理缩进 -->
    <!-- SidebarItem 来自它自己的 padding，但对于树形结构我们可能想要手动控制或只需传递样式 -->
    <!-- 如果需要，使用包装器来处理缩进一致性，或修改 SidebarItem 类 -->
    <div style="padding-left: {depth * 12}px">
        {#if item.component}
            <SidebarItem
                label={item.label}
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
                icon={item.icon}
                href={item.href}
                onclick={item.onClick}
                isActive={item.isActive}
                class={item.class}
            />
        {/if}
    </div>
{/if}
