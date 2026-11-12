import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { isStandalonePreviewLink, renderMarkdown } from '../src/lib/utils/domain/markdown.ts';
import {
	applyHorizontalWheel,
	normalizeWheelDelta
} from '../src/lib/actions/tableScrollEnhancer.svelte.ts';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('原始 HTML 通过 AST 白名单保留定义与排版元素', async () => {
	const { html } = await renderMarkdown(`
<dl><dt>术语</dt><dd>定义</dd></dl>
<details><summary>详情</summary><kbd>Command</kbd> <mark>重点</mark> H<sub>2</sub>O<sup>2</sup><br>换行</details>
`);

	assert.match(html, /<dl><dt>术语<\/dt><dd>定义<\/dd><\/dl>/);
	assert.match(html, /<details><summary>详情<\/summary>/);
	assert.match(html, /<kbd>Command<\/kbd>/);
	assert.match(html, /<mark>重点<\/mark>/);
	assert.match(html, /<sub>2<\/sub>/);
	assert.match(html, /<sup>2<\/sup>/);
	assert.match(html, /<br>/);
});

test('危险元素、事件属性和内联样式被移除', async () => {
	const { html } = await renderMarkdown(`
<div onclick="alert(1)" style="color:red">安全正文</div>
<script>alert('script')</script>
<style>.unsafe { display: block }</style>
<iframe src="https://example.com">iframe</iframe>
<object data="https://example.com">object</object>
<embed src="https://example.com">
<img src="x" onerror="alert(2)" style="width:9999px">
`);

	assert.match(html, /安全正文/);
	assert.doesNotMatch(html, /<(?:script|style|iframe|object|embed)\b/i);
	assert.doesNotMatch(html, /\bon\w+=/i);
	assert.doesNotMatch(html, /\sstyle=/i);
	assert.doesNotMatch(html, /alert\(|\.unsafe|>iframe<|>object</);
});

test('普通文字链接保持链接，只有独立裸 URL 满足预览规则', async () => {
	const ordinary = await renderMarkdown(
		'[项目主页](https://example.com)\n\n[带标题](https://example.org "说明")\n\n自动链接：https://example.net'
	);
	const naked = await renderMarkdown('https://example.com');

	assert.match(ordinary.html, /<a href="https:\/\/example\.com"/);
	assert.match(ordinary.html, /<a href="https:\/\/example\.org" title="说明"/);
	assert.match(ordinary.html, /<p>自动链接：<a href="https:\/\/example\.net"/);
	assert.doesNotMatch(ordinary.html, /data-link-preview|not-prose/);
	assert.match(
		naked.html,
		/<p><a href="https:\/\/example\.com"[^>]*>https:\/\/example\.com<\/a><\/p>/
	);
	assert.equal(isStandalonePreviewLink('https://example.com', '项目主页'), false);
	assert.equal(isStandalonePreviewLink('https://example.com', 'https://EXAMPLE.com/'), true);
	assert.equal(isStandalonePreviewLink('/relative', '/relative'), false);
});

test('KaTeX 保留 MathML 无障碍层并依靠组件静态样式避免视觉重复', async () => {
	const { html } = await renderMarkdown('$$\n\\int_0^1 x^2\\,dx\n$$');
	const rendererSource = fs.readFileSync(
		path.join(projectRoot, 'src/lib/components/blog/viewer/MarkdownRenderer.svelte'),
		'utf8'
	);
	const readerCss = fs.readFileSync(path.join(projectRoot, 'src/lib/styles/reader.css'), 'utf8');

	assert.equal((html.match(/class="katex-display"/g) ?? []).length, 1);
	assert.match(html, /class="katex-mathml"/);
	assert.match(html, /<math xmlns="http:\/\/www\.w3\.org\/1998\/Math\/MathML"/);
	assert.match(html, /class="katex-html" aria-hidden="true"/);
	assert.match(rendererSource, /import 'katex\/dist\/katex\.min\.css';/);
	assert.match(rendererSource, /\{#if initialHtml\}/);
	assert.doesNotMatch(rendererSource, /import\('katex\/dist\/katex\.min\.css'\)/);
	assert.doesNotMatch(readerCss, /\.katex-mathml[^}]*display\s*:\s*none/s);
});

test('GFM 表格保留列对齐且每张表只包裹一次', async () => {
	const { html } = await renderMarkdown(`
| 左对齐 | 居中 | 右对齐 |
| :--- | :---: | ---: |
| A | B | C |
`);

	assert.equal((html.match(/class="table-container"/g) ?? []).length, 1);
	assert.equal((html.match(/<table>/g) ?? []).length, 1);
	assert.match(html, /<th align="left" scope="col">左对齐<\/th>/);
	assert.match(html, /<th align="center" scope="col">居中<\/th>/);
	assert.match(html, /<th align="right" scope="col">右对齐<\/th>/);
	assert.match(html, /tabindex="0" role="region" aria-label="可横向滚动表格"/);
});

test('长表格使用内容驱动宽度和可见横向滚动容器', () => {
	const css = fs.readFileSync(path.join(projectRoot, 'src/lib/styles/reader.css'), 'utf8');

	assert.match(css, /\.markdown-body \.table-container\s*\{[^}]*width:\s*100%/s);
	assert.match(css, /\.markdown-body \.table-container\s*\{[^}]*max-width:\s*100%/s);
	assert.match(css, /\.markdown-body \.table-container\s*\{[^}]*overflow-x:\s*auto/s);
	assert.match(css, /\.markdown-body \.table-container\s*\{[^}]*overflow-y:\s*hidden/s);
	assert.match(css, /\.markdown-body table\s*\{[^}]*width:\s*max-content/s);
	assert.match(css, /\.markdown-body table\s*\{[^}]*min-width:\s*100%/s);
	assert.match(css, /\.markdown-body table td\s*\{[^}]*min-width:\s*8rem/s);
	assert.match(css, /\.markdown-body table td\s*\{[^}]*max-width:\s*28rem/s);
	assert.doesNotMatch(css, /\.table-container[^}]*scrollbar-width:\s*none/s);
});

test('纵向滚轮推动溢出表格，横向边界恢复页面滚动', () => {
	const container = { clientWidth: 320, scrollLeft: 0, scrollWidth: 960 };
	let prevented = false;
	const handled = applyHorizontalWheel(container, {
		deltaMode: 0,
		deltaX: 0,
		deltaY: 120,
		preventDefault: () => {
			prevented = true;
		}
	});

	assert.equal(handled, true);
	assert.equal(prevented, true);
	assert.equal(container.scrollLeft, 120);
	assert.equal(normalizeWheelDelta(3, 1, 320), 48);
	assert.equal(normalizeWheelDelta(1, 2, 320), 320);

	container.scrollLeft = 640;
	prevented = false;
	assert.equal(
		applyHorizontalWheel(container, {
			deltaMode: 0,
			deltaX: 0,
			deltaY: 120,
			preventDefault: () => {
				prevented = true;
			}
		}),
		false
	);
	assert.equal(prevented, false);

	container.scrollLeft = 200;
	assert.equal(
		applyHorizontalWheel(container, {
			deltaMode: 0,
			deltaX: 80,
			deltaY: 20,
			preventDefault: () => assert.fail('触控板原生横向输入不应被接管')
		}),
		false
	);
});
