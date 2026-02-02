<script lang="ts">
	/**
	 * 全局错误页面组件
	 *
	 * 负责呈现系统错误、404 页面等，采用玻璃拟态设计风格。
	 */
	import { page } from '$app/state';
	import { t, locale } from '$lib/i18n/store';
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import { FileQuestion, AlertCircle, ServerCrash, Home } from 'lucide-svelte';

	// 根据状态码选择图标
	const getIcon = (status: number) => {
		if (status === 404) return FileQuestion;
		if (status >= 500) return ServerCrash;
		return AlertCircle;
	};

	let Icon = $derived(getIcon(page.status));
</script>

<div class="z-content flex h-full w-full flex-col items-center justify-center pb-30 md:pb-0">
	<LiquidGlass
		class="w-full max-w-lg"
		tilt={false}
	>
		<div class="flex flex-col items-center justify-center gap-8 py-4 text-center">
			<!-- 1. 图标层 -->
			<Icon class="size-20 opacity-20" strokeWidth={1.5} />

			<!-- 2. 状态码与标题层 -->
			<div class="flex flex-col items-center gap-2">
				<span class="text-6xl font-black tracking-tighter opacity-90">
					{page.status}
				</span>
				<h1 class="text-2xl font-bold tracking-tight">
					{page.status === 404 ? $t('error.not_found_title') : $t('error.something_wrong_title')}
				</h1>
			</div>

			<!-- 3. 错误描述层 -->
			<p class="text-sm text-balance text-muted-foreground opacity-70">
				{page.error?.message || (page.status === 404 ? $t('error.not_found_desc') : 'An error occurred')}
			</p>

			<!-- 4. 详细信息：请求路径 (左右布局) -->
			<div class="w-full rounded-2xl bg-black/5 p-4 dark:bg-white/5 transition-colors group-hover:bg-black/10 dark:group-hover:bg-white/10">
				<div class="flex items-center justify-between gap-4 text-sm">
					<span class="shrink-0 font-medium opacity-50">{$t('error.request_path')}</span>
					<code class="truncate font-mono text-xs opacity-70 bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md">
						{page.url.pathname}
					</code>
				</div>
			</div>

		<!-- 5. 返回操作：使用独立 LiquidGlass 按钮 -->
		<LiquidGlass 
			tag="a" 
			href="/home/"
			class="!w-auto !p-0 inline-flex rounded-full text-foreground transition-all"
			tilt={false}
		>
			<div class="flex items-center gap-2 px-4 py-2">
				<Home class="size-4" />
				<Crossfade key={'backhome-' + $locale} class="inline-grid">
					<span class="font-medium">{$t('nav.home')}</span>
				</Crossfade>
			</div>
		</LiquidGlass>
		</div>
	</LiquidGlass>
</div>
