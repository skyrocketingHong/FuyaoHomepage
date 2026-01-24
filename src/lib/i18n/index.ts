import zh from './locales/zh.json';
import en from './locales/en.json';

export const locales = {
    zh,
    en
};

export type LocaleKey = keyof typeof locales;
export type TranslationKey = string; // In a real app we might want strict typing here
