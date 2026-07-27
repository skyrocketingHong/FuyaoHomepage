<script lang="ts">
	/**
	 * 底部信息容器组件
	 *
	 * 依次编排三个子组件：来源信息、服务状态、版权文本。
	 * 替代原 Copyright.svelte，提供垂直/水平/自适应三种布局。
	 * 桌面垂直模式为低优先级元数据区：一条顶部细分界线 + 连续左对齐元数据列表，
	 * 无类别小标题，通过图标、字号、字重和透明度区分层级。
	 * 垂直节奏统一由本容器控制：分割线上方 8px、下方 8px，信息行间距 4px，
	 * 行高 16px，图标 12px，图标与文字间距 4px；子组件不再自带 margin/gap。
	 * 左侧起点使用 --sidebar-icon-start 与导航图标列对齐。
	 * 移动端水平布局使用明确字号与间距，不使用 zoom 缩放。
	 *
	 * @prop direction - 排列方向：'vertical' | 'horizontal' | 'auto'
	 * @prop alignment - 信息行对齐方式：'start' | 'center'，默认保持左对齐
	 * @prop infoComponent - 可选的背景信息展示组件
	 * @prop infoComponentProps - 传递给信息组件的属性
	 * @prop infoKey - 信息组件的唯一键
	 */
	import { locale } from '$lib/i18n/store';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import BackgroundInfo from './BackgroundInfo.svelte';
	import ServiceStatus from './ServiceStatus.svelte';
	import CopyrightText from './CopyrightText.svelte';
	import type { DynamicComponent } from '$lib/types/component';

	let {
		direction = 'auto',
		alignment = 'start',
		infoComponent: InfoComponent = null,
		infoComponentProps = {},
		infoKey = 'default'
	} = $props<{
		direction?: 'vertical' | 'horizontal' | 'auto';
		alignment?: 'start' | 'center';
		infoComponent?: DynamicComponent | null;
		infoComponentProps?: Record<string, unknown>;
		infoKey?: string;
	}>();

	let verticalContainerClass = $derived(
		alignment === 'center' ? 'items-center px-2' : 'items-start pr-2 pl-[var(--sidebar-icon-start)]'
	);
	let verticalListClass = $derived(alignment === 'center' ? 'items-center' : 'items-start');
</script>

{#if direction === 'horizontal'}
	<!-- 移动端水平布局：左右各占一半 -->
	<div
		class="bottom-info-container w-full flex-none text-center text-xs text-foreground/50 drop-shadow-md"
	>
		<Crossfade
			key={$locale}
			class="flex w-full flex-col items-center justify-center transition-opacity duration-300"
		>
			<Crossfade key={infoKey || (InfoComponent ? 'has-info' : 'no-info')} class="w-full">
				<!-- 移动端页脚为根布局可滚动内容末尾的普通文档流 (不再并入固定导航表面)，
				     此处不绘制分割线，与上方正文仅保留自然留白 -->
				<div class="flex w-full items-stretch py-1 text-[10px] leading-tight">
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
						<ServiceStatus {direction} {alignment} />
					</div>
					<!-- 右侧：版权信息（垂直居中、右对齐） -->
					<div class="flex w-1/2 flex-col items-end justify-center text-right leading-snug">
						<CopyrightText {direction} {alignment} />
					</div>
				</div>
			</Crossfade>
		</Crossfade>
	</div>
{:else}
	<!-- 桌面端/垂直布局：分割线独立于信息列表，节奏由容器统一控制 -->
	<div class="bottom-info-container w-full flex-none text-[11px] leading-4 text-foreground/50">
		<Crossfade key={$locale} class="flex w-full flex-col {verticalContainerClass}">
			<!-- 顶部唯一细分界线：上下各 8px -->
			<div
				class="mt-2 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent"
			></div>

			<!-- 元数据列表：行间距统一 4px -->
			<div class="mt-2 flex w-full flex-col gap-1 {verticalListClass}">
				{#if InfoComponent}
					<Crossfade key={infoKey || 'has-info'} class="w-full min-w-0">
						<BackgroundInfo
							infoComponent={InfoComponent}
							{infoComponentProps}
							{infoKey}
							{direction}
						/>
					</Crossfade>
				{/if}

				<!-- 服务状态 -->
				<ServiceStatus {direction} {alignment} />

				<!-- 版权文本 -->
				<CopyrightText {direction} {alignment} />
			</div>
		</Crossfade>
	</div>
{/if}
