import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
	assertPublicTreePermissions,
	normalizePublicTreePermissions
} from '../scripts/lib/public-permissions.js';

test('公开产物不继承私有内容源的限制权限', (t) => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fuyao-public-permissions-'));
	t.after(() => fs.rmSync(root, { recursive: true, force: true }));
	const dataRoot = path.join(root, 'data');
	const dataFile = path.join(dataRoot, 'friends.yaml');

	fs.mkdirSync(dataRoot, { mode: 0o700 });
	fs.writeFileSync(dataFile, 'online: []\n', { mode: 0o600 });
	assert.throws(() => assertPublicTreePermissions(root, '测试产物'), /文件不可由 Web 服务器读取/);

	normalizePublicTreePermissions(root);
	assert.doesNotThrow(() => assertPublicTreePermissions(root, '测试产物'));
	assert.equal(fs.statSync(root).mode & 0o777, 0o755);
	assert.equal(fs.statSync(dataRoot).mode & 0o777, 0o755);
	assert.equal(fs.statSync(dataFile).mode & 0o777, 0o644);
});
