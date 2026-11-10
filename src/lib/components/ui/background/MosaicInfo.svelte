<script lang="ts">
	/**
	 * 马赛克背景信息入口
	 *
	 * 展示当前车站并打开全屏背景信息；站名和语言变化时仅交叉淡化文字，
	 * 保留单行布局、静态省略和完整无障碍语义。
	 *
	 * @prop size - 尺寸：'md' (默认/桌面端) | 'sm' (移动端紧凑)
	 */
	import { mosaicState } from '$lib/stores/mosaic.svelte';
	import { backgroundInfoState } from '$lib/stores/backgroundInfo.svelte';
	import { locale, t } from '$lib/i18n/store';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import { SiMtr } from '@icons-pack/svelte-simple-icons';

	let { size = 'md' } = $props<{
		size?: 'sm' | 'md';
	}>();

	let station = $derived(mosaicState.currentStation);
	let iconClass = $derived(size === 'sm' ? 'size-2.5' : 'size-3.5');
	let zhClass = $derived(size === 'sm' ? 'text-[10px] font-semibold' : 'text-[12px] font-semibold');
	let enClass = $derived(size === 'sm' ? 'text-[10px]' : 'text-[11px]');
	let stationLabel = $derived(station ? `${station.nameZh} ${station.name}` : '');
	let detailLabel = $derived(`${stationLabel} · ${$t('background.view_details')}`);
</script>

{#if station}
	<button
		type="button"
		onclick={() => backgroundInfoState.open('mosaic')}
		class="flex w-full min-w-0 cursor-pointer items-center justify-start gap-1.5 overflow-hidden rounded-sm whitespace-nowrap transition-colors duration-200 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
		title={detailLabel}
		aria-label={detailLabel}
		aria-haspopup="dialog"
	>
		<span class="{iconClass} shrink-0 [&>svg]:size-full" aria-hidden="true">
			<SiMtr />
		</span>
		<Crossfade
			key={`${station.name}:${$locale}`}
			inline
			class={size === 'sm' ? 'min-w-0 flex-1 overflow-hidden' : 'shrink-0'}
		>
			<span class="flex min-w-0 items-center gap-1.5">
				<span
					class="shrink-0 {zhClass}"
					style="font-family: 'MTRSong', 'Noto Serif TC', 'PingFang TC', serif; letter-spacing: 0.1em;"
				>
					{station.nameZh}
				</span>
				<span
					class="{size === 'sm' ? 'min-w-0 truncate' : 'shrink-0'} {enClass}"
					style="font-family: 'Helvetica Neue Medium', 'Helvetica Neue', Arial, sans-serif;"
				>
					{station.name}
				</span>
			</span>
		</Crossfade>
	</button>
{/if}
