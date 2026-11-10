import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/** @param {string} file */
const read = (file) => fs.readFileSync(path.join(projectRoot, file), 'utf8');

test('Newsroom 列表使用统一栅格并按 1+2+3 组织首屏报道', () => {
	const home = read('src/lib/components/blog/home/Home.svelte');
	const postCard = read('src/lib/components/blog/card/PostCard.svelte');
	const gridCard = read('src/lib/components/blog/card/GridPostCard.svelte');

	assert.match(home, /max-w-\[980px\]/);
	assert.match(home, /paginatedPosts\.slice\(1, 3\)/);
	assert.match(home, /paginatedPosts\.slice\(3, 6\)/);
	assert.match(home, /paginatedPosts\.slice\(6\)/);
	assert.match(home, /variant="secondary"/);
	assert.match(home, /md:grid-cols-2/);
	assert.match(home, /md:grid-cols-3/);
	assert.match(postCard, /variant\?: 'featured' \| 'secondary' \| 'grid' \| 'list'/);
	assert.match(gridCard, /size\?: 'large' \| 'regular'/);
	assert.doesNotMatch(gridCard, /Marquee|svelte\/transition|in:fly/);
});

test('Newsroom 卡片使用平面表面、明确焦点和可关闭的图片缩放', () => {
	const components = read('src/lib/styles/components.css');
	const featured = read('src/lib/components/blog/card/FeaturedPostCard.svelte');
	const cardCss = components.slice(
		components.indexOf('.newsroom-card {'),
		components.indexOf('.amap-hide-ui')
	);

	assert.match(cardCss, /background: var\(--newsroom-card\)/);
	assert.match(cardCss, /\.newsroom-card:focus-visible/);
	assert.match(cardCss, /outline: 2px solid var\(--newsroom-link\)/);
	assert.match(cardCss, /prefers-reduced-motion: reduce/);
	assert.match(cardCss, /transform: scale\(1\.02\)/);
	assert.doesNotMatch(cardCss, /box-shadow|translateY/);
	assert.match(featured, /loading="eager"/);
	assert.match(featured, /fetchpriority="high"/);
});

test('文章头部、封面和 Markdown 共用 Newsroom 阅读尺寸', () => {
	const header = read('src/lib/components/blog/viewer/Header.svelte');
	const viewer = read('src/lib/components/blog/viewer/Viewer.svelte');
	const reader = read('src/lib/styles/reader.css');

	assert.match(header, /max-w-\[653px\]/);
	assert.match(header, /max-w-\[980px\]/);
	assert.match(header, /loading="eager"/);
	assert.match(header, /fetchpriority="high"/);
	assert.match(header, /role="status"/);
	assert.match(header, /aria-live="polite"/);
	assert.doesNotMatch(header, /fromNow|relativeDate|relativeLastmod/);
	assert.match(viewer, /font-newsroom/);
	assert.match(reader, /max-width: 653px/);
	assert.match(reader, /font-size: 17px/);
	assert.match(reader, /line-height: 25px/);
	assert.match(reader, /color: var\(--newsroom-link\)/);
	assert.match(reader, /\.markdown-body blockquote\s*\{[^}]*font-style: normal/s);
	assert.match(reader, /\.markdown-body \.code-wrapper\s*\{[^}]*box-shadow: none/s);
});

test('博客列表与文章使用独立的锁定语义背景', () => {
	const config = read('src/lib/config/index.ts');
	const background = read('src/lib/components/layout/background/BackgroundLayer.svelte');
	const theme = read('src/lib/styles/theme.css');

	assert.match(config, /blogKind === 'blog-article'.*mode: 'solid'.*switchable: false/);
	assert.match(config, /if \(blogKind\) return \{ mode: 'newsroom', switchable: false \}/);
	assert.match(background, /mode === 'solid' \|\| mode === 'newsroom' \|\| mode === 'flowing'/);
	assert.match(background, /mode === 'newsroom'/);
	assert.match(background, /bg-\(--newsroom-background\)/);
	assert.match(theme, /--newsroom-background: #f5f5f7/);
	assert.match(theme, /--newsroom-background: #000000/);
	assert.match(theme, /--font-newsroom:/);
});

test('Newsroom 中英文排版仅使用 MiSans 字体族', () => {
	const theme = read('src/lib/styles/theme.css');
	const reader = read('src/lib/styles/reader.css');
	const fontStack = theme.match(/--font-newsroom:\s*([^;]+);/)?.[1] ?? '';

	assert.match(fontStack, /'MiSans VF'/);
	assert.match(fontStack, /'Misans TC VF'/);
	assert.match(fontStack, /'MiSans L3'/);
	assert.doesNotMatch(
		fontStack,
		/apple|SF Pro|PingFang|Hiragino|Noto|system-ui|BlinkMacSystemFont/i
	);
	assert.match(reader, /font-family: var\(--font-newsroom\)/);
});

test('搜索、标签和目录延续 Newsroom 配套层级', () => {
	const search = read('src/lib/components/blog/search/Search.svelte');
	const tag = read('src/lib/components/blog/common/TagBadge.svelte');
	const toc = read('src/lib/components/blog/viewer/TableOfContents.svelte');
	const empty = read('src/lib/components/blog/home/EmptyState.svelte');

	assert.doesNotMatch(search, /LiquidGlass/);
	assert.doesNotMatch(empty, /LiquidGlass/);
	assert.match(search, /aria-label=\{\$t\('blog\.search\.placeholder'\)\}/);
	assert.match(search, /border-\(--newsroom-border\)/);
	assert.match(tag, /focus-visible:outline-\(--newsroom-link\)/);
	assert.match(toc, /const depthClasses = \['pl-3', 'pl-6', 'pl-9', 'pl-12', 'pl-14', 'pl-16'\]/);
});
