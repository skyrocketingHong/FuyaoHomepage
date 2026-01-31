
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
            priority: item.href === '/home' ? '1.0' : '0.8',
            lastmod: new Date().toISOString()
        };
    });

    // 2. Blog Posts
    let blogPosts: any[] = [];
    try {
        const postsDir = path.join(process.cwd(), 'static/posts');
        const latestPath = path.join(postsDir, 'latest.json');
        const archivePath = path.join(postsDir, 'archive.json');

        if (fs.existsSync(latestPath) && fs.existsSync(archivePath)) {
            const latest = JSON.parse(fs.readFileSync(latestPath, 'utf-8'));
            const archive = JSON.parse(fs.readFileSync(archivePath, 'utf-8'));
            const allPosts = [...latest, ...archive];

            blogPosts = allPosts.map(post => {
                // Construct URL based on logic: category/slug or just slug if Uncategorized
                // In generate-blog-index.js: 
                // const fullPath = p.category === 'Uncategorized' ? p.slug : `${p.category}/${p.slug}`;
                // However, the real URL is /blog/[...path]
                const urlPath = post.category === 'Uncategorized' ? post.slug : `${post.category}/${post.slug}`;

                return {
                    loc: `${siteUrl}/blog/${urlPath}`,
                    changefreq: 'weekly',
                    priority: '0.6',
                    lastmod: post.lastmod || post.date // Use lastmod if available, otherwise date
                };
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
