<script lang="ts">
	/**
	 * 背景来源信息组件
	 *
	 * 展示当前背景图片/效果的来源信息。
	 * 仅在传入 infoComponent 时渲染内容。
	 *
	 * @prop infoComponent - 背景信息展示组件
	 * @prop infoComponentProps - 传递给信息组件的属性
	 * @prop infoKey - 信息组件的唯一键，用于动画过渡
	 * @prop direction - 排列方向
	 */
	import { t } from '$lib/i18n/store';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import type { Component } from 'svelte';

	let {
		infoComponent: InfoComponent = null,
		infoComponentProps = {},
		infoKey = 'default',
		direction = 'vertical'
	} = $props<{
		infoComponent?: Component | null;
		infoComponentProps?: Record<string, unknown>;
		infoKey?: string;
		direction?: 'vertical' | 'horizontal' | 'auto';
	}>();
</script>

{#if InfoComponent}
	{#if direction === 'horizontal'}
		<!-- 移动端水平布局 -->
		<div class="flex w-full items-center justify-between">
			<div class="flex items-center gap-1">
				<span class="text-[10px] whitespace-nowrap"
					>{$t('layout.bottom_info.background_source')}</span
				>
				<div class="origin-left">
					<Crossfade key={infoKey}>
						<!-- 移动端传递 size='sm' 给信息组件 -->
						<InfoComponent {...infoComponentProps} size="sm" />
					</Crossfade>
				</div>
			</div>
		</div>
	{:else}
		<!-- 桌面端/垂直布局 -->
		<div class="flex w-full items-center justify-between pr-2 pl-2">
			<span>{$t('layout.bottom_info.background_source')}</span>
			<Crossfade key={infoKey}>
				<InfoComponent {...infoComponentProps} />
			</Crossfade>
		</div>
	{/if}
{/if}
