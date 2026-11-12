import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { syncDerivedVersions } from '../scripts/update-version.js';

/**
 * 构造最小 site 目录（package.json、theme.json、根锁文件）供版本同步测试。
 *
 * @param {string} root
 * @param {{ withThemeManifest?: boolean, lockVersion?: string }} [options]
 * @returns {string} site 根目录
 */
function scaffold(root, { withThemeManifest = true, lockVersion = '27.0.0' } = {}) {
	fs.mkdirSync(path.join(root, 'site'), { recursive: true });
	fs.writeFileSync(
		path.join(root, 'site', 'package.json'),
		`${JSON.stringify({ name: 'fuyao-homepage', version: '27.0.0' }, null, '\t')}\n`
	);
	if (withThemeManifest) {
		fs.writeFileSync(
			path.join(root, 'site', 'theme.json'),
			`${JSON.stringify(
				{ contract: 'fuyao.theme.manifest/v1', id: 'fuyao-homepage', version: '27.0.0' },
				null,
				'\t'
			)}\n`
		);
	}
	fs.writeFileSync(
		path.join(root, 'package-lock.json'),
		`${JSON.stringify(
			{ name: 'fuyao-homepage-workspace', packages: { '': {}, site: { version: lockVersion } } },
			null,
			'\t'
		)}\n`
	);
	return path.join(root, 'site');
}

test('版本命令同步 package.json、theme.json 与根锁文件', () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fuyao-version-sync-'));
	try {
		const siteRoot = scaffold(root);
		syncDerivedVersions(siteRoot, '27.2.0');

		const packageJson = JSON.parse(fs.readFileSync(path.join(siteRoot, 'package.json'), 'utf8'));
		assert.equal(packageJson.version, '27.2.0');
		assert.equal(packageJson.name, 'fuyao-homepage');

		const themeManifest = JSON.parse(fs.readFileSync(path.join(siteRoot, 'theme.json'), 'utf8'));
		assert.equal(themeManifest.version, '27.2.0');
		assert.equal(themeManifest.id, 'fuyao-homepage');
		assert.equal(themeManifest.contract, 'fuyao.theme.manifest/v1');

		const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
		assert.equal(lock.packages.site.version, '27.2.0');
	} finally {
		fs.rmSync(root, { recursive: true, force: true });
	}
});

test('缺少 theme.json 时版本同步仅更新 package 与锁文件', () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fuyao-version-sync-notheme-'));
	try {
		const siteRoot = scaffold(root, { withThemeManifest: false });
		assert.doesNotThrow(() => syncDerivedVersions(siteRoot, '27.2.0'));
		assert.equal(
			JSON.parse(fs.readFileSync(path.join(siteRoot, 'package.json'), 'utf8')).version,
			'27.2.0'
		);
	} finally {
		fs.rmSync(root, { recursive: true, force: true });
	}
});
