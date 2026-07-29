<script lang="ts">
	/**
	 * Pass 固定高度操作区。
	 *
	 * `text` 渲染无交互普通文本，`status` 渲染不可点击状态，`link` 仅渲染真实链接。
	 * 三种模式都只保留与内容区之间的一条轻量分隔线，不创建玻璃、胶囊或附加边框。
	 * 链接模式保留键盘焦点外环；纯文本与状态模式不接受 href 或点击回调。
	 *
	 * @prop mode - 操作区语义：`text`、`status` 或 `link`。
	 * @prop children - 操作文案 snippet；行内 Crossfade 应在调用方完成。
	 * @prop href - 仅 `link` 模式必填的真实链接。
	 * @prop label - 仅 `link` 模式使用的完整可读标签。
	 * @prop target - 链接打开目标，默认 `_blank`。
	 * @prop rel - 链接关系，默认 `noopener noreferrer external`。
	 */
	import type { Snippet } from 'svelte';

	type TextProps = {
		mode: 'text' | 'status';
		children: Snippet;
	};

	type LinkProps = {
		mode: 'link';
		children: Snippet;
		href: string;
		label: string;
		target?: string;
		rel?: string;
	};

	type Props = TextProps | LinkProps;
	let props: Props = $props();
</script>

{#if props.mode === 'link'}
	<!-- 已由调用方校验的外部 HTTPS 或支付应用协议，不属于 SvelteKit 内部路由。 -->
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<a
		href={props.href}
		target={props.target ?? '_blank'}
		rel={props.rel ?? 'noopener noreferrer external'}
		aria-label={props.label}
		class="pass-action pass-action--link flex min-w-0 items-center justify-center gap-2 px-[var(--payment-card-content-inline)] text-center text-[14px] leading-5 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-current"
	>
		{@render props.children()}
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{:else if props.mode === 'status'}
	<div
		class="pass-action flex min-w-0 items-center justify-center px-[var(--payment-card-content-inline)] text-center text-[14px] leading-5 font-medium"
		role="status"
	>
		{@render props.children()}
	</div>
{:else}
	<div
		class="pass-action flex min-w-0 items-center justify-center px-[var(--payment-card-content-inline)] text-center text-[14px] leading-5 font-medium"
	>
		{@render props.children()}
	</div>
{/if}

<style>
	.pass-action {
		height: var(--payment-action-height);
		border-top: 1px solid var(--payment-card-divider-color);
	}

	.pass-action--link:hover {
		background: color-mix(in srgb, currentColor 8%, transparent);
	}
</style>
