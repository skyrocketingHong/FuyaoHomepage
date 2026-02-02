/**
 * 博客业务领域逻辑工具集
 * 
 * 提供分类视觉映射、路径生成、名称查找等核心业务逻辑。
 * 
 * 调用示例：
 * ```ts
 * import { getPostUrl } from '$lib/utils/domain/blog';
 * const url = getPostUrl(post, activeCategory);
 * ```
 */
import { Code, Cpu, FileText, Coffee, Newspaper, BookOpen, Hash, Zap, Globe, Sparkles, PenTool } from 'lucide-svelte';
import { t } from '$lib/i18n/store';
import { get } from 'svelte/store';

/**
 * 博客主题配置
 */
export const BLOG_THEMES = [
    { gradient: 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-400/20 dark:to-cyan-400/20', color: 'text-blue-600 dark:text-blue-400' },
    { gradient: 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-400/20 dark:to-pink-400/20', color: 'text-purple-600 dark:text-purple-400' },
    { gradient: 'bg-gradient-to-br from-orange-500/10 to-amber-500/10 dark:from-orange-400/20 dark:to-amber-400/20', color: 'text-orange-600 dark:text-orange-400' },
    { gradient: 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-400/20 dark:to-teal-400/20', color: 'text-emerald-600 dark:text-emerald-400' },
    { gradient: 'bg-gradient-to-br from-rose-500/10 to-red-500/10 dark:from-rose-400/20 dark:to-red-400/20', color: 'text-rose-600 dark:text-rose-400' },
    { gradient: 'bg-gradient-to-br from-indigo-500/10 to-violet-500/10 dark:from-indigo-400/20 dark:to-violet-400/20', color: 'text-indigo-600 dark:text-indigo-400' },
];

/**
 * 根据分类名称获取对应的视觉样式和图标
 * @param category 分类名称
 */
export function getCategoryVisuals(category: string) {
    const cat = (category || 'uncategorized').toLowerCase();
    
    // 1. 图标选择
    let icon = Hash;
    if (cat.includes('code') || cat.includes('dev') || cat.includes('git')) icon = Code;
    else if (cat.includes('beta') || cat.includes('tech') || cat.includes('ai') || cat.includes('mac')) icon = Cpu;
    else if (cat.includes('resource') || cat.includes('file') || cat.includes('doc')) icon = FileText;
    else if (cat.includes('learn') || cat.includes('read') || cat.includes('book')) icon = BookOpen;
    else if (cat.includes('life') || cat.includes('think') || cat.includes('me')) icon = Coffee;
    else if (cat.includes('web') || cat.includes('net')) icon = Globe;
    else if (cat.includes('game') || cat.includes('play')) icon = Zap;
    else if (cat.includes('design') || cat.includes('art') || cat.includes('ui')) icon = PenTool;
    else if (cat.includes('news') || cat.includes('update')) icon = Newspaper;
    else if (cat.includes('star') || cat.includes('best')) icon = Sparkles;

    // 2. 颜色选择 (确定性哈希)
    let hash = 0;
    for (let i = 0; i < cat.length; i++) {
        hash += cat.charCodeAt(i);
    }
    const theme = BLOG_THEMES[hash % BLOG_THEMES.length];

    return {
        gradient: theme.gradient,
        color: theme.color,
        icon: icon
    };
}

interface Post {
    slug: string;
    category: string;
    categories?: string[];
    [key: string]: unknown;
}

/**
 * 获取文章的完整 URL 路径
 * @param post 文章对象
 * @param activeCategory 当前激活的分类
 */
export function getPostUrl(post: Post, activeCategory: string = 'All') {
    const cats = post.categories || (post.category ? [post.category] : []);
    const targetCategory = (activeCategory !== 'All' && cats.includes(activeCategory)) 
        ? activeCategory 
        : (cats[0] || 'Uncategorized');
    
    const postPath = !targetCategory || targetCategory === 'Uncategorized' 
        ? post.slug 
        : `${targetCategory}/${post.slug}`;
        
    return `/blog/${postPath}/`;
}

/**
 * 获取分类标题
 * @param slug 分类 slug
 * @param categories 分类配置列表
 */
export function getCategoryTitle(slug: string, categories: { slug: string; title: string }[] = []) {
    if (slug === 'All') return get(t)('blog.all');
    const cat = categories.find(c => c.slug === slug);
    return cat ? cat.title : slug;
}

/**
 * 获取博客列表页面的规范 URL
 * @param category 分类 (可选)
 * @param tag 标签 (可选)
 */
export function getBlogListUrl(category: string = 'All', tag: string = '') {
    let path = '/blog';
    
    if (category && category !== 'All') {
        path += `/${category}`;
    }
    
    if (tag) {
        path += `/tag/${encodeURIComponent(tag)}`;
    }
    
    // 始终添加末尾斜杠以匹配 trailingSlash = 'always'
    return `${path}/`;
}
