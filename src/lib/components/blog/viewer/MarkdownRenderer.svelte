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
    import { linkEnhancer } from './actions';
    import './reader.css';
	
	let { source, toc = $bindable([]) }: { 
        source: string; 
        toc?: { id: string; text: string; depth: number }[] 
    } = $props();

    // 处理渲染与样式注水
    async function handleRender(src: string) {
        if (!src) return '';
        
        // 按需异步加载样式分片 (让全局打包更小)
        if (src.includes('$')) import('katex/dist/katex.min.css');
        if (src.includes('```')) import('highlight.js/styles/github.css');

        const result = await renderMarkdown(src);
        toc = result.toc;
        return result.html;
    }

    // 响应式渲染 Promise
    let renderPromise = $derived(handleRender(source));

	// 代码复制逻辑 (保留在 UI 层处理交互反馈)
	function handleCopy(event: MouseEvent) {
		const target = event.target as HTMLElement;
		const btn = target.closest('.copy-btn') as HTMLElement;
		
		if (btn && btn.dataset.code) {
			try {
				const code = decodeURIComponent(btn.dataset.code);
				navigator.clipboard.writeText(code);
				
                const originalText = btn.innerText;
                btn.innerText = $t('common.copied') + '!';
                btn.classList.add('copied');
                
                setTimeout(() => {
                    btn.innerText = 'Copy';
                    btn.classList.remove('copied');
                }, 2000);
			} catch (err) {
				console.error('Failed to copy:', err);
			}
		}
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div 
    class="markdown-body"
    use:linkEnhancer={{ source }}
    onclick={handleCopy}
    role="article"
>
    {#await renderPromise}
        <!-- 骨架屏占位 -->
        <div class="h-32 animate-pulse rounded bg-secondary/10"></div>
    {:then html}
        {@html html}
    {:catch error}
        <p class="text-red-400">{$t('blog.render_error', { message: error.message })}</p>
    {/await}
</div>
