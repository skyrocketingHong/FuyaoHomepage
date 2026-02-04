/**
 * 通用工具模块
 * 
 * 包含 CSS 类名合并、类型辅助工具等。
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
 
/**
 * 合并 Tailwind CSS 类名
 * 
 * 使用 clsx 进行条件合并，使用 tailwind-merge 处理冲突。
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
 
/** 移除类型 T 中的 child 属性 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
/** 移除类型 T 中的 children 属性 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
/** 移除类型 T 中的 child 和 children 属性 */
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
/** 为类型 T 增加可选的 ref 属性 */
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
