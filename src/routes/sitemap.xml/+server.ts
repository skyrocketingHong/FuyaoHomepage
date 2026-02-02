
import { navItems, seoConfig } from '$lib/config';
import fs from 'fs';
import path from 'path';

export const prerender = true;

/**
 * Generates the sitemap.xml
 */
export async function GET() {
    const siteUrl = seoConfig.baseURL.replace(/\/$/, '');

    // 1. Static Pages
    const staticPages = navItems.map(item => {
        return {
            loc: `${siteUrl}${item.href}`,
            changefreq: 'daily',
            priority: item.href === '/home/' ? '1.0' : '0.8',
            lastmod: new Date().toISOString()
        };
    });

    // 2. Blog Posts
    let blogPosts: { loc: string; changefreq: string; priority: string; lastmod: string }[] = [];
    try {
        const postsDir = path.join(process.cwd(), 'static/posts');
        const allPostsPath = path.join(postsDir, 'all.json');

        if (fs.existsSync(allPostsPath)) {
            const allPosts = JSON.parse(fs.readFileSync(allPostsPath, 'utf-8'));

            // 为多分类文章生成多个 URL
            blogPosts = allPosts.flatMap((post: { categories?: string[]; slug: string; lastmod?: string; date: string }) => {
                const cats = post.categories || [];
                if (cats.length === 0) {
                    // 无分类的文章
                    return [{
                        loc: `${siteUrl}/blog/${post.slug}/`,
                        changefreq: 'weekly',
                        priority: '0.6',
                        lastmod: post.lastmod || post.date
                    }];
                }
                
                // 为每个分类生成一个 URL
                return cats.map((category: string) => ({
                    loc: `${siteUrl}/blog/${category}/${post.slug}/`,
                    changefreq: 'weekly',
                    priority: '0.6',
                    lastmod: post.lastmod || post.date
                }));
            });
        }
    } catch (e) {
        console.error('Error reading blog index for sitemap:', e);
    }

    // 3. Combine and Generate XML
    const urls = [...staticPages, ...blogPosts];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `    <url>
        <loc>${url.loc}</loc>
        <lastmod>${url.lastmod}</lastmod>
        <changefreq>${url.changefreq}</changefreq>
        <priority>${url.priority}</priority>
    </url>`).join('\n')}
</urlset>`;

    return new Response(sitemap, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'max-age=0, s-maxage=3600'
        }
    });
}
