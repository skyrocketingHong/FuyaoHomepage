#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const historyMode = process.argv.includes('--history');
const publicExampleEnvFiles = new Set(['.env.example']);
const historicalExampleEnvFiles = new Set(['.env']);
const allowedStaticPrefixes = ['static/favicon/', 'static/fonts/'];
const historicalExampleStaticPrefixes = ['static/data/', 'static/posts/', 'static/wp-content/'];
const allowedStaticFiles = new Set(['static/robots.txt']);
const historicalExampleStaticFiles = new Set(['static/sitemap.xml']);
const publicExampleEntropyFingerprints = new Set([
	'32495f32ed2f391ba6d0d0307a213be1309069066583e116948d898f5eed3fe7',
	'89a23d18083edf90cfef477740990ea55c561e813ac4990ab634bfcc41405245',
	'a6799e2d67cf427ea9ad3320ccc51a6f8d7f39f76a509ff8a79a16a52e2a96be'
]);
const secretPatterns = [
	['私钥', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
	['GitHub Token', /\bgh[opusr]_[A-Za-z0-9_]{20,}\b/],
	['AWS Access Key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
	['JWT', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/],
	[
		'疑似秘密赋值',
		/^\s*["']?(?:token|password|passwd|private[_-]?key|webhook[_-]?secret)["']?\s*[:=]\s*["']?[^\s"']{12,}/im
	]
];
const serverPathPattern = /\/srv\/fuyao\//;
const generatedDirectories = new Set([
	'.git',
	'.fuyao',
	'.svelte-kit',
	'build',
	'coverage',
	'node_modules'
]);

function git(args, options = {}) {
	return execFileSync('git', args, { cwd: projectRoot, encoding: 'utf8', ...options });
}

function trackedFiles() {
	return git(['ls-files', '--cached', '--others', '--exclude-standard', '-z'])
		.split('\0')
		.filter(Boolean);
}

function packageFiles() {
	const files = [];
	function walk(directory) {
		for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
			if (entry.isDirectory() && generatedDirectories.has(entry.name)) continue;
			const absolutePath = path.join(directory, entry.name);
			const relativePath = path.relative(projectRoot, absolutePath);
			if (entry.isDirectory()) walk(absolutePath);
			else files.push(relativePath);
		}
	}
	walk(projectRoot);
	return files.sort();
}

function currentFiles() {
	return fs.existsSync(path.join(projectRoot, '.git')) ? trackedFiles() : packageFiles();
}

function readPrivacyTerms() {
	const file = process.env.FUYAO_PRIVACY_TERMS_FILE;
	if (!file) return [];
	return fs
		.readFileSync(file, 'utf8')
		.split(/\r?\n/)
		.map((value) => value.trim())
		.filter((value) => value && !value.startsWith('#'));
}

function repositoryPath(label) {
	return label.replace(/^[0-9a-f]{12}:/, '');
}

function isDeclaredPublicExample(label) {
	const relativePath = repositoryPath(label);
	return (
		publicExampleEnvFiles.has(relativePath) ||
		historicalExampleEnvFiles.has(relativePath) ||
		allowedStaticFiles.has(relativePath) ||
		historicalExampleStaticFiles.has(relativePath) ||
		allowedStaticPrefixes.some((prefix) => relativePath.startsWith(prefix)) ||
		historicalExampleStaticPrefixes.some((prefix) => relativePath.startsWith(prefix))
	);
}

function isKnownPublicExampleEntropy(value) {
	return publicExampleEntropyFingerprints.has(createHash('sha256').update(value).digest('hex'));
}

function inspectText(label, content, issues, privacyTerms) {
	const infrastructurePathAllowed =
		label.endsWith('.md') ||
		label.endsWith('.example') ||
		label.includes('deploy/') ||
		label.endsWith('scripts/deploy.js') ||
		label.endsWith('scripts/prepare-build-inputs.js');
	if (serverPathPattern.test(content) && !infrastructurePathAllowed) {
		issues.push(`${label} 含服务器绝对路径`);
	}
	for (const [name, pattern] of secretPatterns) {
		if (pattern.test(content)) issues.push(`${label} 命中 ${name} 模式`);
	}
	for (const term of privacyTerms) {
		if (content.includes(term)) issues.push(`${label} 命中外部隐私词表`);
	}
	const entropyEligible = /(?:^|[:/])\.env(?:\.|$)|\.(?:ya?ml|json)$/i.test(label);
	if (entropyEligible && !label.endsWith('package-lock.json') && !label.includes('.example')) {
		for (const match of content.matchAll(/\b[A-Za-z0-9+/_=-]{40,}\b/g)) {
			const value = match[0];
			const counts = new Map();
			for (const character of value) counts.set(character, (counts.get(character) || 0) + 1);
			const entropy = [...counts.values()].reduce((sum, count) => {
				const probability = count / value.length;
				return sum - probability * Math.log2(probability);
			}, 0);
			if (entropy >= 4.5) {
				if (isDeclaredPublicExample(label) && isKnownPublicExampleEntropy(value)) continue;
				issues.push(`${label} 含疑似高熵字符串（长度 ${value.length}，熵 ${entropy.toFixed(2)}）`);
				break;
			}
		}
	}
}

function currentAudit() {
	const issues = [];
	const terms = readPrivacyTerms();
	for (const relativePath of currentFiles()) {
		const absolutePath = path.join(projectRoot, relativePath);
		if (!fs.existsSync(absolutePath)) continue;
		if (/^\.env(?:\.|$)/.test(relativePath) && !publicExampleEnvFiles.has(relativePath)) {
			issues.push(`${relativePath} 是非示例环境文件`);
		}
		if (
			relativePath.startsWith('static/') &&
			!allowedStaticFiles.has(relativePath) &&
			!allowedStaticPrefixes.some((prefix) => relativePath.startsWith(prefix))
		) {
			issues.push(`${relativePath} 不在公开 static 白名单`);
		}
		const stat = fs.lstatSync(absolutePath);
		if (stat.isSymbolicLink()) {
			issues.push(`${relativePath} 是源码包中的符号链接`);
			continue;
		}
		if (!stat.isFile() || stat.size > 4 * 1024 * 1024) continue;
		const buffer = fs.readFileSync(absolutePath);
		if (buffer.includes(0)) continue;
		inspectText(relativePath, buffer.toString('utf8'), issues, terms);
	}
	return issues;
}

function historyAudit() {
	const issues = [];
	const terms = readPrivacyTerms();
	const commits = git(['rev-list', '--all']).trim().split(/\r?\n/).filter(Boolean);
	for (const commit of commits) {
		const files = git(['ls-tree', '-r', '--name-only', commit])
			.trim()
			.split(/\r?\n/)
			.filter(Boolean);
		for (const relativePath of files) {
			if (/\.(?:png|jpe?g|gif|webp|woff2?|zip|pdf)$/i.test(relativePath)) continue;
			let content;
			try {
				content = git(['show', `${commit}:${relativePath}`], { maxBuffer: 8 * 1024 * 1024 });
			} catch {
				continue;
			}
			inspectText(`${commit.slice(0, 12)}:${relativePath}`, content, issues, terms);
		}
	}
	return issues;
}

const issues = historyMode ? historyAudit() : currentAudit();
const currentLabel = fs.existsSync(path.join(projectRoot, '.git')) ? '当前跟踪文件' : '当前源码包';
if (issues.length) {
	console.error(`${historyMode ? 'Git 历史' : currentLabel}隐私审计失败，共 ${issues.length} 项：`);
	for (const issue of issues.slice(0, 100)) console.error(`- ${issue}`);
	if (issues.length > 100) console.error(`- 其余 ${issues.length - 100} 项已省略`);
	process.exit(1);
}

console.log(`${historyMode ? 'Git 历史' : currentLabel}隐私审计通过`);
