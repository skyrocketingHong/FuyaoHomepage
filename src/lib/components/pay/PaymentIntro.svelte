<script lang="ts">
	/**
	 * Wallet 卡栈最前层的“支持本站”Pass。
	 *
	 * 组件使用通用 Pass 三段结构，始终采用纯白不透明表面和独立浅色配色环境。
	 * 身份条是唯一选择入口；正文与感谢文本均为非交互内容。卡片位置、层级和底部
	 * 下穿距离由父级卡栈控制。
	 *
	 * @prop selected - 当前卡片是否选中。
	 * @prop onselect - 通过身份条选择当前卡片的回调。
	 */
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import PassActionArea from '$lib/components/pay/pass/PassActionArea.svelte';
	import PassCard from '$lib/components/pay/pass/PassCard.svelte';
	import PassContentArea from '$lib/components/pay/pass/PassContentArea.svelte';
	import PassIdentityBar from '$lib/components/pay/pass/PassIdentityBar.svelte';
	import { BookOpenText, HandHeart, LockKeyhole, ServerCog } from 'lucide-svelte';
	import { t, locale } from '$lib/i18n/store';

	interface Props {
		selected?: boolean;
		onselect?: () => void;
	}

	let { selected = false, onselect }: Props = $props();

	const panelId = 'support-pass-panel';
	const titleId = 'support-pass-title';
	let supportTitle = $derived($t('pay.card.support_title'));
	let identityActionLabel = $derived(
		$t(selected ? 'pay.card.support_active' : 'pay.card.support_restore')
	);
</script>

<PassCard
	{selected}
	{panelId}
	labelledBy={titleId}
	surface="#ffffff"
	foreground="#111827"
	class="support-pass"
>
	{#snippet identity()}
		<PassIdentityBar
			iconSurface="#f3f4f6"
			{titleId}
			selectable
			{selected}
			controlsId={panelId}
			label={identityActionLabel}
			{onselect}
		>
			{#snippet icon()}
				<HandHeart class="size-[22px] text-[#374151]" strokeWidth={2} />
			{/snippet}
			{#snippet title()}
				<Crossfade key={$locale} inline class="inline-grid max-w-full">
					<span class="truncate">{supportTitle}</span>
				</Crossfade>
			{/snippet}
			{#snippet description()}
				<Crossfade key={$locale} inline class="inline-grid max-w-full">
					<span class="truncate">{$t('pay.card.support_description')}</span>
				</Crossfade>
			{/snippet}
		</PassIdentityBar>
	{/snippet}

	{#snippet content()}
		<PassContentArea layout="start" class="support-pass__content">
			<div class="support-pass__content-inner">
				<h2
					class="support-pass__lead max-w-[38rem] text-[19px] leading-6 font-semibold text-[#111827]"
				>
					<Crossfade key={$locale} inline class="inline-grid max-w-full">
						<span>{$t('pay.card.support_lead')}</span>
					</Crossfade>
				</h2>

				<p class="support-pass__body max-w-[38rem] text-[14px] leading-[1.55] text-[#4b5563]">
					<Crossfade key={$locale} inline class="inline-grid max-w-full">
						<span>{$t('pay.card.support_body')}</span>
					</Crossfade>
				</p>

				<ul class="support-pass__purposes max-w-[38rem]" aria-label={$t('pay.card.support_uses')}>
					<li class="support-pass__purpose flex min-w-0 items-center gap-3">
						<span
							class="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-[#f3f4f6] text-[#4b5563]"
							aria-hidden="true"
						>
							<BookOpenText size={19} strokeWidth={1.9} />
						</span>
						<span class="min-w-0 text-left">
							<strong class="block text-[13px] leading-[18px] font-semibold text-[#1f2937]">
								<Crossfade key={$locale} inline class="inline-grid max-w-full">
									<span>{$t('pay.card.support_content_title')}</span>
								</Crossfade>
							</strong>
							<span
								class="support-pass__purpose-description block text-[12px] leading-4 text-[#6b7280]"
							>
								<Crossfade key={$locale} inline class="inline-grid max-w-full">
									<span>{$t('pay.card.support_content_description')}</span>
								</Crossfade>
							</span>
						</span>
					</li>

					<li class="support-pass__purpose flex min-w-0 items-center gap-3">
						<span
							class="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-[#f3f4f6] text-[#4b5563]"
							aria-hidden="true"
						>
							<ServerCog size={19} strokeWidth={1.9} />
						</span>
						<span class="min-w-0 text-left">
							<strong class="block text-[13px] leading-[18px] font-semibold text-[#1f2937]">
								<Crossfade key={$locale} inline class="inline-grid max-w-full">
									<span>{$t('pay.card.support_maintenance_title')}</span>
								</Crossfade>
							</strong>
							<span
								class="support-pass__purpose-description block text-[12px] leading-4 text-[#6b7280]"
							>
								<Crossfade key={$locale} inline class="inline-grid max-w-full">
									<span>{$t('pay.card.support_maintenance_description')}</span>
								</Crossfade>
							</span>
						</span>
					</li>
				</ul>

				<p
					class="support-pass__privacy flex max-w-[38rem] items-start gap-2 text-[12px] leading-[1.45] text-[#6b7280]"
				>
					<LockKeyhole class="mt-px size-4 shrink-0" strokeWidth={1.9} aria-hidden="true" />
					<Crossfade key={$locale} inline class="inline-grid max-w-full">
						<span>{$t('pay.card.support_privacy')}</span>
					</Crossfade>
				</p>
			</div>
		</PassContentArea>
	{/snippet}

	{#snippet action()}
		<PassActionArea mode="text">
			<Crossfade key={$locale} inline class="inline-grid max-w-full text-[#374151]">
				<span>{$t('pay.card.support_thanks')}</span>
			</Crossfade>
		</PassActionArea>
	{/snippet}
</PassCard>

<style>
	:global(.support-pass) {
		--payment-card-border-color: rgb(17 24 39 / 0.1);
		--payment-card-divider-color: rgb(17 24 39 / 0.12);
		color-scheme: light;
	}

	:global(.support-pass__content) {
		display: block;
		container: support-content / size;
	}

	.support-pass__content-inner {
		display: flex;
		height: 100%;
		min-height: 0;
		flex-direction: column;
		align-items: stretch;
		gap: 10px;
	}

	.support-pass__purposes {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.support-pass__purpose {
		padding-block: 7px;
	}

	.support-pass__purpose + .support-pass__purpose {
		border-top: 1px solid rgb(17 24 39 / 0.1);
	}

	@container support-content (max-height: 300px) {
		.support-pass__content-inner {
			gap: 7px;
		}

		.support-pass__purpose {
			padding-block: 4px;
		}
	}

	@container support-content (max-height: 255px) {
		.support-pass__content-inner {
			gap: 5px;
		}

		.support-pass__purpose-description {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}

	@container support-content (max-height: 225px) {
		.support-pass__lead {
			font-size: 17px;
			line-height: 21px;
		}

		.support-pass__body {
			font-size: 13px;
			line-height: 1.45;
		}

		.support-pass__purpose-description {
			display: none;
		}
	}

	@container support-content (max-height: 190px) {
		.support-pass__purposes {
			display: none;
		}

		.support-pass__content-inner {
			gap: 4px;
		}
	}

	@container support-content (max-height: 145px) {
		.support-pass__lead {
			font-size: 14px;
			line-height: 17px;
		}

		.support-pass__body,
		.support-pass__privacy {
			font-size: 10px;
			line-height: 1.25;
		}

		.support-pass__privacy :global(svg) {
			display: none;
		}
	}
</style>
