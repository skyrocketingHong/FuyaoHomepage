import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** @param {string} relativePath */
function read(relativePath) {
	return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
}

/**
 * @param {RegExpMatchArray | null} match
 * @param {string[]} expectedClasses
 */
function assertHasClasses(match, expectedClasses) {
	assert(match, '未找到目标元素');
	const classes = new Set(match[1].split(/\s+/));
	for (const className of expectedClasses) assert(classes.has(className), `缺少 ${className}`);
}

test('首页社交卡片统一保持固定左侧图标和可换行的右对齐名称', () => {
	const socialLinks = read('src/lib/components/home/content/SocialLinks.svelte');

	assert.match(socialLinks, /<div class="flex h-full items-center gap-2">/);
	assert.doesNotMatch(socialLinks, /items-center justify-between/);
	assertHasClasses(
		socialLinks.match(/<span class="([^"]*)" aria-hidden="true">\s*<link\.icon size=\{16\} \/>/),
		['flex', 'size-4', 'shrink-0', 'items-center', 'justify-center']
	);
	assertHasClasses(
		socialLinks.match(/<span class="([^"]*)">\s*<span class="[^"]*">\{link\.name\}<\/span>/),
		['ml-auto', 'flex', 'min-w-0', 'flex-1', 'justify-end', 'text-right', 'leading-tight']
	);
	assertHasClasses(socialLinks.match(/<span class="([^"]*)">\{link\.name\}<\/span>/), [
		'min-w-0',
		'max-w-full',
		'break-words'
	]);
});
