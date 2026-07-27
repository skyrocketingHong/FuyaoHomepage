<script lang="ts">
	/**
	 * 足迹页面 (Footprint Page)
	 *
	 * 该页面展示站长曾到访过的城市和地点。
	 * 核心功能：
	 * 1. 地图可视化：使用高德地图 (AMap) 展示足迹点。
	 * 2. 侧边栏列表：在侧边栏展示地点列表，支持按时间或城市筛选。
	 * 3. 交互联动：点击列表项定位地图，点击地图标记高亮列表项。
	 * 4. 响应式布局：适配桌面端和移动端视图。
	 */
	import { onMount, onDestroy } from 'svelte';
	import AMap from '$lib/components/footprint/map/AMap.svelte';
	import FootprintList from '$lib/components/footprint/FootprintList.svelte';
	import FootprintActions from '$lib/components/footprint/FootprintActions.svelte';
	import MapCopyright from '$lib/components/footprint/map/MapCopyright.svelte';
	import { sidebarState, layoutState, headerState } from '$lib/stores/app.svelte';
	import { loadFootprints, type FootprintData, type BasePlace } from '$lib/utils/domain/footprints';
	import LoadingState from '$lib/components/ui/feedback/LoadingState.svelte';
	import { t, locale } from '$lib/i18n/store';
	import type { CopyrightData } from '$lib/components/footprint/map/types';
	import { fade } from 'svelte/transition';
	import { MapPinned, RotateCcw } from 'lucide-svelte';
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import { publicConfig } from '$lib/config/public';

	// ==========================================
	// 状态定义
	// ==========================================
	let footprintData = $state<FootprintData | null>(null);
	// 派生扁平列表用于地图 markers (过滤掉没有坐标的点)
	let places = $derived(
		(footprintData?.all ?? []).filter(
			(p) => !!p.position
		) as unknown as import('$lib/components/footprint/map/types').MarkerConfig[]
	);

	let loading = $state(true);
	let mapLoaded = $state(false);
	let error = $state('');

	// 地图视图状态
	let mapCenter = $state<[number, number]>([105, 35]); // 默认中国中心
	let mapZoom = $state(4); // 默认全国视图
	let selectedPlace = $state<BasePlace | null>(null);
	let mapCopyrightData = $state<CopyrightData | null>(null);

	// 高德浏览器凭据属于公开配置，必须设置域名白名单和最小权限。
	let amapKey = publicConfig.services.amap.browserKey ?? '';
	let amapSecurityCode = publicConfig.services.amap.securityCode ?? '';

	// 清理 ID
	let sidebarListId = '';
	let headerActionId = '';

	// ==========================================
	// 生命周期
	// ==========================================
	onMount(async () => {
		try {
			// 加载足迹数据
			footprintData = await loadFootprints();
		} catch (e) {
			console.error('加载足迹数据失败', e);
			error = $t('footprint.load_error');
		} finally {
			loading = false;
		}

		// 初始化 UI 状态
		setupLayout();
	});

	// 自动管理侧边栏版权信息的注入与清理
	$effect(() => {
		if (mapCopyrightData) {
			const id = sidebarState.setExtraInfo(
				MapCopyright,
				mapCopyrightData as unknown as Record<string, unknown>,
				'map'
			);
			return () => {
				sidebarState.clearExtraInfo(id);
			};
		}
	});

	onDestroy(() => {
		// 清理 UI 状态
		sidebarState.clearList(sidebarListId);
		if (headerActionId) headerState.clearRight(headerActionId);
		layoutState.setTransparent(false);
	});

	// ==========================================
	// 逻辑处理
	// ==========================================

	/**
	 * 设置初始布局状态
	 * 包括注入侧边栏、Header 操作按钮，设置透明背景等
	 */
	function setupLayout() {
		if (footprintData?.indices) {
			sidebarListId = sidebarState.setList(
				FootprintList,
				{
					indices: footprintData.indices,
					onSelect: (place: BasePlace) => handleSelect(place)
				},
				'footprint.list_title'
			);
		}

		layoutState.setTransparent(true);
		headerActionId = headerState.setRight(FootprintActions);
	}

	/**
	 * 处理地点选择事件
	 * @param place 被选中的地点
	 */
	function handleSelect(place: BasePlace) {
		if (place.position) {
			// 更新地图中心和选中状态
			mapCenter = place.position;
			selectedPlace = place;

			// 根据类型自动调整缩放层级
			// 城市视图较远 (10)，具体景点较近 (14)
			const isCity = 'type' in place && place.type === 'city';
			mapZoom = isCity ? 10 : 14;

			// 移动端选择后自动关闭侧边栏抽屉，提升体验
			sidebarState.closeMobileDrawer();
		}
	}

	/** 关闭地点详情并恢复全国足迹概览。 */
	function handleResetMap() {
		selectedPlace = null;
		mapCenter = [105, 35];
		mapZoom = 4;
	}

	// 监听 selectedPlace 变化，更新 Sidebar 高亮状态
	$effect(() => {
		// 显式读取依赖，确保 Svelte 追踪 selectedPlace.id 的变化
		// 这是一个防止“海森堡Bug”的防御性编程模式
		const currentId = selectedPlace?.id;
		// void sidebarListId; // 也可以显式读取其他依赖

		if (sidebarListId && currentId) {
			// 使用显式 setter 更新状态
			sidebarState.setActiveId(currentId);

			sidebarState.updateList(sidebarListId, {
				indices: footprintData?.indices,
				onSelect: (place: BasePlace) => handleSelect(place),
				// 为了双重保险，我们也将 activeId 放回 updateList 中
				activeId: currentId
			});
		}
	});
</script>

<div class="pointer-events-none relative h-full w-full">
	{#if error}
		<div class="flex h-full w-full items-center justify-center">
			<LoadingState {error} />
		</div>
	{:else}
		<!-- 
            地图背景容器
            使用 fixed 定位覆盖全屏，z-index 较低以作为背景。
            pointer-events-auto 确保地图可交互。
            地图完整铺满视口，不使用任何 mask、背景色或替代性渐变遮罩。
        -->
		<div
			class="pointer-events-auto fixed inset-0 z-0 bg-transparent transition-opacity duration-500"
		>
			<AMap
				apiKey={amapKey}
				securityCode={amapSecurityCode}
				markers={places}
				center={mapCenter}
				zoom={mapZoom}
				zooms={[4, 20]}
				selectedPlace={selectedPlace as unknown as import('$lib/components/footprint/map/types').MarkerConfig}
				onMarkerClick={(place) => {
					handleSelect(place as unknown as BasePlace);
					sidebarState.setViewMode('city');
				}}
				onInfoWindowClose={() => {
					selectedPlace = null;
				}}
				onCopyrightLoad={(data) => {
					mapCopyrightData = data;
				}}
				onMapLoad={() => {
					// 仅当数据也加载完成时，才认为整体加载完成
					// 但 actually we just set mapLoaded = true, the derived state or template check handles the rest
					mapLoaded = true;
				}}
			/>
		</div>

		{#if mapLoaded && !loading}
			<!-- 概览/重置按钮：移动端定位于导航胶囊上方 (底部安全距离 + 导航高度 + 10px 净空)，
			     水平居中于整个视口；桌面端保持原位置与侧栏宽度补偿 -->
			<div
				class="z-controls pointer-events-auto fixed bottom-[calc(var(--mobile-nav-bottom-inset)+var(--mobile-nav-height)+var(--mobile-nav-overlay-gap))] left-1/2 max-w-[calc(100vw-24px)] -translate-x-1/2 md:bottom-6 md:left-[calc(50%+124px)] lg:left-[calc(50%+128px)]"
			>
				<LiquidGlass
					tag="button"
					variant="control"
					refractive
					blur={8}
					refractionStrength={4}
					contentLayout="center"
					class="inline-flex !w-auto max-w-full items-center rounded-full !p-0 text-foreground shadow-xl"
					onclick={handleResetMap}
					title={$t('footprint.map.reset_view')}
				>
					<span class="flex h-11 max-w-full items-center gap-2 px-3.5">
						<MapPinned size={17} class="shrink-0 text-[var(--theme-color)]" />
						<Crossfade
							key={`${$locale}-${selectedPlace?.id ?? 'overview'}`}
							inline
							class="inline-grid min-w-0"
						>
							<span class="block truncate text-sm font-semibold">
								{selectedPlace?.title ??
									$t('footprint.map.location_count', { count: String(places.length) })}
							</span>
						</Crossfade>
						<RotateCcw size={14} class="shrink-0 text-muted-foreground" />
					</span>
				</LiquidGlass>
			</div>
		{/if}

		<!-- 移动端高德地图 Logo 与版权信息：固定视口页面不渲染全局移动页脚，
		     版权层改在按钮上方独立展示，避开导航胶囊与概览按钮；桌面端仍由侧栏 BottomInfo 承载 -->
		{#if mapCopyrightData}
			<div
				class="z-controls pointer-events-auto fixed bottom-[calc(var(--mobile-nav-bottom-inset)+var(--mobile-nav-height)+var(--mobile-nav-overlay-gap)+44px+8px)] left-3 max-w-[70vw] md:hidden"
			>
				<MapCopyright {...mapCopyrightData} />
			</div>
		{/if}

		{#if loading || !mapLoaded}
			<div
				class="fixed inset-0 z-50 flex items-center justify-center bg-background"
				transition:fade={{ duration: 300 }}
			>
				<LoadingState loading variant="fullscreen" />
			</div>
		{/if}
	{/if}
</div>
