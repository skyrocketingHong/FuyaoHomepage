/**
 * 侧边栏类型定义
 *
 * 定义侧边栏导航项和视图模式的数据结构。
 */
import type { ComponentType } from 'svelte';
import type { Pathname } from '$app/types';
import type { DynamicComponent } from './component';

/**
 * 侧边栏导航项类型
 *
 * 支持嵌套子项（递归结构）和自定义组件渲染。
 */
export interface SidebarItemType {
	/** 显示文本 */
	label: string;
	/** 图标组件 */
	icon?: ComponentType;
	/** 图标 CSS 类名（覆盖默认 sidebar-icon） */
	iconClass?: string;
	/** 链接地址 */
	href?: Pathname;
	/** 点击回调 */
	onClick?: () => void;
	/** 是否处于激活状态 */
	isActive?: boolean;
	/** 自定义 CSS 类名 */
	class?: string;
	/** 嵌套子项列表 */
	items?: SidebarItemType[];
	/** 是否默认展开子项 */
	defaultExpanded?: boolean;
	/** 自定义渲染组件 */
	component?: DynamicComponent;
	/** 自定义组件参数 */
	componentProps?: Record<string, unknown>;
	/** 扩展属性 */
	[key: string]: unknown;
}

/**
 * 侧边栏视图模式
 *
 * 用于在侧边栏头部切换不同的列表视图（如按城市/按年份）。
 */
export interface SidebarViewMode {
	/** 模式唯一标识 */
	id: string;
	/** 显示文本 */
	label: string;
	/** 图标组件 */
	icon?: ComponentType;
}
