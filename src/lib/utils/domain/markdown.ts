/**
 * Markdown 解析引擎与渲染工具集
 * 
 * 职责:
 * 1. 封装 unified/remark/rehype 工具链，实现从 Markdown 源码到 HTML 的异步转换。
 * 2. 具备自动 TOC (目录) 提取功能。
 * 3. 实现代码块增强（语言标签显示与复制功能封装）。
 * 4. 具备数学公式 (Katex) 与 代码高亮 (Highlight.js) 的按需加载能力。
 */

/**
 * Markdown 渲染核心函数
 * 
 * 采用动态加载依赖策略以优化 Bundle 体积和首屏加载速度。
 * 
 * @param src - 原始 Markdown 字符串源码
 * @returns 包含渲染后的 HTML 字符串和解析出的 TOC 结构
 */
export async function renderMarkdown(src: string, options: { copyLabel?: string } = {}) {
    if (!src) return { html: '', toc: [] };

    const copyLabel = options.copyLabel || 'Copy';

    // 1. 并行动态加载所有依赖，确保模块上下文一致
    const [
        { unified },
        { default: remarkParse },
        { default: remarkGfm },
        { default: remarkRehype },
        { default: rehypeStringify },
        { default: rehypeSlug },
        { visit, SKIP },
        { default: DOMPurify }
    ] = await Promise.all([
        import('unified'),
        import('remark-parse'),
        import('remark-gfm'),
        import('remark-rehype'),
        import('rehype-stringify'),
        import('rehype-slug'),
        import('unist-util-visit'),
        import('dompurify')
    ]);

    // 内部文本提取工具 (更安全)
    function toString(node: unknown): string {
        if (!node || typeof node !== 'object') return '';
        const n = node as { type?: string; value?: string; children?: unknown[] };
        if (n.type === 'text') return n.value || '';
        if (n.children && Array.isArray(n.children)) {
            return n.children.map(toString).join('');
        }
        return '';
    }

    const localToc: { id: string; text: string; depth: number }[] = [];

    // 2. 自定义插件：TOC 提取器 (闭包模式)
    const rehypeExtractToc = () => (tree: unknown) => {
        visit(tree as any, 'element', (node: any) => {
            if (['h1', 'h2', 'h3'].includes(node.tagName)) {
                const id = node.properties && (node.properties.id as string);
                if (id) {
                    const text = toString(node);
                    const depth = parseInt(node.tagName.slice(1), 10);
                    localToc.push({ id, text, depth });
                }
            }
        });
    };

    // 3. 自定义插件：代码块增强 (闭包模式)
    const rehypeCodeWrapper = () => (tree: unknown) => {
        // @ts-expect-error - unist-util-visit 的 node 类型与 HAST 节点类型在 strict 模式下存在不匹配
        visit(tree, 'element', (node: any, index: number | undefined, parent: any) => {
            // 跳过已处理的容器，防止递归死循环
            if (parent && parent.properties && parent.properties.className && 
                Array.isArray(parent.properties.className) && 
                parent.properties.className.includes('code-wrapper')) {
                return SKIP;
            }

            if (node.tagName === 'pre' && node.children && Array.isArray(node.children)) {
                // 查找 code 节点
                const codeNode = node.children.find((c: any) => c.type === 'element' && c.tagName === 'code');
                if (!codeNode) return;

                const classes = (codeNode.properties && codeNode.properties.className) || [];
                const langClass = Array.isArray(classes) ? classes.find((c: unknown) => typeof c === 'string' && c.startsWith('language-')) : null;
                const lang = langClass ? (langClass as string).slice(9).toUpperCase() : 'TEXT';
                
                const rawCode = toString(codeNode);
                const encoded = encodeURIComponent(rawCode);

                const wrapperNode = {
                    type: 'element',
                    tagName: 'div',
                    properties: { className: ['code-wrapper'] },
                    children: [
                        {
                            type: 'element',
                            tagName: 'div',
                            properties: { className: ['code-header'] },
                            children: [
                                { type: 'element', tagName: 'span', properties: { className: ['lang-label'] }, children: [{ type: 'text', value: lang }] },
                                { type: 'element', tagName: 'button', properties: { className: ['copy-btn'], 'data-code': encoded }, children: [{ type: 'text', value: copyLabel }] }
                            ]
                        },
                        {
                            ...node,
                            properties: {
                                ...(node.properties || {}),
                                className: [...((node.properties && node.properties.className) || []), 'hljs']
                            }
                        }
                    ]
                };

                if (parent && typeof index === 'number') {
                    parent.children[index] = wrapperNode;
                    return SKIP;
                }
            }
        });
    };

    // 4. 自定义插件：表格包裹器 (解决横向滚动)
    const rehypeTableWrapper = () => (tree: unknown) => {
         // @ts-expect-error - visitor pattern types
        visit(tree, 'element', (node: any, index: number | undefined, parent: any) => {
            if (node.tagName === 'table') {
                // 防止重复包裹
                if (parent && parent.properties && parent.properties.className && 
                    Array.isArray(parent.properties.className) && 
                    parent.properties.className.includes('table-container')) {
                    return SKIP;
                }

                const wrapperNode = {
                    type: 'element',
                    tagName: 'div',
                    properties: { className: ['table-container'] },
                    children: [node]
                };

                if (parent && typeof index === 'number') {
                    parent.children[index] = wrapperNode;
                    return SKIP;
                }
            }
        });
    };

    // 5. 自定义插件：图片说明检测 (Image Caption)
    const rehypeImageCaption = () => (tree: any) => {
        visit(tree, 'element', (node: any, index: number | undefined, parent: any) => {
            // 检查当前段落是否仅包含一个图片
            if (node.tagName === 'p' && node.children && parent && typeof index === 'number') {
                const realChildren = node.children.filter((c: any) => 
                    c.type === 'element' || (c.type === 'text' && c.value.trim().length > 0)
                );
                
                const hasOnlyImage = realChildren.length === 1 && realChildren[0].tagName === 'img';
                
                if (hasOnlyImage) {
                    // 寻找下一个非空元素段落作为说明文字
                    let nextIndex = index + 1;
                    while (parent.children[nextIndex] && 
                           (parent.children[nextIndex].type === 'text' && !parent.children[nextIndex].value.trim())) {
                        nextIndex++;
                    }

                    const nextNode = parent.children[nextIndex];
                    if (nextNode && nextNode.type === 'element' && nextNode.tagName === 'p') {
                        const text = toString(nextNode).trim();
                        const isLikelyCaption = text.startsWith('图') || 
                                              text.toLowerCase().startsWith('figure') || 
                                              (nextNode.children.length === 1 && nextNode.children[0].tagName === 'em');
                        
                        if (isLikelyCaption) {
                            nextNode.properties = nextNode.properties || {};
                            nextNode.properties.className = [...(nextNode.properties.className || []), 'image-caption'];
                            node.properties = node.properties || {};
                            node.properties.className = [...(node.properties.className || []), 'image-paragraph'];
                        }
                    }
                } else {
                    // 情况 B: 图片和说明在同一个段落里
                    const imgNode = realChildren.find((c: any) => c.tagName === 'img');
                    if (imgNode && realChildren.length === 2) {
                        const otherNode = realChildren.find((c: any) => c !== imgNode);
                        const text = toString(otherNode).trim();
                        if (text.length > 0 && text.length < 200 && (text.startsWith('图') || text.toLowerCase().startsWith('figure') || otherNode.tagName === 'em')) {
                            node.properties = node.properties || {};
                            node.properties.className = [...(node.properties.className || []), 'image-caption'];
                        }
                    }
                }
            }
        });
    };

    let processor = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype, { allowDangerousHtml: true });

    // 按需加载：数学公式
    if (src.includes('$')) {
        const [{ default: remarkMath }, { default: rehypeKatex }] = await Promise.all([
            import('remark-math'),
            import('rehype-katex')
        ]);

        processor = processor.use(remarkMath).use(rehypeKatex);
    }

    // 按需加载：代码高亮
    if (src.includes('```')) {
        const { default: rehypeHighlight } = await import('rehype-highlight');
        // @ts-expect-error - 某些版本的 rehype-highlight 类型定义与当前 unified 版本可能存在细微冲突
        processor = processor.use(rehypeHighlight, { ignoreMissing: true });
    }

    // 执行解析
    const file = await processor
        .use(rehypeSlug)

        .use(rehypeCodeWrapper)

        .use(rehypeTableWrapper)
        .use(rehypeImageCaption)
        .use(rehypeExtractToc)
        .use(rehypeStringify, { allowDangerousHtml: true })
        .process(src);

    // 最终过滤
    const cleanHtml = DOMPurify.sanitize(String(file), {
        ADD_TAGS: ['math', 'maction', 'maligngroup', 'malignmark', 'menclose', 'merror', 'mfenced', 'mfrac', 'mglyph', 'mi', 'mlabeledtr', 'mlongdiv', 'mmultiscripts', 'mn', 'mo', 'mover', 'mpadded', 'mphantom', 'mroot', 'mrow', 'ms', 'mscarries', 'mscarry', 'msgroup', 'msline', 'mspace', 'msqrt', 'msrow', 'mstack', 'mstyle', 'msub', 'msubsup', 'msup', 'mtable', 'mtd', 'mtext', 'mtr', 'munder', 'munderover', 'semantics', 'annotation', 'annotation-xml', 'button'],
        ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'id', 'class', 'data-code', 'style']
    });

    return { html: cleanHtml, toc: localToc };
}
