import { exec } from 'child_process';
import type { Plugin } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// 寻找相对于此文件的 scripts/generate-blog-index.js
// src/lib/plugins/vite-plugin-blog-watcher.ts -> ../../../scripts/generate-blog-index.js
const SCRIPT_PATH = join(__dirname, '../../../scripts/generate-blog-index.js');

/**
 * 博客文件监听插件
 * 
 * 监听 `static/posts` 目录下的 Markdown 文件变化，
 * 自动运行 `scripts/generate-blog-index.js` 生成博客索引。
 */
export default function blogWatcher(): Plugin {
    return {
        name: 'vite-plugin-blog-watcher',
        configureServer(server) {
            // 启动时运行
            runGeneration();
        },
        handleHotUpdate({ file, server }) {
            // 监听 static/posts 中的变化
            if (file.includes('static/posts') && file.endsWith('.md')) {
                runGeneration();
            }
        }
    };
}

function runGeneration() {
    exec(`node "${SCRIPT_PATH}"`, (error, stdout, stderr) => {
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
