<script lang="ts">
	/**
	 * 统一的博客标签组件
	 *
	 * 实现圆角胶囊、淡色背景、灰色文字的视觉样式，支持点击交互。
	 *
	 * @prop tag - 标签文本
	 * @prop active - 是否处于激活状态
	 * @prop onclick - 点击回调函数
	 */
	let {
		tag,
		active = false,
		onclick
	} = $props<{
		tag: string;
		active?: boolean;
		onclick?: (tag: string) => void;
	}>();
</script>

<button
	class="inline-flex items-center rounded-full px-3 py-0.5 text-[12px] font-medium transition-all select-none
	{active
		? 'bg-primary text-primary-foreground shadow-sm'
		: 'bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#e8e8ed] hover:text-[#1d1d1f] dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-[#f5f5f7]'}\n"
	onclick={() => onclick?.(tag)}
	title={tag}
>
	{tag}
</button>
