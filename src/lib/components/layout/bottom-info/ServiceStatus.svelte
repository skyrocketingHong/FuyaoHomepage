<script lang="ts">
	/**
	 * 服务状态与部署信息组件
	 *
	 * 显示服务状态链接 (Betterstack) 和部署平台信息 (Aliyun)。
	 * 根据当前语言自动切换链接。
	 *
	 * @prop direction - 排列方向，影响文字大小
	 */
	import { SiBetterstack, SiAlibabacloud } from '@icons-pack/svelte-simple-icons';
	import { t, locale } from '$lib/i18n/store';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';

	let { direction = 'vertical' } = $props<{
		direction?: 'vertical' | 'horizontal' | 'auto';
	}>();

	/* 根据语言生成状态页链接 */
	let statusUrl = $derived(
		$locale === 'zh-CN'
			? 'https://status.fuyaoskyrocket.ing/zh'
			: 'https://status.fuyaoskyrocket.ing/en'
	);

	/* 移动端使用更小的文字 */
	let textClass = $derived(direction === 'horizontal' ? 'text-[10px]' : '');

	/* 移动端使用更小的图标 */
	let iconClass = $derived(direction === 'horizontal' ? 'h-2.5 w-2.5' : 'h-3 w-3');
</script>

<!-- 服务状态与部署信息 -->
<div class="flex items-center justify-center gap-1 whitespace-nowrap {textClass}">
	<!-- 服务状态链接 -->
	<a
		href={statusUrl}
		target="_blank"
		rel="noopener noreferrer"
		class="inline-flex items-center gap-1 transition-colors hover:text-foreground"
	>
		<div class="{iconClass} [&>svg]:h-full [&>svg]:w-full">
			<SiBetterstack />
		</div>
		<Crossfade key={$locale} class="inline-grid">
			<span>{$t('layout.bottom_info.service_status')}</span>
		</Crossfade>
	</a>

	<!-- 分隔符 -->
	<span class="opacity-40">·</span>

	<!-- 部署平台信息 -->
	<span class="inline-flex items-center gap-1">
		<div class="{iconClass} [&>svg]:h-full [&>svg]:w-full">
			<SiAlibabacloud />
		</div>
		<Crossfade key={$locale} class="inline-grid">
			<span>{$t('layout.bottom_info.deployed_on')}</span>
		</Crossfade>
	</span>
</div>
