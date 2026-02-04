<script lang="ts">
	/**
	 * 支付二维码卡片组件
	 *
	 * 展示支付方式列表，点击后在原地展开显示二维码。
	 * 使用 LiquidGlass 效果和 i18n 国际化。
	 * 
	 * @prop payments - 支付方式配置数组 (包含名称、URL、颜色及图标)
	 */
	import { onMount } from 'svelte';
	import QRCode from 'qrcode';
	import LoadingSpinner from '$lib/components/ui/feedback/LoadingSpinner.svelte';
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import LazyImage from '$lib/components/ui/display/LazyImage.svelte';
	import { t, locale } from '$lib/i18n/store';
	import { fade, slide } from 'svelte/transition';
	
	import {
		SiAlipay,
		SiWechat,
		SiQq,
		SiContactlesspayment
	} from '@icons-pack/svelte-simple-icons';

	interface PaymentOriginal {
		name: string;
		url: string;
		color: string;
		icon: string;
	}

	interface Payment extends PaymentOriginal {
		qrCodeDataUrl?: string;
	}

	let { payments = [] }: { payments: PaymentOriginal[] } = $props();

	let processedPayments = $state<Payment[]>([]);
	let selectedIndex: number | null = $state(null);
	let loading = $state(true);

	// 图标映射
	const iconMap: Record<string, typeof SiAlipay> = {
		alipay: SiAlipay,
		wechat: SiWechat,
		qq: SiQq,
		unionpay: SiContactlesspayment
	};

	// i18n 键名映射
	const i18nKeyMap: Record<string, string> = {
		alipay: 'alipay',
		wechat: 'wechat',
		qq: 'qq',
		unionpay: 'unionpay'
	};

	onMount(async () => {
		try {
			processedPayments = await Promise.all(
				payments.map(async (p) => {
					try {
						const dataUrl = await QRCode.toDataURL(p.url, {
							margin: 2,
							width: 320,
							color: {
								dark: p.color,
								light: '#ffffff'
							}
						});
						return { ...p, qrCodeDataUrl: dataUrl };
					} catch (err) {
						console.error(`Failed to generate QR for ${p.name}`, err);
						return { ...p };
					}
				})
			);
		} catch (e) {
			console.error('Error processing payments', e);
		} finally {
			loading = false;
		}
	});

	function togglePayment(index: number) {
		if (selectedIndex === index) {
			selectedIndex = null;
		} else {
			selectedIndex = index;
		}
	}

	/**
	 * 获取支付方式的本地化名称
	 */
	function getPaymentName(icon: string): string {
		const key = i18nKeyMap[icon];
		if (key) {
			return $t(`pay.methods.${key}`);
		}
		return icon;
	}
</script>

{#if loading}
	<div class="flex items-center justify-center p-8">
		<LoadingSpinner size="lg" />
	</div>
{:else}
	<div class="mx-auto w-full max-w-3xl flex flex-col gap-3">
		{#each processedPayments as payment, i}
			<LiquidGlass
				opaque={true}
				class="rounded-2xl p-0 overflow-hidden transition-all duration-300"
				tilt={selectedIndex !== i}
			>
				<!-- 卡片头部 -->
				<button
					class="w-full p-4 flex items-center gap-4 text-left"
					onclick={() => togglePayment(i)}
				>
					<!-- 图标 -->
					{#if iconMap[payment.icon]}
						{@const IconComponent = iconMap[payment.icon]}
						<div
							class="shrink-0 rounded-xl bg-white/10 p-3"
							style="color: {payment.color}"
						>
							<IconComponent size={24} />
						</div>
					{:else}
						<div
							class="shrink-0 rounded-xl bg-secondary/50 p-3"
							style="color: {payment.color}"
						>
							<span class="text-lg font-bold">{payment.name.charAt(0)}</span>
						</div>
					{/if}

					<!-- 名称 -->
					<div class="flex-1">
						<h3 class="text-lg font-bold text-foreground">
							<Crossfade key={$locale} class="inline-grid">
								<span>{getPaymentName(payment.icon)}</span>
							</Crossfade>
						</h3>
					</div>

					<!-- 展开/收起指示器 -->
					<div
						class="shrink-0 text-muted-foreground transition-transform duration-300"
						class:rotate-180={selectedIndex === i}
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="6 9 12 15 18 9"></polyline>
						</svg>
					</div>
				</button>

				<!-- 展开区域 - 二维码 -->
				{#if selectedIndex === i}
					<div
						class="px-4 pb-5"
						transition:slide={{ duration: 250 }}
					>
						<div class="flex flex-col items-center gap-4">
							{#if payment.qrCodeDataUrl}
								<Crossfade key={payment.qrCodeDataUrl} class="rounded-2xl bg-white p-3 shadow-lg">
									<LazyImage
										src={payment.qrCodeDataUrl}
										alt="{payment.name} QR Code"
										class="w-64 h-64 md:w-72 md:h-72 object-contain"
										fit="contain"
										width="auto"
										height="auto"
									/>
								</Crossfade>
							{:else}
								<div
									class="flex h-48 w-48 items-center justify-center rounded-xl bg-secondary/30 text-muted-foreground"
								>
									<Crossfade key={$locale} class="inline-grid">
										<span>{$t('pay.modal.no_qr')}</span>
									</Crossfade>
								</div>
							{/if}

							<!-- 直接打开链接 -->
							<a
								href={payment.url}
								target="_blank"
								class="flex items-center gap-2 rounded-full bg-secondary/50 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/70"
							>
								<Crossfade key={$locale} class="inline-grid">
									<span>{$t('pay.modal.open_link')}</span>
								</Crossfade>
								<svg 
									xmlns="http://www.w3.org/2000/svg" 
									width="12" 
									height="12" 
									viewBox="0 0 24 24" 
									fill="none" 
									stroke="currentColor" 
									stroke-width="2" 
									stroke-linecap="round" 
									stroke-linejoin="round"
								>
									<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
									<polyline points="15 3 21 3 21 9"></polyline>
									<line x1="10" y1="14" x2="21" y2="3"></line>
								</svg>
							</a>
						</div>
					</div>
				{/if}
			</LiquidGlass>
		{/each}
	</div>
{/if}
