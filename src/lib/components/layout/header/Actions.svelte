<script lang="ts">
	/**
	 * 顶部操作栏组件
	 *
	 * 包含主题切换和语言切换按钮。
	 */
	import HeaderActionButton from '$lib/components/layout/header/ActionButton.svelte';

	import { Moon, Sun, Monitor } from 'lucide-svelte';
	import { themeState } from '$lib/stores/app.svelte';
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
	<HeaderActionButton
		onclick={toggleTheme}
		title={$t('layout.header.toggle_theme') + ` (${themeState.preference})`}
		crossfadeKey={themeState.preference}
	>
		{#snippet text()}
			{#if themeState.preference === 'dark'}
				{$t('layout.header.theme.dark')}
			{:else if themeState.preference === 'light'}
				{$t('layout.header.theme.light')}
			{:else}
				{$t('layout.header.theme.system')}
			{/if}
		{/snippet}
		{#snippet icon()}
			{#if themeState.preference === 'dark'}
				<Moon size={20} class="shrink-0" />
			{:else if themeState.preference === 'light'}
				<Sun size={20} class="shrink-0" />
			{:else}
				<Monitor size={20} class="shrink-0" />
			{/if}
		{/snippet}
	</HeaderActionButton>

	<!-- 语言切换/翻译按钮 -->
	<HeaderActionButton
		onclick={toggleLanguage}
		title={$t('layout.header.switch_language')}
		crossfadeKey={$locale}
	>
		{#snippet text()}
			{$locale === 'zh-CN' ? $t('layout.header.lang.zh') : $t('layout.header.lang.en')}
		{/snippet}
		{#snippet icon()}
			<div class="relative size-5 shrink-0">
				<span
					class="absolute inset-0 flex items-center justify-center text-xs font-bold transition-all duration-300 {$locale ===
					'zh-CN'
						? 'scale-100 opacity-100'
						: 'scale-75 opacity-0'}">ZH</span
				>
				<span
					class="absolute inset-0 flex items-center justify-center text-xs font-bold transition-all duration-300 {$locale ===
					'en-US'
						? 'scale-100 opacity-100'
						: 'scale-75 opacity-0'}">EN</span
				>
			</div>
		{/snippet}
	</HeaderActionButton>
</div>
