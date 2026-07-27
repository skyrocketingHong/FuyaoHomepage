<script lang="ts">
	/**
	 * 全局错误页面组件
	 *
	 * 负责呈现系统错误、404 页面等，采用玻璃拟态设计风格。
	 */
	import { page } from '$app/state';
	import { t, locale } from '$lib/i18n/store';
	import StatusState from '$lib/components/ui/feedback/StatusState.svelte';
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import { FileQuestion, AlertCircle, ServerCrash, Home } from 'lucide-svelte';

	// 根据状态码选择图标
	const getIcon = (status: number) => {
		if (status === 404) return FileQuestion;
		if (status >= 500) return ServerCrash;
		return AlertCircle;
	};

	let Icon = $derived(getIcon(page.status));
</script>

{#snippet action()}
	<LiquidGlass
		tag="a"
		href="/"
		class="inline-flex !w-auto rounded-full !p-0 text-foreground transition-all"
		tilt={false}
	>
		<span class="flex items-center gap-2 px-4 py-2">
			<Home class="size-4" />
			<Crossfade key={'backhome-' + $locale} inline class="inline-grid">
				<span class="font-medium">{$t('nav.home')}</span>
			</Crossfade>
		</span>
	</LiquidGlass>
{/snippet}

<StatusState
	icon={Icon}
	code={page.status}
	title={page.status === 404 ? $t('error.not_found_title') : $t('error.something_wrong_title')}
	description={page.status === 404 ? $t('error.not_found_desc') : $t('error.something_wrong_desc')}
	transitionKey={$locale}
	detailLabel={$t('error.request_path')}
	detailValue={page.url.pathname}
	{action}
/>
