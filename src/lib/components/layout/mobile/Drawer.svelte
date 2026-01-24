<script lang="ts">
	/**
	 * 移动端抽屉组件
	 *
	 * 在移动端点击列表按钮时弹出的抽屉，用于显示侧边栏列表内容。
	 */
	import LiquidGlass from '$lib/components/ui/liquid-glass.svelte';
	import { sidebarState } from '$lib/state.svelte';
	import { fade, fly } from 'svelte/transition';
	import { X } from 'lucide-svelte';
</script>

{#if sidebarState.isMobileDrawerOpen && sidebarState.listComponent}
	<div class="fixed inset-0 z-[60] md:hidden" transition:fade={{ duration: 200 }}>
		<!-- 背景遮罩 -->
		<div
			class="pointer-events-auto absolute inset-0 bg-black/60 backdrop-blur-sm"
			onclick={() => sidebarState.toggleMobileDrawer()}
			role="button"
			tabindex="0"
			onkeydown={(e) => e.key === 'Escape' && sidebarState.toggleMobileDrawer()}
		></div>

		<!-- 抽屉内容 -->
		<div
			class="pointer-events-auto absolute top-0 right-0 left-0 max-h-[80vh] w-full"
			transition:fly={{ y: -300, duration: 300 }}
		>
			<LiquidGlass
				class="flex h-full max-h-[80vh] w-full flex-col rounded-t-none border-b border-white/10 bg-black/80"
			>
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-lg font-bold text-white">List</h2>
					<button
						class="rounded-full p-2 text-white/60 transition-all hover:bg-white/10 hover:text-white"
						onclick={() => sidebarState.toggleMobileDrawer()}
					>
						<span class="block size-5">
							<X size={20} />
						</span>
					</button>
				</div>

				<div class="flex-1 overflow-y-auto">
					<!-- 动态渲染列表组件 -->
					<sidebarState.listComponent {...sidebarState.listProps} />
				</div>
			</LiquidGlass>
		</div>
	</div>
{/if}
