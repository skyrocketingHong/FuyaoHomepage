<script lang="ts">
	/**
	 * 背景来源信息组件
	 *
	 * 渲染当前背景图片/效果的动态来源组件，提供 Crossfade 过渡。
	 * 仅在传入 infoComponent 时渲染内容，不渲染任何类别标题。
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
		<!-- 移动端水平布局：紧凑来源组件，左对齐 -->
		<div class="flex w-full min-w-0 items-center justify-start">
			<Crossfade key={infoKey} class="w-full">
				<!-- 移动端传递 size='sm' 给信息组件 -->
				<InfoComponent {...infoComponentProps} size="sm" />
			</Crossfade>
		</div>
	{:else}
		<!-- 桌面端/垂直布局：来源组件独占整行，左对齐 -->
		<div class="flex w-full min-w-0 items-center justify-start text-foreground/65">
			<Crossfade key={infoKey} class="w-full">
				<InfoComponent {...infoComponentProps} />
			</Crossfade>
		</div>
	{/if}
{/if}
