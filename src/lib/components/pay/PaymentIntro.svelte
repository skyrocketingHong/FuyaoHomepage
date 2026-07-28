<script lang="ts">
	/**
	 * 支付页顶部说明卡。
	 *
	 * 复用友链顶部信息卡的水平布局语言：固定图标底座位于左侧，标题与说明在
	 * 右侧自然换行。组件只提供一层 12px 内边距，不创建滚动区域。
	 */
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import { WalletCards } from 'lucide-svelte';
	import { t, locale } from '$lib/i18n/store';
</script>

<section class="payment-intro w-full" aria-labelledby="payment-intro-title">
	<LiquidGlass opaque={true} tilt={false} class="rounded-xl !p-3">
		<div class="payment-intro-layout flex min-w-0 items-start gap-3 text-left">
			<div
				class="payment-intro-icon flex size-11 shrink-0 items-center justify-center rounded-[12px]"
				aria-hidden="true"
			>
				<WalletCards size={22} strokeWidth={2} />
			</div>

			<div class="payment-intro-copy min-w-0 flex-1 self-center text-foreground">
				<strong id="payment-intro-title" class="block text-[15px] leading-5 font-semibold">
					<Crossfade key={$locale} inline class="inline-grid max-w-full">
						<span>{$t('pay.card.purpose')}</span>
					</Crossfade>
				</strong>
				<p class="mt-0.5 text-xs leading-[17px] text-foreground/65">
					<Crossfade key={$locale} inline class="inline-grid max-w-full">
						<span>{$t('pay.card.local_qr')}</span>
					</Crossfade>
				</p>
			</div>
		</div>
	</LiquidGlass>
</section>

<style>
	.payment-intro-icon {
		color: var(--theme-color);
		background: color-mix(in srgb, var(--theme-color) 14%, transparent);
	}
</style>
