<script lang="ts">
	/**
	 * 通用区块标题组件
	 *
	 * 统一展示区块的图标、标题、副标题以及右侧的额外信息。
	 * 图标为 SF Symbols 风格的实心图形，通过语义化变体选择；
	 * accent 配色 (橙/绿/天蓝/青/玫红/紫) 集中在 theme.css 的 --section-icon-* token，
	 * 调用方不得传入颜色类名。支持 Crossfade 动画。
	 */
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import { SiGithub } from '@icons-pack/svelte-simple-icons';
	import { t, locale } from '$lib/i18n/store';

	/** 语义化图标变体：时间胶囊 / 社交链接 / 访问统计 / 编程统计 / 最新文章 / 开源项目 */
	export type SectionIcon = 'time' | 'social' | 'analytics' | 'coding' | 'posts' | 'github';

	interface Props {
		/** 语义图标变体，accent 配色由主题 token 按变体统一控制 */
		icon: SectionIcon;
		/** 标题 i18n key */
		titleKey: string;
		/** 副标题 i18n key (可选) */
		subtitleKey?: string;
		/** 右侧文本 i18n key (可选) */
		rightKey?: string;
		/** 右侧插槽 (替代 rightKey) */
		rightSection?: import('svelte').Snippet;
		/** 自定义类名 */
		class?: string;
	}

	let {
		icon,
		titleKey,
		subtitleKey,
		rightKey,
		rightSection,
		class: className = ''
	}: Props = $props();

	/** 各图标变体对应的语义 accent，颜色值集中在 theme.css 的 --section-icon-surface-* token */
	const ICON_ACCENT: Record<SectionIcon, string> = {
		time: 'orange',
		social: 'green',
		analytics: 'sky',
		coding: 'teal',
		posts: 'rose',
		github: 'purple'
	};
</script>

<div
	class="mb-4 flex items-center justify-between {className}"
	style="text-shadow: 0 1px 6px rgba(0,0,0,0.35)"
>
	<div class="flex items-center gap-4">
		<LiquidGlass
			variant="icon"
			gpuBlur={false}
			refractive={false}
			contentLayout="center"
			class={`h-12 w-12 flex-none rounded-2xl !p-0 section-icon--${ICON_ACCENT[icon]}`}
		>
			{#if icon === 'time'}
				<!-- 实心表盘，表针以底座同色系切口色填充，模拟负空间挖除 -->
				<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
					<circle cx="12" cy="12" r="8.6" fill="currentColor" />
					<rect x="11" y="6.6" width="2" height="6.2" rx="1" class="section-icon-cutout" />
					<rect
						x="11"
						y="8.4"
						width="2"
						height="4.4"
						rx="1"
						class="section-icon-cutout"
						transform="rotate(135 12 12)"
					/>
				</svg>
			{:else if icon === 'social'}
				<!-- 节点实心填充，连接杆 2.4px 粗度，先画杆后画节点保证接合干净 -->
				<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="currentColor">
					<path
						d="M7 11.1 16.2 6M7 12.9 16.2 18"
						fill="none"
						stroke="currentColor"
						stroke-width="2.4"
						stroke-linecap="round"
					/>
					<circle cx="5.8" cy="12" r="3.1" />
					<circle cx="18" cy="5.4" r="3" />
					<circle cx="18" cy="18.6" r="3" />
				</svg>
			{:else if icon === 'analytics'}
				<!-- 相互分离的实心柱体，柱间距约 2.9px -->
				<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="currentColor">
					<rect x="4" y="12" width="3.4" height="8" rx="1.2" />
					<rect x="10.3" y="5" width="3.4" height="15" rx="1.2" />
					<rect x="16.6" y="9" width="3.4" height="11" rx="1.2" />
				</svg>
			{:else if icon === 'coding'}
				<!-- 左右分离的实心尖括号，间距 3.6px -->
				<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="currentColor">
					<path d="M10.2 5.2 4 12l6.2 6.8v-3.4L7.4 12l2.8-3.4Z" />
					<path d="M13.8 5.2 20 12l-6.2 6.8v-3.4L16.6 12l-2.8-3.4Z" />
				</svg>
			{:else if icon === 'posts'}
				<!-- 左右页片分别填充，中缝 2px 保持清晰 -->
				<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="currentColor">
					<path
						d="M11 6.4C9.5 5.2 6.9 4.7 4.2 5.3c-.3 0-.5.3-.5.6v11.6c0 .4.4.7.8.6C7 17.5 9.6 18 11 19.2Z"
					/>
					<path
						d="M13 6.4c1.5-1.2 4.1-1.7 6.8-1.1.3 0 .5.3.5.6v11.6c0 .4-.4.7-.8.6-2.5-.6-5.1-.1-6.5 1.1Z"
					/>
				</svg>
			{:else}
				<!-- 开源项目：Simple Icons 实心品牌图形 -->
				<SiGithub size={24} />
			{/if}
		</LiquidGlass>
		<div>
			<h2 class="text-2xl font-bold text-foreground">
				<Crossfade key={$locale} inline class="inline-grid"><span>{$t(titleKey)}</span></Crossfade>
			</h2>
			{#if subtitleKey}
				<p class="text-[10px] text-foreground/90">
					<Crossfade key={$locale} inline class="inline-grid"
						><span>{$t(subtitleKey)}</span></Crossfade
					>
				</p>
			{/if}
		</div>
	</div>
	{#if rightSection}
		{@render rightSection()}
	{:else if rightKey}
		<span class="text-xs text-foreground/90">
			<Crossfade key={$locale} inline class="inline-grid"><span>{$t(rightKey)}</span></Crossfade>
		</span>
	{/if}
</div>
