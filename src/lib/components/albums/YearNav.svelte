<script lang="ts">
	/**
	 * 年份导航组件
	 *
	 * 显示年份的水平分段控制器，用于切换相册年份。
	 * 放置在 Header 的 middle 插槽中。
	 *
	 * @prop years - 可用年份列表（降序）
	 * @prop currentYear - 当前选中的年份
	 * @prop onSelect - 选择年份的回调
	 */
	import SegmentedControl from '$lib/components/ui/display/SegmentedControl.svelte';

	let { years, currentYear, onSelect } = $props<{
		years: number[];
		currentYear: number;
		onSelect: (year: number) => void;
	}>();

	let controlItems = $derived(
		years.map((year: number) => ({ id: String(year), label: String(year) }))
	);
</script>

<SegmentedControl
	items={controlItems}
	activeId={String(currentYear)}
	onSelect={(id) => onSelect(Number(id))}
	class="h-9"
/>
