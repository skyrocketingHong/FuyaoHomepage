<script lang="ts">
	/**
	 * 背景来源信息组件
	 *
	 * 渲染当前背景图片／效果的动态来源组件，提供 Crossfade 过渡。
	 * 仅在传入 infoComponent 时渲染内容，不渲染任何类别标题。
	 * 移动端保持固定单行，内容溢出时静态省略；完整语义由具体信息组件提供。
	 *
	 * @prop infoComponent - 背景信息展示组件
	 * @prop infoComponentProps - 传递给信息组件的属性
	 * @prop infoKey - 信息组件的唯一键，用于动画过渡
	 * @prop direction - 排列方向
	 */
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import type { DynamicComponent } from '$lib/types/component';

	let {
		infoComponent: InfoComponent = null,
		infoComponentProps = {},
		infoKey = 'default',
		direction = 'vertical'
	} = $props<{
		infoComponent?: DynamicComponent | null;
		infoComponentProps?: Record<string, unknown>;
		infoKey?: string;
		direction?: 'vertical' | 'horizontal' | 'auto';
	}>();
</script>

{#if InfoComponent}
	{#if direction === 'horizontal'}
		<!-- 移动端水平布局：单行左对齐，溢出时保持静态省略。 -->
		<div
			class="flex h-full w-full min-w-0 items-center justify-start overflow-hidden whitespace-nowrap"
		>
			<Crossfade key={infoKey} class="h-full w-full min-w-0">
				<span
					class="bottom-info-background-content flex h-full w-full min-w-0 items-center overflow-hidden whitespace-nowrap"
				>
					<InfoComponent {...infoComponentProps} size="sm" />
				</span>
			</Crossfade>
		</div>
	{:else}
		<!-- 桌面端/垂直布局：来源组件独占整行，左对齐 -->
		<div class="flex w-full min-w-0 items-center justify-start">
			<Crossfade key={infoKey} class="w-full">
				<InfoComponent {...infoComponentProps} />
			</Crossfade>
		</div>
	{/if}
{/if}

<style>
	:global(.bottom-info-background-content > *) {
		width: 100%;
		min-width: 0;
		flex-flow: row nowrap !important;
		white-space: nowrap;
	}
</style>
