<script lang="ts">
	/**
	 * 背景模式切换组件
	 *
	 * 桌面端：嵌入 chrome 的分段胶囊 Tab (SegmentedControl embedded 静态表面模式)，
	 * 选项为 马赛克/壁纸/流动，选择持久化到 localStorage (BackgroundState.userPreference)。
	 * 移动端：单个圆形按钮循环切换，避免分段胶囊挤压标题区域。
	 *
	 * 仅控制用户偏好；足迹页 (none) 与博客文章页 (solid) 的语义背景由根布局锁定，不受其影响。
	 */
	import SegmentedControl from '$lib/components/ui/display/SegmentedControl.svelte';
	import HeaderActionButton from '$lib/components/layout/header/ActionButton.svelte';
	import { LayoutGrid, Image, Waves } from 'lucide-svelte';
	import { backgroundState, type UserBackgroundMode } from '$lib/stores/app.svelte';
	import { t } from '$lib/i18n/store';

	const modes: { id: UserBackgroundMode; icon: typeof LayoutGrid; labelKey: string }[] = [
		{ id: 'mosaic', icon: LayoutGrid, labelKey: 'layout.header.background.mosaic' },
		{ id: 'image', icon: Image, labelKey: 'layout.header.background.image' },
		{ id: 'flowing', icon: Waves, labelKey: 'layout.header.background.flowing' }
	];

	let items = $derived(modes.map((m) => ({ id: m.id, label: $t(m.labelKey), icon: m.icon })));
	let activeIndex = $derived(modes.findIndex((m) => m.id === backgroundState.userPreference));
	let ActiveIcon = $derived(modes[activeIndex]?.icon ?? LayoutGrid);
	let activeLabel = $derived(activeIndex >= 0 ? $t(modes[activeIndex].labelKey) : '');

	/** 移动端循环切换：马赛克 -> 壁纸 -> 流动 */
	function cycle() {
		const next = modes[(activeIndex + 1) % modes.length];
		backgroundState.setUserPreference(next.id);
	}
</script>

<!-- 桌面端：嵌入 chrome 的分段胶囊 Tab -->
<SegmentedControl
	embedded
	{items}
	activeId={backgroundState.userPreference}
	onSelect={(id) => backgroundState.setUserPreference(id as UserBackgroundMode)}
	class="hidden md:flex"
/>

<!-- 移动端：单按钮循环切换 -->
<div class="md:hidden">
	<HeaderActionButton
		onclick={cycle}
		title={`${$t('layout.header.background.label')} (${activeLabel})`}
		crossfadeKey={backgroundState.userPreference}
	>
		{#snippet icon()}
			<ActiveIcon size={20} class="shrink-0" />
		{/snippet}
	</HeaderActionButton>
</div>
