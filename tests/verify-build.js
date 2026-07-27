import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildRoot = path.join(projectRoot, 'build');
const buildContext = JSON.parse(
	fs.readFileSync(path.join(projectRoot, '.fuyao/build-context.json'), 'utf8')
);
const posts = JSON.parse(
	fs.readFileSync(path.join(buildContext.assetsDir, 'posts/all.json'), 'utf8')
);
const firstPost = posts[0];
const category = firstPost.categories?.[0] ?? 'Uncategorized';
const articlePath = path.join(buildRoot, 'blog', category, firstPost.slug, 'index.html');

assert(fs.existsSync(path.join(buildRoot, 'blog/rss.xml')), '构建产物缺少 RSS');
assert(fs.existsSync(path.join(buildRoot, 'sitemap.xml')), '构建产物缺少 Sitemap');
assert(fs.existsSync(articlePath), `构建产物缺少文章页面：${category}/${firstPost.slug}`);

const articleHtml = fs.readFileSync(articlePath, 'utf8');
const blogListHtml = fs.readFileSync(path.join(buildRoot, 'blog', 'index.html'), 'utf8');
assert.match(articleHtml, /<title>[^<]+<\/title>/, '文章页面缺少服务端渲染标题');
assert.match(articleHtml, /<div class="markdown-body"/, '文章页面缺少服务端渲染正文');
assert.match(articleHtml, /reader-background/, '文章首屏未使用纯色阅读背景');
assert.doesNotMatch(articleHtml, /title="背景模式 \(/, '文章首屏不应渲染背景切换胶囊');
assert.match(blogListHtml, /title="背景模式 \(/, '博客列表页应保留背景切换胶囊');

console.log('构建产物验证通过：博客正文、阅读背景及列表页背景切换器状态正确。');
