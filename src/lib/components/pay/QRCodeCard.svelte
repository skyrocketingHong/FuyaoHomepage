<script lang="ts">
	/**
	 * 响应式 Wallet 主从布局控制器。
	 *
	 * 统一校验支付配置、在浏览器本地生成二维码，并以同一个 `selectedIndex`
	 * 驱动手机／平板的 Wallet 展开态和宽屏当前详情。小于 1024px 时渲染单列
	 * Wallet 栈；宽屏渲染固定支付方式列表与单张详情卡，不创建滚动区域。
	 *
	 * @prop payments - 支付方式配置数组。
	 * @prop onready - 二维码处理结束后的回调。
	 */
	import { onMount } from 'svelte';
	import QRCode from 'qrcode';
	import WalletPass from '$lib/components/pay/WalletPass.svelte';
	import type { WalletPayment } from '$lib/components/pay/WalletPass.svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import StatusState from '$lib/components/ui/feedback/StatusState.svelte';
	import { t, locale } from '$lib/i18n/store';
	import { LoaderCircle, WalletCards } from 'lucide-svelte';

	interface PaymentConfig {
		name: string;
		url: string;
		color: string;
		icon: string;
	}

	interface Props {
		payments: PaymentConfig[];
		onready?: () => void;
	}

	let { payments = [], onready }: Props = $props();

	let processedPayments = $state<WalletPayment[]>([]);
	let processing = $state(true);
	let selectedIndex = $state<number | null>(null);

	let defaultIndex = $derived.by(() => {
		const availableIndex = processedPayments.findIndex((payment) => payment.linkAvailable);
		return availableIndex >= 0 ? availableIndex : 0;
	});
	let activeIndex = $derived(selectedIndex ?? defaultIndex);
	let activePayment = $derived(processedPayments[activeIndex]);

	const brandColorMap: Record<string, string> = {
		alipay: '#1677ff',
		wechat: '#07c160',
		qq: '#12b7f5',
		unionpay: '#d9251d'
	};

	/** 根据品牌规则与配置值返回可用的不透明十六进制色。 */
	function normalizeBrandColor(color: string, icon: string): string {
		if (icon === 'alipay' || icon === 'qq') return brandColorMap[icon];
		if (/^#[\da-f]{6}$/i.test(color)) return color.toLowerCase();
		return brandColorMap[icon] ?? '#475569';
	}

	/** 依据 WCAG 相对亮度在深色与白色前景间选择对比度更高的一项。 */
	function getForegroundColor(hex: string): '#111827' | '#ffffff' {
		const value = hex.slice(1);
		const red = Number.parseInt(value.slice(0, 2), 16) / 255;
		const green = Number.parseInt(value.slice(2, 4), 16) / 255;
		const blue = Number.parseInt(value.slice(4, 6), 16) / 255;
		const linearize = (channel: number) =>
			channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
		const luminance =
			0.2126 * linearize(red) + 0.7152 * linearize(green) + 0.0722 * linearize(blue);
		return luminance > 0.179 ? '#111827' : '#ffffff';
	}

	/** 仅接受显式协议链接，并拒绝可执行或可嵌入数据协议。 */
	function normalizePaymentUrl(value: unknown): string {
		if (typeof value !== 'string') return '';
		const url = value.trim();
		if (!/^[a-z][a-z\d+.-]*:/i.test(url)) return '';
		if (/^(?:javascript|data|vbscript):/i.test(url)) return '';
		return url;
	}

	/** 手机／平板再次选择已展开 Pass 时收起，其他情况展开当前 Pass。 */
	function togglePayment(index: number) {
		selectedIndex = selectedIndex === index ? null : index;
	}

	/** 宽屏选择仅替换右侧详情，不改变布局或页面滚动位置。 */
	function selectPayment(index: number) {
		selectedIndex = index;
	}

	/** 返回未选中 Pass 在顶部摘要栈中的连续位置。 */
	function getStackPosition(index: number): number {
		if (selectedIndex === null || index < selectedIndex) return index;
		if (index > selectedIndex) return index - 1;
		return processedPayments.length - 1;
	}

	/** Escape 关闭移动展开态；宽屏自动回到第一个可用支付方式。 */
	function handleEscape(event: KeyboardEvent) {
		if (event.key === 'Escape' && selectedIndex !== null) {
			event.preventDefault();
			selectedIndex = null;
		}
	}

	onMount(() => {
		let active = true;

		async function processPayments() {
			if (payments.length === 0) {
				processing = false;
				onready?.();
				return;
			}

			const nextPayments = await Promise.all(
				payments.map(async (payment) => {
					const brandColor = normalizeBrandColor(payment.color, payment.icon);
					const foregroundColor = getForegroundColor(brandColor);
					const paymentUrl = normalizePaymentUrl(payment.url);
					const base: WalletPayment = {
						name: payment.name,
						url: paymentUrl,
						icon: payment.icon,
						brandColor,
						foregroundColor,
						iconSurfaceColor:
							foregroundColor === '#ffffff' ? 'rgb(0 0 0 / 0.2)' : 'rgb(255 255 255 / 0.58)',
						linkAvailable: paymentUrl.length > 0
					};

					if (!paymentUrl) return { ...base, qrError: true };

					try {
						const qrCodeDataUrl = await QRCode.toDataURL(paymentUrl, {
							margin: 0,
							width: 320,
							errorCorrectionLevel: 'M',
							color: { dark: '#000000', light: '#ffffff' }
						});
						return { ...base, qrCodeDataUrl };
					} catch (error) {
						console.error(`Failed to generate QR for ${payment.name}`, error);
						return { ...base, qrError: true };
					}
				})
			);

			if (!active) return;
			processedPayments = nextPayments;
			selectedIndex = null;
			processing = false;
			onready?.();
		}

		void processPayments();
		return () => {
			active = false;
		};
	});
</script>

<svelte:window onkeydown={handleEscape} />

{#if processing}
	<StatusState
		icon={LoaderCircle}
		title={$t('pay.states.loading')}
		description={$t('pay.states.loading_hint')}
		transitionKey={$locale}
		layout="viewport"
		iconClass="animate-spin opacity-60"
	/>
{:else if processedPayments.length === 0}
	<StatusState
		icon={WalletCards}
		code={0}
		title={$t('pay.states.empty')}
		description={$t('pay.states.empty_hint')}
		transitionKey={$locale}
		layout="viewport"
	/>
{:else}
	<div class="wallet-responsive-root h-full min-h-0 w-full">
		<div class="wallet-pass-stack relative mx-auto h-full min-h-0 w-full max-w-[460px] lg:hidden">
			{#each processedPayments as payment, index (`${payment.name}-${index}`)}
				{@const stackPosition = getStackPosition(index)}
				<WalletPass
					mode="mobile-stack"
					{payment}
					{index}
					expanded={selectedIndex === index}
					{stackPosition}
					selectedPosition={processedPayments.length - 1}
					stackZIndex={stackPosition + 1}
					ontoggle={() => togglePayment(index)}
				/>
			{/each}
		</div>

		<div class="wallet-desktop-workspace hidden h-full min-h-0 w-full lg:grid">
			<div class="wallet-method-list flex min-h-0 flex-col gap-3" role="list">
				{#each processedPayments as payment, index (`summary-${payment.name}-${index}`)}
					<div role="listitem">
						<WalletPass
							mode="desktop-summary"
							{payment}
							{index}
							expanded={activeIndex === index}
							ontoggle={() => selectPayment(index)}
						/>
					</div>
				{/each}
			</div>

			<div class="wallet-detail-shell min-h-0 min-w-0">
				{#if activePayment}
					<Crossfade key={activeIndex} duration={180} class="h-full">
						<WalletPass
							mode="desktop-detail"
							payment={activePayment}
							index={activeIndex}
							expanded={true}
							ontoggle={() => selectPayment(activeIndex)}
						/>
					</Crossfade>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.wallet-responsive-root {
		--wallet-summary-height: 68px;
		--wallet-stack-step: clamp(44px, 7dvh, 52px);
		--wallet-qr-size: clamp(128px, min(54vw, 32dvh), 220px);
		--wallet-expanded-height: min(100%, 420px);
	}

	.wallet-desktop-workspace {
		grid-template-columns:
			var(--payment-desktop-list-width)
			var(--payment-desktop-detail-width);
		gap: var(--payment-workspace-gap);
		align-content: start;
		justify-content: center;
	}

	.wallet-detail-shell {
		width: var(--payment-desktop-detail-width);
		height: min(100%, 420px);
	}

	@media (min-width: 1024px) {
		.wallet-responsive-root {
			--wallet-qr-size: clamp(180px, min(22vw, 28dvh), 220px);
		}
	}

	@media (max-width: 359px) and (max-height: 620px) and (orientation: portrait) {
		.wallet-responsive-root {
			--wallet-qr-size: 128px;
		}
	}

	@media (orientation: landscape) and (max-height: 600px) {
		.wallet-responsive-root {
			--wallet-qr-size: clamp(128px, 26vw, 160px);
		}
	}
</style>
