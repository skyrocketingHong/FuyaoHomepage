/**
 * 国际化存储模块
 *
 * 提供语言切换和翻译功能。
 * 支持浏览器语言检测和 localStorage 持久化。
 */
import { writable, derived } from 'svelte/store';
import { locales, type LocaleKey } from './index';
import { browser } from '$app/environment';

/** localStorage 存储键名 */
const LOCALE_STORAGE_KEY = 'fuyao-locale';

/** 支持的语言列表 */
const SUPPORTED_LOCALES: LocaleKey[] = ['zh-CN', 'en-US'];

/** 默认语言 */
const DEFAULT_LOCALE: LocaleKey = 'zh-CN';

/**
 * 检测浏览器首选语言
 * @returns 检测到的语言或默认语言
 */
function detectBrowserLocale(): LocaleKey {
    if (!browser) return DEFAULT_LOCALE;

    // 获取浏览器语言列表
    const browserLangs = navigator.languages || [navigator.language];

    for (const lang of browserLangs) {
        // 先尝试精确匹配（如 'zh-CN'）
        const normalizedLang = lang.replace('_', '-');
        if (SUPPORTED_LOCALES.includes(normalizedLang as LocaleKey)) {
            return normalizedLang as LocaleKey;
        }
        // 再尝试语言代码匹配（如 'zh' -> 'zh-CN', 'en' -> 'en-US'）
        const langCode = lang.split('-')[0].toLowerCase();
        if (langCode === 'zh') return 'zh-CN';
        if (langCode === 'en') return 'en-US';
    }

    return DEFAULT_LOCALE;
}

/**
 * 获取初始语言
 * 优先级: localStorage > 浏览器语言 > 默认语言
 */
function getInitialLocale(): LocaleKey {
    if (!browser) return DEFAULT_LOCALE;

    // 尝试从 localStorage 读取
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (savedLocale && SUPPORTED_LOCALES.includes(savedLocale as LocaleKey)) {
        return savedLocale as LocaleKey;
    }

    // 检测浏览器语言
    return detectBrowserLocale();
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
        toggle: () => update((n) => {
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

export const locale = createI18nStore();

/**
 * 同步获取翻译文本（不依赖 store 订阅）
 * 用于需要立即获取翻译的场景，如初始化
 */
export function getTranslation(key: string, vars: Record<string, any> = {}): string {
    const currentLocale = getInitialLocale();
    const keys = key.split('.');
    let text: any = locales[currentLocale];

    for (const k of keys) {
        if (text && typeof text === 'object' && k in text) {
            text = text[k];
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
export const t = derived(locale, ($locale) => (key: string, vars: Record<string, any> = {}) => {
    const keys = key.split('.');
    let text: any = locales[$locale];

    for (const k of keys) {
        if (text && typeof text === 'object' && k in text) {
            text = text[k];
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

