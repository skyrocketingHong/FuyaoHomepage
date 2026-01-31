<script lang="ts">
	/**
	 * 马赛克背景信息组件
	 *
	 * 展示当前马赛克背景对应的车站信息。
	 * 包含车站的中英文名称及 MTR 图标。
	 */
	import { mosaicState } from '$lib/state.svelte';
	import { SiMtr } from '@icons-pack/svelte-simple-icons';
</script>

{#if mosaicState.currentStation}
	<div class="flex items-center justify-center gap-3 transition-all duration-500">
		<SiMtr size={20} />
		<div class="flex flex-col items-center leading-none">
			<span 
				class="text-[14px] font-bold" 
				style="font-family: 'MTRSong', 'Noto Serif TC', 'PingFang TC', serif; letter-spacing: 0.1em;"
			>
				{mosaicState.currentStation.nameZh}
			</span>
			<span 
				class="text-[8px] tracking-widest opacity-90 mt-0.5"
				style="font-family: 'Helvetica Neue Medium', 'Helvetica Neue', Arial, sans-serif;"
			>
				{mosaicState.currentStation.nameEn}
			</span>
		</div>
	</div>
{/if}
