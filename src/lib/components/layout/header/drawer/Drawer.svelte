<script lang="ts">
	/**
	 * 移动端列表抽屉组件
	 *
	 * 在移动端点击列表按钮时从顶部弹出的抽屉，用于显示侧边栏列表内容。
	 */
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import { sidebarState } from '$lib/stores/app.svelte';
	import { X } from 'lucide-svelte';
	import { t, locale } from '$lib/i18n/store'; // 添加翻译导入
	import ScrollContainer from '$lib/components/ui/layout/ScrollContainer.svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import SegmentedControl from '$lib/components/ui/display/SegmentedControl.svelte';
</script>

<Crossfade
	key={sidebarState.isMobileDrawerOpen}
	class="fixed inset-0 z-modal md:hidden pointer-events-none"
>
	{#if sidebarState.isMobileDrawerOpen && sidebarState.listComponent}
		<!-- 背景遮罩 -->
		<div
			class="pointer-events-auto absolute inset-0 bg-background/60 backdrop-blur-sm cursor-pointer"
			onclick={() => sidebarState.toggleMobileDrawer()}
			role="button"
			tabindex="0"
			onkeydown={(e) => {
				if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					sidebarState.toggleMobileDrawer();
				}
			}}
		></div>

		<!-- 抽屉内容 -->
		<div
			class="pointer-events-auto absolute top-0 right-0 left-0 max-h-[80vh] w-full"
		>
			<!-- 包裹 LiquidGlass 以作为背景 -->
			<div class="relative w-full h-full max-h-[80vh] rounded-b-2xl overflow-hidden">
				<!-- 背景 LiquidGlass -->
				<LiquidGlass
					class="absolute inset-0 w-full h-full rounded-b-2xl border-b border-border bg-background/80"
				>
                    <!-- 空子元素仅用于视觉效果 -->
                    <div></div>
                </LiquidGlass>

				<!-- 实际内容覆盖且可滚动 -->
				<div class="relative z-10 flex flex-col h-full max-h-[80vh]">
					<div class="mb-4 flex items-center justify-between p-4 pb-0">
						<!-- 更新标题以使用翻译 -->
						<div class="flex items-center gap-3">
							<h2 class="text-lg font-bold text-foreground">
								<Crossfade key={(sidebarState.listTitle || 'nav.list') + $locale} class="inline-grid">
									<span>{sidebarState.listTitle ? $t(sidebarState.listTitle) : $t('nav.list')}</span>
								</Crossfade>
							</h2>

							{#if sidebarState.availableModes.length > 1}
								<Crossfade key={sidebarState.listTitle} class="ml-1">
									<SegmentedControl 
										items={sidebarState.availableModes.map(m => ({ id: m.id, label: $t(m.label), icon: m.icon }))}
										activeId={sidebarState.viewMode}
										onSelect={(id) => sidebarState.setViewMode(id)}
										size="sm"
										noShadow={true}
										class="!bg-transparent !p-0"
									/>
								</Crossfade>
							{/if}
						</div>
						
						<button
							class="rounded-full p-2 text-muted-foreground transition-all hover:bg-secondary/20 hover:text-foreground"
							onclick={() => sidebarState.toggleMobileDrawer()}
						>
							<span class="block size-5">
								<X size={20} />
							</span>
						</button>
					</div>

					<ScrollContainer class="flex-1 overflow-y-auto px-4 pb-4">
						<!-- 动态渲染列表组件 -->
						<sidebarState.listComponent {...sidebarState.listProps} />
					</ScrollContainer>
				</div>
			</div>
		</div>
	{/if}
</Crossfade>
