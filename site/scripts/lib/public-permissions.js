import fs from 'node:fs';
import path from 'node:path';

const PUBLIC_DIRECTORY_MODE = 0o755;
const PUBLIC_FILE_MODE = 0o644;

/**
 * @param {string} root
 * @param {(target: string, stat: import('node:fs').Stats) => void} visit
 */
function visitTree(root, visit) {
	const stat = fs.lstatSync(root);
	if (stat.isSymbolicLink()) throw new Error(`公开产物禁止符号链接：${root}`);

	visit(root, stat);
	if (!stat.isDirectory()) return;

	for (const entry of fs.readdirSync(root)) visitTree(path.join(root, entry), visit);
}

/**
 * 将静态站点公开产物统一为 Caddy 可读取的权限，避免继承私有内容源的 0600/0700。
 *
 * @param {string} root 公开产物根目录
 */
export function normalizePublicTreePermissions(root) {
	visitTree(root, (target, stat) => {
		if (stat.isDirectory()) fs.chmodSync(target, PUBLIC_DIRECTORY_MODE);
		else if (stat.isFile()) fs.chmodSync(target, PUBLIC_FILE_MODE);
		else throw new Error(`公开产物只允许普通文件和目录：${target}`);
	});
}

/**
 * 校验静态站点公开产物可由非属主的 Web 服务器进程遍历和读取。
 *
 * @param {string} root 公开产物根目录
 * @param {string} label 错误信息中的产物名称
 */
export function assertPublicTreePermissions(root, label) {
	/** @type {string[]} */
	const issues = [];
	visitTree(root, (target, stat) => {
		const mode = stat.mode & 0o777;
		const relative = path.relative(root, target) || '.';
		if (stat.isDirectory() && (mode & 0o005) !== 0o005) {
			issues.push(`${relative} 目录不可由 Web 服务器遍历（${mode.toString(8)}）`);
		} else if (stat.isFile() && (mode & 0o004) !== 0o004) {
			issues.push(`${relative} 文件不可由 Web 服务器读取（${mode.toString(8)}）`);
		}
	});

	if (issues.length) throw new Error(`${label}权限校验失败：\n- ${issues.join('\n- ')}`);
}
