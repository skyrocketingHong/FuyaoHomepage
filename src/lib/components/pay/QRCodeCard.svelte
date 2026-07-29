<script lang="ts">
	/**
	 * Apple Wallet 式纵向 Pass 卡栈控制器。
	 *
	 * 支付配置反向映射为视觉序列，“支持本站”固定追加为最前层。每张完整 Pass 保持
	 * 默认 Y 坐标和固定 z-index；选中卡片后，只把其前方卡片下移到底部轨道。
	 * ResizeObserver 按实际视口、Dock、前方卡片数量和设计 token 计算安全交互高度、
	 * 内容间距、二维码尺寸及紧凑布局。具体 Pass 不参与堆叠或 Dock 计算。
	 *
	 * @prop payments - 按业务优先级排列的支付方式配置数组。
	 */
	import { onMount } from 'svelte';
	import QRCode from 'qrcode';
	import PaymentIntro from '$lib/components/pay/PaymentIntro.svelte';
	import WalletPass from '$lib/components/pay/WalletPass.svelte';
	import type { WalletPayment } from '$lib/components/pay/WalletPass.svelte';
	import StatusState from '$lib/components/ui/feedback/StatusState.svelte';
	import { t, locale } from '$lib/i18n/store';
	import { LoaderCircle, WalletCards } from 'lucide-svelte';

	interface PaymentConfig {
		name: string;
		url: string;
		color: string;
		icon: string;
	}

	interface PaymentLayoutTokens {
		headerHeight: number;
		stackStep: number;
		frontRailStep: number;
		activeBottomGap: number;
		qrSizePreferredMin: number;
		qrSizeMin: number;
		qrSizeCompactMin: number;
		qrSizeCompactMax: number;
		qrSizeMax: number;
		qrWidthRatio: number;
		qrHeightRatio: number;
		contentPaddingInline: number;
		contentPaddingBlockMin: number;
		contentPaddingBlockMax: number;
		actionHeight: number;
		dockHeight: number;
		cardUnderlapHeight: number;
	}

	interface PaymentLayout {
		visualCardHeight: number;
		interactiveCardHeight: number;
		frontRailStart: number;
		frontRailStep: number;
		contentPaddingBlock: number;
		qrSize: number;
		compact: boolean;
	}

	interface Props {
		payments: PaymentConfig[];
	}

	let { payments = [] }: Props = $props();

	let processedPayments = $state<WalletPayment[]>([]);
	let processing = $state(true);
	let expandedPassId = $state<string | null>(null);
	let stackElement = $state<HTMLDivElement>();
	let dockRulerElement = $state<HTMLSpanElement>();
	let underlapRulerElement = $state<HTMLSpanElement>();
	let measuredLayout = $state<PaymentLayout | null>(null);

	let visualPayments = $derived([...processedPayments].reverse());
	let introVisualIndex = $derived(visualPayments.length);
	let visualCardCount = $derived(visualPayments.length + 1);
	let activeVisualIndex = $derived.by(() => {
		if (expandedPassId === null) return introVisualIndex;
		const paymentIndex = visualPayments.findIndex((payment) => payment.id === expandedPassId);
		return paymentIndex >= 0 ? paymentIndex : introVisualIndex;
	});
	let stackStyle = $derived.by(() => {
		if (!measuredLayout) return '';
		return [
			`--payment-card-visual-height: ${measuredLayout.visualCardHeight}px`,
			`--payment-interactive-card-height: ${measuredLayout.interactiveCardHeight}px`,
			`--payment-card-content-block: ${measuredLayout.contentPaddingBlock}px`,
			`--payment-qr-size: ${measuredLayout.qrSize}px`
		].join('; ');
	});

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

	/** 由支付配置内容生成不受排序影响的稳定卡片 ID。 */
	function createPaymentId(payment: PaymentConfig): string {
		const identity = `${payment.icon}\u0000${payment.name}\u0000${payment.url}`;
		let hash = 2166136261;
		for (let index = 0; index < identity.length; index += 1) {
			hash ^= identity.charCodeAt(index);
			hash = Math.imul(hash, 16777619);
		}
		const prefix = payment.icon.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'payment';
		return `${prefix}-${(hash >>> 0).toString(36)}`;
	}

	function readPixelToken(styles: CSSStyleDeclaration, name: string): number {
		const value = Number.parseFloat(styles.getPropertyValue(name));
		return Number.isFinite(value) ? value : 0;
	}

	function readLayoutTokens(
		element: HTMLElement,
		dockHeight: number,
		cardUnderlapHeight: number
	): PaymentLayoutTokens {
		const styles = getComputedStyle(element);
		return {
			headerHeight: readPixelToken(styles, '--payment-card-header-height'),
			stackStep: readPixelToken(styles, '--payment-stack-step'),
			frontRailStep: readPixelToken(styles, '--payment-front-rail-step'),
			activeBottomGap: readPixelToken(styles, '--payment-active-bottom-gap'),
			qrSizePreferredMin: readPixelToken(styles, '--payment-qr-size-preferred-min'),
			qrSizeMin: readPixelToken(styles, '--payment-qr-size-min'),
			qrSizeCompactMin: readPixelToken(styles, '--payment-qr-size-compact-min'),
			qrSizeCompactMax: readPixelToken(styles, '--payment-qr-size-compact-max'),
			qrSizeMax: readPixelToken(styles, '--payment-qr-size-max'),
			qrWidthRatio: readPixelToken(styles, '--payment-qr-width-ratio'),
			qrHeightRatio: readPixelToken(styles, '--payment-qr-height-ratio'),
			contentPaddingInline: readPixelToken(styles, '--payment-card-content-inline'),
			contentPaddingBlockMin: readPixelToken(styles, '--payment-card-content-block-min'),
			contentPaddingBlockMax: readPixelToken(styles, '--payment-card-content-block-max'),
			actionHeight: readPixelToken(styles, '--payment-action-height'),
			dockHeight,
			cardUnderlapHeight
		};
	}

	function clamp(value: number, minimum: number, maximum: number): number {
		return Math.min(Math.max(value, minimum), maximum);
	}

	/**
	 * 计算卡片视觉高度、底部身份轨道和所选卡片的安全内容区。
	 * 二维码先压缩内容区垂直内边距，再按可见宽高比例缩放，空间不足时切换紧凑尺寸。
	 */
	function calculateLayout(
		width: number,
		height: number,
		count: number,
		selectedIndex: number,
		tokens: PaymentLayoutTokens
	): PaymentLayout {
		const selectedTop = selectedIndex * tokens.stackStep;
		const frontCount = Math.max(0, count - selectedIndex - 1);
		const dockTop = Math.max(0, height - clamp(tokens.dockHeight, 0, height));
		const preferredRailStart =
			dockTop - tokens.headerHeight - Math.max(0, frontCount - 1) * tokens.frontRailStep;
		const frontRailStart = frontCount > 0 ? Math.max(0, preferredRailStart) : dockTop;
		const interactiveBottom = (frontCount > 0 ? frontRailStart : dockTop) - tokens.activeBottomGap;
		const interactiveCardHeight = Math.max(tokens.headerHeight, interactiveBottom - selectedTop);

		const contentHeight = Math.max(
			0,
			interactiveCardHeight - tokens.headerHeight - tokens.actionHeight - 1
		);
		const paddingBudget = (contentHeight - tokens.qrSizePreferredMin) / 2;
		const contentPaddingBlock = clamp(
			paddingBudget,
			tokens.contentPaddingBlockMin,
			tokens.contentPaddingBlockMax
		);
		const innerContentHeight = Math.max(0, contentHeight - contentPaddingBlock * 2);
		const innerContentWidth = Math.max(0, width - tokens.contentPaddingInline * 2);
		const regularTarget = Math.min(
			innerContentWidth * tokens.qrWidthRatio,
			innerContentHeight * tokens.qrHeightRatio,
			tokens.qrSizeMax
		);
		const compact = regularTarget < tokens.qrSizeMin;
		const modeMaximum = compact ? tokens.qrSizeCompactMax : tokens.qrSizeMax;
		const modeMinimum = compact ? tokens.qrSizeCompactMin : tokens.qrSizeMin;
		const geometricCapacity = Math.min(innerContentWidth, innerContentHeight, modeMaximum);
		const proportionalTarget = Math.min(
			innerContentWidth * tokens.qrWidthRatio,
			innerContentHeight * tokens.qrHeightRatio,
			modeMaximum
		);
		const qrSize = Math.floor(
			Math.min(geometricCapacity, Math.max(proportionalTarget, modeMinimum))
		);

		return {
			visualCardHeight: height + tokens.cardUnderlapHeight,
			interactiveCardHeight,
			frontRailStart,
			frontRailStep: tokens.frontRailStep,
			contentPaddingBlock,
			qrSize: Math.max(0, qrSize),
			compact
		};
	}

	/** 展开未选中的支付卡片；再次选择当前卡片时恢复默认堆叠。 */
	function togglePaymentPass(paymentId: string) {
		expandedPassId = expandedPassId === paymentId ? null : paymentId;
	}

	/** “支持本站”代表默认状态，重复选择默认状态不会触发状态更新。 */
	function restoreDefaultStack() {
		if (expandedPassId !== null) expandedPassId = null;
	}

	/** 将固定视觉层级和当前 Y 轴目标映射为卡片局部 CSS 变量。 */
	function getCardStyle(visualIndex: number): string {
		const layout = measuredLayout;
		const shouldDock = visualIndex > activeVisualIndex && layout;
		const translateY = shouldDock
			? `${layout.frontRailStart + (visualIndex - activeVisualIndex - 1) * layout.frontRailStep}px`
			: `calc(var(--payment-stack-step) * ${visualIndex})`;
		return `--payment-card-translate-y: ${translateY}; --payment-card-z-index: ${visualIndex + 1};`;
	}

	$effect(() => {
		const element = stackElement;
		const dockRuler = dockRulerElement;
		const underlapRuler = underlapRulerElement;
		const count = visualCardCount;
		const selectedIndex = activeVisualIndex;
		if (!element || !dockRuler || !underlapRuler || count === 0) return;

		const updateLayout = () => {
			const { width, height } = element.getBoundingClientRect();
			if (width <= 0 || height <= 0) return;
			const dockHeight = dockRuler.getBoundingClientRect().height;
			const cardUnderlapHeight = underlapRuler.getBoundingClientRect().height;
			measuredLayout = calculateLayout(
				width,
				height,
				count,
				selectedIndex,
				readLayoutTokens(element, dockHeight, cardUnderlapHeight)
			);
		};

		updateLayout();
		const observer = new ResizeObserver(updateLayout);
		observer.observe(element);
		observer.observe(dockRuler);
		observer.observe(underlapRuler);
		return () => observer.disconnect();
	});

	onMount(() => {
		let active = true;

		async function processPayments() {
			if (payments.length === 0) {
				processing = false;
				return;
			}

			const nextPayments = await Promise.all(
				payments.map(async (payment) => {
					const brandColor = normalizeBrandColor(payment.color, payment.icon);
					const foregroundColor = getForegroundColor(brandColor);
					const paymentUrl = normalizePaymentUrl(payment.url);
					const base: WalletPayment = {
						id: createPaymentId(payment),
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
							margin: 4,
							width: 960,
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
			expandedPassId = null;
			processing = false;
		}

		void processPayments();
		return () => {
			active = false;
		};
	});
</script>

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
	<div
		bind:this={stackElement}
		class="wallet-pass-stack z-content relative h-full min-h-0 w-full overflow-visible"
		class:wallet-pass-stack--compact={measuredLayout?.compact}
		style={stackStyle}
		role="list"
		aria-label={$t('pay.card.stack_label')}
	>
		<span bind:this={dockRulerElement} class="payment-dock-ruler" aria-hidden="true"></span>
		<span bind:this={underlapRulerElement} class="payment-underlap-ruler" aria-hidden="true"></span>

		{#each visualPayments as payment, visualIndex (payment.id)}
			<div
				class="wallet-stack-item absolute inset-x-0 top-0"
				style={getCardStyle(visualIndex)}
				data-wallet-visual-index={visualIndex}
				data-wallet-region={visualIndex > activeVisualIndex ? 'dock' : 'stack'}
				role="listitem"
			>
				<WalletPass
					{payment}
					selected={expandedPassId === payment.id}
					onselect={() => togglePaymentPass(payment.id)}
				/>
			</div>
		{/each}

		<div
			class="wallet-stack-item absolute inset-x-0 top-0"
			style={getCardStyle(introVisualIndex)}
			data-wallet-visual-index={introVisualIndex}
			data-wallet-region={introVisualIndex > activeVisualIndex ? 'dock' : 'stack'}
			role="listitem"
		>
			<PaymentIntro selected={expandedPassId === null} onselect={restoreDefaultStack} />
		</div>
	</div>
{/if}

<style>
	.wallet-pass-stack {
		--payment-card-visual-height: calc(100% + var(--payment-card-underlap-height));
		--payment-interactive-card-height: calc(
			100% - var(--payment-dock-height) - var(--payment-active-bottom-gap)
		);
		--payment-card-content-block: var(--payment-card-content-block-max);
		--payment-qr-size: var(--payment-qr-size-min);
	}

	.payment-dock-ruler,
	.payment-underlap-ruler {
		position: absolute;
		width: 0;
		visibility: hidden;
		pointer-events: none;
	}

	.payment-dock-ruler {
		height: var(--payment-dock-height);
	}

	.payment-underlap-ruler {
		height: var(--payment-card-underlap-height);
	}

	.wallet-stack-item {
		height: var(--payment-card-visual-height);
		transform: translate3d(0, var(--payment-card-translate-y), 0);
		z-index: var(--payment-card-z-index);
		transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1);
		will-change: transform;
	}

	@media (prefers-reduced-motion: reduce) {
		.wallet-stack-item {
			transition-duration: 0ms;
			will-change: auto;
		}
	}
</style>
