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

function getCurrentVersion() {
    const content = fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8');
    const pkg = JSON.parse(content);
    return pkg.version;
}

function updatePackageJson(newVersion) {
    const content = fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8');
    const pkg = JSON.parse(content);
    pkg.version = newVersion;
    fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(pkg, null, '\t') + '\n');
    console.log(`✅ package.json updated to version ${newVersion}`);
}

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

    // Find the place to insert the new version. 
    // Customarily, it's after the "Keep a Changelog" link or first header, 
    // but looking at the user's file, it seems the first version header starts around line 7.
    // We'll look for the first occurrence of "## [" to insert before it, 
    // or if not found (first release), append or insert after header.

    // Strategy: Find the first line starting with "## ["
    const lines = content.split('\n');
    let insertIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('## [')) {
            insertIndex = i;
            break;
        }
    }

    if (insertIndex === -1) {
        // Fallback: append to end if no version headers found, or after title if empty
        // Ideally we want it after the intro.
        // Let's look for the last non-empty line of the header section (approx line 5-6)
        insertIndex = lines.length;
        // Try to find the Keep a Changelog line
        const keepChangelogIndex = lines.findIndex(l => l.includes('Keep a Changelog'));
        if (keepChangelogIndex !== -1) {
            insertIndex = keepChangelogIndex + 2; // +1 for the line itself, +1 for newline gap
        }
    }

    const newSection = `${header}\n${template}\n`;

    lines.splice(insertIndex, 0, newSection);

    // Clean up potential extra newlines if needed, but simple splicing should be okay for now

    fs.writeFileSync(CHANGELOG_PATH, lines.join('\n'));
    console.log(`✅ CHANGELOG.md updated with new entry for ${newVersion}`);
}

function incrementVersion(version, type) {
    const [major, minor, patch] = version.split('.').map(Number);
    switch (type) {
        case 'major': return `${major + 1}.0.0`;
        case 'minor': return `${major}.${minor + 1}.0`;
        case 'patch': return `${major}.${minor}.${patch + 1}`;
        default: return version;
    }
}

async function main() {
    const currentVersion = getCurrentVersion();
    console.log(`Current version: ${currentVersion}`);

    const patch = incrementVersion(currentVersion, 'patch');
    const minor = incrementVersion(currentVersion, 'minor');
    const major = incrementVersion(currentVersion, 'major');

    console.log(`1. Patch (${patch})`);
    console.log(`2. Minor (${minor})`);
    console.log(`3. Major (${major})`);
    console.log(`4. Custom`);

    rl.question('Select update type (1-4): ', (answer) => {
        let newVersion = '';

        if (answer === '1') newVersion = patch;
        else if (answer === '2') newVersion = minor;
        else if (answer === '3') newVersion = major;
        else if (answer === '4') {
            rl.question('Enter custom version: ', (ver) => {
                finalize(ver);
            });
            return;
        } else {
            console.log('Invalid selection');
            rl.close();
            return;
        }

        finalize(newVersion);
    });
}

function finalize(newVersion) {
    if (!newVersion) {
        console.log('No version provided');
        rl.close();
        return;
    }
    updatePackageJson(newVersion);
    updateChangelog(newVersion);
    console.log(`\n🎉 Version update complete! Don't forget to fill in CHANGELOG.md`);
    rl.close();
}

main();
