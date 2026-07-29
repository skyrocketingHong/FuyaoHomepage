<script module lang="ts">
	/** 已完成二维码处理、可直接交给 Wallet Pass 渲染的支付方式。 */
	export interface WalletPayment {
		/** 不受配置排序影响的稳定卡片 ID。 */
		id: string;
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
</script>

<script lang="ts">
	/**
	 * 使用统一三段式组件组合的支付方式 Pass。
	 *
	 * 身份条是唯一的卡片选择按钮；内容区承载状态提示和完整二维码；操作区仅渲染
	 * 真实支付链接或不可点击状态。二维码尺寸与紧凑布局由父级卡栈通过 CSS 变量控制，
	 * 本组件不计算卡片坐标、层级、Dock 避让或整体动画。
	 *
	 * @prop payment - 已处理的支付方式与二维码数据。
	 * @prop selected - 当前卡片是否选中。
	 * @prop onselect - 通过身份条选择当前卡片的回调。
	 */
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import PassActionArea from '$lib/components/pay/pass/PassActionArea.svelte';
	import PassCard from '$lib/components/pay/pass/PassCard.svelte';
	import PassContentArea from '$lib/components/pay/pass/PassContentArea.svelte';
	import PassIdentityBar from '$lib/components/pay/pass/PassIdentityBar.svelte';
	import { CircleAlert, ExternalLink } from 'lucide-svelte';
	import { SiAlipay, SiWechat, SiQq, SiContactlesspayment } from '@icons-pack/svelte-simple-icons';
	import { t, locale } from '$lib/i18n/store';

	interface Props {
		payment: WalletPayment;
		selected?: boolean;
		onselect?: () => void;
	}

	let { payment, selected = false, onselect }: Props = $props();

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
	let identityActionLabel = $derived(
		$t(selected ? 'pay.card.collapse' : 'pay.card.expand', { method: paymentName })
	);
	let panelId = $derived(`payment-pass-panel-${payment.id}`);
	let titleId = $derived(`payment-pass-title-${payment.id}`);
</script>

<PassCard
	{selected}
	{panelId}
	labelledBy={titleId}
	cardKey={payment.name}
	surface={payment.brandColor}
	foreground={payment.foregroundColor}
	class="payment-pass"
>
	{#snippet identity()}
		<PassIdentityBar
			iconSurface={payment.iconSurfaceColor}
			{titleId}
			selectable
			{selected}
			controlsId={panelId}
			label={identityActionLabel}
			{onselect}
		>
			{#snippet icon()}
				<IconComponent size={22} />
			{/snippet}
			{#snippet title()}
				<Crossfade key={$locale} inline class="inline-grid max-w-full">
					<span class="truncate">{paymentName}</span>
				</Crossfade>
			{/snippet}
			{#snippet description()}
				<Crossfade key={$locale} inline class="inline-grid max-w-full">
					<span class="truncate">{stateLabel}</span>
				</Crossfade>
			{/snippet}
		</PassIdentityBar>
	{/snippet}

	{#snippet content()}
		<PassContentArea layout="center" class="payment-pass__content">
			{#if payment.qrCodeDataUrl && !payment.qrError}
				<img
					src={payment.qrCodeDataUrl}
					alt={$t('pay.ticket.qr_alt', { method: paymentName })}
					class="payment-pass__qr-zone shrink-0 object-contain"
				/>
			{:else}
				<div
					class="payment-pass__qr-zone flex shrink-0 flex-col items-center justify-center gap-1 rounded-[12px] bg-white text-center text-neutral-900"
					role="status"
				>
					<CircleAlert class="size-6 shrink-0 text-neutral-500" aria-hidden="true" />
					<strong class="text-xs">{$t('pay.states.qr_error')}</strong>
				</div>
			{/if}
		</PassContentArea>
	{/snippet}

	{#snippet action()}
		{#if payment.linkAvailable}
			<PassActionArea mode="link" href={payment.url} label={actionLabel}>
				<Crossfade key={$locale} inline class="inline-grid min-w-0">
					<span class="truncate">{actionLabel}</span>
				</Crossfade>
				<ExternalLink class="size-4 shrink-0" aria-hidden="true" />
			</PassActionArea>
		{:else}
			<PassActionArea mode="status">
				<Crossfade key={$locale} inline class="inline-grid min-w-0">
					<span class="truncate">{actionLabel}</span>
				</Crossfade>
			</PassActionArea>
		{/if}
	{/snippet}
</PassCard>

<style>
	.payment-pass__qr-zone {
		box-sizing: border-box;
		width: var(--payment-qr-size);
		height: var(--payment-qr-size);
		color-scheme: light;
	}
</style>
