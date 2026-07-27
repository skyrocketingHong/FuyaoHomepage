import adapter from '@sveltejs/adapter-static';
import fs from 'node:fs';
import path from 'node:path';

const contextPath = new URL('./.fuyao/build-context.json', import.meta.url);

function getAssetsDirectory() {
	if (!fs.existsSync(contextPath)) return path.resolve('static');
	const context = JSON.parse(fs.readFileSync(contextPath, 'utf8'));
	return context.assetsDir;
}

export function getPrerenderEntries() {
	/** @type {Set<'*' | `/${string}`>} */
	const entries = new Set(['*', '/blog/', '/blog/search/']);
	const postsPath = path.join(getAssetsDirectory(), 'posts', 'all.json');

	if (!fs.existsSync(postsPath)) return [...entries];

	const posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
	for (const post of posts) {
		const categories = post.categories?.length ? post.categories : ['Uncategorized'];
		for (const category of categories) {
			entries.add(`/blog/${category}/`);
			entries.add(`/blog/${category}/${post.slug}/`);
			for (const tag of post.tags ?? []) {
				entries.add(`/blog/${category}/tag/${encodeURIComponent(tag)}/`);
			}
		}
	}

	return [...entries];
}

const externalAssetPrefixes = ['/wp-content/', '/media/albums/', '/images/'];

/**
 * 忽略由 Caddy 从持久化内容目录提供的资源，其他预渲染错误仍然中止构建。
 *
 * @param {{ status: number; path: string; referrer: string | null; referenceType: 'linked' | 'fetched'; message: string }} details
 */
export function handlePrerenderHttpError({ path: requestPath, message }) {
	if (externalAssetPrefixes.some((prefix) => requestPath.startsWith(prefix))) return;
	throw new Error(message);
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		files: {
			assets: getAssetsDirectory()
		},
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '200.html'
		}),
		prerender: {
			entries: getPrerenderEntries(),
			handleUnseenRoutes: 'fail',
			handleHttpError: handlePrerenderHttpError
		}
	}
};

export default config;
