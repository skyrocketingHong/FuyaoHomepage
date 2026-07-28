/**
 * 项目版本管理入口。
 *
 * `version.json` 是营销版本、Build Train 与构建序号的唯一人工维护入口；
 * 脚本在修改后同步 `package.json`，并生成类似 `27.1 (4B96)` 的展示文本。
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import readline from 'node:readline/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const versionPath = path.join(projectRoot, 'version.json');
const packagePath = path.join(projectRoot, 'package.json');
const packageLockPath = path.join(projectRoot, 'package-lock.json');
const semverPattern = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*))?$/;

/** @typedef {{ version: string; buildTrain: string; build: number }} VersionManifest */

/**
 * 解析并校验 SemVer。
 * @param {string} version
 */
export function parseVersion(version) {
	const match = semverPattern.exec(version);
	if (!match) {
		throw new Error(`版本号必须符合 SemVer，例如 27.0.0；当前值：${version}`);
	}

	return {
		major: Number(match[1]),
		minor: Number(match[2]),
		patch: Number(match[3]),
		prerelease: match[4] ?? ''
	};
}

/**
 * 生成 Build Train 标识，例如 4B + 96 => 4B96。
 * @param {string} buildTrain
 * @param {number} build
 */
export function formatBuildIdentifier(buildTrain, build) {
	validateBuildTrain(buildTrain);
	validateBuild(build);
	return `${buildTrain}${build}`;
}

/**
 * 生成页面使用的完整版本文本。
 * @param {string} version
 * @param {string} buildTrain
 * @param {number} build
 */
export function formatVersionDisplay(version, buildTrain, build) {
	const { major, minor, patch, prerelease } = parseVersion(version);
	const marketingVersion = patch === 0 && !prerelease ? `${major}.${minor}` : version;
	return `${marketingVersion} (${formatBuildIdentifier(buildTrain, build)})`;
}

/** @param {string} buildTrain */
function validateBuildTrain(buildTrain) {
	if (!/^[1-9]\d*[A-Z]+$/.test(buildTrain)) {
		throw new Error(`Build Train 必须由非零数字和大写字母组成，例如 4A；当前值：${buildTrain}`);
	}
}

/**
 * @param {number} build
 */
function validateBuild(build) {
	if (!Number.isSafeInteger(build) || build < 1 || build > 999) {
		throw new Error(`构建序号必须是 1—999 的整数；当前值：${build}`);
	}
}

/** @returns {VersionManifest} */
export function readVersionManifest() {
	const manifest = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
	parseVersion(manifest.version);
	validateBuildTrain(manifest.buildTrain);
	validateBuild(manifest.build);
	return manifest;
}

/** @param {VersionManifest} manifest */
function writeVersionManifest(manifest) {
	fs.writeFileSync(versionPath, `${JSON.stringify(manifest, null, '\t')}\n`);
}

/** @param {string} version */
function syncPackageVersion(version) {
	const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
	packageJson.version = version;
	fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, '\t')}\n`);

	if (fs.existsSync(packageLockPath)) {
		const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));
		packageLock.version = version;
		if (packageLock.packages?.['']) packageLock.packages[''].version = version;
		fs.writeFileSync(packageLockPath, `${JSON.stringify(packageLock, null, '\t')}\n`);
	}
}

/** @param {VersionManifest} manifest */
function saveVersion(manifest) {
	parseVersion(manifest.version);
	validateBuildTrain(manifest.buildTrain);
	validateBuild(manifest.build);
	writeVersionManifest(manifest);
	syncPackageVersion(manifest.version);
	printVersion(manifest);
}

/** @param {VersionManifest} manifest */
function printVersion(manifest) {
	console.log(`营销版本：${manifest.version}`);
	console.log(`Build Train：${manifest.buildTrain}`);
	console.log(`构建序号：${manifest.build}`);
	console.log(`构建标识：${formatBuildIdentifier(manifest.buildTrain, manifest.build)}`);
	console.log(
		`页面显示：${formatVersionDisplay(manifest.version, manifest.buildTrain, manifest.build)}`
	);
}

/**
 * 递增全局构建序号，不修改营销版本。
 */
export function bumpBuild() {
	const current = readVersionManifest();
	saveVersion({ ...current, build: current.build + 1 });
}

/** @param {'major' | 'minor' | 'patch'} type */
function bumpVersion(type) {
	const current = readVersionManifest();
	const { major, minor, patch } = parseVersion(current.version);
	const versions = {
		major: `${major + 1}.0.0`,
		minor: `${major}.${minor + 1}.0`,
		patch: `${major}.${minor}.${patch + 1}`
	};
	saveVersion({ ...current, version: versions[type], build: current.build + 1 });
}

/**
 * @param {string | undefined} input
 * @param {string | undefined} buildTrainInput
 */
function setVersion(input, buildTrainInput) {
	if (!input) throw new Error('缺少版本号，例如：npm run version:set -- 27.0.0 4A');
	const current = readVersionManifest();
	parseVersion(input);
	const buildTrain = buildTrainInput ?? current.buildTrain;
	validateBuildTrain(buildTrain);
	if (input === current.version && buildTrain === current.buildTrain) {
		throw new Error(`营销版本和 Build Train 均未变化：${input} (${buildTrain})`);
	}
	saveVersion({ version: input, buildTrain, build: current.build + 1 });
}

/** @param {string | undefined} input */
function setBuild(input) {
	const nextBuild = Number(input);
	validateBuild(nextBuild);
	const current = readVersionManifest();
	if (nextBuild <= current.build) {
		throw new Error(`新构建号必须大于当前值 ${current.build}；收到：${input}`);
	}
	saveVersion({ ...current, build: nextBuild });
}

/** @param {string | undefined} input */
function setBuildTrain(input) {
	if (!input) throw new Error('缺少 Build Train，例如：npm run train:set -- 4A');
	validateBuildTrain(input);
	const current = readVersionManifest();
	if (input === current.buildTrain) throw new Error(`Build Train 已经是 ${input}`);
	saveVersion({ ...current, buildTrain: input, build: current.build + 1 });
}

function syncVersion() {
	const current = readVersionManifest();
	syncPackageVersion(current.version);
	printVersion(current);
}

async function promptForVersion() {
	const current = readVersionManifest();
	const { major, minor, patch } = parseVersion(current.version);
	printVersion(current);
	console.log('');
	console.log(`1. 补丁版本：${major}.${minor}.${patch + 1}`);
	console.log(`2. 次版本：${major}.${minor + 1}.0`);
	console.log(`3. 主版本：${major + 1}.0.0`);
	console.log('4. 仅递增构建号');
	console.log('5. 指定营销版本与可选 Build Train');

	const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });
	try {
		const answer = (await terminal.question('请选择操作（1—5）：')).trim();
		if (answer === '1') bumpVersion('patch');
		else if (answer === '2') bumpVersion('minor');
		else if (answer === '3') bumpVersion('major');
		else if (answer === '4') bumpBuild();
		else if (answer === '5') {
			const version = (await terminal.question('请输入 SemVer：')).trim();
			const buildTrain = (
				await terminal.question(`请输入 Build Train（留空保持 ${current.buildTrain}）：`)
			).trim();
			setVersion(version, buildTrain || undefined);
		} else throw new Error(`无效选项：${answer}`);
	} finally {
		terminal.close();
	}
}

async function main() {
	const [command = 'show', value, buildTrain] = process.argv.slice(2);
	if (command === 'show') printVersion(readVersionManifest());
	else if (command === 'build') bumpBuild();
	else if (command === 'build-set') setBuild(value);
	else if (command === 'patch' || command === 'minor' || command === 'major') bumpVersion(command);
	else if (command === 'set') setVersion(value, buildTrain);
	else if (command === 'train-set') setBuildTrain(value);
	else if (command === 'sync') syncVersion();
	else if (command === 'prompt') await promptForVersion();
	else throw new Error(`未知命令：${command}`);
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
	main().catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	});
}
