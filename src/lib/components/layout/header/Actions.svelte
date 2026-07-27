<script lang="ts">
	/**
	 * 顶部全局操作区组件
	 *
	 * 按功能分组组织，组间间距 8px：
	 * - 背景模式：桌面端嵌入 chrome 的分段胶囊 Tab，移动端循环按钮 (BackgroundSwitcher)，
	 *   锁定背景页面 (足迹 none / 文章 solid) 通过 backgroundSwitchable 从 DOM 整体卸载
	 * - 主题切换：独立圆形玻璃按钮
	 * - 语言切换：独立紧凑胶囊 (ActionGroup 单按钮)，不再与主题共用边框
	 *
	 * @prop backgroundSwitchable - 是否渲染背景切换器 (默认 true)
	 */
	import HeaderActionButton from '$lib/components/layout/header/ActionButton.svelte';
	import ActionGroup from '$lib/components/layout/header/ActionGroup.svelte';
	import BackgroundSwitcher from '$lib/components/layout/header/BackgroundSwitcher.svelte';

	import { Moon, Sun, Monitor } from 'lucide-svelte';
	import { themeState } from '$lib/stores/app.svelte';
	import { locale, t } from '$lib/i18n/store';

	let { backgroundSwitchable = true } = $props<{ backgroundSwitchable?: boolean }>();

	function toggleTheme() {
		themeState.cycle();
	}

	function toggleLanguage() {
		locale.toggle();
	}
</script>

<div class="flex items-center gap-2">
	<!-- 背景模式切换 (锁定背景页面不渲染) -->
	{#if backgroundSwitchable}
		<BackgroundSwitcher />
	{/if}

	<!-- 主题切换：独立圆形按钮 -->
	<HeaderActionButton
		onclick={toggleTheme}
		title={$t('layout.header.toggle_theme') + ` (${themeState.preference})`}
		crossfadeKey={themeState.preference}
	>
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

	<!-- 语言切换：独立紧凑胶囊 -->
	<ActionGroup>
		<HeaderActionButton
			bare
			onclick={toggleLanguage}
			title={$t('layout.header.switch_language')}
			crossfadeKey={$locale}
		>
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
	</ActionGroup>
</div>
