/**
 * 国际化入口模块
 *
 * 导出所有语言包和相关类型。
 */
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';

/** 语言包映射 */
export const locales = {
    'zh-CN': zhCN,
    'en-US': enUS
};

/** 语言键类型 */
export type LocaleKey = keyof typeof locales;

/** 翻译键类型（实际应用中可能需要更严格的类型定义） */
export type TranslationKey = string;

