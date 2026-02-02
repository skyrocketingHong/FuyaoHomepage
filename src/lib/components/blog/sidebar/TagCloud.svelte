<script lang="ts">
	/**
	 * 标签云组件
	 * 
	 * 在侧边栏中展示所有标签，支持点击过滤。
	 * 
	 * @prop tags - 标签字符串数组
	 * @prop activeTag - 当前选中的标签
	 * @prop onSelect - 选中回调
	 */
	import TagBadge from '../common/TagBadge.svelte';

	let { 
		tags = [], 
		activeTag = '', 
		onSelect 
	} = $props<{
		tags: string[];
		activeTag?: string;
		onSelect: (tag: string) => void;
	}>();
</script>

<div class="flex flex-wrap gap-2 p-2">
	{#each tags as tag}
		<TagBadge 
			{tag} 
			active={activeTag === tag} 
			onclick={onSelect} 
		/>
	{/each}
	{#if tags.length === 0}
		<span class="text-xs text-muted-foreground italic px-2">No tags found</span>
	{/if}
</div>
