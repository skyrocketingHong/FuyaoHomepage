import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// 定义路径
const POSTS_DIR = path.join(process.cwd(), 'static/posts');
const OUTPUT_LATEST = path.join(POSTS_DIR, 'latest.json');
const OUTPUT_ARCHIVE = path.join(POSTS_DIR, 'archive.json');
const OUTPUT_CATEGORIES = path.join(POSTS_DIR, 'categories.json');
const OUTPUT_MAP = path.join(POSTS_DIR, 'map.json');

// 常量定义
const LATEST_COUNT = 24;

// 获取递归文件的辅助函数
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

// 解析所有分类的 _index.md 标题
function getCategoryTitles(postsDir) {
    const titles = {};

    function scanDir(dir, relativePath = '') {
        if (!fs.existsSync(dir)) return;

        const files = fs.readdirSync(dir);

        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                const newRelativePath = relativePath ? `${relativePath}/${file}` : file;
                scanDir(filePath, newRelativePath);
            } else if (file === '_index.md') {
                try {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    const { data } = matter(content);
                    if (data.title && relativePath) {
                        titles[relativePath] = data.title;
                    }
                } catch (e) {
                    console.warn(`解析 ${filePath} 失败:`, e.message);
                }
            }
        });
    }

    scanDir(postsDir);
    return titles;
}

// 生成友好的分类标题（支持多层级拼接）
function getCategoryTitle(category, categoryTitles) {
    if (category === 'Uncategorized') return category;

    const parts = category.split('/');
    const titleParts = [];

    let currentPath = '';
    for (const part of parts) {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        titleParts.push(categoryTitles[currentPath] || part);
    }

    return titleParts.join(' / ');
}

// 从文件名生成默认 slug
function generateSlugFromFilename(relativePath) {
    const filename = path.basename(relativePath, '.md');
    // 移除日期前缀 (如 2023-05-19-)
    const withoutDate = filename.replace(/^\d{4}-\d{2}-\d{2}-/, '');
    // 转换为 URL 友好格式
    return withoutDate.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, '-').replace(/^-|-$/g, '');
}

// 主执行
try {
    console.log('正在扫描博客文章...');

    // 确保目录存在
    if (!fs.existsSync(POSTS_DIR)) {
        console.warn(`${POSTS_DIR} 不存在，跳过生成。`);
        process.exit(0);
    }

    // 1. 解析所有分类标题
    const categoryTitles = getCategoryTitles(POSTS_DIR);

    // 2. 生成 Categories List (Slug -> Title)
    // 提取所有唯一分类
    // 注意：这里我们只列出有文章的分类，或者有 _index.md 的分类。
    // 为了简单，我们只列出有 _index.md 定义的分类，或者全量扫描后提取。
    // 这里采用：使用 categoryTitles 中的所有键作为分类列表
    const categoriesList = [{ slug: 'All', title: 'All' }]; // 这里以后可以做 i18n
    Object.keys(categoryTitles).sort().forEach(slug => {
        categoriesList.push({
            slug,
            title: categoryTitles[slug]
        });
    });

    const allFiles = getFiles(POSTS_DIR);
    const posts = [];

    allFiles.forEach(filePath => {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const { data } = matter(content);

            // 获取前端获取的相对路径
            const relativePath = path.relative(POSTS_DIR, filePath);

            // 从文件夹名称提取分类
            const dirName = path.dirname(relativePath);
            const category = dirName === '.' ? 'Uncategorized' : dirName;

            // 仅包含非草稿
            if (!data.draft) {
                posts.push({
                    title: data.title || path.basename(filePath, '.md'),
                    date: data.date,
                    lastmod: data.lastmod,
                    file: relativePath,
                    slug: data.slug || generateSlugFromFilename(relativePath),
                    category: category,
                    categoryTitle: getCategoryTitle(category, categoryTitles),
                    tags: data.tags || [],
                    description: data.description || data.summary || '',
                    cover: data.cover || '',
                    cover_alt: data.cover_alt || '',
                    cover_source: data.cover_source || '',
                    cover_source_link: data.cover_source_link || ''
                });
            }
        } catch (err) {
            console.error(`处理 ${filePath} 时出错:`, err);
        }
    });

    // 按日期降序排序
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 3. 生成 Latest 和 Archive
    const latestPosts = posts.slice(0, LATEST_COUNT);
    const archivePosts = posts.slice(LATEST_COUNT);

    // 4. 生成 Map (Slug -> Metadata 轻量级)
    // 用于快速查找任意 slug 对应的文件路径，解决 Deep Linking 问题
    // Key: slug (注意：如果有重名 slug 可能会冲突，最好加上 category 前缀或者保证 slug 唯一。
    // 目前逻辑 BlogHome 使用 category/slug 作为 path，但 map 最好能通过 slug 直接找到，或者我们存储完整 path map)
    // 既然前端路由是 [...path]，可能是 category/slug 或 slug。
    // 我们生成一个 map:  "category/slug": { ...metadata } AND "slug": { ...metadata } (backup)
    const postMap = {};
    posts.forEach(p => {
        // Full path key
        const fullPath = p.category === 'Uncategorized' ? p.slug : `${p.category}/${p.slug}`;
        const minimalData = {
            file: p.file,
            title: p.title,
            category: p.category,
            categoryTitle: p.categoryTitle,
            date: p.date
        };
        postMap[fullPath] = minimalData;

        // Short slug key (backup, only if not exists to avoid overwrite)
        if (!postMap[p.slug]) {
            postMap[p.slug] = minimalData;
        }
    });

    // 写入文件
    fs.writeFileSync(OUTPUT_LATEST, JSON.stringify(latestPosts, null, 2));
    fs.writeFileSync(OUTPUT_ARCHIVE, JSON.stringify(archivePosts, null, 2));
    fs.writeFileSync(OUTPUT_CATEGORIES, JSON.stringify(categoriesList, null, 2));
    fs.writeFileSync(OUTPUT_MAP, JSON.stringify(postMap, null, 2));

    console.log(`成功生成索引:`);
    console.log(`- 最新文章 (Latest): ${latestPosts.length}`);
    console.log(`- 归档文章 (Archive): ${archivePosts.length}`);
    console.log(`- 分类数量 (Categories): ${categoriesList.length}`);
    console.log(`- 映射条目 (Map Entries): ${Object.keys(postMap).length}`);

} catch (e) {
    console.error('生成索引时出错:', e);
}
