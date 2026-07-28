<script lang="ts">
	/**
	 * 支付页面。
	 *
	 * 统一外层控制说明卡与 Wallet 工作区的最大宽度和水平边界。手机与平板使用
	 * 固定视口 Wallet 堆叠，宽屏使用支付方式列表与当前详情双栏；页面及内部组件
	 * 均不创建滚动容器。
	 */
	import { onMount } from 'svelte';
	import QRCodeCard from '$lib/components/pay/QRCodeCard.svelte';
	import PaymentIntro from '$lib/components/pay/PaymentIntro.svelte';
	import StatusState from '$lib/components/ui/feedback/StatusState.svelte';
	import { loadYaml } from '$lib/utils/network/loading';
	import { t, locale } from '$lib/i18n/store';
	import { CircleAlert, LoaderCircle, WalletCards } from 'lucide-svelte';

	interface Payment {
		name: string;
		url: string;
		color: string;
		icon: string;
		[key: string]: unknown;
	}

	let payments = $state<Payment[]>([]);
	let loading = $state(true);
	let error = $state('');
	let cardReady = $state(false);

	onMount(async () => {
		try {
			payments = await loadYaml<Payment[]>('/data/payments.yaml');
		} catch (loadError) {
			error = loadError instanceof Error ? loadError.message : 'payment-config-load-failed';
			console.error('Error loading payment configuration', loadError);
		} finally {
			loading = false;
		}
	});
</script>

{#if loading}
	<StatusState
		icon={LoaderCircle}
		title={$t('pay.states.loading')}
		description={$t('pay.states.loading_hint')}
		transitionKey={$locale}
		layout="viewport"
		iconClass="animate-spin opacity-60"
	/>
{:else if error}
	<StatusState
		icon={CircleAlert}
		code="!"
		title={$t('pay.states.load_error')}
		description={$t('pay.states.load_error_hint')}
		transitionKey={$locale}
		layout="viewport"
	/>
{:else if payments.length === 0}
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
		class="payment-page mx-auto flex h-[calc(100%-var(--mobile-dock-clearance))] min-h-0 w-full max-w-[var(--payment-content-max-width)] flex-col items-center gap-3 md:h-full md:gap-4"
	>
		{#if cardReady}
			<PaymentIntro />
		{/if}

		<div class="flex min-h-0 w-full flex-1 justify-center">
			<QRCodeCard {payments} onready={() => (cardReady = true)} />
		</div>
	</div>
{/if}
