#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import yaml from 'js-yaml';

import { assertPublicTreePermissions } from './lib/public-permissions.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const phase =
	process.argv.find((value) => value.startsWith('--phase='))?.split('=', 2)[1] ?? 'build';
const forbiddenPathPattern = /(?:\/srv\/fuyao\/|FUYAO_(?:CONFIG|CONTENT|RELEASE|SHARED)_ROOT)/;
const secretPatterns = [
	/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
	/\bgh[opusr]_[A-Za-z0-9_]{20,}\b/,
	/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
	/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/
];
const sensitiveNamePattern = /(?:TOKEN|PASSWORD|PASSWD|PRIVATE_KEY|WEBHOOK_SECRET|CLIENT_SECRET)/i;

function loadSensitiveValues() {
	const values = Object.entries(process.env)
		.filter(([name, value]) => sensitiveNamePattern.test(name) && typeof value === 'string')
		.map(([, value]) => value)
		.filter((value) => value.length >= 8);
	const secretFile = process.env.FUYAO_SECRETS_FILE;
	if (secretFile && fs.existsSync(secretFile)) {
		for (const line of fs.readFileSync(secretFile, 'utf8').split(/\r?\n/)) {
			const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
			if (!match || !sensitiveNamePattern.test(match[1])) continue;
			const value = match[2].trim().replace(/^(["'])(.*)\1$/, '$2');
			if (value.length >= 8) values.push(value);
		}
	}
	return [...new Set(values)];
}

const sensitiveValues = loadSensitiveValues();

function filesUnder(root) {
	const files = [];
	if (!fs.existsSync(root)) return files;
	for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
		const fullPath = path.join(root, entry.name);
		if (entry.isSymbolicLink()) throw new Error(`禁止符号链接：${fullPath}`);
		if (entry.isDirectory()) files.push(...filesUnder(fullPath));
		else if (entry.isFile()) files.push(fullPath);
	}
	return files;
}

function assertNoLeaks(root, label) {
	const issues = [];
	for (const file of filesUnder(root)) {
		const stat = fs.statSync(file);
		if (stat.size > 8 * 1024 * 1024) continue;
		const content = fs.readFileSync(file, 'utf8');
		if (forbiddenPathPattern.test(content))
			issues.push(`${label} 含服务端绝对路径：${path.relative(root, file)}`);
		for (const pattern of secretPatterns) {
			if (pattern.test(content)) issues.push(`${label} 命中秘密模式：${path.relative(root, file)}`);
		}
		if (sensitiveValues.some((value) => content.includes(value))) {
			issues.push(`${label} 包含服务端秘密值：${path.relative(root, file)}`);
		}
	}
	if (issues.length) throw new Error(issues.join('\n'));
}

function validateInputs(snapshotRoot) {
	const publicRoot = path.join(snapshotRoot, 'public');
	const postsRoot = path.join(publicRoot, 'posts');
	const dataRoot = path.join(publicRoot, 'data');
	const faviconRoot = path.join(publicRoot, 'favicon');
	const albumIndex = path.join(publicRoot, 'albums', 'index.json');
	const issues = [];

	for (const file of filesUnder(postsRoot).filter(
		(value) => value.endsWith('.md') && path.basename(value) !== '_index.md'
	)) {
		const parsed = matter(fs.readFileSync(file, 'utf8'));
		if (typeof parsed.data.title !== 'string' || !parsed.data.title.trim())
			issues.push(`${file} 缺少 title`);
		if (typeof parsed.data.slug !== 'string' || !/^[a-z0-9-]+$/.test(parsed.data.slug))
			issues.push(`${file} 的 slug 无效`);
		const date = parsed.data.date instanceof Date ? parsed.data.date : new Date(parsed.data.date);
		if (Number.isNaN(date.getTime())) issues.push(`${file} 的 date 无效`);
		const contentWithoutCode = parsed.content
			.replace(/```[\s\S]*?```/g, '')
			.replace(/~~~[\s\S]*?~~~/g, '');
		for (const match of contentWithoutCode.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
			const target = match[1].split(/[?#]/, 1)[0];
			if (!target || /^(?:[a-z][a-z0-9+.-]*:|#|\/)/i.test(target)) continue;
			if (!fs.existsSync(path.resolve(path.dirname(file), target)))
				issues.push(`${file} 引用了不存在的资源 ${target}`);
		}
	}

	for (const file of filesUnder(dataRoot).filter((value) => /\.ya?ml$/i.test(value))) {
		try {
			yaml.load(fs.readFileSync(file, 'utf8'), { json: false });
		} catch (error) {
			issues.push(`${file} YAML 无效：${error instanceof Error ? error.message : String(error)}`);
		}
	}
	if (!fs.existsSync(albumIndex)) issues.push('相册元数据缺少 index.json');
	else {
		const index = JSON.parse(fs.readFileSync(albumIndex, 'utf8'));
		if (index.schemaVersion !== 1) issues.push('相册 index.json 缺少兼容的 schemaVersion: 1');
	}
	for (const required of ['all.json', 'categories.json', 'search.json', 'manifest.json']) {
		if (!fs.existsSync(path.join(postsRoot, required))) issues.push(`博客索引缺少 ${required}`);
	}
	for (const required of [
		'apple-touch-icon.png',
		'favicon-32x32.png',
		'favicon-16x16.png',
		'site.webmanifest',
		'safari-pinned-tab.svg',
		'mstile-144x144.png'
	]) {
		if (!fs.existsSync(path.join(faviconRoot, required))) issues.push(`favicon 缺少 ${required}`);
	}
	if (issues.length) throw new Error(`构建输入校验失败：\n- ${issues.join('\n- ')}`);
	assertNoLeaks(publicRoot, '公开构建输入');
	assertPublicTreePermissions(publicRoot, '公开构建输入');
}

if (phase === 'inputs') {
	const snapshotRoot = process.env.FUYAO_BUILD_SNAPSHOT;
	if (!snapshotRoot) throw new Error('缺少 FUYAO_BUILD_SNAPSHOT');
	validateInputs(snapshotRoot);
} else {
	const buildRoot = process.env.FUYAO_BUILD_ROOT || path.join(projectRoot, 'build');
	if (!fs.existsSync(buildRoot)) throw new Error(`构建产物不存在：${buildRoot}`);
	assertNoLeaks(buildRoot, '最终构建产物');
	assertPublicTreePermissions(buildRoot, '最终构建产物');
	for (const required of ['index.html', 'sitemap.xml', path.join('blog', 'rss.xml')]) {
		if (!fs.existsSync(path.join(buildRoot, required))) throw new Error(`构建产物缺少 ${required}`);
	}
}

console.log(`${phase === 'inputs' ? '构建输入' : '构建产物'}校验通过`);
