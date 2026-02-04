<script lang="ts">
	/**
	 * 马赛克背景信息组件
	 *
	 * 展示当前马赛克背景对应的车站信息。
	 * 包含车站的中英文名称及 MTR 图标。
	 */
	import { mosaicState } from '$lib/stores/app.svelte';
	import { SiMtr } from '@icons-pack/svelte-simple-icons';
</script>

{#if mosaicState.currentStation}
	<div class="flex items-center justify-center transition-all duration-500">
		<div class="md:mr-2 mr-0.5 w-5 h-5 [&>svg]:w-full [&>svg]:h-full">
			<SiMtr />
		</div>
		<div class="flex flex-col items-center leading-none gap-1 md:gap-0 md:mt-1">
			<span 
				class="text-[13px] font-bold" 
				style="font-family: 'MTRSong', 'Noto Serif TC', 'PingFang TC', serif; letter-spacing: 0.1em;"
			>
				{mosaicState.currentStation.nameZh}
			</span>
			<!-- 英文：scale(0.6) 缩放后用负边距补偿多余空间 -->
			<span 
				class="text-[10px] scale-[0.6] origin-center tracking-widest md:-mx-[10px] -mx-[8px]"
				style="font-family: 'Helvetica Neue Medium', 'Helvetica Neue', Arial, sans-serif;"
			>
				{mosaicState.currentStation.nameEn}
			</span>
		</div>
	</div>
{/if}
