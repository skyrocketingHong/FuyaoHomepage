/**
 * 应用级全局状态管理
 *
 * 提供侧边栏、背景、布局、主题、顶部导航栏等核心状态的集中管理。
 * 所有状态类均以 Svelte 5 runes ($state) 实现响应性。
 */
import type { Component } from 'svelte';
import type { SidebarViewMode } from '$lib/types/sidebar';

/**
 * 侧边栏状态管理
 */
export class SidebarState {
	/** 动态渲染在侧边栏列表区域的组件 */
	listComponent = $state<Component | null>(null);
	/** 列表组件参数 */
	listProps = $state<Record<string, unknown>>({});
	/** 列表标题 (支持 i18n key) */
	listTitle = $state<string>('');

	/** 当前视图模式 ID */
	viewMode = $state<string>('');
	/** 可用的视图模式列表 */
	availableModes = $state<SidebarViewMode[]>([]);

	/** 移动端抽屉是否展开 */
	isMobileDrawerOpen = $state(false);

	/** 当前列表的唯一标识符，用于防止页面切换时的竞态条件 */
	currentListId = $state<string>('');

	/** 当前激活项 ID，独立追踪以避免通过 listProps 传递时的响应性丢失 */
	activeId = $state<string | undefined>(undefined);

	/**
	 * 设置列表组件
	 * @param component 需要渲染的组件
	 * @param props 组件参数
	 * @param title 列表标题 (支持 i18n key)
	 * @returns uniqueId 返回当前列表的唯一ID，需要在组件销毁时传回给 clearList
	 */
	setList(
		component: Component | null,
		props: Record<string, unknown> = {},
		title: string = '',
		modes: SidebarViewMode[] = []
	) {
		const id = Math.random().toString(36).substring(7);
		this.listComponent = component;
		this.listProps = props;
		// 提取 activeId 到独立状态
		this.activeId = props.activeId as string | undefined;

		this.listTitle = title;
		this.currentListId = id;

		// 设置可用模式
		this.availableModes = modes;
		if (modes.length > 0) {
			this.viewMode = modes[0].id; // 默认选中第一个
		} else {
			this.viewMode = '';
		}

		return id;
	}

	/**
	 * 设置视图模式
	 */
	setViewMode(modeId: string) {
		this.viewMode = modeId;
	}

	/**
	 * 显式设置 ActiveId
	 * 推荐使用此方法而不是通过 props 传递，以获得更好的类型提示和确定的响应性
	 */
	setActiveId(id: string | undefined) {
		this.activeId = id;
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
	 * 更新列表组件参数
	 * @param id 创建列表时返回的ID。
	 * @param props 新的组件参数
	 */
	updateList(id: string, props: Record<string, unknown>) {
		if (id && id !== this.currentListId) {
			return;
		}
		this.listProps = props;
		// 同步更新 activeId，确保响应性能穿透
		if ('activeId' in props) {
			this.activeId = props.activeId as string | undefined;
		}
	}

	/**
	 * 清除列表内容并关闭抽屉
	 * @param id 创建列表时返回的ID。如果不提供，或ID匹配当前列表ID，则执行清除。
	 */
	clearList(id?: string) {
		// 如果提供了ID，且不匹配当前ID，说明是旧页面的清理调用，应忽略
		if (id && id !== this.currentListId) {
			return;
		}

		this.listComponent = null;
		this.listProps = {};
		this.activeId = undefined;
		this.listTitle = '';
		this.currentListId = '';
		this.isMobileDrawerOpen = false;
		this.viewMode = '';
		this.availableModes = [];
	}

	/** 额外信息组件 (例如地图版权) */
	extraInfoComponent = $state<Component | null>(null);
	/** 额外信息组件参数 */
	extraInfoProps = $state<Record<string, unknown>>({});
	/** 额外信息动画键值 (用于 Crossfade) */
	extraInfoKey = $state<string>('');
	/** 额外信息的唯一标识符，用于防止竞态条件 */
	currentExtraInfoId = $state<string>('');

	/**
	 * 设置额外信息
	 *
	 * 推荐使用 Svelte `$effect` 自动管理生命周期：
	 * ```typescript
	 * $effect(() => {
	 *   if (data) {
	 *     const id = sidebarState.setExtraInfo(Component, data, 'key');
	 *     return () => sidebarState.clearExtraInfo(id);
	 *   }
	 * });
	 * ```
	 *
	 * @param component 组件
	 * @param props 参数
	 * @param key 动画键值 (用于 Crossfade)
	 */
	setExtraInfo(
		component: Component | null,
		props: Record<string, unknown> = {},
		key: string = ''
	) {
		const id = Math.random().toString(36).substring(7);
		this.extraInfoComponent = component;
		this.extraInfoProps = props;
		this.extraInfoKey = key;
		this.currentExtraInfoId = id;
		return id;
	}

	/**
	 * 清除额外信息组件
	 */
	clearExtraInfo(id?: string) {
		if (id && id !== this.currentExtraInfoId) {
			return;
		}
		this.extraInfoComponent = null;
		this.extraInfoProps = {};
		this.extraInfoKey = '';
		this.currentExtraInfoId = '';
	}
}

/**
 * 背景状态管理
 */
export class BackgroundState {
	/** 动态背景组件 (优先级高于静态图片) */
	component = $state<Component | null>(null);
	/** 背景组件参数 */
	props = $state<Record<string, unknown>>({});

	/** UI 主题：'dark' (默认，白字) | 'light' (黑字) */
	uiTheme = $state<'dark' | 'light'>('dark');

	/** 背景加载状态 */
	isLoaded = $state(false);

	/**
	 * 设置背景
	 * @param component 背景组件
	 * @param props 组件参数
	 * @param theme UI主题颜色
	 */
	set(
		component: Component | null,
		props: Record<string, unknown> = {},
		theme: 'dark' | 'light' = 'dark'
	) {
		this.component = component;
		this.props = props;
		this.uiTheme = theme;
	}

	/**
	 * 设置加载状态
	 */
	setLoaded(loaded: boolean) {
		this.isLoaded = loaded;
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
	/** 内容区域是否透明（用于某些需要全屏展示的场景） */
	isContentTransparent = $state(false);

	/** 内容区域是否可滚动 (默认可滚动；子组件自行处理滚动时设为 false) */
	isContentScrollable = $state(true);

	/**
	 * 设置内容透明度
	 * @param transparent 是否透明
	 */
	setTransparent(transparent: boolean) {
		this.isContentTransparent = transparent;
	}

	/**
	 * 设置内容是否可滚动
	 * @param scrollable 是否可滚动
	 */
	setScrollable(scrollable: boolean) {
		this.isContentScrollable = scrollable;
	}

	/** @deprecated Header 扩展模式已废弃，改由 MainContent 自动检测 */
	// isHeaderExtended = $state(false);

	/**
	 * 设置 Header 扩展状态
	 * @param extended 是否扩展
	 *
	 * @deprecated 已废弃，MainContent 现在会自动处理
	 */
	// setHeaderExtended(extended: boolean) {
	//    this.isHeaderExtended = extended;
	// }
}

/**
 * 主题状态管理
 */
export class ThemeState {
	/** 当前主题偏好设置 */
	preference = $state<'light' | 'dark' | 'system'>('system');

	/** 当前实际是否为暗色模式 (用于 UI 渲染判断) */
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

/**
 * 顶部导航栏状态管理
 */
export class HeaderState {
	/** 中间区域组件 */
	middleComponent = $state<Component | null>(null);
	/** 中间区域组件参数 */
	middleProps = $state<Record<string, unknown>>({});

	/** 唯一标识符，用于防止竞态条件 (Session ID) */
	currentMiddleId = $state<string>('');
	/** 内容标识符，用于控制动画切换 (Animation Key) */
	middleKey = $state<string>('');

	/**
	 * 设置中间区域组件
	 * @param component 组件
	 * @param props 参数
	 * @param key 动画/内容标识符。如果需要在不同实例间保持无缝切换，请传递相同的 key。
	 */
	setMiddle(
		component: Component | null,
		props: Record<string, unknown> = {},
		key: string = ''
	) {
		const id = Math.random().toString(36).substring(7);
		this.middleComponent = component;
		this.middleProps = props;
		this.currentMiddleId = id;
		// 如果没有提供 key，则使用 id 作为默认 key (每次都会触发动画)
		this.middleKey = key || id;
		return id;
	}

	/**
	 * 清除中间区域
	 * @param id 创建时返回的ID
	 */
	clearMiddle(id?: string) {
		if (id && id !== this.currentMiddleId) {
			return;
		}
		this.middleComponent = null;
		this.middleProps = {};
		this.currentMiddleId = '';
		this.middleKey = '';
	}

	/**
	 * 更新中间区域组件参数
	 * @param id 创建时返回的ID
	 * @param props 新的组件参数
	 */
	updateMiddle(id: string, props: Record<string, unknown>) {
		if (id && id !== this.currentMiddleId) {
			return;
		}
		this.middleProps = props;
	}

	/** 左侧区域组件 */
	leftComponent = $state<Component | null>(null);
	/** 左侧区域组件参数 */
	leftProps = $state<Record<string, unknown>>({});

	/** 左侧区域唯一标识符 */
	currentLeftId = $state<string>('');
	/** 左侧区域动画键值 */
	leftKey = $state<string>('');

	/**
	 * 设置左侧区域组件
	 */
	setLeft(component: Component | null, props: Record<string, unknown> = {}, key: string = '') {
		const id = Math.random().toString(36).substring(7);
		this.leftComponent = component;
		this.leftProps = props;
		this.currentLeftId = id;
		this.leftKey = key || id;
		return id;
	}

	/**
	 * 清除左侧区域
	 */
	clearLeft(id?: string) {
		if (id && id !== this.currentLeftId) {
			return;
		}
		this.leftComponent = null;
		this.leftProps = {};
		this.currentLeftId = '';
		this.leftKey = '';
	}

	/** 右侧区域组件 */
	rightComponent = $state<Component | null>(null);
	/** 右侧区域组件参数 */
	rightProps = $state<Record<string, unknown>>({});

	/** 右侧区域唯一标识符 */
	currentRightId = $state<string>('');
	/** 右侧区域动画键值 */
	rightKey = $state<string>('');

	/**
	 * 设置右侧区域组件
	 */
	setRight(
		component: Component | null,
		props: Record<string, unknown> = {},
		key: string = ''
	) {
		const id = Math.random().toString(36).substring(7);
		this.rightComponent = component;
		this.rightProps = props;
		this.currentRightId = id;
		this.rightKey = key || id;
		return id;
	}

	/**
	 * 清除右侧区域
	 */
	clearRight(id?: string) {
		if (id && id !== this.currentRightId) {
			return;
		}
		this.rightComponent = null;
		this.rightProps = {};
		this.currentRightId = '';
		this.rightKey = '';
	}
}

/** 侧边栏全局单例 */
export const sidebarState = new SidebarState();
/** 背景全局单例 */
export const backgroundState = new BackgroundState();
/** 布局全局单例 */
export const layoutState = new LayoutState();
/** 主题全局单例 */
export const themeState = new ThemeState();
/** 顶部导航栏全局单例 */
export const headerState = new HeaderState();
