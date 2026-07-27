import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { ownsHeaderSlot } from '../src/lib/utils/state/headerOwnership.ts';
import { resolveBlogRoute } from '../src/lib/utils/domain/blogRoute.ts';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** @param {string} relativePath */
function read(relativePath) {
	return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
}

test('Header 插槽仅允许当前非空注册 ID 清理', () => {
	assert.equal(ownsHeaderSlot('', 'blog-nav'), false);
	assert.equal(ownsHeaderSlot('album-nav', 'blog-nav'), false);
	assert.equal(ownsHeaderSlot('blog-nav', 'blog-nav'), true);

	const appStore = read('src/lib/stores/app.svelte.ts');
	assert.match(appStore, /clear\(id: string\)/);
	assert.match(appStore, /if \(!ownsHeaderSlot\(id, this\.currentId\)\) return false/);
	assert.match(appStore, /clearAll\(\)/);
	assert.doesNotMatch(appStore, /clear\(id\?: string\)/);
});

test('Header 页面清理不再以空 ID 充当强制清理', () => {
	const albumPage = read('src/routes/albums/[...path]/+page.svelte');
	const footprintPage = read('src/routes/footprint/+page.svelte');
	const friendsPage = read('src/routes/friends/+page.svelte');
	const header = read('src/lib/components/layout/header/Header.svelte');
	const sources = [
		albumPage,
		footprintPage,
		friendsPage,
		read('src/lib/hooks/useBlogState.svelte.ts')
	];

	assert.match(albumPage, /if \(headerNavId\) headerState\.clearMiddle\(headerNavId\)/);
	assert.match(footprintPage, /if \(headerActionId\) headerState\.clearRight\(headerActionId\)/);
	assert.match(friendsPage, /if \(headerId\) headerState\.clearMiddle\(headerId\)/);
	assert.match(header, /\{#if headerState\.middle\.component\}[\s\S]*<MiddleComponent/);
	assert.doesNotMatch(header, /\{:else\}\s*<div class="w-full"><\/div>/);
	for (const source of sources) {
		assert.doesNotMatch(source, /clear(?:Middle|Left|Right)\(\s*(?:''|undefined)?\s*\)/);
	}
});

test('统一博客路由正确区分任意深度分类、标签和文章', () => {
	const categories = [
		{ slug: 'engineering' },
		{ slug: 'engineering/platform/runtime' },
		{ slug: 'release-notes' }
	];
	const posts = [
		{ slug: 'edge-cache', categories: ['engineering/platform/runtime'] },
		{ slug: 'brief', categories: [] },
		{ slug: 'release-notes', categories: ['engineering'] }
	];

	assert.deepEqual(resolveBlogRoute('engineering/platform/runtime', posts, categories), {
		blogPageKind: 'blog-category',
		category: 'engineering/platform/runtime'
	});
	assert.deepEqual(
		resolveBlogRoute('engineering/platform/runtime/tag/Svelte%205', posts, categories),
		{
			blogPageKind: 'blog-tag',
			category: 'engineering/platform/runtime',
			tag: 'Svelte 5'
		}
	);
	assert.equal(
		resolveBlogRoute('engineering/platform/runtime/edge-cache', posts, categories).blogPageKind,
		'blog-article'
	);
	assert.equal(resolveBlogRoute('brief', posts, categories).blogPageKind, 'blog-article');
	assert.equal(resolveBlogRoute('release-notes', posts, categories).blogPageKind, 'blog-category');
	assert.equal(resolveBlogRoute('missing', posts, categories).blogPageKind, null);
});

test('博客页面类型由 load 数据驱动根布局背景策略', () => {
	const catchAllLoad = read('src/routes/blog/(main)/[...path]/+page.ts');
	const rootLoad = read('src/routes/blog/(main)/+page.ts');
	const searchLoad = read('src/routes/blog/(main)/search/+page.ts');
	const config = read('src/lib/config/index.ts');
	const rootLayout = read('src/routes/+layout.svelte');
	const headerActions = read('src/lib/components/layout/header/Actions.svelte');
	const solidBackground = read('src/lib/components/ui/background/SolidBackground.svelte');

	for (const kind of ['blog-category', 'blog-tag', 'blog-article']) {
		assert.match(catchAllLoad, new RegExp(`blogPageKind: '${kind}'`));
	}
	assert.match(rootLoad, /blogPageKind: 'blog-list'/);
	assert.match(searchLoad, /blogPageKind: 'blog-search'/);
	assert.match(config, /if \(pageData\?\.blogPageKind\) return pageData\.blogPageKind/);
	assert.match(config, /blogKind === 'blog-article'.*mode: 'solid'.*switchable: false/);
	assert.doesNotMatch(config, /\[category\]\/\[slug\]/);
	assert.match(
		rootLayout,
		/getBackgroundPolicy\(page\.url\.pathname, page\.data, page\.route\.id\)/s
	);
	assert.match(
		headerActions,
		/\{#if backgroundSwitchable\}[\s\S]*<BackgroundSwitcher \/>[\s\S]*\{\/if\}/
	);
	assert.match(solidBackground, /bg-\(--reader-background\)/);
});
