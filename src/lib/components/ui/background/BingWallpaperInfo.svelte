<script lang="ts">
	/**
	 * Bing 每日壁纸来源信息组件
	 *
	 * 仅展示已确认的 Bing 图片来源名称，不推断或显示标题、地点、作者及版权描述。
	 * 图标与文本始终保持单行左对齐，空间不足时静态省略文本，并通过 title 与
	 * aria-label 保留当前语言下的完整来源名称。
	 *
	 * 使用 Simple Icons 的 Microsoft Bing 品牌路径；当前依赖版本已移除对应导出，
	 * 因此在组件内保留同源 24×24 单路径 SVG，并与其他 Simple Icons 一样继承 currentColor。
	 *
	 * @prop size - 尺寸：'md'（桌面端）或 'sm'（移动端紧凑布局）。
	 */
	import { t, locale } from '$lib/i18n/store';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';

	let { size = 'md' } = $props<{
		size?: 'sm' | 'md';
	}>();

	let label = $derived($t('layout.bottom_info.bing_wallpaper'));
	let iconClass = $derived(size === 'sm' ? 'size-2.5' : 'size-3.5');
	let textClass = $derived(size === 'sm' ? 'text-[10px]' : 'text-[12px]');
</script>

<div
	class="flex w-full min-w-0 items-center justify-start gap-1.5 overflow-hidden whitespace-nowrap"
	title={label}
	aria-label={label}
>
	<svg
		class="{iconClass} shrink-0"
		viewBox="0 0 24 24"
		fill="currentColor"
		aria-hidden="true"
		focusable="false"
		data-simple-icon="microsoftbing"
	>
		<path
			d="M20.176 15.406a6.48 6.48 0 0 1-1.736 4.414c1.338-1.47.803-3.869-1.003-4.635-.862-.305-2.488-.85-3.367-1.158a1.834 1.834 0 0 1-.932-.818c-.381-.975-1.163-2.968-1.548-3.948-.095-.285-.31-.625-.265-.938.046-.598.724-1.003 1.276-.754l3.682 1.888c.621.292 1.305.692 1.796 1.172a6.486 6.486 0 0 1 2.097 4.777Zm-1.44 1.888c-.264-1.194-1.135-1.744-2.216-2.028-1.527.902-4.853 2.878-6.952 4.13-1.103.68-2.13 1.35-2.919 1.242a2.866 2.866 0 0 1-2.77-2.325c-.012-.048-.008-.03-.001.01a6.4 6.4 0 0 0 .947 2.653 6.498 6.498 0 0 0 5.486 3.022c1.908.062 3.536-1.153 5.099-2.096.292-.188.804-.496 1.332-.831l1.423-1.51c.553-.577.764-1.426.571-2.267Zm-12.04 2.97c.422 0 .822-.1 1.173-.29.355-.215.964-.579 1.7-1.018L9.57 4.502c0-.99-.497-1.864-1.257-2.382-.08-.059-2.91-1.901-2.99-1.956-.605-.432-1.523.045-1.5.797v14.887l.417 2.36a2.488 2.488 0 0 0 2.455 2.056Z"
		/>
	</svg>
	<Crossfade key={$locale} inline class="min-w-0 overflow-hidden">
		<span class="block min-w-0 truncate {textClass}">{label}</span>
	</Crossfade>
</div>
