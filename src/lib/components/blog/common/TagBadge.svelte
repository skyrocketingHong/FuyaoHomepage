<script lang="ts">
	/**
	 * Newsroom 标签控件。
	 *
	 * 使用中性平面底色，支持筛选激活状态与日夜主题。
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
	type="button"
	class="inline-flex min-h-9 items-center rounded-full px-3.5 text-[12px] font-medium transition-colors select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--newsroom-link)
	{active
		? 'bg-(--newsroom-foreground) text-(--newsroom-background)'
		: 'bg-(--newsroom-interactive) text-(--newsroom-secondary) hover:bg-(--newsroom-interactive-hover) hover:text-(--newsroom-foreground)'}"
	onclick={() => onclick?.(tag)}
	title={tag}
>
	{tag}
</button>
