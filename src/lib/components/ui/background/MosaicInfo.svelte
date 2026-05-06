<script lang="ts">
	/**
	 * 马赛克背景信息组件
	 *
	 * 展示当前马赛克背景对应的车站信息。
	 * 包含车站的中英文名称及 MTR 图标。
	 *
	 * @prop size - 尺寸：'md' (默认/桌面端) | 'sm' (移动端紧凑)
	 */
	import { mosaicState } from '$lib/stores/mosaic.svelte';
	import { SiMtr } from '@icons-pack/svelte-simple-icons';

	let { size = 'md' } = $props<{
		size?: 'sm' | 'md';
	}>();

	/* 根据 size 生成样式 */
	let iconClass = $derived(size === 'sm' ? 'mr-0.5 h-2.5 w-2.5' : 'mr-0.5 h-5 w-5 md:mr-2');
	let zhClass = $derived(size === 'sm' ? 'text-[10px] font-bold' : 'text-[13px] font-bold');
	let enClass = $derived(
		size === 'sm'
			? 'text-[10px] opacity-70'
			: '-mx-[8px] origin-center scale-[0.6] text-[10px] tracking-widest md:-mx-[10px]'
	);
	let gapClass = $derived(
		size === 'sm'
			? 'flex items-baseline gap-1'
			: 'flex flex-col items-center gap-1 leading-none md:mt-1 md:gap-0'
	);
</script>

{#if mosaicState.currentStation}
	<div class="flex items-center justify-center transition-all duration-500">
		<div class="{iconClass} [&>svg]:h-full [&>svg]:w-full">
			<SiMtr />
		</div>
		<div class={gapClass}>
			<span
				class={zhClass}
				style="font-family: 'MTRSong', 'Noto Serif TC', 'PingFang TC', serif; letter-spacing: 0.1em;"
			>
				{mosaicState.currentStation.nameZh}
			</span>
			<!-- 英文：缩放后用负边距补偿多余空间 -->
			<span
				class={enClass}
				style="font-family: 'Helvetica Neue Medium', 'Helvetica Neue', Arial, sans-serif;"
			>
				{mosaicState.currentStation.nameEn}
			</span>
		</div>
	</div>
{/if}
