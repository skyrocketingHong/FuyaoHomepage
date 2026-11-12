/**
 * 初始语言解析（纯函数）。
 *
 * 优先级：访客已保存的语言选择 > 浏览器语言 > 站点配置的默认语言。
 * 默认语言来自 site.defaultLocale（构建时由平台保存的站点设置注入），
 * 纯函数拆分使该优先级可在 node:test 中直接验证。
 */

/** 支持的语言 */
export type InitialLocale = 'zh-CN' | 'en-US';

const SUPPORTED: InitialLocale[] = ['zh-CN', 'en-US'];

/** 归一化浏览器语言标记（下划线转连字符）后精确匹配支持语言。 */
function exactMatch(lang: string): InitialLocale | null {
	const normalized = lang.replace('_', '-');
	return (SUPPORTED as string[]).includes(normalized) ? (normalized as InitialLocale) : null;
}

/** 语言主代码匹配：zh* 归 zh-CN，en* 归 en-US。 */
function languageCodeMatch(lang: string): InitialLocale | null {
	const code = lang.split('-')[0].toLowerCase();
	if (code === 'zh') return 'zh-CN';
	if (code === 'en') return 'en-US';
	return null;
}

/**
 * 解析初始语言。
 *
 * @param defaultLocale 站点配置的默认语言（最后的回退值）
 * @param saved 访客已保存的语言选择（localStorage 值），无效值忽略
 * @param browserLanguages 浏览器语言列表（非浏览器环境传 null）
 */
export function resolveInitialLocale(options: {
	defaultLocale: InitialLocale;
	saved: string | null;
	browserLanguages: readonly string[] | null;
}): InitialLocale {
	const { defaultLocale, saved, browserLanguages } = options;
	const fallback: InitialLocale = SUPPORTED.includes(defaultLocale) ? defaultLocale : 'zh-CN';

	if (saved) {
		const savedLocale = exactMatch(saved);
		if (savedLocale) return savedLocale;
	}

	if (browserLanguages) {
		for (const lang of browserLanguages) {
			const exact = exactMatch(lang);
			if (exact) return exact;
			const byCode = languageCodeMatch(lang);
			if (byCode) return byCode;
		}
	}

	return fallback;
}
