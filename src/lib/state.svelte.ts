import type { Component } from 'svelte';

/**
 * 侧边栏状态管理
 */
export class SidebarState {
    // 动态渲染在侧边栏列表区域的组件
    listComponent = $state<Component<any> | null>(null);
    listProps = $state<Record<string, any>>({});

    // 移动端抽屉状态
    isMobileDrawerOpen = $state(false);

    /**
     * 设置列表组件
     * @param component 需要渲染的组件
     * @param props 组件参数
     */
    setList(component: Component<any> | null, props: Record<string, any> = {}) {
        this.listComponent = component;
        this.listProps = props;
    }

    /**
     * 切换移动端抽屉显示状态
     */
    toggleMobileDrawer() {
        this.isMobileDrawerOpen = !this.isMobileDrawerOpen;
    }

    /**
     * 关闭移动端抽屉
     */
    closeMobileDrawer() {
        this.isMobileDrawerOpen = false;
    }

    /**
     * 清除列表内容并关闭抽屉
     */
    clearList() {
        this.listComponent = null;
        this.listProps = {};
        this.isMobileDrawerOpen = false;
    }
}

/**
 * 背景状态管理
 */
export class BackgroundState {
    // 动态背景组件 (优先级高于静态图片)
    component = $state<Component<any> | null>(null);
    props = $state<Record<string, any>>({});

    // UI 主题：'dark' (默认，白字) | 'light' (黑字)
    uiTheme = $state<'dark' | 'light'>('dark');

    /**
     * 设置背景
     * @param component 背景组件
     * @param props 组件参数
     * @param theme UI主题颜色
     */
    set(component: Component<any> | null, props: Record<string, any> = {}, theme: 'dark' | 'light' = 'dark') {
        this.component = component;
        this.props = props;
        this.uiTheme = theme;
    }

    /**
     * 清除背景设置，恢复默认
     */
    clear() {
        this.component = null;
        this.props = {};
        this.uiTheme = 'dark';
    }
}

/**
 * 布局状态管理
 */
export class LayoutState {
    // 内容区域是否透明（用于某些需要全屏展示的场景）
    isContentTransparent = $state(false);

    /**
     * 设置内容透明度
     * @param transparent 是否透明
     */
    setTransparent(transparent: boolean) {
        this.isContentTransparent = transparent;
    }
}

/**
 * 主题状态管理
 */
export class ThemeState {
    // 当前偏好: 'light' | 'dark' | 'system'
    preference = $state<'light' | 'dark' | 'system'>('system');

    // 当前实际是否是暗色模式 (用于 UI 渲染判断)
    isDark = $state(false);

    constructor() {
        if (typeof window !== 'undefined') {
            // 初始化
            const saved = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
            this.preference = saved || 'system';
            this.updateSystem();

            // 监听系统变化
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (this.preference === 'system') {
                    this.setDark(e.matches);
                }
            });
        }
    }

    /**
     * 设置实际的 DOM 类名
     */
    private setDark(isDark: boolean) {
        this.isDark = isDark;
        if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', isDark);
            // 更新 meta theme-color
            const meta = document.querySelector('meta[name="theme-color"]');
            if (meta) {
                meta.setAttribute('content', isDark ? '#000000' : '#ffffff');
            }
        }
    }

    /**
     * 内部更新逻辑
     */
    private updateSystem() {
        if (typeof window === 'undefined') return;

        if (this.preference === 'system') {
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.setDark(systemDark);
        } else {
            this.setDark(this.preference === 'dark');
        }
    }

    /**
     * 设置主题偏好
     */
    setPreference(pref: 'light' | 'dark' | 'system') {
        this.preference = pref;

        if (typeof window !== 'undefined') {
            if (pref === 'system') {
                localStorage.removeItem('theme');
            } else {
                localStorage.setItem('theme', pref);
            }
        }

        this.updateSystem();
    }

    /**
     * 循环切换：Light -> Dark -> System
     */
    cycle() {
        const order: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
        const nextIndex = (order.indexOf(this.preference) + 1) % order.length;
        this.setPreference(order[nextIndex]);
    }
}

// 导出全局单例状态
export const sidebarState = new SidebarState();
export const backgroundState = new BackgroundState();
export const layoutState = new LayoutState();
export const themeState = new ThemeState();
