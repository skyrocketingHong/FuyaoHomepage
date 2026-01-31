<script lang="ts">
	/**
	 * 全局顶部标题栏组件
	 *
	 * 整合移动端和桌面端的标题栏逻辑。
	 * - 移动端：显示为固定顶部条，包含菜单、动态操作项、站点名称及页面标题。
	 * - 桌面端：显示为绝对定位，字体更宽大，布局扁平化。
	 *
	 * @prop pageLabel - 当前页面标题 (显示在站点名称后)
	 * @prop class - 额外的 CSS 类名
	 */
	import HeaderActions from '$lib/components/layout/header/button/HeaderActions.svelte';
	import HeaderActionButton from '$lib/components/layout/header/button/HeaderActionButton.svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import FadeEdge from '$lib/components/ui/effect/FadeEdge.svelte';
	import { Menu } from 'lucide-svelte';
	import { sidebarState, headerState } from '$lib/state.svelte';
	import { t } from '$lib/i18n/store';


	import { cn } from '$lib/utils';
	// Props 定义
	let { pageLabel, class: className = '' } = $props<{
		pageLabel: string;
		class?: string;
	}>();
</script>

<header class={cn(className, "flex flex-wrap items-center gap-2 md:flex-nowrap")}>
	<!-- 1. 标题区域与右侧操作按钮容器 -->
	<!-- Mobile: Flex row (Top bar). Desktop: Contents (Flat list). -->
	<!-- pointer-events-none on wrapper to let clicks pass through gaps, auto on children -->
	<div class="pointer-events-none order-1 flex w-full items-center justify-between gap-2 md:contents">
		<h1
			class="pointer-events-auto flex-1 md:flex-none md:order-1 flex min-w-0 shrink items-center gap-1 text-xl font-bold drop-shadow-md md:text-2xl md:tracking-wide text-foreground"
		>
			<FadeEdge orientation="horizontal" showEnd={true} fadeSize="1.5rem" class="w-full flex items-center">
				<div class="overflow-hidden whitespace-nowrap md:pr-8 flex items-center gap-1">
					{import.meta.env.VITE_SITE_NAME}
					<Crossfade key={pageLabel} class="inline-grid">
						<span>· {pageLabel}</span>
					</Crossfade>
				</div>
			</FadeEdge>
		</h1>

		<!-- 4. 右侧操作按钮（移动端：顺序 2；桌面端：顺序 4） -->
		<div
			class="pointer-events-auto flex shrink-0 items-center gap-2 pr-0 md:order-4"
		>
			<!-- 动态右侧组件 -->
			<Crossfade key={headerState.rightComponent ? 'right-content' : 'right-empty'} class="flex">
				{#if headerState.rightComponent}
					{@const RightComponent = headerState.rightComponent}
					<RightComponent {...headerState.rightProps} />
				{/if}
			</Crossfade>

			<!-- 移动端侧边栏开关 (仅移动端显示，但在右侧区域) -->
			<!-- 使用 Crossfade 包裹整个条件块，以便在 sidebarState.listComponent 变化时有过渡 -->
			<div class="md:hidden">
				<Crossfade key={sidebarState.listComponent ? 'drawer-button' : 'drawer-empty'}>
					{#if sidebarState.listComponent}
						<HeaderActionButton
							class="h-9 box-border w-auto rounded-full p-2"
							onclick={() => sidebarState.toggleMobileDrawer()}
							title={sidebarState.listTitle ? $t(sidebarState.listTitle) : $t('nav.list')}
							crossfadeKey={sidebarState.listTitle || 'default-list'}
						>
							{#snippet text()}
								{sidebarState.listTitle ? $t(sidebarState.listTitle) : $t('nav.list')}
							{/snippet}
							{#snippet icon()}
								<Menu size={20} class="shrink-0" />
							{/snippet}
						</HeaderActionButton>
					{/if}
				</Crossfade>
			</div>

			<HeaderActions />
		</div>
	</div>

	<!-- 移动端第二行容器 (左 + 中) -->
	<!-- 移动端：顺序 3，全宽（强制换行）。桌面端：内容（扁平兄弟节点）。 -->
	<!-- 添加 pointer-events-auto 以确保移动端可点击 -->
	<div class={cn("pointer-events-auto order-3 flex w-full items-center gap-2 md:contents", !headerState.leftComponent && "gap-0")}>
		<!-- 2. 左侧操作按钮（移动端：在包装器内；桌面端：顺序 2） -->
		<div class="flex items-center gap-2 md:order-2">
			<!-- 动态左侧组件 (如返回按钮) -->
			<Crossfade key={headerState.leftComponent ? 'left-content' : 'left-empty'} class="flex">
				{#if headerState.leftComponent}
					{@const LeftComponent = headerState.leftComponent}
					<LeftComponent {...headerState.leftProps} />
				{/if}
			</Crossfade>
		</div>
	
		<!-- 3. 中间导航部分（移动端：在包装器内；桌面端：顺序 3） -->
		<Crossfade 
			key={headerState.middleKey || 'empty'} 
			class={cn(
				"flex justify-start transition-all duration-300 min-w-0 max-w-full",
				"flex-1 md:order-3 md:justify-center",
				!headerState.middleComponent && "hidden md:flex"
			)}
		>
			{#if headerState.middleComponent}
				{@const MiddleComponent = headerState.middleComponent}
				<MiddleComponent {...headerState.middleProps} />
			{:else}
				<div class="w-full"></div>
			{/if}
		</Crossfade>
	</div>
</header>
