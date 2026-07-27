import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

import { getPrerenderEntries, handlePrerenderHttpError } from '../svelte.config.js';
import { formatBuildIdentifier, formatVersionDisplay } from '../scripts/update-version.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildContext = JSON.parse(
	fs.readFileSync(path.join(projectRoot, '.fuyao/build-context.json'), 'utf8')
);
const preparedAssets = buildContext.assetsDir;

test('预渲染清单覆盖全部博客分类、文章和标签页面', () => {
	const posts = JSON.parse(fs.readFileSync(path.join(preparedAssets, 'posts/all.json'), 'utf8'));
	const entries = new Set(getPrerenderEntries());

	assert(entries.has('*'));
	assert(entries.has('/blog/'));
	assert(entries.has('/blog/search/'));

	for (const post of posts) {
		const categories = post.categories?.length ? post.categories : ['Uncategorized'];
		for (const category of categories) {
			assert(entries.has(`/blog/${category}/`));
			assert(entries.has(`/blog/${category}/${post.slug}/`));
			for (const tag of post.tags ?? []) {
				assert(entries.has(`/blog/${category}/tag/${encodeURIComponent(tag)}/`));
			}
		}
	}
});

test('预渲染只忽略由 Caddy 提供的持久化资源', () => {
	for (const requestPath of [
		'/wp-content/uploads/example.png',
		'/media/albums/photos/example.jpg',
		'/images/background.jpg'
	]) {
		assert.doesNotThrow(() =>
			handlePrerenderHttpError({
				status: 404,
				path: requestPath,
				referrer: '/blog/',
				referenceType: 'linked',
				message: `404 ${requestPath}`
			})
		);
	}

	assert.throws(
		() =>
			handlePrerenderHttpError({
				status: 404,
				path: '/missing.js',
				referrer: '/',
				referenceType: 'linked',
				message: '404 /missing.js'
			}),
		/404 \/missing\.js/
	);
});

test('开发和构建命令不修改版本文件，相册默认命令不重命名照片', () => {
	const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
	const versionManifest = JSON.parse(
		fs.readFileSync(path.join(projectRoot, 'version.json'), 'utf8')
	);
	const packageLock = JSON.parse(
		fs.readFileSync(path.join(projectRoot, 'package-lock.json'), 'utf8')
	);

	assert.doesNotMatch(packageJson.scripts.dev, /update-build-num|bump-build/);
	assert.doesNotMatch(packageJson.scripts.build, /update-build-num|bump-build/);
	assert.match(packageJson.scripts['gen-album'], /--no-rename/);
	assert.equal(packageJson.version, versionManifest.version);
	assert.equal(packageLock.version, versionManifest.version);
	assert.equal(packageLock.packages[''].version, versionManifest.version);
	assert(Number.isSafeInteger(versionManifest.build));
	assert(versionManifest.build > 0);
	assert.match(versionManifest.buildTrain, /^[1-9]\d*[A-Z]+$/);
});

test('营销版本与 Build Train 独立显示', () => {
	assert.equal(formatBuildIdentifier('4A', 83), '4A083');
	assert.equal(formatVersionDisplay('27.0.0', '4A', 83), '27.0 (4A083)');
	assert.equal(formatVersionDisplay('27.0.1', '4A', 84), '27.0.1 (4A084)');
});

test('RSS 与 Sitemap 使用单一静态产物并保持可发布', () => {
	const rssPath = path.join(preparedAssets, 'blog/rss.xml');
	const sitemapPath = path.join(preparedAssets, 'sitemap.xml');

	assert(fs.existsSync(rssPath));
	assert.match(fs.readFileSync(rssPath, 'utf8'), /<rss\b[\s\S]*<channel>/);
	assert(fs.existsSync(sitemapPath));
	assert.match(fs.readFileSync(sitemapPath, 'utf8'), /<urlset\b/);
	assert(!fs.existsSync(path.join(projectRoot, 'src/routes/blog/rss.xml/+server.ts')));
	assert(!fs.existsSync(path.join(projectRoot, 'src/routes/sitemap.xml/+server.ts')));
});

test('相册生成器输出响应式缩略图，并可移除公开索引中的位置字段', async (t) => {
	const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fuyao-album-test-'));
	t.after(() => fs.rmSync(tempRoot, { recursive: true, force: true }));

	const albumsRoot = path.join(tempRoot, 'content/albums');
	const photoDir = path.join(albumsRoot, 'photos/2026/07/21');
	const thumbnailsDir = path.join(albumsRoot, 'thumbnails');
	const metadataDir = path.join(albumsRoot, 'metadata');
	fs.mkdirSync(photoDir, { recursive: true });
	await sharp({
		create: { width: 800, height: 600, channels: 3, background: '#336699' }
	})
		.jpeg()
		.toFile(path.join(photoDir, 'fixture.jpg'));

	execFileSync(
		process.execPath,
		[path.join(projectRoot, 'scripts/generate-album-index.js'), '--no-rename', '--strip-gps'],
		{
			cwd: tempRoot,
			stdio: 'pipe',
			env: {
				...process.env,
				FUYAO_ALBUM_PHOTOS_DIR: path.join(albumsRoot, 'photos'),
				FUYAO_ALBUM_THUMBNAILS_DIR: thumbnailsDir,
				FUYAO_ALBUM_METADATA_DIR: metadataDir
			}
		}
	);

	const index = JSON.parse(fs.readFileSync(path.join(metadataDir, 'index.json'), 'utf8'));
	assert.equal(index.totalPhotos, 1);

	const yearData = JSON.parse(
		fs.readFileSync(path.join(metadataDir, `${index.years[0]}.json`), 'utf8')
	);
	const [photo] = yearData.photos;
	assert.equal(photo.gps, undefined);
	assert.equal(photo.altitude, undefined);
	assert.equal(photo.gpsDirection, undefined);
	assert(photo.variants.length > 0);

	for (const variant of photo.variants) {
		assert(fs.existsSync(path.join(thumbnailsDir, variant.path)));
		assert.equal(variant.type, 'image/webp');
	}
});
