<script lang="ts">
	/**
	 * 马赛克背景信息组件
	 *
	 * 展示当前马赛克背景对应的车站信息。
	 * 包含车站的中英文名称及 MTR 图标，单行左对齐排列。
	 *
	 * @prop size - 尺寸：'md' (默认/桌面端) | 'sm' (移动端紧凑)
	 */
	import { mosaicState } from '$lib/stores/mosaic.svelte';
	import { SiMtr } from '@icons-pack/svelte-simple-icons';

	let { size = 'md' } = $props<{
		size?: 'sm' | 'md';
	}>();

	/* 根据 size 生成样式 */
	let iconClass = $derived(size === 'sm' ? 'size-2.5' : 'size-3.5');
	let zhClass = $derived(size === 'sm' ? 'text-[10px] font-semibold' : 'text-[12px] font-semibold');
	let enClass = $derived(
		size === 'sm' ? 'text-[10px] opacity-70' : 'text-[11px] text-muted-foreground'
	);
</script>

{#if mosaicState.currentStation}
	<div class="flex w-full items-center justify-start gap-1.5 transition-all duration-500">
		<div class="{iconClass} shrink-0 [&>svg]:size-full">
			<SiMtr />
		</div>
		<span
			class={zhClass}
			style="font-family: 'MTRSong', 'Noto Serif TC', 'PingFang TC', serif; letter-spacing: 0.1em;"
		>
			{mosaicState.currentStation.nameZh}
		</span>
		<span
			class={enClass}
			style="font-family: 'Helvetica Neue Medium', 'Helvetica Neue', Arial, sans-serif;"
		>
			{mosaicState.currentStation.nameEn}
		</span>
	</div>
{/if}
