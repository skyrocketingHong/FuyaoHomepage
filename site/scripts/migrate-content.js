#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apply = process.argv.includes('--apply');
const legacyRoot = path.resolve(process.env.FUYAO_LEGACY_ROOT || projectRoot);
const targetRootValue = process.env.FUYAO_CONTENT_ROOT;
const manifestPathValue = process.env.FUYAO_MIGRATION_MANIFEST;
const requestedTypes = new Set(
	(process.env.FUYAO_MIGRATION_TYPES || 'posts,footprints,friends,payments,social-links,albums')
		.split(',')
		.map((value) => value.trim())
		.filter(Boolean)
);
const supportedTypes = new Set([
	'posts',
	'footprints',
	'friends',
	'payments',
	'social-links',
	'albums'
]);

for (const type of requestedTypes) {
	if (!supportedTypes.has(type)) {
		throw new Error(`未知迁移类型：${type}；可用值：${Array.from(supportedTypes).join(', ')}`);
	}
}

if (apply && (!targetRootValue || !manifestPathValue)) {
	throw new Error('--apply 必须同时提供 FUYAO_CONTENT_ROOT 和 FUYAO_MIGRATION_MANIFEST');
}

const generatedBlogFiles = new Set([
	'all.json',
	'categories.json',
	'search.json',
	'map.json',
	'rss.xml'
]);
const mappings = [
	{
		type: 'posts',
		source: 'static/posts',
		target: 'posts',
		filter: (relativeFile) => !generatedBlogFiles.has(relativeFile)
	},
	{
		type: 'footprints',
		source: 'static/data',
		target: 'data',
		filter: (relativeFile) => relativeFile === 'footprints.yaml'
	},
	{
		type: 'friends',
		source: 'static/data',
		target: 'data',
		filter: (relativeFile) => relativeFile === 'friends.yaml'
	},
	{
		type: 'payments',
		source: 'static/data',
		target: 'data',
		filter: (relativeFile) => relativeFile === 'payments.yaml'
	},
	{
		type: 'social-links',
		source: 'static/data',
		target: 'data',
		filter: (relativeFile) => relativeFile === 'social-links.yaml'
	},
	{ type: 'albums', source: 'static/albums/photos', target: 'albums/photos' },
	{ type: 'albums', source: 'static/albums/thumbnails', target: 'albums/thumbnails' },
	{
		type: 'albums',
		source: 'static/albums',
		target: 'albums/metadata',
		filter: (relativeFile) => /^(?:index|\d{4})\.json$/.test(relativeFile)
	}
];

function listFiles(root, filter, base = root) {
	if (!fs.existsSync(root)) return [];
	const files = [];
	for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
		const source = path.join(root, entry.name);
		if (entry.isSymbolicLink()) throw new Error(`迁移源禁止符号链接：${source}`);
		if (entry.isDirectory()) files.push(...listFiles(source, filter, base));
		else if (entry.isFile()) {
			const relativeFile = path.relative(base, source);
			if (!filter || filter(relativeFile)) files.push(source);
		}
	}
	return files;
}

function sha256(file) {
	return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

const records = [];
for (const mapping of mappings) {
	if (!requestedTypes.has(mapping.type)) continue;
	const sourceRoot = path.join(legacyRoot, mapping.source);
	for (const sourceFile of listFiles(sourceRoot, mapping.filter)) {
		const relativeFile = path.relative(sourceRoot, sourceFile);
		const targetFile = targetRootValue
			? path.join(path.resolve(targetRootValue), mapping.target, relativeFile)
			: path.join('<FUYAO_CONTENT_ROOT>', mapping.target, relativeFile);
		const record = {
			type: mapping.type,
			source: path.relative(legacyRoot, sourceFile),
			target: targetRootValue
				? path.relative(path.resolve(targetRootValue), targetFile)
				: targetFile,
			size: fs.statSync(sourceFile).size,
			sha256: sha256(sourceFile)
		};
		records.push(record);
		if (apply) {
			fs.mkdirSync(path.dirname(targetFile), { recursive: true });
			if (fs.existsSync(targetFile)) {
				if (sha256(targetFile) !== record.sha256)
					throw new Error(`目标已存在且内容不同：${targetFile}`);
			} else {
				fs.copyFileSync(sourceFile, targetFile, fs.constants.COPYFILE_EXCL);
			}
			if (sha256(targetFile) !== record.sha256) throw new Error(`复制后校验失败：${targetFile}`);
		}
	}
}

if (records.length === 0) {
	throw new Error(`未在 3.0.0 源目录中发现所选内容：${legacyRoot}；请设置正确的 FUYAO_LEGACY_ROOT`);
}

const manifest = {
	schemaVersion: 1,
	createdAt: new Date().toISOString(),
	mode: apply ? 'applied' : 'dry-run',
	migrationTypes: Array.from(requestedTypes).sort(),
	fileCount: records.length,
	totalBytes: records.reduce((sum, item) => sum + item.size, 0),
	files: records
};

if (apply) {
	const manifestPath = path.resolve(manifestPathValue);
	if (fs.existsSync(manifestPath)) throw new Error(`迁移清单已存在，拒绝覆盖：${manifestPath}`);
	fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
	fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, {
		mode: 0o600,
		flag: 'wx'
	});
}

console.log(
	`迁移${apply ? '完成' : '预检完成'}：${manifest.fileCount} 个文件，${manifest.totalBytes} 字节`
);
if (!apply) console.log('未写入任何文件；确认外部持久化目录后使用 --apply。');
