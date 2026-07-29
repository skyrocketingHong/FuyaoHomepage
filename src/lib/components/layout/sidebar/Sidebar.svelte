<script lang="ts">
	/**
	 * 桌面端侧边栏组件
	 *
	 * 桌面布局左侧的侧边栏，包含主导航、动态列表区域和版权信息。
	 *
	 */
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import BottomInfo from '../bottom-info/BottomInfo.svelte';
	import { navItems } from '$lib/config/index';
	import { page } from '$app/state';
	import { sidebarState } from '$lib/stores/app.svelte';
	import { isActiveRoute } from '$lib/utils/domain/nav';
	import { t } from '$lib/i18n/store';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import FadeEdge from '$lib/components/ui/effect/FadeEdge.svelte';
	import SidebarTree from './SidebarTree.svelte';

	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { tick } from 'svelte';
	import {} from 'svelte/transition';
	import { SvelteMap } from 'svelte/reactivity';
	import SegmentedControl from '$lib/components/ui/display/SegmentedControl.svelte';
	import { X } from 'lucide-svelte';

	// 监听路由变化，如果当前页面不需要侧边栏列表，则立即清理
	$effect(() => {
		const currentPath = page.url.pathname;
		const activeItem = navItems.find((item) => isActiveRoute(currentPath, item.href));

		// 如果匹配到了导航项，且该导航项没有配置 sidebar list，则清理
		// 如果没有匹配到导航项（例如 root /），也清理
		if (!activeItem || !activeItem.hasSidebarList) {
			if (sidebarState.listComponent) {
				sidebarState.clearList();
			}
		}
	});
	// 转换 navItems 以适配 SidebarGroup
	let sidebarNavItems = $derived(
		navItems.map((item) => ({
			label: $t(item.i18nKey),
			icon: item.icon,
			href: item.href,
			isActive: isActiveRoute(page.url.pathname, item.href)
		}))
	);

	let scrollContainer = $state<HTMLElement>();
	let showTop = $state(false);
	let showBottom = $state(false);

	// 存储滚动位置：pathname -> scrollTop
	let scrollPositions = new SvelteMap<string, number>();

	beforeNavigate(() => {
		if (scrollContainer) {
			// 使用 pathname 作为键，以便在重新进入相同页面上下文时恢复侧边栏位置
			scrollPositions.set(page.url.pathname, scrollContainer.scrollTop);
		}
	});

	afterNavigate(async ({ type, to }) => {
		await tick();
		if (!scrollContainer) return;

		// 如果我们在同一个“部分”内导航（侧边栏列表保持不变），可根据需要在这里处理

		if (type === 'popstate' && to?.url.pathname) {
			const savedPosition = scrollPositions.get(to.url.pathname) ?? 0;
			scrollContainer.scrollTop = savedPosition;
		}
	});

	function updateScrollState() {
		if (!scrollContainer) return;
		const { scrollTop, scrollHeight, clientHeight } = scrollContainer;

		showTop = scrollTop > 0;
		// 允许 1px 误差
		showBottom = Math.ceil(scrollTop + clientHeight) < scrollHeight - 1;
	}

	$effect(() => {
		if (scrollContainer) {
			updateScrollState();
			const ro = new ResizeObserver(updateScrollState);
			ro.observe(scrollContainer);
			// 同时监听变动，因为动态列表内容会改变高度
			const mo = new MutationObserver(updateScrollState);
			mo.observe(scrollContainer, { childList: true, subtree: true });

			return () => {
				ro.disconnect();
				mo.disconnect();
			};
		}
	});

	// 自动滚动到激活项，带有“智能缓冲区” (Smart Scroll)
	$effect(() => {
		const activeId = sidebarState.activeId;
		if (activeId && scrollContainer) {
			// 小量延迟以确保 DOM 已更新
			tick().then(() => {
				if (!scrollContainer) return;

				const activeEl = scrollContainer.querySelector(`[data-id="${activeId}"]`);
				if (!activeEl) return;

				const containerRect = scrollContainer.getBoundingClientRect();
				const activeRect = activeEl.getBoundingClientRect();
				const offset = 60; // 缓冲区域 (px)

				// 检查项是否在“安全区域”上方
				if (activeRect.top < containerRect.top + offset) {
					// 向上滚动
					// 我们希望 activeRect.top 变为 (containerRect.top + offset)
					const targetScrollTop =
						scrollContainer.scrollTop + (activeRect.top - containerRect.top) - offset;
					scrollContainer.scrollTo({
						top: targetScrollTop,
						behavior: 'smooth'
					});
				}
				// 检查项是否在“安全区域”下方
				if (activeRect.bottom > containerRect.bottom - offset) {
					// 向下滚动
					// 让 activeRect.bottom 变为 (containerRect.bottom - offset)
					const targetScrollTop =
						scrollContainer.scrollTop + (activeRect.bottom - containerRect.bottom) + offset;

					// 浏览器通常会自动处理最大滚动限制
					scrollContainer.scrollTo({
						top: targetScrollTop,
						behavior: 'smooth'
					});
				}
			});
		}
	});

	// 不需要 resolvedExtraInfoComponent 了，直接使用 sidebarState.extraInfoComponent
</script>

<!-- 左侧侧边栏：路由、列表、版权。贴边一体化布局：外部留白转移到内部，仅保留右侧细分界线 -->
<LiquidGlass
	variant="panel"
	flat
	class="pointer-events-auto relative z-20 h-full w-[248px] flex-none rounded-none border-r border-border/40 px-3 py-3 shadow-none! lg:w-64"
>
	<div class="flex h-full flex-col">
		<!-- 可滚动内容区域 -->
		<FadeEdge
			orientation="vertical"
			showStart={showTop}
			showEnd={showBottom}
			class="flex min-h-0 flex-1 flex-col"
		>
			<div
				class="flex min-h-0 flex-1 flex-col overflow-y-auto"
				bind:this={scrollContainer}
				onscroll={updateScrollState}
			>
				<!-- 1. 路由导航区域 -->
				<div class="flex flex-none flex-col">
					<h2 class="sidebar-section-title mb-2 flex-none">
						<Crossfade key={$t('layout.sidebar.navigation')} inline class="inline-grid"
							><span>{$t('layout.sidebar.navigation')}</span></Crossfade
						>
					</h2>
					<div class="flex flex-col px-1">
						<div class="flex flex-col gap-1">
							{#each sidebarNavItems as item (item.href)}
								<SidebarTree {item} />
							{/each}
						</div>
					</div>
				</div>

				<!-- 2. 动态列表区域 -->
				<div class="flex flex-col">
					<Crossfade
						key={sidebarState.listTitle || 'empty'}
						class="w-full grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)]"
					>
						{#if sidebarState.listComponent}
							<div class="flex flex-col pt-4">
								{#if $t(sidebarState.listTitle)}
									<div
										class="sidebar-section-title mb-2 flex flex-none items-center justify-between"
									>
										<h2>
											<Crossfade key={$t(sidebarState.listTitle)} inline class="inline-grid"
												><span>{$t(sidebarState.listTitle)}</span></Crossfade
											>
										</h2>

										{#if sidebarState.availableModes.length > 1}
											<Crossfade key={sidebarState.listTitle} class="ml-auto">
												<SegmentedControl
													items={sidebarState.availableModes.map((m) => ({
														id: m.id,
														label: $t(m.label),
														icon: m.icon
													}))}
													activeId={sidebarState.viewMode}
													onSelect={(id) => sidebarState.setViewMode(id)}
													size="sm"
													noShadow={true}
													class="!p-0"
												/>
											</Crossfade>
										{/if}
									</div>
								{/if}

								<Crossfade
									key={sidebarState.filterLabel || 'no-filter'}
									class="grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)]"
								>
									{#if sidebarState.filterLabel}
										<div class="flex-none px-1 pb-1">
											<button
												class="sidebar-item-base sidebar-item-active group"
												onclick={() => sidebarState.onFilterClear?.()}
											>
												<X class="sidebar-icon" />
												<span class="truncate">{sidebarState.filterLabel}</span>
											</button>
										</div>
									{/if}
								</Crossfade>

								<div class="flex flex-col px-1">
									<sidebarState.listComponent
										{...sidebarState.listProps}
										activeId={sidebarState.activeId}
									/>
								</div>
							</div>
						{:else}
							<!-- 无列表激活时的占位符 -->
							<div></div>
						{/if}
					</Crossfade>
				</div>
			</div>
		</FadeEdge>
		<!-- 3. 版权区域：独立固定区，禁止 Flex 压缩 -->
		<div class="mt-auto shrink-0">
			<BottomInfo
				direction="vertical"
				infoComponent={sidebarState.extraInfoComponent}
				infoComponentProps={{ ...sidebarState.extraInfoProps }}
				infoKey={sidebarState.extraInfoKey || 'default'}
			/>
		</div>
	</div>
</LiquidGlass>
