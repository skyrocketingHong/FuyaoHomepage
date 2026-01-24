<script lang="ts">
	/**
	 * 顶部操作栏组件
	 *
	 * 包含主题切换和语言切换按钮。
	 */
	import LiquidGlass from '$lib/components/ui/liquid-glass.svelte';
	import Crossfade from '$lib/components/ui/crossfade.svelte';
	import { Moon, Sun, Monitor } from 'lucide-svelte';
	import { themeState } from '$lib/state.svelte';
	import { locale, t } from '$lib/i18n/store';

	function toggleTheme() {
		themeState.cycle();
	}

	function toggleLanguage() {
		locale.toggle();
	}
</script>

<div class="flex items-center gap-2">
	<!-- 主题切换按钮 -->
	<LiquidGlass
		tag="button"
		onclick={toggleTheme}
		class="group w-auto rounded-full p-2 text-white hover:bg-white/10"
		title={$t('layout.header.toggle_theme') + ` (${themeState.preference})`}
	>
		<div class="flex items-center justify-center">
			<div
				class="grid grid-cols-[0fr] transition-[grid-template-columns] duration-300 ease-out group-hover:grid-cols-[1fr]"
			>
				<div class="overflow-hidden">
					<Crossfade key={themeState.preference}>
						<span
							class="block whitespace-nowrap pr-2 text-sm font-medium opacity-0 transition-opacity duration-300 group-hover:opacity-100"
						>
							{#if themeState.preference === 'dark'}
								{$t('layout.header.theme.dark')}
							{:else if themeState.preference === 'light'}
								{$t('layout.header.theme.light')}
							{:else}
								{$t('layout.header.theme.system')}
							{/if}
						</span>
					</Crossfade>
				</div>
			</div>
			{#if themeState.preference === 'dark'}
				<Moon size={20} class="shrink-0" />
			{:else if themeState.preference === 'light'}
				<Sun size={20} class="shrink-0" />
			{:else}
				<Monitor size={20} class="shrink-0" />
			{/if}
		</div>
	</LiquidGlass>

	<!-- 语言切换/翻译按钮 -->
	<LiquidGlass
		tag="button"
		onclick={toggleLanguage}
		class="group w-auto rounded-full p-2 text-white hover:bg-white/10"
		title={$t('layout.header.switch_language')}
	>
		<div class="flex items-center justify-center">
			<div
				class="grid grid-cols-[0fr] transition-[grid-template-columns] duration-300 ease-out group-hover:grid-cols-[1fr]"
			>
				<div class="overflow-hidden">
					<Crossfade key={$locale}>
						<span
							class="block whitespace-nowrap pr-2 text-sm font-medium opacity-0 transition-opacity duration-300 group-hover:opacity-100"
						>
							{$locale === 'zh' ? $t('layout.header.lang.zh') : $t('layout.header.lang.en')}
						</span>
					</Crossfade>
				</div>
			</div>
			<div class="relative size-5 shrink-0">
				<span
					class="absolute inset-0 flex items-center justify-center text-xs font-bold transition-all duration-300 {$locale ===
					'zh'
						? 'scale-100 opacity-100'
						: 'scale-75 opacity-0'}">ZH</span
				>
				<span
					class="absolute inset-0 flex items-center justify-center text-xs font-bold transition-all duration-300 {$locale ===
					'en'
						? 'scale-100 opacity-100'
						: 'scale-75 opacity-0'}">EN</span
				>
			</div>
		</div>
	</LiquidGlass>
</div>
