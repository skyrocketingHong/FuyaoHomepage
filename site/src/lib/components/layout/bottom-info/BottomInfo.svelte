<script lang="ts">
	/**
	 * 底部信息容器组件
	 *
	 * 依次编排三个子组件：来源信息、服务状态、版权文本。
	 * 替代原 Copyright.svelte，提供垂直/水平/自适应三种布局。
	 * 桌面垂直模式为低优先级元数据区：一条顶部细分界线 + 连续左对齐元数据列表，
	 * 无类别小标题，全部元数据与图标继承统一的底部信息前景色 token。
	 * 垂直节奏统一由本容器控制：分割线上方 8px、下方 8px，信息行间距 4px，
	 * 行高 16px，图标 12px，图标与文字间距 4px；子组件不再自带 margin/gap。
	 * 左侧起点使用 --sidebar-icon-start 与导航图标列对齐。
	 * 移动端固定布局在与 Bottom Tab 等宽的外层中放置占满可用宽度的信息网格：
	 * 两个等宽列各包含两条 13px 单行信息，列间距 14px、行间距 3px。
	 * 网格统一提供一次 8px 水平内边距，左列左对齐、右列右对齐。
	 * 行内内容禁止换行，超长文本静态截断并通过 title/aria-label 保留完整语义。
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
	<!-- 移动端固定 Dock 元数据区：全宽等分两列，每列两行，不绘制第二层玻璃边界。 -->
	<div
		class="bottom-info-container flex h-full w-full min-w-0 items-center justify-center overflow-hidden text-[10px] leading-[13px]"
	>
		<div class="bottom-info-compact-grid grid min-w-0">
			<!-- 左列：背景地点、服务状态与部署平台。 -->
			<div
				class="grid min-w-0 grid-rows-[13px_13px] content-center gap-[3px] overflow-hidden text-left"
			>
				<div
					class="flex h-[13px] w-full min-w-0 items-center justify-start overflow-hidden text-left whitespace-nowrap"
				>
					{#if InfoComponent}
						<BackgroundInfo
							infoComponent={InfoComponent}
							{infoComponentProps}
							{infoKey}
							{direction}
						/>
					{/if}
				</div>
				<div
					class="flex h-[13px] w-full min-w-0 items-center justify-start overflow-hidden text-left whitespace-nowrap"
				>
					<ServiceStatus {direction} {alignment} />
				</div>
			</div>

			<!-- 右列：版权信息、GitHub 仓库与版本号。 -->
			<div
				class="grid min-w-0 grid-rows-[13px_13px] content-center gap-[3px] overflow-hidden text-right"
			>
				<CopyrightText {direction} {alignment} />
			</div>
		</div>
	</div>
{:else}
	<!-- 桌面端/垂直布局：分割线独立于信息列表，节奏由容器统一控制 -->
	<div class="bottom-info-container w-full flex-none text-[11px] leading-4">
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

<style>
	.bottom-info-compact-grid {
		box-sizing: border-box;
		width: 100%;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		column-gap: 14px;
		padding-inline: 8px;
	}

	.bottom-info-container {
		color: var(--bottom-info-foreground);
	}
</style>
