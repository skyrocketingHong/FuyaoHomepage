<script lang="ts">
	/**
	 * Markdown 内容渲染组件
	 * 
	 * 使用 unified 管道（remark/rehype）解析 Markdown，支持数学公式（Katex）、
	 * 代码高亮（Highlight.js）、GfM 以及自定义的 TOC 提取与代码块增强。
	 * 样式仿照 Apple Newsroom 设计。
	 * 
	 * @prop source - 原始 Markdown 字符串
	 * @prop toc - 绑定属性，用于输出解析得到的目录结构
	 */
	import { unified } from 'unified';
	import remarkParse from 'remark-parse';
	import remarkMath from 'remark-math';
	import remarkGfm from 'remark-gfm';
	import remarkRehype from 'remark-rehype';
	import rehypeKatex from 'rehype-katex';
	import rehypeHighlight from 'rehype-highlight';
	import rehypeStringify from 'rehype-stringify';
	import rehypeSlug from 'rehype-slug';
	import { visit } from 'unist-util-visit';
	import type { Transformer } from 'unified';
	import type { Element } from 'hast';
	
	import DOMPurify from 'dompurify';
	import 'katex/dist/katex.min.css';
	// highlight.js styles are imported via global CSS or potentially here if needed specific theme
	// The user requested 'Apple Newsroom' style, let's stick to a clean github-like for code for now or minimal
    // But we need some css for hljs. 
	import 'highlight.js/styles/github.css'; 
	// Removed: 'github-markdown-css/github-markdown.css' - we will style manually for Apple Newsroom look
	
	import { mount, unmount } from 'svelte';
	import LinkPreview from './LinkPreview.svelte';
	
	// Define exported props
	let { source, toc = $bindable([]) }: { source: string; toc?: { id: string; text: string; depth: number }[] } = $props();

    // --- 自定义插件 ---

    // 1. TOC (目录) 提取插件
    function rehypeExtractToc(): Transformer {
        return (tree) => {
            const newToc: typeof toc = [];
            visit(tree, 'element', (node: any) => {
                if (['h1', 'h2', 'h3'].includes(node.tagName)) {
                    const id = node.properties?.id;
                    if (id) {
                        // Extract text content from children
                        const text = extractText(node);
                        const depth = parseInt(node.tagName.slice(1), 10);
                        newToc.push({ id, text, depth });
                    }
                }
            });
            // Update the bound prop
            // Note: Since this runs in the pipeline, we need to defer the update or just assign to a local var
            // returning it via side-effect here is okay if we are careful.
            extractedToc = newToc;
        };
    }

    function extractText(node: any): string {
        if (node.type === 'text') return node.value;
        if (node.children) return node.children.map(extractText).join('');
        return '';
    }

    // 2. 自定义代码块封装插件（用于添加语言标签和复制按钮）
    function rehypeCodeWrapper(): Transformer {
        return (tree) => {
            visit(tree, 'element', (node: any, index, parent) => {
                if (node.tagName === 'pre' && node.children && node.children.length > 0) {
                    const codeNode = node.children[0];
                    if (codeNode && codeNode.tagName === 'code') {
                        // 提取语言类名 (language-xxx)
                        const className = codeNode.properties?.className || [];
                        let lang = 'TEXT';
                        for (const cls of className) {
                            if (typeof cls === 'string' && cls.startsWith('language-')) {
                                lang = cls.slice(9).toUpperCase();
                                break;
                            }
                        }
                        
                        // 提取原始代码用于复制功能
                        const rawCode = extractText(codeNode);
                        const encoded = encodeURIComponent(rawCode);

                        // 构建封装结构：
                        // <div class="code-wrapper">
                        //    <div class="code-header">...</div>
                        //    <pre class="hljs">...</pre>
                        // </div>

                        const wrapper: Element = {
                            type: 'element',
                            tagName: 'div',
                            properties: { className: ['code-wrapper'] },
                            children: [
                                {
                                    type: 'element',
                                    tagName: 'div',
                                    properties: { className: ['code-header'] },
                                    children: [
                                        {
                                            type: 'element',
                                            tagName: 'span',
                                            properties: { className: ['lang-label'] },
                                            children: [{ type: 'text', value: lang }]
                                        },
                                        {
                                            type: 'element',
                                            tagName: 'button',
                                            properties: { 
                                                className: ['copy-btn'],
                                                'data-code': encoded
                                            },
                                            children: [{ type: 'text', value: 'Copy' }]
                                        }
                                    ]
                                },
                                // 原始 pre 节点，确保包含 hljs 类以保持样式一致
                                {
                                    ...node,
                                    properties: {
                                        ...node.properties,
                                        className: [...(node.properties?.className || []), 'hljs'] 
                                    }
                                }
                            ]
                        };

                        // 替换当前节点为封装后的节点
                        if (parent && typeof index === 'number') {
                            parent.children[index] = wrapper;
                        }
                    }
                }
            });
        };
    }
    
    // 用于存储提取到的 TOC
    let extractedToc: typeof toc = [];

	// 创建统一处理器管道
    const processor = unified()
        .use(remarkParse)
        .use(remarkMath)
        .use(remarkGfm)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeKatex)
        .use(rehypeHighlight, { ignoreMissing: true })
        .use(rehypeSlug)
        .use(rehypeCodeWrapper)
        .use(rehypeExtractToc)
        .use(rehypeStringify, { allowDangerousHtml: true });

	// 响应式处理
	let finalHtml = $state('');

    $effect(() => {
        if (!source) {
            finalHtml = '';
            toc = [];
            return;
        }

        async function process() {
            try {
                const file = await processor.process(source);
                const rawHtml = String(file);
                
                // HTML 清洗，支持特定的数学公式标签和自定义按钮
                finalHtml = DOMPurify.sanitize(rawHtml, {
                    ADD_TAGS: ['math', 'maction', 'maligngroup', 'malignmark', 'menclose', 'merror', 'mfenced', 'mfrac', 'mglyph', 'mi', 'mlabeledtr', 'mlongdiv', 'mmultiscripts', 'mn', 'mo', 'mover', 'mpadded', 'mphantom', 'mroot', 'mrow', 'ms', 'mscarries', 'mscarry', 'msgroup', 'msline', 'mspace', 'msqrt', 'msrow', 'mstack', 'mstyle', 'msub', 'msubsup', 'msup', 'mtable', 'mtd', 'mtext', 'mtr', 'munder', 'munderover', 'semantics', 'annotation', 'annotation-xml', 'button'],
                    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'id', 'class', 'data-code', 'style']
                });

                // 更新 TOC 目录
                toc = extractedToc;

            } catch (err) {
                console.error('Markdown processing error:', err);
                finalHtml = `<p style="color:red">渲染内容出错</p>`;
            }
        }

        process();
    });

	
	function handleCopy(event: MouseEvent) {
		const target = event.target as HTMLElement;
		const btn = target.closest('.copy-btn') as HTMLElement;
		
		if (btn && btn.dataset.code) {
			try {
				const code = decodeURIComponent(btn.dataset.code);
				navigator.clipboard.writeText(code);
				
                // 视觉反馈
                const originalText = btn.innerText;
                btn.innerText = '已复制！';
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
	
	// 链接增强 Action：自动将孤立的链接转化为 LinkPreview
	function linkEnhancer(node: HTMLElement, content: string) {
		const cleanupFns: (() => void)[] = [];

		const process = () => {
			cleanupFns.forEach(fn => fn());
			cleanupFns.length = 0;

			// 等待 DOM 更新
			setTimeout(() => {
				const paragraphs = node.querySelectorAll('p');
				paragraphs.forEach(p => {
					if (p.childNodes.length === 1 && p.childNodes[0].nodeName === 'A') {
							// 检查是否仅包含链接（去除多余空格）
						if (p.textContent?.trim() !== (p.childNodes[0] as HTMLElement).textContent?.trim()) return;

						const a = p.childNodes[0] as HTMLAnchorElement;
						const href = a.getAttribute('href');
						if (!href) return;
						
						const container = document.createElement('div');
						container.className = 'my-8 not-prose w-full';
						p.parentNode?.replaceChild(container, p);
						
						const component = mount(LinkPreview, {
							target: container,
							props: { url: href }
						});

						cleanupFns.push(() => {
							unmount(component);
						});
					}
				});
			}, 0);
		};

        // 立即运行
		process();

		return {
			update(newContent: string) {
				process();
			},
			destroy() {
				cleanupFns.forEach(fn => fn());
			}
		};
	}
</script>

	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div 
		class="markdown-body"
		use:linkEnhancer={finalHtml}
		onclick={handleCopy}
		role="article"
	>
		{@html finalHtml}
	</div>

<style>
    /* =========================================================
       Apple Newsroom 样式配置
       ========================================================= */
       
    :global(.markdown-body) {
        /* 布局与字体匹配 Apple Newsroom 规范 */
        font-family: "SF Pro Text", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif;
        /* 桌面端: 17px / 25px */
        font-size: 17px; 
        line-height: 25px; 
        font-weight: 400;
        letter-spacing: 0.011em;
        color: #1d1d1f;
        max-width: 653px; /* 严格的内容正文宽度 */
        margin: 0 auto;
        padding: 0;
        
        /* 平滑过渡 */
        transition: color 0.3s, background-color 0.3s;
    }

    /* 标题样式 */
    :global(.markdown-body h1),
    :global(.markdown-body h2),
    :global(.markdown-body h3),
    :global(.markdown-body h4),
    :global(.markdown-body h5),
    :global(.markdown-body h6) {
        font-family: "SF Pro Display", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif;
        font-weight: 700;
        letter-spacing: -0.015em;
        color: #1d1d1f;
    }

    /* 正文内的 H1 - 注意：通常文章标题在外部定义，此处用于处理兜底
       移动端: 32/36, 平板: 40/44, 桌面端: 48/52 */
    :global(.markdown-body h1) { 
        font-size: 48px; 
        line-height: 52px;
        margin-top: 1.0em;
        margin-bottom: 0.5em;
    }
    
    :global(.markdown-body h2) { 
        font-size: 24px; 
        line-height: 28px;
        margin-top: 52px; 
        margin-bottom: 16px;
        border-bottom: none; 
    }
    
    :global(.markdown-body h3) { 
        font-size: 20px; 
        line-height: 24px;
        margin-top: 32px;
        margin-bottom: 12px;
    }

    /* 响应式调整 */
    @media (max-width: 1024px) {
        /* 平板 / 窄屏模式 */
        :global(.markdown-body h1) { font-size: 40px; line-height: 44px; }
    }

    @media (max-width: 768px) {
        /* 移动端 */
        :global(.markdown-body h1) { font-size: 32px; line-height: 36px; }
        :global(.markdown-body h2) { font-size: 22px; line-height: 26px; margin-top: 40px; }
        :global(.markdown-body h3) { font-size: 19px; line-height: 23px; }
    }

    /* 段落 */
    :global(.markdown-body p) {
        margin-bottom: 1.42em; 
        color: #1d1d1f; 
        font-weight: 400;
    }

    /* 暗色模式覆盖 */
    :global(.dark .markdown-body) {
        color: #f5f5f7;
    }
    :global(.dark .markdown-body h1),
    :global(.dark .markdown-body h2),
    :global(.dark .markdown-body h3),
    :global(.dark .markdown-body h4),
    :global(.dark .markdown-body h5),
    :global(.dark .markdown-body h6),
    :global(.dark .markdown-body p) {
        color: #f5f5f7;
    }

    /* 链接 */
    :global(.markdown-body a) {
        color: var(--primary);
        text-decoration: underline;
        text-decoration-thickness: 1px;
        text-underline-offset: 2px;
    }
    :global(.markdown-body a:hover) {
        color: var(--theme-color);
        transition: color 0.2s;
    }

    /* 图片 (Apple 风格: 圆角与阴影) */
    :global(.markdown-body img) {
        display: block;
        margin: 2.5em auto;
        max-width: 100%;
        height: auto;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.06);
    }
    
    /* 暗色模式阴影调整 */
    :global(.dark .markdown-body img) {
        box-shadow: 0 8px 30px rgba(0,0,0,0.3);
    }

    /* 引用块 */
    :global(.markdown-body blockquote) {
        margin: 2rem 0;
        padding-left: 1.5rem;
        border-left: 4px solid var(--primary);
        color: var(--muted-foreground);
        font-style: italic;
        font-size: 1.1em;
    }

    /* 列表 */
    :global(.markdown-body ul),
    :global(.markdown-body ol) {
        margin-bottom: 1.5em;
        padding-left: 1.5em;
    }
    :global(.markdown-body li) {
        margin-bottom: 0.5em;
    }

    /* 分隔线 */
    :global(.markdown-body hr) {
        height: 1px;
        background-color: var(--border);
        border: none;
        margin: 3em 0;
    }

    /* =========================================================
       代码块样式 (Apple Developer / Xcode 风格)
       ========================================================= */
    
    /* 1. 容器样式重置 */
    :global(.markdown-body .code-wrapper) {
      all: initial; 
      display: block;
      margin: 2.5em 0;
      border-radius: 14px;
      background-color: var(--code-bg);
      font-family: "SF Mono", SFMono-Regular, ui-monospace, Menlo, Monaco, Consolas, monospace;
      width: 100%;
      box-sizing: border-box;
      font-size: 17px;
      overflow: hidden; 
      border: 1px solid var(--code-border);
      box-shadow: 0 4px 6px rgba(0,0,0,0.02);
    }

    /* 重置 pre/code 内部样式 */
    :global(.markdown-body .code-wrapper pre),
    :global(.markdown-body .code-wrapper code) {
      background: transparent !important;
      border: none !important;
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      color: inherit !important;
      font-family: inherit !important;
    }

    /* 2. 头部标签与按钮 (极简风格) */
    :global(.markdown-body .code-header) {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      background-color: transparent;
      border-bottom: 1px solid var(--code-border-inner);
      user-select: none;
    }

    :global(.markdown-body .lang-label) {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--code-text-muted);
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }

    :global(.markdown-body .copy-btn) {
      appearance: none;
      background: transparent;
      border: 1px solid transparent;
      border-radius: 6px;
      cursor: pointer;
      color: var(--code-text-muted);
      font-size: 0.75rem;
      padding: 4px 10px;
      transition: all 0.2s ease;
      font-weight: 500;
    }

    :global(.markdown-body .copy-btn:hover) {
      background-color: var(--code-hover);
      color: var(--code-text);
    }
    
    :global(.markdown-body .copy-btn.copied) {
        color: var(--primary);
        font-weight: 600;
    }

    /* 3. 内边距与滚动 */
    :global(.markdown-body .code-wrapper pre.hljs) {
      padding: 16px 20px !important;
      overflow-x: auto;
      line-height: 25px;
      color: var(--code-text);
      -webkit-font-smoothing: antialiased;
    }

    /* 4. 主题变量 */
    :global(:root) {
      /* Apple Developer 亮色: 纯净灰 #f5f5f7 */
      --code-bg: #f5f5f7;
      --code-border: rgba(0,0,0,0.03);
      --code-border-inner: rgba(0,0,0,0.04);
      --code-text: #1d1d1f;
      --code-text-muted: #86868b;
      --code-hover: rgba(0,0,0,0.06);
    }

    /* 暗色模式: Xcode 深色风格 */
    :global(.dark) {
      --code-bg: #1c1c1e; 
      --code-border: rgba(255,255,255,0.08);
      --code-border-inner: rgba(255,255,255,0.06);
      --code-text: #f5f5f7;
      --code-text-muted: #98989d;
      --code-hover: rgba(255,255,255,0.1);
    }
    
    :global(.dark .code-wrapper),
    :global(.dark .code-wrapper pre) {
        color: var(--code-text) !important;
    }

    /* 数学公式渲染调整 */
    :global(.katex-display) {
        margin: 2em 0;
        overflow-x: auto;
        overflow-y: hidden;
    }
    
    /* 表格样式 */
    :global(.markdown-body table) {
        display: block;
        width: 100%;
        overflow: auto;
        margin: 2em 0;
        border-collapse: collapse; 
    }
    :global(.markdown-body table th),
    :global(.markdown-body table td) {
        padding: 10px 16px;
        border: 1px solid var(--border);
    }
    :global(.markdown-body table th) {
        font-weight: 600;
        background-color: var(--secondary);
    }
    :global(.markdown-body table tr) {
        background-color: transparent;
    }
    :global(.markdown-body table tr:nth-child(2n)) {
        background-color: var(--muted);
    }
</style>
