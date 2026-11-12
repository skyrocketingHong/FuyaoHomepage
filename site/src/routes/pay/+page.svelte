<script lang="ts">
	/**
	 * 支付页面。
	 *
	 * 使用 Header 下方的完整内容视口承载统一 Wallet 卡栈，移动端卡片背景可继续
	 * 延伸到固定底部 Dock 后方。说明卡由 QRCodeCard 编排为最后一个视觉索引；页面不创建
	 * 滚动容器、独立背景或额外水平留白。
	 */
	import { onMount } from 'svelte';
	import QRCodeCard from '$lib/components/pay/QRCodeCard.svelte';
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
		data-payment-page
		class="payment-page flex h-full min-h-0 w-full items-center justify-center overflow-visible md:mx-auto md:max-w-[var(--payment-card-max-width)]"
	>
		<div class="size-full min-h-0 min-w-0 overflow-visible">
			<QRCodeCard {payments} />
		</div>
	</div>
{/if}
