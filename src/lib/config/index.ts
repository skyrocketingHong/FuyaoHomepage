import { Home, BookOpen, MapPin, CreditCard, Users, Image } from 'lucide-svelte';
import type { ComponentType } from 'svelte';
import type { Pathname } from '$app/types';
import { publicConfig } from './public';

/**
 * 导航项接口定义
 */
export interface NavItem {
	/** i18n 翻译键 */
	i18nKey: string;
	/** 链接路径 */
	href: Pathname;
	/** 图标组件 */
	icon: ComponentType;
	/** SEO 配置（可选） */
	seo?: {
		/** 可选的标题覆盖 */
		title?: string;
		/** 页面描述 */
		description?: string;
		/** 页面关键词 */
		keywords?: string[];
	};
	/** 是否拥有侧边栏列表 (用于控制路由切换时的列表清理) */
	hasSidebarList?: boolean;
	/** 背景模式 (可选，覆盖默认行为) */
	backgroundMode?: BackgroundMode;
	/** 内容区域是否可滚动 (默认 true；固定视口页面如足迹地图、赞赏页设为 false) */
	contentScrollable?: boolean;
}

/**
 * 网站 SEO 全局配置
 *
 * 从构建时校验的公开配置白名单读取，不直接访问环境变量。
 */
export const seoConfig = {
	/** 网站域名（基础 URL） */
	baseURL: publicConfig.site.url.replace(/\/$/, ''),
	/** 网站起始日期 */
	startDate: publicConfig.site.startDate,
	/** 网站名称 */
	siteName: publicConfig.site.name,
	/** 网站默认描述 */
	description: publicConfig.seo.description,
	/** 网站关键词列表 */
	keywords: publicConfig.seo.keywords,
	/** 作者名称 */
	author: publicConfig.seo.author,
	/** Twitter 用户名 */
	twitterId: publicConfig.seo.twitterId,
	/** GitHub 主页链接 */
	github: `https://github.com/${publicConfig.repository.owner}`
};

/**
 * 导航菜单配置
 *
 * 定义网站的主导航菜单项，包含首页、博客、赞赏、友链等。
 */
export const navItems: NavItem[] = [
	{
		i18nKey: 'nav.home',
		href: '/',
		icon: Home,
		seo: {
			description: `${seoConfig.author}的个人主页首页，包含最新动态和个人简介。`,
			keywords: ['首页', 'Dashboard', '个人中心']
		},
		backgroundMode: 'mosaic'
	},
	{
		i18nKey: 'nav.footprint',
		href: '/footprint/',
		icon: MapPin,
		seo: {
			description: `${seoConfig.author}的足迹，记录我走过的城市和地方。`,
			keywords: ['足迹', '足迹记录', '足迹追踪']
		},
		hasSidebarList: true,
		backgroundMode: 'none',
		contentScrollable: false
	},
	{
		i18nKey: 'nav.blog',
		href: '/blog/',
		icon: BookOpen,
		seo: {
			description: `${seoConfig.author}的博客文章，分享技术教程、生活感悟和思考随笔。`,
			keywords: ['博客', '文章', '技术教程', '随笔']
		},
		hasSidebarList: true,
		backgroundMode: 'mosaic'
	},
	{
		i18nKey: 'nav.album',
		href: '/albums/' as Pathname,
		icon: Image,
		seo: {
			description: `${seoConfig.author}的时光相册，记录生活中的美好瞬间。`,
			keywords: ['相册', '照片', '时光相册', '图集']
		},
		hasSidebarList: true,
		backgroundMode: 'mosaic'
	},
	{
		i18nKey: 'nav.pay',
		href: '/pay/',
		icon: CreditCard,
		seo: {
			description: `${seoConfig.author}的赞赏支持，如果您觉得我的内容对您有帮助，欢迎赞赏支持。`,
			keywords: ['赞赏', '捐赠', '支持']
		},
		backgroundMode: 'mosaic',
		contentScrollable: false
	},
	{
		i18nKey: 'nav.friends',
		href: '/friends/',
		icon: Users,
		seo: {
			description: `${seoConfig.author}的友情链接，我的朋友们和推荐的优质网站。`,
			keywords: ['友链', '朋友圈', '推荐网站']
		},
		backgroundMode: 'mosaic'
	}
];

/**
 * 获取头像 URL
 *
 * 优先使用环境变量配置的 URL，否则使用 GitHub 头像。
 */
export function getAvatarUrl(): string {
	return publicConfig.profile.avatarUrl;
}

/**
 * 个人资料配置
 */
export const profileConfig = {
	/** 姓名 (使用 SEO 作者名) */
	name: publicConfig.profile.name,
	/** 角色/职业 (多语言) */
	role: {
		zh: publicConfig.profile.roles['zh-CN'],
		en: publicConfig.profile.roles['en-US']
	},
	/** 个性签名 (多语言) */
	quote: {
		zh: publicConfig.profile.quotes['zh-CN'],
		en: publicConfig.profile.quotes['en-US']
	},
	/** 头像 URL */
	avatar: getAvatarUrl()
};

/**
 * 获取仓库配置
 */
export const repoConfig = {
	/** 仓库地址 */
	url: publicConfig.repository.url,
	/** 仓库名称 */
	name: publicConfig.repository.name
};

/**
 * 背景模式定义
 */
export type BackgroundMode = 'none' | 'image' | 'solid' | 'flowing' | 'mosaic';

/**
 * 博客页面类型
 *
 * 由页面 load 函数解析并写入 page.data，不依赖 route id 或路径段数量猜测：
 * 列表/分类/标签/搜索使用马赛克全局背景，单篇文章使用纯白阅读背景。
 */
export type BlogPageKind =
	| 'blog-list'
	| 'blog-category'
	| 'blog-tag'
	| 'blog-search'
	| 'blog-article';

/**
 * 获取服务端／通用 load 已解析的博客页面类型
 *
 * @param pageData 当前页面的合并 load 数据
 * @param routeId 当前 route id，仅用于博客根页和搜索页的异常兜底
 * @returns 博客页面类型；非博客路由返回 null
 */
export function getBlogPageKind(
	pageData: { blogPageKind?: BlogPageKind } | null | undefined,
	routeId: string | null = null
): BlogPageKind | null {
	if (pageData?.blogPageKind) return pageData.blogPageKind;
	if (routeId === '/blog/(main)') return 'blog-list';
	if (routeId === '/blog/(main)/search') return 'blog-search';
	return null;
}

/**
 * 背景策略：路由背景模式 + 是否允许用户切换
 *
 * 足迹页 (none) 与博客文章页 (solid) 属于语义背景，为锁定模式：
 * switchable 为 false，用户背景偏好不得覆盖，且 Header 不渲染背景切换器。
 */
export interface BackgroundPolicy {
	/** 路由背景模式 */
	mode: BackgroundMode;
	/** 是否允许用户切换背景 (false 时用户偏好被锁定，背景切换器不渲染) */
	switchable: boolean;
}

/**
 * 根据路径与路由标识获取背景策略
 *
 * @param pathname 当前路径
 * @param pageData 当前页面的合并 load 数据
 * @param routeId 当前 route id，仅用于静态博客页面的异常兜底
 * @returns BackgroundPolicy (背景模式 + 是否允许用户切换)
 */
export function getBackgroundPolicy(
	pathname: string,
	pageData?: { blogPageKind?: BlogPageKind } | null,
	routeId?: string | null
): BackgroundPolicy {
	// 博客页面按页面类型明确区分：列表类马赛克 (可切换)，文章页阅读背景 (锁定)
	const blogKind = getBlogPageKind(pageData, routeId ?? null);
	if (blogKind === 'blog-article') return { mode: 'solid', switchable: false };
	if (blogKind) return { mode: 'mosaic', switchable: true };

	// 查找匹配的导航项
	const activeItem = navItems.find((item) => {
		// 简单匹配：只要 pathname 以 item.href 开头 (且 item.href 不是 '/'，除非 pathname 也是 '/')
		if (item.href === '/') return pathname === '/';
		return pathname.startsWith(item.href);
	});

	// 语义背景 (none/solid) 锁定，其余模式允许用户偏好覆盖
	const mode = activeItem?.backgroundMode ?? 'mosaic';
	return { mode, switchable: mode !== 'none' && mode !== 'solid' };
}

/**
 * 根据路径与路由标识获取背景模式
 *
 * @param pathname 当前路径
 * @param pageData 当前页面的合并 load 数据
 * @param routeId 当前 route id，仅用于静态博客页面的异常兜底
 * @returns BackgroundMode
 */
export function getBackgroundMode(
	pathname: string,
	pageData?: { blogPageKind?: BlogPageKind } | null,
	routeId?: string | null
): BackgroundMode {
	return getBackgroundPolicy(pathname, pageData, routeId).mode;
}

/**
 * 根据路径获取内容区域是否可滚动
 *
 * 默认可滚动；仅固定视口页面（如足迹地图、赞赏页）配置为 false。
 * 该配置是内容滚动模式的唯一来源，页面不得再自行修改全局滚动状态。
 *
 * @param pathname 当前路径
 * @returns 是否可滚动
 */
export function getContentScrollable(pathname: string): boolean {
	const activeItem = navItems.find((item) => {
		if (item.href === '/') return pathname === '/';
		return pathname.startsWith(item.href);
	});

	return activeItem?.contentScrollable ?? true;
}
