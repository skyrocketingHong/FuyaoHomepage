<script lang="ts">
	/**
	 * 地图信息窗体组件
	 *
	 * 模仿 GridPostCard 的样式，提供"液态玻璃"视觉效果的地图弹窗。
	 * 包含封面图（Placeholder）、标题、日期、描述和关闭按钮。
	 */
	import { formatDate } from '$lib/utils/datetime/date';
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import { X } from 'lucide-svelte';
	import type { MarkerConfig } from './types';
	import { locale, t } from '$lib/i18n/store';

	let { place, onClose } = $props<{
		place: MarkerConfig;
		onClose: () => void;
	}>();

	// 格式化日期
	let dateStr = $derived(place.visitDate ? formatDate(place.visitDate, $locale) : '');
</script>

<div class="relative w-[280px] origin-bottom animate-in duration-300 zoom-in-95">
	<LiquidGlass
		refractive
		blur={8}
		refractionStrength={4}
		class="flex w-full flex-col gap-0 !p-0 shadow-xl"
		showLighting={true}
		showGloss={true}
	>
		<!-- 关闭按钮 -->
		<button
			class="absolute top-2 right-2 z-50 rounded-full p-1.5 text-muted-foreground transition-all hover:bg-black/5 hover:text-foreground"
			onclick={onClose}
			aria-label={$t('common.close')}
		>
			<X size={14} strokeWidth={2.5} />
		</button>

		<div class="relative flex w-full flex-col">
			<!-- 内容区域 -->
			<div class="flex flex-1 flex-col p-5 pt-7">
				<!-- 标题 -->
				<div class="mb-1 flex items-start justify-between gap-2">
					<Crossfade key={`${$locale}-${place.title}`}>
						<h3 class="text-base leading-tight font-bold text-foreground">
							{place.title}
						</h3>
					</Crossfade>
				</div>

				<div class="mb-3 flex items-center justify-between">
					{#if dateStr}
						<span class="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
							{dateStr}
						</span>
					{/if}
				</div>

				{#if place.description}
					<p class="line-clamp-4 text-justify text-[13px] leading-relaxed text-muted-foreground">
						{place.description}
					</p>
				{/if}
			</div>
		</div>
	</LiquidGlass>

	<!-- 底部小三角指示器 (模拟气泡尾巴) -->
	<div
		class="absolute -bottom-2 left-1/2 z-[-1] h-4 w-4 -translate-x-1/2 rotate-45 border-r border-b border-border bg-[var(--glass-surface)] shadow-sm"
	></div>
</div>
