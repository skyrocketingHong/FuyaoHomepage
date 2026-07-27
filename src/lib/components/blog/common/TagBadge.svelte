<script lang="ts">
	/**
	 * 统一的博客标签组件
	 *
	 * 实现圆角胶囊、淡色背景、灰色文字的视觉样式，支持点击交互。
	 * 颜色使用 --reader-* 阅读语义 token，日夜模式自动切换。
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
		: 'bg-(--reader-card) text-(--reader-secondary) hover:bg-(--reader-card-hover) hover:text-(--reader-foreground)'}"
	onclick={() => onclick?.(tag)}
	title={tag}
>
	{tag}
</button>
