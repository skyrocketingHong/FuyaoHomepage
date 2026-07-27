/** 当前站点配置与内容映射支持的 Schema 版本。 */
export const CONFIG_SCHEMA_VERSION = 1 as const;

export type SupportedLocale = 'zh-CN' | 'en-US';
export type AlbumMediaMode = 'external';

export interface LocalizedText {
	'zh-CN': string;
	'en-US': string;
}

export interface PublicSiteConfig {
	schemaVersion: typeof CONFIG_SCHEMA_VERSION;
	site: {
		name: string;
		url: string;
		startDate: string;
		startYear: number;
		defaultLocale: SupportedLocale;
	};
	profile: {
		name: string;
		birthDate: string;
		email?: string;
		avatarUrl: string;
		roles: LocalizedText;
		quotes: LocalizedText;
	};
	repository: {
		name: string;
		url: string;
		owner: string;
	};
	seo: {
		author: string;
		description: string;
		keywords: string[];
		twitterId?: string;
	};
	services: {
		wallpaper: {
			defaultUrl: string;
			apiUrl?: string;
		};
		amap: {
			browserKey?: string;
			securityCode?: string;
			serviceHost?: string;
		};
		analyticsProxyUrl?: string;
		codingActivityProxyUrl?: string;
		codingLanguagesProxyUrl?: string;
	};
}

export interface ContentConfig {
	schemaVersion: typeof CONFIG_SCHEMA_VERSION;
	paths: {
		posts: string;
		data: string;
		albumPhotos: string;
		albumThumbnails: string;
		albumMetadata: string;
	};
	media: {
		albumPublicBase: string;
		mode: AlbumMediaMode;
	};
}

export interface ValidationOptions {
	production?: boolean;
}

export class ConfigValidationError extends Error {
	readonly issues: string[];

	constructor(label: string, issues: string[]) {
		super(`${label} 校验失败：\n- ${issues.join('\n- ')}`);
		this.name = 'ConfigValidationError';
		this.issues = issues;
	}
}

const SECRET_FIELD_PATTERN =
	/(?:^|_)(?:token|password|passwd|privatekey|private_key|webhooksecret|webhook_secret|clientsecret|client_secret|accesssecret|access_secret)(?:$|_)/i;
const PLACEHOLDER_PATTERN =
	/(?:example\.com|example\.org|example\.net|\.invalid(?:\/|$)|your[_ -]|placeholder|changeme|replace[_ -]?me|sample[_ -]?key|demo[_ -]?key)/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function recordAt(value: unknown, path: string, issues: string[]): Record<string, unknown> {
	if (!isRecord(value)) {
		issues.push(`${path} 必须是对象`);
		return {};
	}
	return value;
}

function exactKeys(
	value: Record<string, unknown>,
	allowed: readonly string[],
	path: string,
	issues: string[]
): void {
	for (const key of Object.keys(value)) {
		if (!allowed.includes(key)) issues.push(`${path}.${key} 是未知字段`);
	}
}

function requiredString(
	value: unknown,
	path: string,
	issues: string[],
	options: { url?: boolean; date?: boolean; email?: boolean; production?: boolean } = {}
): string {
	if (typeof value !== 'string' || value.trim() === '') {
		issues.push(`${path} 必须是非空字符串`);
		return '';
	}
	const normalized = value.trim();
	if (options.url) validateUrl(normalized, path, issues);
	if (options.date) validateDate(normalized, path, issues);
	if (options.email && !EMAIL_PATTERN.test(normalized)) issues.push(`${path} 必须是有效邮箱`);
	if (options.production && PLACEHOLDER_PATTERN.test(normalized)) {
		issues.push(`${path} 在生产配置中不能使用示例或占位值`);
	}
	return normalized;
}

function optionalString(
	value: unknown,
	path: string,
	issues: string[],
	options: { url?: boolean; date?: boolean; email?: boolean; production?: boolean } = {}
): string | undefined {
	if (value === undefined || value === null || value === '') return undefined;
	return requiredString(value, path, issues, options);
}

function validateUrl(value: string, path: string, issues: string[]): void {
	try {
		const url = new URL(value);
		if (url.protocol !== 'https:' && url.protocol !== 'http:') {
			issues.push(`${path} 仅允许 http 或 https URL`);
		}
	} catch {
		issues.push(`${path} 必须是有效 URL`);
	}
}

function validateDate(value: string, path: string, issues: string[]): void {
	if (!DATE_PATTERN.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
		issues.push(`${path} 必须是有效的 YYYY-MM-DD 日期`);
	}
}

function scanSecretFields(value: unknown, path: string, issues: string[]): void {
	if (Array.isArray(value)) {
		value.forEach((item, index) => scanSecretFields(item, `${path}[${index}]`, issues));
		return;
	}
	if (!isRecord(value)) return;
	for (const [key, child] of Object.entries(value)) {
		if (SECRET_FIELD_PATTERN.test(key)) issues.push(`${path}.${key} 禁止出现在公开配置中`);
		scanSecretFields(child, `${path}.${key}`, issues);
	}
}

function localizedText(value: unknown, path: string, issues: string[]): LocalizedText {
	const record = recordAt(value, path, issues);
	exactKeys(record, ['zh-CN', 'en-US'], path, issues);
	return {
		'zh-CN': requiredString(record['zh-CN'], `${path}.zh-CN`, issues),
		'en-US': requiredString(record['en-US'], `${path}.en-US`, issues)
	};
}

/** 校验并返回浏览器可见的公开配置白名单。 */
export function parsePublicSiteConfig(
	input: unknown,
	options: ValidationOptions = {}
): PublicSiteConfig {
	const issues: string[] = [];
	const root = recordAt(input, 'site.yaml', issues);
	scanSecretFields(root, 'site.yaml', issues);
	exactKeys(
		root,
		['schemaVersion', 'site', 'profile', 'repository', 'seo', 'services'],
		'site.yaml',
		issues
	);

	if (root.schemaVersion !== CONFIG_SCHEMA_VERSION) {
		issues.push(
			`site.yaml.schemaVersion 必须为 ${CONFIG_SCHEMA_VERSION}，实际为 ${String(root.schemaVersion)}`
		);
	}

	const site = recordAt(root.site, 'site', issues);
	exactKeys(site, ['name', 'url', 'startDate', 'startYear', 'defaultLocale'], 'site', issues);
	const startYear = site.startYear;
	if (!Number.isInteger(startYear) || Number(startYear) < 1970 || Number(startYear) > 9999) {
		issues.push('site.startYear 必须是 1970 至 9999 之间的整数');
	}
	if (site.defaultLocale !== 'zh-CN' && site.defaultLocale !== 'en-US') {
		issues.push('site.defaultLocale 必须是 zh-CN 或 en-US');
	}

	const profile = recordAt(root.profile, 'profile', issues);
	exactKeys(
		profile,
		['name', 'birthDate', 'email', 'avatarUrl', 'roles', 'quotes'],
		'profile',
		issues
	);
	const repository = recordAt(root.repository, 'repository', issues);
	exactKeys(repository, ['name', 'url', 'owner'], 'repository', issues);
	const seo = recordAt(root.seo, 'seo', issues);
	exactKeys(seo, ['author', 'description', 'keywords', 'twitterId'], 'seo', issues);
	if (!Array.isArray(seo.keywords) || seo.keywords.some((item) => typeof item !== 'string')) {
		issues.push('seo.keywords 必须是字符串数组');
	}

	const services = recordAt(root.services, 'services', issues);
	exactKeys(
		services,
		['wallpaper', 'amap', 'analyticsProxyUrl', 'codingActivityProxyUrl', 'codingLanguagesProxyUrl'],
		'services',
		issues
	);
	const wallpaper = recordAt(services.wallpaper, 'services.wallpaper', issues);
	exactKeys(wallpaper, ['defaultUrl', 'apiUrl'], 'services.wallpaper', issues);
	const amap = recordAt(services.amap, 'services.amap', issues);
	exactKeys(amap, ['browserKey', 'securityCode', 'serviceHost'], 'services.amap', issues);

	const production = options.production === true;
	const result: PublicSiteConfig = {
		schemaVersion: CONFIG_SCHEMA_VERSION,
		site: {
			name: requiredString(site.name, 'site.name', issues, { production }),
			url: requiredString(site.url, 'site.url', issues, { url: true, production }),
			startDate: requiredString(site.startDate, 'site.startDate', issues, { date: true }),
			startYear: Number(startYear),
			defaultLocale: site.defaultLocale === 'en-US' ? 'en-US' : 'zh-CN'
		},
		profile: {
			name: requiredString(profile.name, 'profile.name', issues, { production }),
			birthDate: requiredString(profile.birthDate, 'profile.birthDate', issues, { date: true }),
			email: optionalString(profile.email, 'profile.email', issues, { email: true, production }),
			avatarUrl: requiredString(profile.avatarUrl, 'profile.avatarUrl', issues, {
				url: true,
				production
			}),
			roles: localizedText(profile.roles, 'profile.roles', issues),
			quotes: localizedText(profile.quotes, 'profile.quotes', issues)
		},
		repository: {
			name: requiredString(repository.name, 'repository.name', issues, { production }),
			url: requiredString(repository.url, 'repository.url', issues, { url: true, production }),
			owner: requiredString(repository.owner, 'repository.owner', issues, { production })
		},
		seo: {
			author: requiredString(seo.author, 'seo.author', issues, { production }),
			description: requiredString(seo.description, 'seo.description', issues),
			keywords: Array.isArray(seo.keywords)
				? seo.keywords.filter((item): item is string => typeof item === 'string')
				: [],
			twitterId: optionalString(seo.twitterId, 'seo.twitterId', issues, { production })
		},
		services: {
			wallpaper: {
				defaultUrl: requiredString(wallpaper.defaultUrl, 'services.wallpaper.defaultUrl', issues, {
					url: true,
					production
				}),
				apiUrl: optionalString(wallpaper.apiUrl, 'services.wallpaper.apiUrl', issues, {
					url: true,
					production
				})
			},
			amap: {
				browserKey: optionalString(amap.browserKey, 'services.amap.browserKey', issues, {
					production
				}),
				securityCode: optionalString(amap.securityCode, 'services.amap.securityCode', issues, {
					production
				}),
				serviceHost: optionalString(amap.serviceHost, 'services.amap.serviceHost', issues, {
					url: true,
					production
				})
			},
			analyticsProxyUrl: optionalString(
				services.analyticsProxyUrl,
				'services.analyticsProxyUrl',
				issues,
				{ url: true, production }
			),
			codingActivityProxyUrl: optionalString(
				services.codingActivityProxyUrl,
				'services.codingActivityProxyUrl',
				issues,
				{ url: true, production }
			),
			codingLanguagesProxyUrl: optionalString(
				services.codingLanguagesProxyUrl,
				'services.codingLanguagesProxyUrl',
				issues,
				{ url: true, production }
			)
		}
	};

	if (issues.length > 0) throw new ConfigValidationError('公开站点配置', issues);
	return result;
}

/** 校验内容目录映射；真实路径边界由仅服务端模块进一步验证。 */
export function parseContentConfig(input: unknown): ContentConfig {
	const issues: string[] = [];
	const root = recordAt(input, 'content.yaml', issues);
	exactKeys(root, ['schemaVersion', 'paths', 'media'], 'content.yaml', issues);
	if (root.schemaVersion !== CONFIG_SCHEMA_VERSION) {
		issues.push(
			`content.yaml.schemaVersion 必须为 ${CONFIG_SCHEMA_VERSION}，实际为 ${String(root.schemaVersion)}`
		);
	}
	const paths = recordAt(root.paths, 'paths', issues);
	exactKeys(
		paths,
		['posts', 'data', 'albumPhotos', 'albumThumbnails', 'albumMetadata'],
		'paths',
		issues
	);
	const media = recordAt(root.media, 'media', issues);
	exactKeys(media, ['albumPublicBase', 'mode'], 'media', issues);
	if (media.mode !== 'external') issues.push('media.mode 目前仅支持 external');

	const result: ContentConfig = {
		schemaVersion: CONFIG_SCHEMA_VERSION,
		paths: {
			posts: requiredString(paths.posts, 'paths.posts', issues),
			data: requiredString(paths.data, 'paths.data', issues),
			albumPhotos: requiredString(paths.albumPhotos, 'paths.albumPhotos', issues),
			albumThumbnails: requiredString(paths.albumThumbnails, 'paths.albumThumbnails', issues),
			albumMetadata: requiredString(paths.albumMetadata, 'paths.albumMetadata', issues)
		},
		media: {
			albumPublicBase: requiredString(media.albumPublicBase, 'media.albumPublicBase', issues),
			mode: 'external'
		}
	};
	if (
		!result.media.albumPublicBase.startsWith('/') ||
		result.media.albumPublicBase.includes('..')
	) {
		issues.push('media.albumPublicBase 必须是无 .. 的站内绝对 URL 路径');
	}

	if (issues.length > 0) throw new ConfigValidationError('内容配置', issues);
	return result;
}
