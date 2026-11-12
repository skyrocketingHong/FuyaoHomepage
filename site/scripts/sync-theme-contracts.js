#!/usr/bin/env node
/**
 * 同步主题契约副本（FuyaoHomepage ← FuyaoManager contracts/theme）。
 *
 * 权威契约位于管理平台仓库 FuyaoManager 的 contracts/theme；本主题仓通过
 * 受版本控制的生成式副本消费契约（默认解析路径为仓库根 contracts/theme，
 * 管理平台构建时仍以 FUYAO_THEME_CONTRACTS 显式注入权威源）。
 *
 * 用法：
 *   node site/scripts/sync-theme-contracts.js --source /path/to/FuyaoManager/contracts/theme [--source-commit <sha>]
 *       重新生成本仓 contracts/theme 副本并写入 PROVENANCE.json。
 *   node site/scripts/sync-theme-contracts.js --check
 *       校验本地副本与 PROVENANCE 摘要一致（CI 用；漂移即非零退出）。
 *
 * 要比对权威源两侧内容，可在临时检出上重新执行 --source 同步后用
 * git diff 检查副本是否变化。副本损坏时脚本直接报错，绝不静默回退。
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const REPO_ROOT = path.dirname(path.dirname(import.meta.dirname));
const COPY_ROOT = path.join(REPO_ROOT, 'contracts', 'theme');
const EXAMPLES_DIR = 'examples';
const PROVENANCE_FILE = 'PROVENANCE.json';
const SCHEMA_FILES = [
	'manifest.schema.json',
	'build-input.schema.json',
	'release.schema.json',
	'README.md',
	'README_ZH.md'
];
const SOURCE_REPO = 'https://github.com/skyrocketingHong/FuyaoManager';

/**
 * 将受限相对路径规范化并锚定在 root 内：拒绝 `..`、绝对路径与反斜杠，
 * 结果越界立即抛错。全部文件访问都经此函数或常量白名单完成。
 */
function resolveInside(root, relPath) {
	const raw = String(relPath);
	if (raw.includes('\\')) {
		throw new Error(`非法相对路径（含反斜杠）：${raw}`);
	}
	const norm = path.posix.normalize(raw);
	if (norm === '' || norm === '..' || norm.startsWith('../') || path.posix.isAbsolute(norm)) {
		throw new Error(`非法相对路径：${raw}`);
	}
	const target = path.resolve(root, norm);
	const base = path.resolve(root);
	if (target !== base && !target.startsWith(base + path.sep)) {
		throw new Error(`路径越界：${raw}（根 ${base}）`);
	}
	return target;
}

function parseArgs(argv) {
	const out = { check: false, source: '', sourceCommit: '' };
	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === '--check') out.check = true;
		else if (arg === '--source') out.source = argv[++i] ?? '';
		else if (arg === '--source-commit') out.sourceCommit = argv[++i] ?? '';
		else {
			console.error(`未知参数：${arg}`);
			process.exit(1);
		}
	}
	return out;
}

/** 解析并校验 --source：拒绝 `..` 片段，必须存在且为目录，规范化后返回。 */
function resolveSourceDir(raw) {
	if (!raw) return '';
	if (raw.split(/[\\/]/).includes('..')) {
		throw new Error('--source 不得包含 .. 片段');
	}
	const resolved = path.resolve(raw);
	const stat = fs.statSync(resolved);
	if (!stat.isDirectory()) {
		throw new Error(`--source 不是目录：${resolved}`);
	}
	return fs.realpathSync(resolved);
}

function sha256(file) {
	return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

/** 列出 root 下全部常规文件的相对斜杠路径（逐级读取目录项，名称不含分隔符）。 */
function listFiles(root, rel = '.') {
	const out = [];
	for (const entry of fs.readdirSync(resolveInside(root, rel), { withFileTypes: true })) {
		const relPath = rel === '.' ? entry.name : `${rel}/${entry.name}`;
		if (entry.isDirectory()) out.push(...listFiles(root, relPath));
		else if (entry.isFile()) out.push(relPath);
	}
	return out;
}

function resolveSourceCommit(source, explicit) {
	if (explicit) return explicit;
	try {
		const managerRoot = path.dirname(path.dirname(source));
		return execFileSync('git', ['-C', managerRoot, 'rev-parse', 'HEAD'], {
			encoding: 'utf8'
		}).trim();
	} catch {
		return null;
	}
}

function sync(source, explicitCommit) {
	for (const file of SCHEMA_FILES) {
		if (!fs.existsSync(resolveInside(source, file))) {
			console.error(`权威源缺少 ${file}：${source}`);
			process.exit(1);
		}
	}
	const files = {};
	for (const file of SCHEMA_FILES) {
		const dst = resolveInside(COPY_ROOT, file);
		fs.mkdirSync(path.dirname(dst), { recursive: true });
		fs.copyFileSync(resolveInside(source, file), dst);
		files[file] = sha256(dst);
	}
	for (const rel of listFiles(resolveInside(source, EXAMPLES_DIR))) {
		const dst = resolveInside(COPY_ROOT, `${EXAMPLES_DIR}/${rel}`);
		fs.mkdirSync(path.dirname(dst), { recursive: true });
		fs.copyFileSync(resolveInside(source, `${EXAMPLES_DIR}/${rel}`), dst);
		files[`${EXAMPLES_DIR}/${rel}`] = sha256(dst);
	}
	const provenance = {
		source: { repository: SOURCE_REPO, directory: 'contracts/theme' },
		sourceCommit: resolveSourceCommit(source, explicitCommit),
		syncedAt: new Date().toISOString(),
		contractVersion: 'v1',
		algorithm: 'sha256',
		files
	};
	fs.writeFileSync(
		resolveInside(COPY_ROOT, PROVENANCE_FILE),
		`${JSON.stringify(provenance, null, '\t')}\n`
	);
	console.log(
		`已同步 ${Object.keys(files).length} 个契约文件到 ${path.relative(REPO_ROOT, COPY_ROOT)}`
	);
	if (!provenance.sourceCommit) {
		console.warn('警告：未能确定权威源 commit（可用 --source-commit 显式指定）');
	}
}

function check() {
	const provenancePath = resolveInside(COPY_ROOT, PROVENANCE_FILE);
	if (!fs.existsSync(provenancePath)) {
		console.error(`缺少 ${PROVENANCE_FILE}：请先运行同步`);
		process.exit(1);
	}
	let provenance;
	try {
		provenance = JSON.parse(fs.readFileSync(provenancePath, 'utf8'));
	} catch (error) {
		console.error(`无法解析 ${PROVENANCE_FILE}：${error.message}`);
		process.exit(1);
	}
	const listed = new Set(Object.keys(provenance.files));
	let failed = false;
	for (const [rel, digest] of Object.entries(provenance.files)) {
		let local;
		try {
			local = resolveInside(COPY_ROOT, rel);
		} catch (error) {
			console.error(`登记路径非法：${rel}（${error.message}）`);
			failed = true;
			continue;
		}
		if (!fs.existsSync(local)) {
			console.error(`副本缺失：${rel}`);
			failed = true;
		} else if (sha256(local) !== digest) {
			console.error(`副本漂移：${rel}`);
			failed = true;
		}
	}
	const present = listFiles(COPY_ROOT).filter((rel) => rel !== PROVENANCE_FILE);
	for (const rel of present) {
		if (!listed.has(rel)) {
			console.error(`副本存在未登记文件：${rel}`);
			failed = true;
		}
	}
	if (failed) {
		console.error('契约副本与 PROVENANCE 不一致：禁止手工编辑生成式副本，请重新同步。');
		process.exit(1);
	}
	console.log(
		`契约副本校验通过（${present.length} 个文件，来源 ${provenance.sourceCommit ?? '未知 commit'}）`
	);
}

const args = parseArgs(process.argv.slice(2));
try {
	const sourceDir = resolveSourceDir(args.source);
	if (args.check && !sourceDir) {
		check();
	} else if (sourceDir) {
		sync(sourceDir, args.sourceCommit);
	} else {
		console.error('用法：--source <dir> 同步；--check 本地校验');
		process.exit(1);
	}
} catch (error) {
	console.error(error.message);
	process.exit(1);
}
