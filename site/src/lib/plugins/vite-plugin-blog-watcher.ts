import { execFile } from 'node:child_process';
import type { Plugin } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = join(__dirname, '../../../scripts/prepare-build-inputs.js');

/**
 * 博客文件监听插件
 *
 * 监听匿名开发内容目录下的 Markdown 文件变化，
 * 自动重新准备隔离构建快照，不回写源码 static 目录。
 */
export default function blogWatcher(): Plugin {
	return {
		name: 'vite-plugin-blog-watcher',
		handleHotUpdate({ file }) {
			if (file.includes('fixtures/content/posts') && file.endsWith('.md')) {
				runGeneration();
			}
		}
	};
}

function runGeneration() {
	execFile(process.execPath, [SCRIPT_PATH, '--mode=development'], (error, _stdout, stderr) => {
		if (error) {
			console.error(`[BlogWatcher] 错误: ${error.message}`);
			return;
		}
		if (stderr) {
			console.error(`[BlogWatcher] 标准错误输出: ${stderr}`);
			return;
		}
		console.log(`[BlogWatcher] 索引已重新生成。`);
	});
}
