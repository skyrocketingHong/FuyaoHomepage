/**
 * 应用级全局状态管理
 *
 * 提供侧边栏、背景、布局、主题、顶部导航栏等核心状态的集中管理。
 * 所有状态类均以 Svelte 5 runes ($state) 实现响应性。
 */
import type { DynamicComponent } from '$lib/types/component';
import type { SidebarViewMode } from '$lib/types/sidebar';
import { runAppearanceTransition } from '$lib/utils/effect/appearanceTransition.svelte';
import { ownsHeaderSlot } from '$lib/utils/state/headerOwnership';

/** 生成唯一 ID */
function generateId(): string {
	return Math.random().toString(36).substring(7);
}

/**
 * 侧边栏状态管理
 */
export class SidebarState {
	/** 动态渲染在侧边栏列表区域的组件 */
	listComponent = $state<DynamicComponent | null>(null);
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

	/** 筛选标签（显示在列表标题旁，如设备名） */
	filterLabel = $state<string>('');
	/** 清除筛选的回调 */
	onFilterClear = $state<(() => void) | null>(null);
	/** 视图模式切换回调（切换时自动清除筛选） */
	onViewModeChange = $state<((modeId: string) => void) | null>(null);

	/**
	 * 设置列表组件
	 * @param component 需要渲染的组件
	 * @param props 组件参数
	 * @param title 列表标题 (支持 i18n key)
	 * @returns uniqueId 返回当前列表的唯一ID，需要在组件销毁时传回给 clearList
	 */
	setList(
		component: DynamicComponent,
		props: Record<string, unknown> = {},
		title: string = '',
		modes: SidebarViewMode[] = []
	) {
		const id = generateId();
		this.listComponent = component;
		this.listProps = props;
		// 提取 activeId 到独立状态
		this.activeId = props.activeId as string | undefined;

		this.listTitle = title;
		this.currentListId = id;

		// 重置筛选状态
		this.filterLabel = '';
		this.onFilterClear = null;
		this.onViewModeChange = null;

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
	 * 设置视图模式（自动清除筛选状态）
	 */
	setViewMode(modeId: string) {
		if (this.viewMode === modeId) return;
		this.viewMode = modeId;
		this.clearFilter();
		this.onViewModeChange?.(modeId);
	}

	/**
	 * 设置筛选状态
	 * @param label 筛选标签（显示在侧边栏标题旁）
	 * @param onClear 清除筛选的回调
	 */
	setFilter(label: string, onClear: () => void) {
		this.filterLabel = label;
		this.onFilterClear = onClear;
	}

	/**
	 * 清除筛选状态
	 */
	clearFilter() {
		this.filterLabel = '';
		this.onFilterClear = null;
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
		this.filterLabel = '';
		this.onFilterClear = null;
		this.onViewModeChange = null;
	}

	/** 额外信息组件 (例如地图版权) */
	extraInfoComponent = $state<DynamicComponent | null>(null);
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
	setExtraInfo(component: DynamicComponent, props: Record<string, unknown> = {}, key: string = '') {
		const id = generateId();
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

/** 用户可选择的背景模式 (仅普通页面生效；足迹 none 与文章 solid 属于语义背景，不可覆盖) */
export type UserBackgroundMode = 'mosaic' | 'image' | 'flowing';

/** 背景加载事务类型 */
export type BackgroundLoadingKind = 'initial' | 'resize';

/** 用户背景偏好的 localStorage 键 */
const BACKGROUND_MODE_KEY = 'background-mode';

export class BackgroundState {
	/** 加载事务递增序号；序号仅用于拒绝过期异步回调 */
	private loadingSequence = 1;

	/** 动态背景组件 (优先级高于静态图片) */
	component = $state<DynamicComponent | null>(null);
	/** 背景组件参数 */
	props = $state<Record<string, unknown>>({});

	/** UI 主题：'dark' (默认，白字) | 'light' (黑字) */
	uiTheme = $state<'dark' | 'light'>('dark');

	/** 背景加载状态 */
	isLoaded = $state(false);
	/** 当前加载事务序号 */
	activeLoadingId = $state(1);
	/** 当前加载事务类型；null 表示当前没有背景加载事务 */
	loadingKind = $state<BackgroundLoadingKind | null>('initial');

	/** 用户背景偏好 (普通页面生效，持久化到 localStorage) */
	userPreference = $state<UserBackgroundMode>('mosaic');

	constructor() {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem(BACKGROUND_MODE_KEY);
			if (saved === 'mosaic' || saved === 'image' || saved === 'flowing') {
				this.userPreference = saved;
			}
		}
	}

	/**
	 * 设置用户背景偏好并持久化
	 * @param mode 背景模式 (马赛克/壁纸/流动)
	 */
	setUserPreference(mode: UserBackgroundMode) {
		this.userPreference = mode;
		if (typeof window !== 'undefined') {
			localStorage.setItem(BACKGROUND_MODE_KEY, mode);
		}
	}

	/**
	 * 设置背景
	 * @param component 背景组件
	 * @param props 组件参数
	 * @param theme UI主题颜色
	 */
	set(
		component: DynamicComponent | null,
		props: Record<string, unknown> = {},
		theme: 'dark' | 'light' = 'dark'
	) {
		this.component = component;
		this.props = props;
		this.uiTheme = theme;
	}

	/**
	 * 开始新的背景加载事务。
	 *
	 * 连续开始事务时保持 isLoaded=false，但递增唯一序号，确保旧绘制回调不能结束新事务。
	 */
	beginLoading(kind: BackgroundLoadingKind): number {
		const id = ++this.loadingSequence;
		this.activeLoadingId = id;
		this.loadingKind = kind;
		this.isLoaded = false;
		return id;
	}

	/** 当前事务是否仍是唯一有效的加载事务 */
	isLoading(id: number, kind?: BackgroundLoadingKind): boolean {
		return (
			!this.isLoaded &&
			this.activeLoadingId === id &&
			(kind === undefined || this.loadingKind === kind)
		);
	}

	/**
	 * 完成指定加载事务。
	 *
	 * @returns 是否完成了当前事务；过期序号会被忽略并返回 false。
	 */
	completeLoading(id: number): boolean {
		if (!this.isLoading(id)) return false;
		this.isLoaded = true;
		this.loadingKind = null;
		return true;
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
	/** 当前主题偏好设置 */
	preference = $state<'light' | 'dark' | 'system'>('system');

	/** 当前实际是否为暗色模式 (用于 UI 渲染判断) */
	isDark = $state(false);

	/** 初始化完成前直接提交类名，不触发外观过渡 */
	private initialized = false;

	constructor() {
		if (typeof window !== 'undefined') {
			// 初始化
			const saved = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
			this.preference = saved || 'system';
			this.updateSystem();
			this.initialized = true;

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
	 *
	 * 主题与系统主题变化复用统一外观过渡入口 (View Transition 能力检测)，
	 * 使背景、玻璃 Token 与文字颜色在同一帧提交；初始化与 prefers-reduced-motion
	 * 下直接切换最终状态。
	 */
	private setDark(isDark: boolean) {
		if (typeof document === 'undefined') {
			this.isDark = isDark;
			return;
		}
		const apply = () => {
			this.isDark = isDark;
			document.documentElement.classList.toggle('dark', isDark);
			// 更新 meta theme-color
			const meta = document.querySelector('meta[name="theme-color"]');
			if (meta) {
				meta.setAttribute('content', isDark ? '#000000' : '#ffffff');
			}
		};
		// 初始化或明暗未实际翻转时直接提交，避免页面加载时多一次无意义过渡
		if (!this.initialized || this.isDark === isDark) {
			apply();
			return;
		}
		runAppearanceTransition(apply);
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
	/** 中间区域 */
	middle = new HeaderSlot();
	/** 左侧区域 */
	left = new HeaderSlot();
	/** 右侧区域 */
	right = new HeaderSlot();

	/**
	 * @deprecated 使用 middle.set() 代替
	 */
	setMiddle(component: DynamicComponent, props: Record<string, unknown> = {}, key: string = '') {
		return this.middle.set(component, props, key);
	}

	/**
	 * @deprecated 使用 middle.clear() 代替
	 */
	clearMiddle(id: string) {
		return this.middle.clear(id);
	}

	/**
	 * @deprecated 使用 middle.update() 代替
	 */
	updateMiddle(id: string, props: Record<string, unknown>) {
		this.middle.update(id, props);
	}

	/**
	 * @deprecated 使用 left.set() 代替
	 */
	setLeft(component: DynamicComponent, props: Record<string, unknown> = {}, key: string = '') {
		return this.left.set(component, props, key);
	}

	/**
	 * @deprecated 使用 left.clear() 代替
	 */
	clearLeft(id: string) {
		return this.left.clear(id);
	}

	/**
	 * @deprecated 使用 right.set() 代替
	 */
	setRight(component: DynamicComponent, props: Record<string, unknown> = {}, key: string = '') {
		return this.right.set(component, props, key);
	}

	/**
	 * @deprecated 使用 right.clear() 代替
	 */
	clearRight(id: string) {
		return this.right.clear(id);
	}

	/** 强制清空全部 Header 插槽，仅供应用级重置使用 */
	clearAll() {
		this.middle.clearAll();
		this.left.clearAll();
		this.right.clearAll();
	}
}

/**
 * Header 区域槽位 (用于消除 middle/left/right 的重复代码)
 */
class HeaderSlot {
	/** 组件 */
	component = $state<DynamicComponent | null>(null);
	/** 组件参数 */
	props = $state<Record<string, unknown>>({});
	/** 唯一标识符，用于防止竞态条件 (Session ID) */
	currentId = $state<string>('');
	/** 内容标识符，用于控制动画切换 (Animation Key) */
	key = $state<string>('');

	/**
	 * 设置组件
	 * @param component 组件
	 * @param props 参数
	 * @param key 动画/内容标识符。如果需要在不同实例间保持无缝切换，请传递相同的 key。
	 */
	set(component: DynamicComponent | null, props: Record<string, unknown> = {}, key: string = '') {
		const id = generateId();
		this.component = component;
		this.props = props;
		this.currentId = id;
		// 如果没有提供 key，则使用 id 作为默认 key (每次都会触发动画)
		this.key = key || id;
		return id;
	}

	/**
	 * 清除
	 * @param id 创建时返回的ID
	 */
	clear(id: string) {
		if (!ownsHeaderSlot(id, this.currentId)) return false;
		this.clearAll();
		return true;
	}

	/** 强制清空插槽，不进行所有权校验 */
	clearAll() {
		this.component = null;
		this.props = {};
		this.currentId = '';
		this.key = '';
	}

	/**
	 * 更新组件参数
	 * @param id 创建时返回的ID
	 * @param props 新的组件参数
	 */
	update(id: string, props: Record<string, unknown>) {
		if (!ownsHeaderSlot(id, this.currentId)) return false;
		this.props = props;
		return true;
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
