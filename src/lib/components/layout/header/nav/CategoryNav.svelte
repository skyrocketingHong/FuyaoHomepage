<script lang="ts">
	/**
	 * 分类导航组件
	 *
	 * 显示文章分类的水平滚动列表（胶囊样式）。
	 * 已重构为使用通用的 SegmentedControl 组件。
	 *
	 * @prop categories - 分类项数组 (包含 slug 和 title)
	 * @prop activeCategory - 当前激活的分类 slug
	 * @prop onSelect - 选择分类时的回调函数
	 */
	import SegmentedControl from '$lib/components/ui/display/SegmentedControl.svelte';
	
	interface Category {
		slug: string;
		title: string;
	}

	let { categories, activeCategory, onSelect } = $props<{
		categories: Category[];
		activeCategory: string;
		onSelect: (cat: string) => void;
	}>();

	// 将 categories 转换为 SegmentedControl 所需的格式
	let controlItems = $derived(categories.map((cat: Category) => ({
		id: cat.slug,
		label: cat.title
	})));
</script>

<SegmentedControl 
	items={controlItems} 
	activeId={activeCategory} 
	onSelect={onSelect}
	class="h-9"
/>
