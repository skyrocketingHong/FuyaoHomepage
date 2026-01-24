import { writable, derived } from 'svelte/store';
import { locales, type LocaleKey } from './index';

// Initialize with a default locale, could be enhanced to detect browser language
const initialLocale: LocaleKey = 'zh';

function createI18nStore() {
    const { subscribe, set, update } = writable<LocaleKey>(initialLocale);

    return {
        subscribe,
        set,
        toggle: () => update((n) => (n === 'zh' ? 'en' : 'zh')),
        setLocale: (lang: LocaleKey) => set(lang)
    };
}

export const locale = createI18nStore();

// Derived store for translations
export const t = derived(locale, ($locale) => (key: string, vars: Record<string, any> = {}) => {
    const keys = key.split('.');
    let text: any = locales[$locale];

    for (const k of keys) {
        if (text && typeof text === 'object' && k in text) {
            text = text[k];
        } else {
            return key; // Fallback to key if not found
        }
    }

    if (typeof text !== 'string') return key;

    // Simple variable replacement
    return Object.keys(vars).reduce((acc, v) => {
        return acc.replace(new RegExp(`{{${v}}}`, 'g'), String(vars[v]));
    }, text);
});
