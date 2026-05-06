<script lang="ts">
	/**
	 * 底部信息容器组件
	 *
	 * 依次编排三个子组件：背景信息、服务状态、版权文本。
	 * 替代原 Copyright.svelte，提供垂直/水平/自适应三种布局。
	 *
	 * @prop direction - 排列方向：'vertical' | 'horizontal' | 'auto'
	 * @prop infoComponent - 可选的背景信息展示组件
	 * @prop infoComponentProps - 传递给信息组件的属性
	 * @prop infoKey - 信息组件的唯一键
	 */
	import { locale } from '$lib/i18n/store';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import BackgroundInfo from './BackgroundInfo.svelte';
	import ServiceStatus from './ServiceStatus.svelte';
	import CopyrightText from './CopyrightText.svelte';
	import type { Component } from 'svelte';

	let {
		direction = 'auto',
		infoComponent: InfoComponent = null,
		infoComponentProps = {},
		infoKey = 'default'
	} = $props<{
		direction?: 'vertical' | 'horizontal' | 'auto';
		infoComponent?: Component | null;
		infoComponentProps?: Record<string, unknown>;
		infoKey?: string;
	}>();

	/* 容器 flex 方向 */
	let containerClass = $derived.by(() => {
		const base = 'flex items-center justify-center transition-opacity duration-300';
		if (direction === 'vertical') return `${base} flex-col gap-1`;
		if (direction === 'horizontal') return `${base} flex-col w-full`;
		return `${base} flex-col gap-1 md:flex-row md:gap-3`;
	});
</script>

<div
	class="bottom-info-container w-full flex-none text-center text-xs text-foreground/50 drop-shadow-md"
>
	<Crossfade key={$locale} class={containerClass}>
		<!-- 背景信息区域 -->
		<Crossfade key={infoKey || (InfoComponent ? 'has-info' : 'no-info')} class="w-full">
			{#if direction === 'horizontal'}
				<!-- 移动端水平布局：左右各占一半 -->
				<div
					class="mt-0 mb-1 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent"
				></div>
				<div class="flex w-full items-stretch text-[10px] leading-tight" style="zoom: 0.85;">
					<!-- 左侧：背景信息 + 服务状态 -->
					<div class="flex w-1/2 flex-col items-start justify-center gap-0">
						{#if InfoComponent}
							<BackgroundInfo
								infoComponent={InfoComponent}
								{infoComponentProps}
								{infoKey}
								{direction}
							/>
						{/if}
						<ServiceStatus {direction} />
					</div>
					<!-- 右侧：版权信息（垂直居中、右对齐） -->
					<div class="flex w-1/2 flex-col items-end justify-center text-right leading-snug">
						<CopyrightText {direction} />
					</div>
				</div>
			{:else}
				<!-- 桌面端/垂直布局 -->
				{#if InfoComponent}
					<div class="w-full">
						<div
							class="my-2 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent pr-2 pl-2"
						></div>
						<BackgroundInfo
							infoComponent={InfoComponent}
							{infoComponentProps}
							{infoKey}
							{direction}
						/>
					</div>
				{:else}
					<div></div>
				{/if}
			{/if}
		</Crossfade>

		{#if direction !== 'horizontal'}
			<!-- 分隔线 -->
			<div
				class="my-2 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent pr-2 pl-2"
			></div>

			<!-- 服务状态 -->
			<ServiceStatus {direction} />

			<!-- 分隔线 -->
			<div
				class="my-2 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent pr-2 pl-2"
			></div>

			<!-- 版权文本 -->
			<CopyrightText {direction} />
		{/if}
	</Crossfade>
</div>
