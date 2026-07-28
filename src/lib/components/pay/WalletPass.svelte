<script module lang="ts">
	/**
	 * 已完成二维码处理、可直接交给 Wallet Pass 渲染的支付方式。
	 */
	export interface WalletPayment {
		/** 配置中的显示名称，仅用于日志与稳定标识。 */
		name: string;
		/** 已校验的支付应用链接；不可用时为空字符串。 */
		url: string;
		/** 支付方式图标键。 */
		icon: string;
		/** Pass 的不透明品牌色。 */
		brandColor: string;
		/** 根据品牌色亮度计算出的前景色。 */
		foregroundColor: '#111827' | '#ffffff';
		/** 品牌图标底座颜色。 */
		iconSurfaceColor: string;
		/** 支付链接是否可直接打开。 */
		linkAvailable: boolean;
		/** 浏览器本地生成的二维码 Data URL。 */
		qrCodeDataUrl?: string;
		/** 二维码生成是否失败。 */
		qrError?: boolean;
	}

	export type WalletPassMode = 'mobile-stack' | 'desktop-summary' | 'desktop-detail';
</script>

<script lang="ts">
	/**
	 * 支持三种展示模式的品牌 Wallet Pass。
	 *
	 * `mobile-stack` 提供 iOS Wallet 堆叠与展开交互；`desktop-summary` 提供
	 * 68px 高的品牌支付方式选择项；`desktop-detail` 展示唯一的当前二维码详情。
	 * 三种模式复用同一支付数据、品牌图标、状态文案与详情模板。
	 *
	 * @prop mode - 移动堆叠、桌面摘要或桌面详情模式。
	 * @prop payment - 已处理的支付方式与二维码数据。
	 * @prop index - 支付方式在原配置中的索引。
	 * @prop expanded - 移动端是否展开，或桌面摘要是否选中。
	 * @prop stackPosition - 当前移动 Pass 在摘要栈中的位置。
	 * @prop selectedPosition - 展开 Pass 位于多少个未选中摘要之后。
	 * @prop stackZIndex - 当前移动摘要 Pass 的局部层级。
	 * @prop ontoggle - 点击可交互表面时触发的选择回调。
	 */
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import { CircleAlert, ExternalLink } from 'lucide-svelte';
	import { SiAlipay, SiWechat, SiQq, SiContactlesspayment } from '@icons-pack/svelte-simple-icons';
	import { t, locale } from '$lib/i18n/store';

	interface Props {
		mode?: WalletPassMode;
		payment: WalletPayment;
		index: number;
		expanded?: boolean;
		stackPosition?: number;
		selectedPosition?: number;
		stackZIndex?: number;
		ontoggle?: () => void;
	}

	let {
		mode = 'mobile-stack',
		payment,
		index,
		expanded = false,
		stackPosition = 0,
		selectedPosition = 0,
		stackZIndex = 1,
		ontoggle
	}: Props = $props();

	const iconMap: Record<string, typeof SiAlipay> = {
		alipay: SiAlipay,
		wechat: SiWechat,
		qq: SiQq,
		unionpay: SiContactlesspayment
	};

	const i18nKeyMap: Record<string, string> = {
		alipay: 'alipay',
		wechat: 'wechat',
		qq: 'qq',
		unionpay: 'unionpay'
	};

	let IconComponent = $derived(iconMap[payment.icon] ?? SiContactlesspayment);
	let paymentName = $derived($t(`pay.methods.${i18nKeyMap[payment.icon] ?? 'other'}`));
	let stateLabel = $derived($t(payment.linkAvailable ? 'pay.card.ready' : 'pay.card.unavailable'));
	let actionLabel = $derived(
		payment.linkAvailable
			? $t('pay.ticket.open_in', { method: paymentName })
			: $t('pay.states.link_unavailable')
	);
	let surfaceStyle = $derived(
		`--payment-color: ${payment.brandColor}; --payment-foreground: ${payment.foregroundColor}; --payment-icon-surface: ${payment.iconSurfaceColor}; --wallet-position: ${stackPosition}; --wallet-selected-position: ${selectedPosition}; --wallet-z-index: ${stackZIndex};`
	);
</script>

{#snippet passIdentity()}
	<span
		class="payment-brand-icon flex size-10 shrink-0 items-center justify-center rounded-[12px]"
		aria-hidden="true"
	>
		<IconComponent size={22} />
	</span>

	<span class="flex min-w-0 flex-1 flex-col items-start text-left">
		<strong class="max-w-full truncate text-[16px] leading-5 font-semibold">
			<Crossfade key={$locale} inline class="inline-grid max-w-full">
				<span class="truncate">{paymentName}</span>
			</Crossfade>
		</strong>
		<span class="mt-0.5 max-w-full truncate text-[11px] leading-[15px] font-medium opacity-75">
			<Crossfade key={$locale} inline class="inline-grid max-w-full">
				<span class="truncate">{stateLabel}</span>
			</Crossfade>
		</span>
	</span>
{/snippet}

{#snippet paymentDetails(panelId: string, visible: boolean)}
	<section id={panelId} class="wallet-pass-details min-h-0" hidden={!visible}>
		{#if visible}
			<p class="wallet-scan-hint min-w-0 text-center text-xs leading-4 font-medium">
				<Crossfade key={$locale} inline class="inline-grid max-w-full">
					<span class="truncate">{$t('pay.ticket.scan_hint')}</span>
				</Crossfade>
			</p>

			<div class="wallet-qr-stage flex min-h-0 min-w-0 items-center justify-center">
				{#if payment.qrCodeDataUrl}
					<div class="qr-scan-zone shrink-0 rounded-[12px] bg-white">
						<img
							src={payment.qrCodeDataUrl}
							alt={$t('pay.ticket.qr_alt', { method: paymentName })}
							class="wallet-qr-image object-contain"
							width="220"
							height="220"
						/>
					</div>
				{:else}
					<div
						class="qr-scan-zone wallet-qr-error flex shrink-0 flex-col items-center justify-center gap-1 rounded-[12px] bg-white text-center text-neutral-900"
					>
						<CircleAlert class="size-6 shrink-0 text-neutral-500" aria-hidden="true" />
						<strong class="text-xs">{$t('pay.states.qr_error')}</strong>
					</div>
				{/if}
			</div>

			{#if payment.linkAvailable}
				<a
					href={payment.url}
					target="_blank"
					rel="noopener noreferrer external"
					class="wallet-open-action flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-white/90 px-3 text-[15px] font-semibold text-neutral-900 transition-colors hover:bg-white/95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
				>
					<Crossfade key={$locale} inline class="inline-grid min-w-0">
						<span class="truncate">{actionLabel}</span>
					</Crossfade>
					<ExternalLink class="size-4 shrink-0" aria-hidden="true" />
				</a>
			{:else}
				<span
					class="wallet-open-action flex h-12 w-full shrink-0 items-center justify-center rounded-xl bg-white/55 px-3 text-center text-[15px] font-semibold text-neutral-700"
					aria-disabled="true"
				>
					<Crossfade key={$locale} inline class="inline-grid min-w-0">
						<span class="truncate">{actionLabel}</span>
					</Crossfade>
				</span>
			{/if}
		{/if}
	</section>
{/snippet}

{#if mode === 'mobile-stack'}
	<article
		class="wallet-pass wallet-pass--mobile absolute inset-x-0 top-0 overflow-hidden rounded-2xl bg-[var(--payment-color)] text-[var(--payment-foreground)]"
		class:wallet-pass--selected={expanded}
		style={surfaceStyle}
	>
		<div class="wallet-pass-content h-full min-h-0">
			<button
				type="button"
				class="wallet-pass-header flex h-[68px] min-h-11 w-full min-w-0 items-center gap-3 px-3 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-current"
				onclick={ontoggle}
				aria-expanded={expanded}
				aria-controls={`payment-panel-${index}`}
				aria-label={$t(expanded ? 'pay.card.collapse' : 'pay.card.expand', {
					method: paymentName
				})}
			>
				{@render passIdentity()}
			</button>

			{@render paymentDetails(`payment-panel-${index}`, expanded)}
		</div>
	</article>
{:else if mode === 'desktop-summary'}
	<button
		type="button"
		class="wallet-summary-button flex h-[68px] w-full min-w-0 items-center gap-3 rounded-2xl bg-[var(--payment-color)] px-3 py-3 text-[var(--payment-foreground)] transition-[filter,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
		class:wallet-summary-button--selected={expanded}
		style={surfaceStyle}
		onclick={ontoggle}
		aria-pressed={expanded}
		aria-label={$t('pay.card.select', { method: paymentName })}
	>
		{@render passIdentity()}
	</button>
{:else}
	<article
		class="wallet-pass-detail h-full min-h-0 w-full overflow-hidden rounded-2xl bg-[var(--payment-color)] text-[var(--payment-foreground)]"
		style={surfaceStyle}
	>
		<div class="wallet-pass-content h-full min-h-0">
			<div class="wallet-pass-header flex h-[68px] min-w-0 items-center gap-3 px-3 py-3">
				{@render passIdentity()}
			</div>

			{@render paymentDetails(`payment-detail-${index}`, true)}
		</div>
	</article>
{/if}

<style>
	.wallet-pass,
	.wallet-pass-detail,
	.wallet-summary-button {
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.28),
			0 10px 24px rgb(15 23 42 / 0.14);
	}

	.wallet-pass {
		height: var(--wallet-summary-height);
		transform: translate3d(0, calc(var(--wallet-stack-step) * var(--wallet-position)), 0);
		z-index: var(--wallet-z-index);
		transition:
			transform 300ms cubic-bezier(0.22, 1, 0.36, 1),
			height 300ms cubic-bezier(0.22, 1, 0.36, 1);
		will-change: transform, height;
	}

	.wallet-pass--selected {
		height: calc(100% - var(--wallet-stack-step) * var(--wallet-selected-position));
		transform: translate3d(0, calc(var(--wallet-stack-step) * var(--wallet-selected-position)), 0);
	}

	.wallet-pass:has(.wallet-pass-header:active) {
		scale: 0.99;
	}

	.wallet-pass-content {
		display: grid;
		grid-template-rows: 68px minmax(0, 1fr);
	}

	.wallet-pass:not(.wallet-pass--selected) .wallet-pass-content {
		display: block;
	}

	.wallet-summary-button--selected {
		filter: brightness(1.07);
		transform: scale(1.012);
	}

	.payment-brand-icon {
		background: var(--payment-icon-surface);
	}

	.wallet-pass-details {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr) 48px;
		gap: 12px;
		padding: 8px 12px 12px;
	}

	.wallet-pass-details[hidden] {
		display: none;
	}

	.qr-scan-zone {
		padding: 12px;
		color-scheme: light;
		box-shadow: none;
	}

	.wallet-qr-image,
	.wallet-qr-error {
		width: var(--wallet-qr-size);
		height: var(--wallet-qr-size);
	}

	:global(.dark) .wallet-pass,
	:global(.dark) .wallet-pass-detail,
	:global(.dark) .wallet-summary-button {
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.24),
			0 10px 24px rgb(0 0 0 / 0.24);
	}

	@media (max-width: 359px) and (max-height: 620px) and (orientation: portrait) {
		.wallet-pass--mobile .wallet-pass-details {
			grid-template-columns: 152px minmax(0, 1fr);
			grid-template-rows: auto minmax(0, 1fr);
			gap: 8px;
			padding-top: 4px;
			padding-bottom: 4px;
		}

		.wallet-pass--mobile .wallet-qr-stage {
			grid-row: 1 / 3;
		}

		.wallet-pass--mobile .wallet-scan-hint {
			align-self: end;
		}

		.wallet-pass--mobile .wallet-open-action {
			align-self: start;
		}
	}

	@media (orientation: landscape) and (max-height: 600px) {
		.wallet-pass--mobile.wallet-pass--selected .wallet-pass-content {
			grid-template-columns: minmax(132px, 0.8fr) minmax(0, 1.2fr);
			grid-template-rows: minmax(0, 1fr);
		}

		.wallet-pass--mobile.wallet-pass--selected .wallet-pass-header {
			height: auto;
			align-self: start;
		}

		.wallet-pass--mobile .wallet-pass-details {
			grid-template-columns: minmax(0, 1fr) minmax(112px, 0.72fr);
			grid-template-rows: auto minmax(0, 1fr);
			gap: 8px;
			padding-top: 8px;
		}

		.wallet-pass--mobile .wallet-scan-hint,
		.wallet-pass--mobile .wallet-open-action {
			grid-column: 2;
		}

		.wallet-pass--mobile .wallet-qr-stage {
			grid-row: 1 / 3;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.wallet-pass,
		.wallet-summary-button {
			transition-duration: 0ms;
			will-change: auto;
		}
	}
</style>
