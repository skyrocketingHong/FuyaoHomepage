import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { normalizePublicTreePermissions } from '../scripts/lib/public-permissions.js';

/** @param {string} source @param {string} destination */
function copyTree(source, destination) {
	fs.cpSync(source, destination, { recursive: true });
}

/** @param {string} configRoot */
function writeProductionConfig(configRoot) {
	fs.mkdirSync(configRoot, { recursive: true });
	const site = fs
		.readFileSync('config/site.example.yaml', 'utf8')
		.replaceAll('演示版本', '生产站点')
		.replace('https://example.com', 'https://fuyao.test')
		.replace('example_twitter', 'fuyao_twitter')
		.replace('your_amap_key_here', 'amap-key-value')
		.replace('your_amap_security_code_here', 'amap-security-value');
	fs.writeFileSync(path.join(configRoot, 'site.yaml'), site);
	fs.copyFileSync('config/content.example.yaml', path.join(configRoot, 'content.yaml'));
}

test('content-only 发布复用应用产物并原子替换全部公开内容', (t) => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fuyao-content-deploy-'));
	t.after(() => fs.rmSync(root, { recursive: true, force: true }));
	const sharedRoot = path.join(root, 'shared');
	const configRoot = path.join(sharedRoot, 'config');
	const contentRoot = path.join(sharedRoot, 'content');
	const faviconRoot = path.join(sharedRoot, 'legacy/root-assets/favicon');
	const releaseRoot = path.join(root, 'releases');
	const baseRelease = path.join(releaseRoot, 'base-release');
	const currentLink = path.join(root, 'current');
	const pendingFile = path.join(contentRoot, 'state/pending-deploy.json');

	writeProductionConfig(configRoot);
	copyTree('fixtures/content', contentRoot);
	copyTree('static/favicon', faviconRoot);
	fs.mkdirSync(path.join(contentRoot, 'state'), { recursive: true });
	fs.writeFileSync(
		pendingFile,
		`${JSON.stringify({ schemaVersion: 1, reasons: ['albums', 'data', 'posts'] }, null, 2)}\n`
	);
	fs.mkdirSync(path.join(baseRelease, '_app/immutable'), { recursive: true });
	fs.mkdirSync(path.join(baseRelease, 'blog/old-post'), { recursive: true });
	fs.writeFileSync(path.join(baseRelease, 'index.html'), '<!doctype html><title>base</title>');
	fs.writeFileSync(path.join(baseRelease, '200.html'), '<!doctype html><title>fallback</title>');
	fs.writeFileSync(path.join(baseRelease, '_app/immutable/app.js'), 'export {};\n');
	fs.writeFileSync(path.join(baseRelease, 'blog/old-post/index.html'), '<p>stale</p>');
	fs.writeFileSync(path.join(baseRelease, 'release.json'), '{"releaseId":"base-release"}\n');
	normalizePublicTreePermissions(baseRelease);
	fs.symlinkSync(baseRelease, currentLink);
	const lockGuard = path.join(root, 'guard-release-lock.mjs');
	fs.writeFileSync(
		lockGuard,
		`import fs from 'node:fs';
const originalRealpath = fs.realpathSync;
fs.realpathSync = function (target, ...args) {
  if (target === process.env.FUYAO_CURRENT_LINK && !fs.existsSync(process.env.FUYAO_DEPLOY_LOCK)) {
    throw new Error('Reading the current release requires holding the deployment lock');
  }
  return originalRealpath.call(this, target, ...args);
};\n`
	);

	const result = spawnSync(process.execPath, ['--import', lockGuard, 'scripts/deploy-content.js'], {
		cwd: process.cwd(),
		encoding: 'utf8',
		env: {
			...process.env,
			FUYAO_CONFIG_ROOT: configRoot,
			FUYAO_CONTENT_ROOT: contentRoot,
			FUYAO_FAVICON_ROOT: faviconRoot,
			FUYAO_SHARED_ROOT: sharedRoot,
			FUYAO_RELEASE_ROOT: releaseRoot,
			FUYAO_CURRENT_LINK: currentLink,
			FUYAO_DEPLOY_LOCK: path.join(root, 'deploy.lock'),
			FUYAO_CONTENT_PENDING_FILE: pendingFile,
			FUYAO_RELEASE_KEEP: '10',
			FUYAO_DEPLOY_REASON: 'albums,posts'
		}
	});
	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /内容发布成功/);

	const deployed = fs.realpathSync(currentLink);
	assert.notEqual(deployed, baseRelease);
	const release = JSON.parse(fs.readFileSync(path.join(deployed, 'release.json'), 'utf8'));
	assert.equal(release.mode, 'content-only');
	assert.equal(release.baseReleaseId, 'base-release');
	assert.deepEqual(release.reasons, ['albums', 'posts']);
	assert(fs.existsSync(path.join(deployed, 'posts/all.json')));
	assert(fs.existsSync(path.join(deployed, 'posts/search.json')));
	assert(fs.existsSync(path.join(deployed, 'data/friends.yaml')));
	assert(fs.existsSync(path.join(deployed, 'albums/index.json')));
	assert(fs.existsSync(path.join(deployed, 'favicon/favicon-32x32.png')));
	assert(fs.existsSync(path.join(deployed, 'blog/rss.xml')));
	assert(fs.existsSync(path.join(deployed, 'sitemap.xml')));
	assert(!fs.existsSync(path.join(deployed, 'blog/old-post/index.html')));
	assert.equal(
		fs.statSync(path.join(deployed, '_app/immutable/app.js')).ino,
		fs.statSync(path.join(baseRelease, '_app/immutable/app.js')).ino
	);
	assert.deepEqual(JSON.parse(fs.readFileSync(pendingFile, 'utf8')).reasons, ['data']);
});

test('Caddy 和 Service Worker 对可变静态内容使用回退与缓存绕过', () => {
	const caddy = fs.readFileSync('../deploy/caddy/FuyaoHomepage.caddy.example', 'utf8');
	const serviceWorker = fs.readFileSync('src/service-worker.ts', 'utf8');
	const layout = fs.readFileSync('src/routes/+layout.svelte', 'utf8');
	const clientHooks = fs.readFileSync('src/hooks.client.ts', 'utf8');
	const fallbackLoader = fs.readFileSync(
		'src/lib/components/layout/loader/spaFallbackLoader.ts',
		'utf8'
	);
	const appTemplate = fs.readFileSync('src/app.html', 'utf8');
	const fallbackPreparer = fs.readFileSync('scripts/prepare-spa-fallback.js', 'utf8');

	assert.match(caddy, /try_files \{path\}\/index\.html \{path\}index\.html \/200\.html/);
	assert.match(
		caddy,
		/try_files \{path\}\/index\.html \{path\}index\.html \{path\}\.html \/200\.html/
	);
	assert.doesNotMatch(caddy, /try_files \{path\} \{path\}\//);
	assert.match(caddy, /Cache-Control "no-store, max-age=0"/);
	assert.match(caddy, /Cloudflare-CDN-Cache-Control "no-store"/);
	for (const prefix of ['/posts/', '/data/', '/albums/', '/favicon/']) {
		assert(serviceWorker.includes(`url.pathname.startsWith('${prefix}')`));
	}
	for (const prefix of ['/images/', '/wp-content/', '/media/albums/']) {
		assert(serviceWorker.includes(`'${prefix}'`));
	}
	assert.match(layout, /\/release\.json\?check=/);
	assert.match(layout, /window\.location\.reload\(\)/);
	assert.match(serviceWorker, /__fuyao_mutable/);
	assert.match(serviceWorker, /self\.skipWaiting\(\)/);
	assert.match(serviceWorker, /self\.clients\.claim\(\)/);
	assert.doesNotMatch(appTemplate, /fuyao-bootstrap-loader|__FUYAO_SPA_FALLBACK__/);
	assert.match(clientHooks, /hydrateSpaFallbackLoader\(\)/);
	assert.match(fallbackLoader, /hydrate\(GlobalLoader/);
	assert.match(fallbackLoader, /\.finishLoading\(\)/);
	assert.match(fallbackLoader, /unmount\(activeLoader\)/);
	assert.doesNotMatch(layout, /prerenderedLoader\.remove/);
	assert.match(fallbackPreparer, /fuyao-global-loader-start/);
	assert.doesNotMatch(fallbackPreparer, /正在前往|Traving to/);
});
