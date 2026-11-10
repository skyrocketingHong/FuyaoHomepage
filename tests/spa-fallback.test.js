import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { prepareSpaFallback } from '../scripts/prepare-spa-fallback.js';

test('SPA fallback 复用可由 hooks.client 直接水合的 GlobalLoader SSR 输出', (t) => {
	const buildRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fuyao-spa-fallback-'));
	t.after(() => fs.rmSync(buildRoot, { recursive: true, force: true }));
	fs.mkdirSync(path.join(buildRoot, 'friends'), { recursive: true });
	fs.writeFileSync(
		path.join(buildRoot, 'friends/index.html'),
		'<html><body><template id="fuyao-global-loader-start"></template><div class="compiled-global-loader">compiled</div><template id="fuyao-global-loader-end"></template></body></html>'
	);
	fs.writeFileSync(
		path.join(buildRoot, '200.html'),
		'<html><body><div id="sveltekit-body" style="display: contents"><script>start()</script></div></body></html>'
	);

	prepareSpaFallback(buildRoot);
	const fallback = fs.readFileSync(path.join(buildRoot, '200.html'), 'utf8');
	assert.match(fallback, /id="fuyao-prerendered-loader"/);
	assert.match(fallback, /class="compiled-global-loader"/);
	assert.match(fallback, /fuyao-prerendered-loader[\s\S]*sveltekit-body/);
	assert.match(fallback, /fuyao-prerendered-loader[^>]*><!--\[-->/);
	assert.match(fallback, /fuyao-global-loader-end[\s\S]*<!--\]-->/);
	assert.equal((fallback.match(/compiled-global-loader/g) ?? []).length, 1);
});
