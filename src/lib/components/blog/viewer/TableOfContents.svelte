<script lang="ts">
	/**
	 * 博客文章目录 (TOC) 组件
	 * 
	 * 渲染侧边栏中的文章目录列表，支持自动高亮当前阅读位置。
	 * 
	 * @prop toc - 嵌套的目录项数组 (id, text, depth)
	 * @prop onItemClick - 点击目录项时的回调
	 * @prop variant - 视觉变体
	 * @prop activeId - 当前激活的锚点 ID
	 */
	import SidebarItem from '$lib/components/layout/sidebar/Item.svelte';

	interface Props {
		toc: { id: string; text: string; depth: number }[];
		onItemClick: (id: string) => void;
		variant?: 'desktop' | 'mobile';
		activeId?: string;
	}

	let { toc, onItemClick, activeId = '' }: Props = $props();
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
