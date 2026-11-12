import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
	loadContentConfig,
	loadSiteConfig,
	resolveContentPaths
} from '../src/lib/config/server.ts';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('示例配置可用于开发和 CI，但不能作为生产配置发布', () => {
	const example = path.join(projectRoot, 'config/site.example.yaml');
	assert.doesNotThrow(() => loadSiteConfig(example, false));
	assert.throws(() => loadSiteConfig(example, true), /生产配置中不能使用示例或占位值/);
});

test('配置拒绝重复字段、未知字段和秘密字段', (t) => {
	const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fuyao-config-test-'));
	t.after(() => fs.rmSync(tempRoot, { recursive: true, force: true }));
	const duplicate = path.join(tempRoot, 'duplicate.yaml');
	fs.writeFileSync(duplicate, 'schemaVersion: 1\nschemaVersion: 1\n');
	assert.throws(() => loadSiteConfig(duplicate), /duplicated mapping key/i);

	const source = fs.readFileSync(path.join(projectRoot, 'config/site.example.yaml'), 'utf8');
	const forbidden = path.join(tempRoot, 'forbidden.yaml');
	fs.writeFileSync(forbidden, `${source}\npassword: should-never-be-public\n`);
	assert.throws(() => loadSiteConfig(forbidden), /禁止出现在公开配置|未知字段/);
});

test('内容 realpath 不能通过符号链接越过持久化根目录', (t) => {
	const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fuyao-content-test-'));
	const contentRoot = path.join(tempRoot, 'content');
	const outsideRoot = path.join(tempRoot, 'outside');
	fs.mkdirSync(contentRoot);
	fs.mkdirSync(outsideRoot);
	for (const relative of [
		'posts',
		'data',
		'albums/photos',
		'albums/thumbnails',
		'albums/metadata'
	]) {
		fs.mkdirSync(path.join(contentRoot, relative), { recursive: true });
	}
	fs.rmSync(path.join(contentRoot, 'posts'), { recursive: true });
	fs.symlinkSync(outsideRoot, path.join(contentRoot, 'posts'));
	t.after(() => fs.rmSync(tempRoot, { recursive: true, force: true }));

	const config = loadContentConfig(path.join(projectRoot, 'config/content.example.yaml'));
	assert.throws(() => resolveContentPaths(config, contentRoot), /越过允许的内容根目录/);
});

test('客户端源码不直接读取 import.meta.env', () => {
	/** @type {string[]} */
	const files = [];
	/** @param {string} directory */
	const visit = (directory) => {
		for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
			const fullPath = path.join(directory, entry.name);
			if (entry.isDirectory()) visit(fullPath);
			else if (/\.(?:svelte|ts|js)$/.test(entry.name)) files.push(fullPath);
		}
	};
	visit(path.join(projectRoot, 'src'));
	for (const file of files) assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /import\.meta\.env/);
});
