<script lang="ts">
	/**
	 * 支付页面
	 *
	 * 展示支付方式列表和二维码。
	 */
	import { onMount } from 'svelte';
	import QRCodeCard from '$lib/components/pay/QRCodeCard.svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import LoadingState from '$lib/components/ui/feedback/LoadingState.svelte';
	import { fade } from 'svelte/transition';
	import { loadYaml } from '$lib/utils/network/loading';
	import { t, locale } from '$lib/i18n/store';

	let payments: any[] = $state([]);
	let loading = $state(true);
	let error = $state('');

	onMount(async () => {
		try {
			payments = await loadYaml<any[]>('/data/payments.yaml');
		} catch (e) {
			error = 'Error loading configuration';
			console.error(e);
		} finally {
			loading = false;
		}
	});
</script>

<div class="flex h-full w-full flex-col items-center justify-start px-0 pt-4 md:px-4 md:pt-8">
	<!-- 标题 -->
	<div class="mb-4 text-center px-4">
		<h1
			class="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-3xl font-bold text-transparent md:text-4xl"
		>
			<Crossfade key={$locale} class="inline-grid">
				<span>{$t('pay.title')}</span>
			</Crossfade>
		</h1>
	</div>

	<!-- 内容区域 -->
	<LoadingState {loading} {error} class="px-4">
		<div class="w-full">
			<QRCodeCard {payments} />
		</div>
	</LoadingState>
</div>
