/**
 * 递归文件监听脚本
 * 
 * 监听博文源目录的变化，并自动触发 generate-blog-index.js
 */
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// 手动加载 .env
function getEnv(key, defaultVal) {
    const envPath = path.join(rootDir, '.env');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
        if (match) return match[1].trim().replace(/^["']|["']$/g, '');
    }
    return defaultVal;
}

const SOURCE_DIR = getEnv('VITE_BLOG_SOURCE_DIR', path.join(rootDir, 'static/posts'));
const GEN_SCRIPT = path.join(rootDir, 'scripts/generate-blog-index.js');

console.log(`[Watcher] 启动递归监听: ${SOURCE_DIR}`);
console.log(`[Watcher] 触发脚本: ${GEN_SCRIPT}`);

let timer = null;
function trigger() {
    if (timer) clearTimeout(timer);
    // 防抖处理，避免短时间内多次上传触发多次
    timer = setTimeout(() => {
        console.log(`[${new Date().toLocaleTimeString()}] 检测到变动，正在更新索引...`);
        exec(`"${process.execPath}" "${GEN_SCRIPT}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`[Error] 更新失败: ${error.message}`);
                return;
            }
            if (stderr) console.error(`[Stderr] ${stderr}`);
            console.log(stdout);
        });
    }, 500);
}

// 递归监听 (Node 25+ 在 Linux 上支持更好的递归监听)
try {
    fs.watch(SOURCE_DIR, { recursive: true }, (event, filename) => {
        if (filename && filename.endsWith('.md')) {
            console.log(`[Event] ${event}: ${filename}`);
            trigger();
        }
    });
} catch (err) {
    console.error(`[Critical] 无法启动监控: ${err.message}`);
    process.exit(1);
}

// 保持进程运行
process.stdin.resume();
