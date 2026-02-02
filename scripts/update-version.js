/**
 * 版本更新脚本
 *
 * 提供交互式命令行界面，用于更新 package.json 版本号并自动生成 CHANGELOG 条目。
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGE_JSON_PATH = path.join(__dirname, '../package.json');
const CHANGELOG_PATH = path.join(__dirname, '../CHANGELOG.md');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * 获取当前版本号
 * @returns {string} 当前版本号
 */
function getCurrentVersion() {
    const content = fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8');
    const pkg = JSON.parse(content);
    return pkg.version;
}

/**
 * 更新 package.json 中的版本号
 * @param {string} newVersion - 新版本号
 */
function updatePackageJson(newVersion) {
    const content = fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8');
    const pkg = JSON.parse(content);
    pkg.version = newVersion;
    fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(pkg, null, '\t') + '\n');
    console.log(`✅ package.json 已更新至版本 ${newVersion}`);
}

/**
 * 更新 CHANGELOG.md，添加新版本条目
 * @param {string} newVersion - 新版本号
 */
function updateChangelog(newVersion) {
    const date = new Date().toISOString().split('T')[0];
    const content = fs.readFileSync(CHANGELOG_PATH, 'utf-8');

    const header = `## [${newVersion}] - ${date}`;
    const template = `
### ✨ 新增
- 

### 🔧 优化
- 

### 🐛 修复
- 
`;

    // 寻找新版本的插入位置。
    // 通常是在 "Keep a Changelog" 链接或第一个二级标题之后。
    // 根据用户文件情况，第一个版本标题通常在第 7 行左右。
    // 我们会寻找第一个出现的 "## [" 并在其上方插入，
    // 如果未找到（首次发布），则追加到末尾。

    // 策略：寻找第一个以 "## [" 开头的行
    const lines = content.split('\n');
    let insertIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('## [')) {
            insertIndex = i;
            break;
        }
    }

    if (insertIndex === -1) {
        // 回退方案：如果未发现版本标题，则追加到末尾，或者在标题介绍后插入。
        // 我们倾向于将其放在介绍之后。
        // 查找标题部分最后的非空行（约 5-6 行）。
        insertIndex = lines.length;
        // 尝试寻找 "Keep a Changelog" 行
        const keepChangelogIndex = lines.findIndex(l => l.includes('Keep a Changelog'));
        if (keepChangelogIndex !== -1) {
            insertIndex = keepChangelogIndex + 2; // +1 表示该行本身，+1 表示空行间隙
        }
    }

    const newSection = `${header}\n${template}\n`;

    lines.splice(insertIndex, 0, newSection);

    // 如有需要，清理多余的换行符，但简单的拼接目前应该没问题

    fs.writeFileSync(CHANGELOG_PATH, lines.join('\n'));
    console.log(`✅ CHANGELOG.md 已更新，并为版本 ${newVersion} 创建了新条目`);
}

/**
 * 递增版本号
 * @param {string} version - 当前版本号
 * @param {'major'|'minor'|'patch'} type - 更新类型
 * @returns {string} 新版本号
 */
function incrementVersion(version, type) {
    const [major, minor, patch] = version.split('.').map(Number);
    switch (type) {
        case 'major': return `${major + 1}.0.0`;
        case 'minor': return `${major}.${minor + 1}.0`;
        case 'patch': return `${major}.${minor}.${patch + 1}`;
        default: return version;
    }
}

/**
 * 主函数：运行交互式版本更新流程
 */
async function main() {
    const currentVersion = getCurrentVersion();
    console.log(`当前版本: ${currentVersion}`);
 
    const patch = incrementVersion(currentVersion, 'patch');
    const minor = incrementVersion(currentVersion, 'minor');
    const major = incrementVersion(currentVersion, 'major');
 
    console.log(`1. 补丁版本 (Patch - ${patch})`);
    console.log(`2. 次要版本 (Minor - ${minor})`);
    console.log(`3. 主要版本 (Major - ${major})`);
    console.log(`4. 自定义版本`);
 
    rl.question('请选择更新类型 (1-4): ', (answer) => {
        let newVersion = '';

        if (answer === '1') newVersion = patch;
        else if (answer === '2') newVersion = minor;
        else if (answer === '3') newVersion = major;
        else if (answer === '4') {
                    rl.question('请输入自定义版本号: ', (ver) => {
                finalize(ver);
            });
            return;
        } else {
            console.log('无效的选择');
            rl.close();
            return;
        }

        finalize(newVersion);
    });
}

/**
 * 完成版本更新
 * @param {string} newVersion - 新版本号
 */
function finalize(newVersion) {
    if (!newVersion) {
        console.log('未提供版本号');
        rl.close();
        return;
    }
    updatePackageJson(newVersion);
    updateChangelog(newVersion);
    console.log(`\n🎉 版本更新完成！别忘了填写 CHANGELOG.md 中的内容`);
    rl.close();
}

main();
