/**
 * RSS Feed 生成器
 * 
 * 根据博客文章生成标准的 RSS 2.0 格式 Feed
 * 访问路径：/blog/rss.xml
 */

import { seoConfig } from '$lib/config';
import fs from 'fs';
import path from 'path';

export const prerender = true;

/**
 * 博客文章接口
 */
interface BlogPost {
    title: string;
    date: string;
    file: string;
    slug: string;
    categories?: string[];
    tags?: string[];
    description?: string;
    cover?: string;
    lastmod?: string;
}

/**
 * 转义 XML 特殊字符
 * 
 * @param text 原始文本
 * @returns 转义后的文本
 */
function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * 格式化日期为 RFC 822 格式
 * 
 * @param dateString ISO 日期字符串
 * @returns RFC 822 格式日期
 */
function formatRfc822Date(dateString: string): string {
    const date = new Date(dateString);
    return date.toUTCString();
}

/**
 * 生成 RSS Feed
 */
export async function GET() {
    const siteUrl = seoConfig.baseURL.replace(/\/$/, '');
    const siteName = seoConfig.author || '扶摇skyrocketing';
    const siteDescription = seoConfig.description || '个人博客';

    let posts: BlogPost[] = [];
    
    try {
        const postsDir = path.join(process.cwd(), 'static/posts');
        const allPostsPath = path.join(postsDir, 'all.json');

        if (fs.existsSync(allPostsPath)) {
            posts = JSON.parse(fs.readFileSync(allPostsPath, 'utf-8'));
        }
    } catch (e) {
        console.error('Error reading blog index for RSS:', e);
    }

    // 按日期排序（最新在前）
    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 生成 RSS 条目
    const items = posts.map(post => {
        // 获取第一个分类作为主分类
        const primaryCategory = post.categories?.[0] || '';
        const postUrl = primaryCategory 
            ? `${siteUrl}/blog/${primaryCategory}/${post.slug}/`
            : `${siteUrl}/blog/${post.slug}/`;
        
        const pubDate = formatRfc822Date(post.date);
        const description = post.description || post.title;
        
        // 构建分类标签
        const categoryTags = (post.categories || [])
            .map(cat => `        <category>${escapeXml(cat)}</category>`)
            .join('\n');

        return `    <item>
        <title>${escapeXml(post.title)}</title>
        <link>${postUrl}</link>
        <guid isPermaLink="true">${postUrl}</guid>
        <pubDate>${pubDate}</pubDate>
        <description>${escapeXml(description)}</description>
${categoryTags}
    </item>`;
    }).join('\n');

    // 构建 RSS Feed
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>${escapeXml(siteName)}</title>
        <link>${siteUrl}</link>
        <description>${escapeXml(siteDescription)}</description>
        <language>zh-CN</language>
        <lastBuildDate>${formatRfc822Date(new Date().toISOString())}</lastBuildDate>
        <atom:link href="${siteUrl}/blog/rss.xml" rel="self" type="application/rss+xml"/>
${items}
    </channel>
</rss>`;

    return new Response(rss, {
        headers: {
            'Content-Type': 'application/rss+xml; charset=utf-8',
            'Cache-Control': 'max-age=0, s-maxage=3600'
        }
    });
}
