/**
 * 构建版本号自动递增脚本
 * 
 * 每次构建时运行，读取 package.json 的版本号与 version.json 进行比对：
 * 1. 如果主版本号 (Major) 增加，将构建号 (build) 重置为 1。
 * 2. 否则，将构建号加 1。
 * 3. 更新 version.json 文件。
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const versionPath = join(__dirname, '../version.json');

try {
	const pkgPath = join(__dirname, '../package.json');
	const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
	const currentVersion = pkg.version;
	
	let versionData;
	try {
		versionData = JSON.parse(readFileSync(versionPath, 'utf-8'));
	} catch {
		versionData = { build: 0, version: '0.0.0' };
	}

	const currentMajor = parseInt(currentVersion.split('.')[0]);
	const storedMajor = versionData.version ? parseInt(versionData.version.split('.')[0]) : currentMajor;

	if (currentMajor > storedMajor) {
		versionData.build = 1;
		console.log(`\nMajor version change detected (${versionData.version} -> ${currentVersion}). Build number reset to 1.\n`);
	} else {
		versionData.build += 1;
		console.log(`\nBuild number updated to: ${versionData.build}\n`);
	}
	
	versionData.version = currentVersion;
	writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
} catch (error) {
	console.error('Failed to update build number:', error);
	process.exit(1);
}
