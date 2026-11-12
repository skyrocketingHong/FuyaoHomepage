/**
 * Markdown 解析引擎与渲染工具集
 *
 * 职责:
 * 1. 封装 unified/remark/rehype 工具链，实现从 Markdown 源码到 HTML 的异步转换。
 * 2. 具备自动 TOC (目录) 提取功能。
 * 3. 实现代码块增强（语言标签显示与复制功能封装）。
 * 4. 通过 AST 白名单净化原始 HTML，并生成 KaTeX 公式与代码高亮结构。
 */
import type { Options as RehypeSanitizeOptions } from 'rehype-sanitize';

/**
 * HAST (HTML AST) 节点类型
 * unist-util-visit 的节点回调类型在 strict 模式下不兼容，故定义局部接口
 */
interface HastNode {
	type: string;
	tagName?: string;
	value?: string;
	properties?: Record<string, unknown>;
	children?: HastNode[];
}

/** HAST 父节点类型 */
interface HastParent extends HastNode {
	children: HastNode[];
}

/** Markdown 渲染选项。 */
export interface MarkdownRenderOptions {
	/** 代码块复制按钮文本。 */
	copyLabel?: string;
	/** 横向滚动表格的无障碍标签。 */
	tableScrollLabel?: string;
}

/** Markdown 渲染结果。 */
export interface MarkdownRenderResult {
	/** 安全转换后的 HTML。 */
	html: string;
	/** 从一级至三级标题提取的目录。 */
	toc: { id: string; text: string; depth: number }[];
}

/**
 * 判断独立链接的可见文字是否与目标 HTTP(S) URL 等价。
 *
 * URL 构造器会统一主机名大小写、默认端口、尾部斜杠和百分号编码，避免直接字符串比较误判。
 */
export function isStandalonePreviewLink(href: string, visibleText: string): boolean {
	try {
		const target = new URL(href.trim());
		const label = new URL(visibleText.trim());
		if (
			!['http:', 'https:'].includes(target.protocol) ||
			!['http:', 'https:'].includes(label.protocol)
		) {
			return false;
		}
		return target.href === label.href;
	} catch {
		return false;
	}
}

/**
 * Markdown 渲染核心函数
 *
 * 采用动态加载依赖策略以优化 Bundle 体积和首屏加载速度。
 *
 * @param src - 原始 Markdown 字符串源码
 * @param options - 本地化文案等渲染选项
 * @returns 包含渲染后 HTML 和目录结构的结果
 */
export async function renderMarkdown(
	src: string,
	options: MarkdownRenderOptions = {}
): Promise<MarkdownRenderResult> {
	if (!src) return { html: '', toc: [] };

	const copyLabel = options.copyLabel || 'Copy';
	const tableScrollLabel = options.tableScrollLabel || '可横向滚动表格';

	// 1. 并行动态加载所有依赖，确保模块上下文一致
	const [
		{ unified },
		{ default: remarkParse },
		{ default: remarkGfm },
		{ default: remarkMath },
		{ default: remarkRehype },
		{ default: rehypeRaw },
		{ default: rehypeSanitize, defaultSchema },
		{ default: rehypeKatex },
		{ default: rehypeHighlight },
		{ default: rehypeStringify },
		{ default: rehypeSlug },
		{ visit, SKIP }
	] = await Promise.all([
		import('unified'),
		import('remark-parse'),
		import('remark-gfm'),
		import('remark-math'),
		import('remark-rehype'),
		import('rehype-raw'),
		import('rehype-sanitize'),
		import('rehype-katex'),
		import('rehype-highlight'),
		import('rehype-stringify'),
		import('rehype-slug'),
		import('unist-util-visit')
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

	const sanitizeSchema: RehypeSanitizeOptions = {
		...defaultSchema,
		tagNames: [...new Set([...(defaultSchema.tagNames || []), 'mark'])],
		attributes: {
			...defaultSchema.attributes,
			code: [
				...(defaultSchema.attributes?.code || []),
				['className', 'math-inline', 'math-display']
			]
		},
		strip: [...new Set([...(defaultSchema.strip || []), 'style', 'iframe', 'object', 'embed'])]
	};

	// 2. 自定义插件：TOC 提取器 (闭包模式)
	const rehypeExtractToc = () => (tree: unknown) => {
		// 需要显式导入 Node 类型，但在动态导入环境下，我们可以使用 any 或 unknown 配合断言
		// 这里 unist-util-visit 的类型定义在某些版本中比较严格
		visit(tree as unknown as HastNode, 'element', (node: HastNode) => {
			if (['h1', 'h2', 'h3'].includes(node.tagName || '')) {
				const id = node.properties && (node.properties.id as string);
				if (id) {
					const text = toString(node);
					const depth = parseInt((node.tagName || '').slice(1), 10);
					localToc.push({ id, text, depth });
				}
			}
		});
	};

	// 3. 自定义插件：代码块增强 (闭包模式)
	const rehypeCodeWrapper = () => (tree: unknown) => {
		visit(
			tree as unknown as HastNode,
			'element',
			(node: HastNode, index: number | undefined, parent: HastParent | null) => {
				// 跳过已处理的容器，防止递归死循环
				if (
					parent &&
					parent.properties &&
					parent.properties.className &&
					Array.isArray(parent.properties.className) &&
					parent.properties.className.includes('code-wrapper')
				) {
					return SKIP;
				}

				if (node.tagName === 'pre' && node.children && Array.isArray(node.children)) {
					// 查找 code 节点
					const codeNode = node.children.find(
						(c: HastNode) => c.type === 'element' && c.tagName === 'code'
					);
					if (!codeNode) return;

					const classes = (codeNode.properties && codeNode.properties.className) || [];
					const langClass = Array.isArray(classes)
						? classes.find((c: unknown) => typeof c === 'string' && c.startsWith('language-'))
						: null;
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
									{
										type: 'element',
										tagName: 'span',
										properties: { className: ['lang-label'] },
										children: [{ type: 'text', value: lang }]
									},
									{
										type: 'element',
										tagName: 'button',
										properties: { className: ['copy-btn'], 'data-code': encoded },
										children: [{ type: 'text', value: copyLabel }]
									}
								]
							},
							{
								...node,
								properties: {
									...(node.properties || {}),
									className: [
										...((node.properties && (node.properties.className as string[])) || []),
										'hljs'
									]
								}
							}
						]
					};

					if (parent && typeof index === 'number') {
						parent.children[index] = wrapperNode as HastNode;
						return SKIP;
					}
				}
			}
		);
	};

	// 4. 自定义插件：表格包裹器 (解决横向滚动)
	const rehypeTableWrapper = () => (tree: unknown) => {
		visit(
			tree as HastNode,
			'element',
			(node: HastNode, index: number | undefined, parent: HastParent | null) => {
				if (node.tagName === 'table') {
					// 防止重复包裹
					if (
						parent &&
						parent.properties &&
						parent.properties.className &&
						Array.isArray(parent.properties.className) &&
						parent.properties.className.includes('table-container')
					) {
						return SKIP;
					}

					const wrapperNode = {
						type: 'element',
						tagName: 'div',
						properties: {
							className: ['table-container'],
							tabIndex: 0,
							role: 'region',
							ariaLabel: tableScrollLabel
						},
						children: [node]
					};

					if (parent && typeof index === 'number') {
						parent.children[index] = wrapperNode as HastNode;
						return SKIP;
					}
				}
			}
		);
	};

	/** 修复 sanitize 为防止 DOM clobbering 添加前缀后，文内锚点仍指向旧 ID 的情况。 */
	const rehypeRepairFragmentLinks = () => (tree: unknown) => {
		const ids = new Set<string>();
		visit(tree as HastNode, 'element', (node: HastNode) => {
			const id = node.properties?.id;
			if (typeof id === 'string') ids.add(id);
		});

		visit(tree as HastNode, 'element', (node: HastNode) => {
			if (node.tagName !== 'a') return;
			const href = node.properties?.href;
			if (typeof href !== 'string' || !href.startsWith('#')) return;

			const targetId = href.slice(1);
			if (!ids.has(targetId) && ids.has(`user-content-${targetId}`)) {
				node.properties = { ...node.properties, href: `#user-content-${targetId}` };
			}
		});
	};

	/** 为媒体、外部链接、表头和任务列表补充浏览器原生语义。 */
	const rehypeEnhanceContent = () => (tree: unknown) => {
		visit(tree as HastNode, 'element', (node: HastNode) => {
			node.properties = node.properties || {};

			if (node.tagName === 'img') {
				node.properties.loading = 'lazy';
				node.properties.decoding = 'async';
			}

			if (node.tagName === 'a') {
				const href = String(node.properties.href ?? '');
				if (/^https?:\/\//i.test(href)) {
					node.properties.rel = ['noopener', 'noreferrer'];
				}
			}

			if (node.tagName === 'th' && !node.properties.scope) {
				node.properties.scope = 'col';
			}

			if (node.tagName === 'input' && node.properties.type === 'checkbox') {
				node.properties.disabled = true;
			}
		});
	};

	// 5. 自定义插件：图片说明检测 (Image Caption)
	const rehypeImageCaption = () => (tree: unknown) => {
		visit(
			tree as unknown as HastNode,
			'element',
			(node: HastNode, index: number | undefined, parent: HastParent | null) => {
				// 检查当前段落是否仅包含一个图片
				if (node.tagName === 'p' && node.children && parent && typeof index === 'number') {
					const realChildren = (node.children || []).filter(
						(c: HastNode) =>
							c.type === 'element' || (c.type === 'text' && (c.value || '').trim().length > 0)
					);

					const hasOnlyImage = realChildren.length === 1 && realChildren[0].tagName === 'img';

					if (hasOnlyImage) {
						// 寻找下一个非空元素段落作为说明文字
						let nextIndex = index + 1;
						while (
							parent.children[nextIndex] &&
							parent.children[nextIndex].type === 'text' &&
							!(parent.children[nextIndex].value || '').trim()
						) {
							nextIndex++;
						}

						const nextNode = parent.children[nextIndex];
						if (nextNode && nextNode.type === 'element' && nextNode.tagName === 'p') {
							const text = toString(nextNode).trim();
							const isLikelyCaption =
								text.startsWith('图') ||
								text.toLowerCase().startsWith('figure') ||
								((nextNode.children || []).length === 1 &&
									(nextNode.children || [])[0].tagName === 'em');

							if (isLikelyCaption) {
								nextNode.properties = nextNode.properties || {};
								nextNode.properties.className = [
									...((nextNode.properties.className as string[]) || []),
									'image-caption'
								];
								node.properties = node.properties || {};
								node.properties.className = [
									...((node.properties.className as string[]) || []),
									'image-paragraph'
								];
							}
						}
					} else {
						// 情况 B: 图片和说明在同一个段落里
						const imgNode = realChildren.find((c: HastNode) => c.tagName === 'img');
						if (imgNode && realChildren.length === 2) {
							const otherNode = realChildren.find((c: HastNode) => c !== imgNode);
							const text = toString(otherNode).trim();
							if (
								text.length > 0 &&
								text.length < 200 &&
								(text.startsWith('图') ||
									text.toLowerCase().startsWith('figure') ||
									otherNode?.tagName === 'em')
							) {
								node.properties = node.properties || {};
								node.properties.className = [
									...((node.properties.className as string[]) || []),
									'image-caption'
								];
							}
						}
					}
				}
			}
		);
	};

	const processor = unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkMath)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeRaw)
		.use(rehypeSanitize, sanitizeSchema)
		.use(rehypeKatex)
		.use(rehypeHighlight)
		.use(rehypeSlug)
		.use(rehypeRepairFragmentLinks)
		.use(rehypeCodeWrapper)
		.use(rehypeTableWrapper)
		.use(rehypeImageCaption)
		.use(rehypeEnhanceContent)
		.use(rehypeExtractToc)
		.use(rehypeStringify);

	const file = await processor.process(src);

	return { html: String(file), toc: localToc };
}
