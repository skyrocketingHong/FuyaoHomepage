import { Home, BookOpen, MapPin, CreditCard, Users } from 'lucide-svelte';

export interface NavItem {
    i18nKey: string; // i18n翻译键
    href: string;  // 链接路径
    icon: any; // 图标组件
}

// 导航菜单配置
export const navItems: NavItem[] = [
    { i18nKey: 'nav.home', href: '/home', icon: Home },
    { i18nKey: 'nav.blog', href: '/blog', icon: BookOpen },
    //{ i18nKey: 'nav.footprint', href: '/footprint', icon: MapPin },
    { i18nKey: 'nav.pay', href: '/pay', icon: CreditCard },
    { i18nKey: 'nav.friends', href: '/friends', icon: Users },
];
