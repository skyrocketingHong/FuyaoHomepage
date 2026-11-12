/**
 * 国际化存储模块
 *
 * 提供语言切换和翻译功能。
 * 支持浏览器语言检测和 localStorage 持久化。
 */
import { writable, derived } from 'svelte/store';
import { locales, type LocaleKey } from './index';
import { browser } from '$app/environment';
import { publicConfig } from '$lib/config/public';
import { resolveInitialLocale } from './initial-locale';

/** localStorage 存储键名 */
const LOCALE_STORAGE_KEY = 'fuyao-locale';

/** 默认语言：取自站点配置的 site.defaultLocale（构建时由平台保存的站点设置注入） */
const DEFAULT_LOCALE: LocaleKey = publicConfig.site.defaultLocale;

/**
 * 获取初始语言
 * 优先级: 已保存的访客选择 > 浏览器语言 > 站点配置默认语言
 */
function getInitialLocale(): LocaleKey {
	if (!browser) return DEFAULT_LOCALE;
	return resolveInitialLocale({
		defaultLocale: DEFAULT_LOCALE,
		saved: localStorage.getItem(LOCALE_STORAGE_KEY),
		browserLanguages: navigator.languages || [navigator.language]
	});
}

/**
 * 创建国际化存储
 */
function createI18nStore() {
	const { subscribe, set, update } = writable<LocaleKey>(getInitialLocale());

	return {
		subscribe,
		set: (lang: LocaleKey) => {
			if (browser) {
				localStorage.setItem(LOCALE_STORAGE_KEY, lang);
			}
			set(lang);
		},
		/** 切换语言（中英互换） */
		toggle: () =>
			update((n) => {
				const newLocale = n === 'zh-CN' ? 'en-US' : 'zh-CN';
				if (browser) {
					localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
				}
				return newLocale;
			}),
		/** 设置指定语言 */
		setLocale: (lang: LocaleKey) => {
			if (browser) {
				localStorage.setItem(LOCALE_STORAGE_KEY, lang);
			}
			set(lang);
		},
		/** 初始化语言（客户端初始化时调用） */
		init: () => {
			const locale = getInitialLocale();
			set(locale);
		}
	};
}

/**
 * 全局国际化存储实例
 *
 * 包含当前语言状态及切换方法。
 */
export const locale = createI18nStore();

/**
 * 同步获取翻译文本（不依赖 store 订阅）
 * 用于需要立即获取翻译的场景，如初始化
 */
export function getTranslation(key: string, vars: Record<string, string> = {}): string {
	const currentLocale = getInitialLocale();
	const keys = key.split('.');
	let text: unknown = locales[currentLocale];

	for (const k of keys) {
		if (text && typeof text === 'object' && k in text) {
			text = (text as Record<string, unknown>)[k];
		} else {
			return key;
		}
	}

	if (typeof text !== 'string') return key;

	return Object.keys(vars).reduce((acc, v) => {
		return acc.replace(new RegExp(`{{${v}}}`, 'g'), String(vars[v]));
	}, text);
}

/**
 * 派生的翻译存储
 *
 * 根据当前语言返回对应的翻译文本。
 */
export const t = derived(locale, ($locale) => (key: string, vars: Record<string, string> = {}) => {
	const keys = key.split('.');
	let text: unknown = locales[$locale];

	for (const k of keys) {
		if (text && typeof text === 'object' && k in text) {
			text = (text as Record<string, unknown>)[k];
		} else {
			// 未找到翻译时回退到键名
			return key;
		}
	}

	if (typeof text !== 'string') return key;

	// 简单变量替换
	return Object.keys(vars).reduce((acc, v) => {
		return acc.replace(new RegExp(`{{${v}}}`, 'g'), String(vars[v]));
	}, text);
});
