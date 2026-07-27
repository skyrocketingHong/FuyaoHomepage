#!/usr/bin/env node
/**
 * 低内存生产内容准备器。
 *
 * 相册变更时更新缩略图和保留 GPS 的公开 EXIF 索引；文章变更只记录待发布状态。
 * 本脚本不执行 Vite 构建，最终 release 必须在本地构建后上传。
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const allowedReasons = new Set(['posts', 'albums']);

function required(name) {
	const value = process.env[name];
	if (!value) throw new Error(`缺少内容准备变量 ${name}`);
	return value;
}

function assertWithin(root, candidate, label) {
	const relative = path.relative(root, candidate);
	if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
		throw new Error(`${label} 越过内容根目录`);
	}
}

const contentRoot = fs.realpathSync(required('FUYAO_CONTENT_ROOT'));
const markerPath = path.resolve(required('FUYAO_CONTENT_PENDING_FILE'));
const markerDirectory = fs.realpathSync(path.dirname(markerPath));
const reasons = new Set(
	required('FUYAO_DEPLOY_REASON')
		.split(',')
		.map((value) => value.trim())
		.filter(Boolean)
);

assertWithin(contentRoot, markerDirectory, '待发布状态目录');
if ([...reasons].some((reason) => !allowedReasons.has(reason))) {
	throw new Error(`不支持的内容变更原因：${[...reasons].join(',')}`);
}

if (reasons.has('albums')) {
	execFileSync(process.execPath, [path.join(projectRoot, 'scripts/generate-album-index.js')], {
		cwd: projectRoot,
		stdio: 'inherit',
		env: {
			...process.env,
			FUYAO_ALBUM_PHOTOS_DIR: fs.realpathSync(required('FUYAO_ALBUM_PHOTOS_DIR')),
			FUYAO_ALBUM_THUMBNAILS_DIR: fs.realpathSync(required('FUYAO_ALBUM_THUMBNAILS_DIR')),
			FUYAO_ALBUM_METADATA_DIR: fs.realpathSync(required('FUYAO_ALBUM_METADATA_DIR'))
		}
	});
}

let existing = {};
if (fs.existsSync(markerPath)) {
	try {
		existing = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
	} catch {
		existing = {};
	}
}
const now = new Date().toISOString();
const mergedReasons = new Set(Array.isArray(existing.reasons) ? existing.reasons : []);
for (const reason of reasons) mergedReasons.add(reason);
const marker = {
	schemaVersion: 1,
	reasons: [...mergedReasons].filter((reason) => allowedReasons.has(reason)).sort(),
	detectedAt: typeof existing.detectedAt === 'string' ? existing.detectedAt : now,
	preparedAt: now
};
const temporaryPath = path.join(markerDirectory, `.pending-deploy-${process.pid}.json`);
fs.writeFileSync(temporaryPath, `${JSON.stringify(marker, null, 2)}\n`, { mode: 0o644 });
fs.renameSync(temporaryPath, markerPath);
console.log(`内容准备完成，待本地发布：${marker.reasons.join(',')}`);
