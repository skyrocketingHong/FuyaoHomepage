/**
 * 博客索引生成脚本
 *
 * 扫描 static/posts 目录下的 Markdown 文件，生成以下索引文件：
 * - all.json: 包含所有文章元数据的列表
 * - categories.json: 分类元数据
 */
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// 定义路径
const POSTS_DIR = path.join(process.cwd(), 'static/posts');
const OUTPUT_ALL = path.join(POSTS_DIR, 'all.json');
const OUTPUT_CATEGORIES = path.join(POSTS_DIR, 'categories.json');

/**
 * 递归获取目录下的所有 Markdown 文件
 * @param {string} dir - 目录路径
 * @param {string[]} fileList - 文件列表（递归累积）
 * @param {string} rootDir - 根目录路径
 * @returns {string[]} 文件路径列表
 */
function getFiles(dir, fileList = [], rootDir = '') {
    if (!fs.existsSync(dir)) return [];

    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            getFiles(filePath, fileList, rootDir || dir);
        } else {
            if (file.endsWith('.md') && !file.startsWith('_index')) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}





/**
 * 从文件名生成默认 slug
 * @param {string} relativePath - 文件相对路径
 * @returns {string} URL 友好的 slug
 */
function generateSlugFromFilename(relativePath) {
    const filename = path.basename(relativePath, '.md');
    // 移除日期前缀（如 2023-05-19-）
    const withoutDate = filename.replace(/^\d{4}-\d{2}-\d{2}-/, '');
    // 转换为 URL 友好格式
    return withoutDate.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, '-').replace(/^-|-$/g, '');
}

/**
 * 检查是否为有效的 slug 格式
 * @param {string} str - 要检查的字符串
 * @returns {boolean} 是否为有效 slug
 */
function isValidSlug(str) {
    // 有效的 slug 只包含小写字母、数字、连字符和斜杠（用于嵌套分类）
    // 不包含中文、emoji 或其他 Unicode 字符（汉字范围 \u4e00-\u9fa5）
    return /^[a-z0-9-/]+$/.test(str);
}

/**
 * 构建分类数组
 * 合并物理目录路径和 frontmatter 中声明的分类
 * @param {string} dirCategory - 从目录路径提取的主分类
 * @param {string[]} frontmatterCategories - frontmatter 中的分类列表
 * @returns {string[]} 去重后的分类数组
 */
function buildCategoriesArray(dirCategory, frontmatterCategories) {
    const categories = new Set();
    
    // 1. 添加物理目录作为主分类
    if (dirCategory && dirCategory !== 'Uncategorized') {
        categories.add(dirCategory);
    }
    
    // 2. 添加 frontmatter 中的分类（仅添加有效的 slug 格式分类）
    if (Array.isArray(frontmatterCategories)) {
        frontmatterCategories.forEach(cat => {
            if (typeof cat === 'string' && cat.trim()) {
                const normalizedCat = cat.trim();
                // 只添加有效的 slug 格式分类
                // 跳过与 dirCategory 相同或是其子级的分类
                if (isValidSlug(normalizedCat) &&
                    normalizedCat !== dirCategory &&
                    !dirCategory.startsWith(normalizedCat + '/') &&
                    !normalizedCat.includes('/')) {
                    categories.add(normalizedCat);
                }
            }
        });
    }
    
    return Array.from(categories);
}

// 主执行
try {
    console.log('正在扫描博客文章...');

    // 确保目录存在
    if (!fs.existsSync(POSTS_DIR)) {
        console.warn(`${POSTS_DIR} 不存在，跳过生成。`);
        process.exit(0);
    }



    // 1. 生成分类列表（递归扫描子目录）
    const categoriesList = [{ slug: 'All', title: 'All' }];
    
    /**
     * 递归获取所有包含 Markdown 文件的目录
     */
    function getCategoryDirs(dir, root = POSTS_DIR) {
        const items = fs.readdirSync(dir);
        let hasMd = false;
        const subDirs = [];

        items.forEach(item => {
            const fullPath = path.join(dir, item);
            if (fs.statSync(fullPath).isDirectory()) {
                subDirs.push(fullPath);
            } else if (item.endsWith('.md')) {
                hasMd = true;
            }
        });

        // 如果当前目录有 MD 文件或是根目录下的直接子目录，将其视为分类
        const relativePath = path.relative(root, dir);
        if (relativePath && (hasMd || !relativePath.includes(path.sep))) {
            let title = path.basename(dir);
            const indexFile = path.join(dir, '_index.md');
            if (fs.existsSync(indexFile)) {
                try {
                    const content = fs.readFileSync(indexFile, 'utf-8');
                    const { data } = matter(content);
                    if (data.title) title = data.title;
                } catch (e) {
                    console.warn(`读取 ${indexFile} 失败:`, e.message);
                }
            }
            // 避免重复添加
            if (!categoriesList.some(c => c.slug === relativePath)) {
                categoriesList.push({ slug: relativePath, title });
            }
        }

        subDirs.forEach(sub => getCategoryDirs(sub, root));
    }

    getCategoryDirs(POSTS_DIR);
    // 按 slug 排序，保证稳定性
    categoriesList.sort((a, b) => {
        if (a.slug === 'All') return -1;
        if (b.slug === 'All') return 1;
        return a.slug.localeCompare(b.slug);
    });

    const allFiles = getFiles(POSTS_DIR);
    const posts = [];

    allFiles.forEach(filePath => {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const { data } = matter(content);

            // 获取相对路径
            const relativePath = path.relative(POSTS_DIR, filePath);

            // 从文件夹名称提取分类
            const dirName = path.dirname(relativePath);
            const dirCategory = dirName === '.' ? 'Uncategorized' : dirName;
            
            // 构建分类数组
            const categories = buildCategoriesArray(dirCategory, data.categories);

            // 仅包含非草稿
            if (!data.draft) {
                const post = {
                    title: data.title || path.basename(filePath, '.md'),
                    date: data.date,
                    file: relativePath,
                    slug: data.slug || generateSlugFromFilename(relativePath),
                    categories: categories,
                    tags: data.tags || []
                };

                // 可选字段：仅在非空时添加
                if (data.lastmod) post.lastmod = data.lastmod;
                if (data.description || data.summary) post.description = data.description || data.summary;
                if (data.cover) post.cover = data.cover;
                if (data.cover_alt) post.cover_alt = data.cover_alt;
                if (data.cover_source) post.cover_source = data.cover_source;
                if (data.cover_source_link) post.cover_source_link = data.cover_source_link;

                // 移除空数组或空字符串类型的默认值，如果它们在逻辑上代表“无”
                if (post.tags.length === 0) delete post.tags;

                posts.push(post);
            }
        } catch (err) {
            console.error(`处理 ${filePath} 时出错:`, err);
        }
    });

    // 按日期降序排序
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 写入文件
    fs.writeFileSync(OUTPUT_ALL, JSON.stringify(posts, null, 2));
    fs.writeFileSync(OUTPUT_CATEGORIES, JSON.stringify(categoriesList, null, 2));

    // 删除旧文件
    const OLD_FILES = [
        path.join(POSTS_DIR, 'latest.json'),
        path.join(POSTS_DIR, 'archive.json')
    ];
    OLD_FILES.forEach(f => {
        if (fs.existsSync(f)) {
            fs.unlinkSync(f);
            console.log(`- 已清理旧文件: ${path.basename(f)}`);
        }
    });

    console.log(`成功生成索引:`);
    console.log(`- 全部文章 (All): ${posts.length}`);
    console.log(`- 分类数量 (Categories): ${categoriesList.length}`);

} catch (e) {
    console.error('生成索引时出错:', e);
}
