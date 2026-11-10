<script lang="ts">
	/**
	 * 博客文章目录。
	 *
	 * 复用全局侧栏并按标题深度缩进，支持当前阅读位置高亮。
	 *
	 * @prop toc - 目录项数组 (id, text, depth)
	 * @prop onItemClick - 点击目录项时的回调
	 * @prop activeId - 当前激活的锚点 ID
	 */
	import SidebarItem from '$lib/components/layout/sidebar/Item.svelte';

	interface Props {
		toc: { id: string; text: string; depth: number }[];
		onItemClick: (id: string) => void;
		activeId?: string;
	}

	let { toc, onItemClick, activeId = '' }: Props = $props();

	const depthClasses = ['pl-3', 'pl-6', 'pl-9', 'pl-12', 'pl-14', 'pl-16'];
</script>

<div>
	{#each toc as item (item.id)}
		<SidebarItem
			label={item.text}
			onclick={() => onItemClick(item.id)}
			isActive={item.id === activeId}
			data-id={item.id}
			class="text-[14px] {depthClasses[
				Math.min(Math.max(item.depth - 1, 0), depthClasses.length - 1)
			]}"
		/>
	{/each}
</div>
