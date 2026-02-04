<script lang="ts">
	/**
	 * 顶部操作按钮组件
	 *
	 * 用于 Header 和 HeaderActions 中的交互按钮。
	 * 具有 LiquidGlass 玻璃拟态背景和 Crossfade 文本切换动画。
	 *
	 * @prop title - 按钮的 titleHTML 属性
	 * @prop onclick - 点击回调函数
	 * @prop crossfadeKey - 用于 Crossfade 动画的唯一 key
	 * @prop text - 按钮文本内容 (Snippet)
	 * @prop icon - 按钮图标 (Snippet)
	 * @prop class - 额外的 CSS 类名
	 */
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		onclick: () => void;
		crossfadeKey: any;
		text: Snippet;
		icon: Snippet;
		class?: string;
	}

	let { title, onclick, crossfadeKey, text, icon, class: className }: Props = $props();
</script>

<LiquidGlass
	tag="button"
	{onclick}
	class="group h-9 box-border w-auto rounded-full p-2 text-foreground hover:bg-secondary/50 {className}"
	{title}
>
	<div class="flex items-center justify-center">
		<div
			class="grid grid-cols-[0fr] transition-[grid-template-columns] duration-300 ease-out group-hover:grid-cols-[1fr] group-data-[interacting=true]:grid-cols-[1fr]"
		>
			<div class="overflow-hidden">
				<Crossfade key={crossfadeKey}>
					<span
						class="block whitespace-nowrap pr-2 text-sm font-medium opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-data-[interacting=true]:opacity-100"
					>
						{@render text()}
					</span>
				</Crossfade>
			</div>
		</div>
		{@render icon()}
	</div>
</LiquidGlass>
