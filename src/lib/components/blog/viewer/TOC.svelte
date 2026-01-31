<script lang="ts">
	/**
	 * 博客文章目录 (TOC) 组件
	 * 
	 * 渲染文章标题列表，并支持点击跳转和激活项高亮。
	 */
	import SidebarItem from '$lib/components/layout/sidebar/Item.svelte';

	interface Props {
		toc: { id: string; text: string; depth: number }[]; // 目录数据项
		onItemClick: (id: string) => void; // 点击项时的回调
		variant?: 'desktop' | 'mobile'; // 组件变体 (桌面端或移动端)
		activeId?: string; // 当前激活的标题 ID
	}

	let { toc, onItemClick, variant = 'desktop', activeId = '' }: Props = $props();
</script>

<div>
	{#each toc as item}
		<SidebarItem 
			label={item.text}
			onclick={() => onItemClick(item.id)}
			isActive={item.id === activeId}
			data-id={item.id}
		/>
	{/each}
</div>
