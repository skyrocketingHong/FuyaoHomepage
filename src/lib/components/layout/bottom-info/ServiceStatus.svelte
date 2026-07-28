<script lang="ts">
	/**
	 * 服务状态与部署平台信息组件。
	 *
	 * 移动端固定为一条 13px 静态单行，图标不压缩，文字溢出时省略；
	 * 桌面端保持普通单行元数据布局。
	 *
	 * @prop direction - 排列方向，影响移动端固定行布局。
	 * @prop alignment - 信息行对齐方式，默认左对齐。
	 */
	import { SiBetterstack, SiAlibabacloud } from '@icons-pack/svelte-simple-icons';
	import { t, locale } from '$lib/i18n/store';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';

	let { direction = 'vertical', alignment = 'start' } = $props<{
		direction?: 'vertical' | 'horizontal' | 'auto';
		alignment?: 'start' | 'center';
	}>();

	let statusUrl = $derived(
		$locale === 'zh-CN'
			? 'https://status.fuyaoskyrocket.ing/zh'
			: 'https://status.fuyaoskyrocket.ing/en'
	);

	let alignmentClass = $derived(
		alignment === 'center' ? 'justify-center text-center' : 'justify-start text-left'
	);
	let fullStatusLabel = $derived(
		`${$t('layout.bottom_info.service_status')} · ${$t('layout.bottom_info.deployed_on')}`
	);
</script>

{#snippet statusContent(iconClass: string)}
	<a
		href={statusUrl}
		target="_blank"
		rel="noopener noreferrer"
		class="inline-flex shrink-0 items-center gap-1 transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary/60"
	>
		<span class="{iconClass} shrink-0 [&>svg]:size-full">
			<SiBetterstack />
		</span>
		<Crossfade key={$locale} inline class="inline-grid shrink-0">
			<span class="shrink-0 whitespace-nowrap">{$t('layout.bottom_info.service_status')}</span>
		</Crossfade>
	</a>
	<span class="shrink-0 opacity-40">·</span>
	<span class="inline-flex shrink-0 items-center gap-1">
		<span class="{iconClass} shrink-0 [&>svg]:size-full">
			<SiAlibabacloud />
		</span>
		<Crossfade key={$locale} inline class="inline-grid shrink-0">
			<span class="shrink-0 whitespace-nowrap">{$t('layout.bottom_info.deployed_on')}</span>
		</Crossfade>
	</span>
{/snippet}

{#if direction === 'horizontal'}
	<div
		class="flex h-full max-w-full min-w-0 items-center gap-1 overflow-hidden whitespace-nowrap"
		title={fullStatusLabel}
		aria-label={fullStatusLabel}
	>
		<a
			href={statusUrl}
			target="_blank"
			rel="noopener noreferrer"
			class="inline-flex min-w-0 items-center gap-1 overflow-hidden transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary/60"
			aria-label={$t('layout.bottom_info.service_status')}
		>
			<span class="size-2.5 shrink-0 [&>svg]:size-full" aria-hidden="true">
				<SiBetterstack />
			</span>
			<Crossfade key={$locale} inline class="inline-grid min-w-0">
				<span class="truncate">{$t('layout.bottom_info.service_status')}</span>
			</Crossfade>
		</a>
		<span class="shrink-0 opacity-40" aria-hidden="true">·</span>
		<span class="inline-flex min-w-0 items-center gap-1 overflow-hidden">
			<span class="size-2.5 shrink-0 [&>svg]:size-full" aria-hidden="true">
				<SiAlibabacloud />
			</span>
			<Crossfade key={$locale} inline class="inline-grid min-w-0">
				<span class="truncate">{$t('layout.bottom_info.deployed_on')}</span>
			</Crossfade>
		</span>
	</div>
{:else}
	<div
		class="flex w-full min-w-0 items-center gap-1 overflow-hidden whitespace-nowrap text-foreground/55 {alignmentClass}"
	>
		{@render statusContent('size-3')}
	</div>
{/if}
