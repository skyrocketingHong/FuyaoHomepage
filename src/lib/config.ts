import { Home, BookOpen, MapPin, CreditCard, Users } from 'lucide-svelte';

/**
 * 导航项接口定义
 */
export interface NavItem {
    /** i18n 翻译键 */
    i18nKey: string;
    /** 链接路径 */
    href: string;
    /** 图标组件 */
    icon: any;
    /** SEO 配置（可选） */
    seo?: {
        /** 可选的标题覆盖 */
        title?: string;
        /** 页面描述 */
        description?: string;
        /** 页面关键词 */
        keywords?: string[];
    };
}

/**
 * 导航菜单配置
 *
 * 定义网站的主导航菜单项，包含首页、博客、赞赏、友链等。
 */
export const navItems: NavItem[] = [
    {
        i18nKey: 'nav.home',
        href: '/home',
        icon: Home,
        seo: {
            description: '扶摇skyrocketing的个人主页首页，包含最新动态和个人简介。',
            keywords: ['首页', 'Dashboard', '个人中心']
        }
    },
    {
        i18nKey: 'nav.blog',
        href: '/blog',
        icon: BookOpen,
        seo: {
            description: '扶摇skyrocketing的博客文章，分享技术教程、生活感悟和思考随笔。',
            keywords: ['博客', '文章', '技术教程', '随笔']
        }
    },
    //{ i18nKey: 'nav.footprint', href: '/footprint', icon: MapPin },
    {
        i18nKey: 'nav.pay',
        href: '/pay',
        icon: CreditCard,
        seo: {
            description: '扶摇skyrocketing的赞赏支持，如果您觉得我的内容对您有帮助，欢迎赞赏支持。',
            keywords: ['赞赏', '捐赠', '支持']
        }
    },
    {
        i18nKey: 'nav.friends',
        href: '/friends',
        icon: Users,
        seo: {
            description: '扶摇skyrocketing的友情链接，我的朋友们和推荐的优质网站。',
            keywords: ['友链', '朋友圈', '推荐网站']
        }
    },
];

/**
 * 网站 SEO 全局配置
 *
 * 从环境变量读取配置，支持自定义域名、描述、关键词等。
 */
export const seoConfig = {
    /** 网站域名（基础 URL） */
    baseURL: import.meta.env.VITE_SITE_URL,
    /** 网站默认描述 */
    description: import.meta.env.VITE_SEO_DESCRIPTION,
    /** 网站关键词列表 */
    keywords: import.meta.env.VITE_SEO_KEYWORDS,
    /** 作者名称 */
    author: import.meta.env.VITE_SEO_AUTHOR,
    /** Twitter 用户名 */
    twitterId: import.meta.env.VITE_TWITTER_ID,
    /** GitHub 主页链接 */
    github: `https://github.com/${import.meta.env.VITE_GITHUB_USERNAME}`,
};

/**
 * 获取头像 URL
 *
 * 优先使用环境变量配置的 URL，否则使用 GitHub 头像。
 */
export function getAvatarUrl(): string {
    const customAvatar = import.meta.env.VITE_AVATAR_URL;
    if (customAvatar) return customAvatar;
    const username = import.meta.env.VITE_GITHUB_USERNAME;
    return `https://github.com/${username}.png`;
}

/**
 * 获取仓库配置
 */
export const repoConfig = {
    /** 仓库地址 */
    url: import.meta.env.VITE_REPO_URL,
    /** 仓库名称 */
    name: import.meta.env.VITE_REPO_NAME,
};

