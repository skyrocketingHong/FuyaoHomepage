/**
 * 博客文章加载工具
 * 
 * 负责 fetching Markdown 文件、解析 Frontmatter 以及聚合文章元数据。
 */
import { loadText } from '$lib/utils/network/loading';
import yaml from 'js-yaml';
import { getCategoryTitle } from '$lib/utils/domain/blog';

export interface PostContent {
    content: string;
    metadata: any;
    loadedFile: string;
}

/**
 * 加载并解析博客文章内容
 * 
 * @param post - 原始文章对象 (列表数据)
 * @param categories - 分类配置列表
 * @returns 解析后的完整文章数据对象
 */
export async function loadPostContent(post: any, categories: { slug: string; title: string }[] = []) {
    if (!post || !post.file) {
        throw new Error('Invalid post data');
    }

    const text = await loadText(`/posts/${post.file}`);
    let cleanText = text;
    let additionalMetadata: any = {};
    
    // 解析 Frontmatter
    const frontmatterMatch = text.match(/^\uFEFF?---([\s\S]+?)---/);
    if (frontmatterMatch) {
        try {
            additionalMetadata = yaml.load(frontmatterMatch[1]) as any;
            cleanText = text.replace(/^\uFEFF?---[\s\S]+?---\s*/, '');
        } catch (e) {
            console.error('Frontmatter parse error', e);
            additionalMetadata = {};
        }
    }

    const cats = post.categories || (post.category ? [post.category] : []);
    
    // 聚合数据: 优先使用 Frontmatter 中的元数据覆盖列表中的元数据
    const aggregatedPost = {
        ...post,
        ...additionalMetadata,
        date: additionalMetadata.date ? new Date(additionalMetadata.date).toISOString().split('T')[0] : post.date,
        lastmod: additionalMetadata.lastmod ? new Date(additionalMetadata.lastmod).toISOString().split('T')[0] : (post.lastmod || ''),
        categoryTitles: cats.map((c: string) => ({ slug: c, title: getCategoryTitle(c, categories) })),
        categories: cats,
        tags: additionalMetadata.tags || post.tags || []
    };

    return {
        content: cleanText,
        displayPost: aggregatedPost,
        loadedFile: post.file
    };
}
