<script lang="ts">
	/**
	 * Markdown 内容渲染组件
	 *
	 * 高度精简后的渲染器，仅作为渲染调度层。
	 * 解析逻辑托管于 $lib/utils/domain/markdown，
	 * 样式系统托管于 ./reader.css。
	 *
	 * @prop source - 原始 Markdown 字符串
	 * @prop toc - 绑定属性，用于输出解析得到的目录结构
	 */
	import { t } from '$lib/i18n/store';
	import { renderMarkdown } from '$lib/utils/domain/markdown';
	import { linkEnhancer } from '$lib/actions/linkEnhancer.svelte';
	import { tableScrollEnhancer } from '$lib/actions/tableScrollEnhancer.svelte';
	import { untrack } from 'svelte';
	import 'katex/dist/katex.min.css';
	import '$lib/styles/reader.css';

	let {
		source,
		toc = $bindable([]),
		initialHtml = '',
		initialToc = []
	}: {
		source: string;
		toc?: { id: string; text: string; depth: number }[];
		initialHtml?: string;
		initialToc?: { id: string; text: string; depth: number }[];
	} = $props();

	const initialTocValue = untrack(() => initialToc);
	if (initialTocValue.length > 0 && toc.length === 0) toc = initialTocValue;
	let rootElement = $state<HTMLElement>();

	// 处理 Markdown 渲染
	async function handleRender(src: string) {
		if (!src) return '';

		const result = await renderMarkdown(src, {
			copyLabel: $t('common.copy'),
			tableScrollLabel: $t('blog.scrollable_table')
		});
		toc = result.toc;
		return result.html;
	}

	// 响应式渲染 Promise
	let renderPromise = $derived(handleRender(source));

	// 代码复制逻辑 (保留在 UI 层处理交互反馈)
	async function handleCopy(event: MouseEvent) {
		const target = event.target as HTMLElement;
		const btn = target.closest('.copy-btn') as HTMLElement;

		if (btn && btn.dataset.code) {
			try {
				const code = decodeURIComponent(btn.dataset.code);
				await navigator.clipboard.writeText(code);

				btn.innerText = $t('common.copied') + '!';
				btn.classList.add('copied');

				setTimeout(() => {
					btn.innerText = $t('common.copy');
					btn.classList.remove('copied');
				}, 2000);
			} catch (err) {
				console.error('Failed to copy:', err);
			}
		}
	}

	// 服务端预渲染无法获知客户端语言偏好，注水后同步按钮文案和无障碍标签。
	$effect(() => {
		const copyLabel = $t('common.copy');
		rootElement?.querySelectorAll<HTMLButtonElement>('.copy-btn').forEach((button) => {
			if (!button.classList.contains('copied')) button.textContent = copyLabel;
			button.setAttribute('aria-label', copyLabel);
		});
		const tableScrollLabel = $t('blog.scrollable_table');
		rootElement?.querySelectorAll<HTMLElement>('.table-container').forEach((container) => {
			container.setAttribute('aria-label', tableScrollLabel);
		});
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	bind:this={rootElement}
	class="markdown-body"
	use:linkEnhancer={{ source }}
	use:tableScrollEnhancer={{ label: $t('blog.scrollable_table') }}
	onclick={handleCopy}
	role="article"
>
	{#if initialHtml}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html initialHtml}
	{:else}
		{#await renderPromise}
			<!-- 骨架屏占位 -->
			<div class="h-32 animate-pulse rounded bg-secondary/10"></div>
		{:then html}
			{@html html}
		{:catch error}
			<p class="text-red-400">{$t('blog.render_error', { message: error.message })}</p>
		{/await}
	{/if}
</div>
