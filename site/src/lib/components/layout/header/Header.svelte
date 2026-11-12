<script lang="ts">
	/**
	 * 全局顶部标题栏组件
	 *
	 * 整合移动端和桌面端的标题栏逻辑。
	 * - 移动端：显示为固定顶部条，包含菜单、动态操作项、站点名称及页面标题。
	 * - 桌面端：显示为绝对定位，字体更宽大，布局扁平化。
	 *
	 * @prop pageLabel - 当前页面标题
	 * @prop backgroundSwitchable - 是否渲染背景切换器 (锁定背景页面为 false，从 DOM 卸载)
	 * @prop class - 额外的 CSS 类名
	 */
	import HeaderActions from '$lib/components/layout/header/Actions.svelte';
	import HeaderActionButton from '$lib/components/layout/header/ActionButton.svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import { Menu } from 'lucide-svelte';
	import { seoConfig } from '$lib/config/index';
	import { sidebarState, headerState } from '$lib/stores/app.svelte';
	import { t } from '$lib/i18n/store';

	import { cn } from '$lib/utils/index';
	// Props 定义
	let {
		pageLabel,
		backgroundSwitchable = true,
		class: className = ''
	} = $props<{
		pageLabel: string;
		backgroundSwitchable?: boolean;
		class?: string;
	}>();
</script>

<header class={cn(className, 'flex flex-wrap items-center gap-2 lg:flex-nowrap')}>
	<!-- 1. 标题区域与右侧操作按钮容器 -->
	<!-- 移动端：Flex 行布局（顶部栏）。桌面端：Contents（扁平列表） -->
	<!-- 外层容器 pointer-events-none 以便点击穿透间隙，子元素设置为 auto -->
	<div
		class="pointer-events-none order-1 flex w-full items-center justify-between gap-2 lg:contents"
	>
		<div
			class="pointer-events-auto min-w-0 flex-1 shrink text-foreground drop-shadow-md lg:order-1 lg:min-w-[200px] lg:flex-initial lg:shrink-[100]"
		>
			<!-- 移动端：站点名称为主标题，当前页面为静态副标题。 -->
			<div class="grid min-w-0 grid-rows-[22px_14px] content-center lg:hidden">
				<h1 class="truncate text-[19px] leading-[22px] font-bold" title={seoConfig.siteName}>
					{seoConfig.siteName}
				</h1>
				<Crossfade key={pageLabel} inline class="inline-grid min-w-0">
					<span
						class="truncate text-[12px] leading-[14px] font-medium text-foreground/60"
						title={pageLabel}>{pageLabel}</span
					>
				</Crossfade>
			</div>

			<!-- 桌面端保留原有单行标题，不启用自动滚动。 -->
			<h1
				class="hidden min-w-0 truncate text-2xl font-bold tracking-wide lg:block"
				title={`${seoConfig.siteName} · ${pageLabel}`}
			>
				{seoConfig.siteName}
				<Crossfade key={pageLabel} inline class="inline-grid">
					<span>· {pageLabel}</span>
				</Crossfade>
			</h1>
		</div>

		<!-- 4. 右侧操作按钮（移动端：顺序 2；桌面端：顺序 4） -->
		<!-- 组内间距 8px (gap-2)；页面上下文操作与全局操作之间 12px (gap-2 + ml-1) -->
		<div class="pointer-events-auto flex shrink-0 items-center gap-2 pr-0 lg:order-4">
			<!-- 动态右侧组件 -->
			<Crossfade key={headerState.right.component ? 'right-content' : 'right-empty'} class="flex">
				{#if headerState.right.component}
					{@const RightComponent = headerState.right.component}
					<RightComponent {...headerState.right.props} />
				{/if}
			</Crossfade>

			<!-- 移动端侧边栏开关 (仅移动端显示，但在右侧区域) -->
			<!-- 使用 Crossfade 包裹整个条件块，以便在 sidebarState.listComponent 变化时有过渡 -->
			<div class="lg:hidden">
				<Crossfade key={sidebarState.listComponent ? 'drawer-button' : 'drawer-empty'}>
					{#if sidebarState.listComponent}
						<HeaderActionButton
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

			<!-- 全局操作区 (背景/主题/语言)，与页面上下文操作保持 12px 间距 -->
			<div class="ml-1 flex items-center">
				<HeaderActions {backgroundSwitchable} />
			</div>
		</div>
	</div>

	<!-- 移动端第二行容器 (左 + 中) -->
	<!-- 移动端：顺序 3，全宽（强制换行）。桌面端：内容（扁平兄弟节点）。 -->
	<!-- 添加 pointer-events-auto 以确保移动端可点击 -->
	<div
		class={cn(
			'pointer-events-auto order-3 flex w-full items-center gap-2 lg:contents',
			!headerState.left.component && 'gap-0'
		)}
	>
		<!-- 2. 左侧操作按钮（移动端：在包装器内；桌面端：顺序 2） -->
		<div class="flex shrink-0 items-center gap-2 lg:order-2">
			<!-- 动态左侧组件 (如返回按钮) -->
			<Crossfade key={headerState.left.component ? 'left-content' : 'left-empty'} class="flex">
				{#if headerState.left.component}
					{@const LeftComponent = headerState.left.component}
					<LeftComponent {...headerState.left.props} />
				{/if}
			</Crossfade>
		</div>

		<!-- 3. 中间导航部分（移动端：在包装器内；桌面端：顺序 3） -->
		{#if headerState.middle.component}
			{@const MiddleComponent = headerState.middle.component}
			<Crossfade
				key={headerState.middle.key}
				class={cn(
					'flex max-w-full min-w-0 flex-1 justify-start transition-all duration-300',
					'lg:order-3 lg:justify-center'
				)}
			>
				<MiddleComponent {...headerState.middle.props} />
			</Crossfade>
		{/if}
	</div>
</header>
