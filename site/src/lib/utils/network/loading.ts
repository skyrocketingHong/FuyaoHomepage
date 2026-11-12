/**
 * 文件加载工具
 *
 * 提供从 static 目录加载各种格式文件的功能。
 */
import yaml from 'js-yaml';

/** 加载选项 */
export interface LoadOptions {
	/** 是否绕过浏览器缓存 (适用于需要实时性的数据) */
	bypassCache?: boolean;
	/** 自定义 fetch 函数 */
	customFetch?: typeof fetch;
}

/**
 * 加载并解析文件
 *
 * @param path - 文件路径（相对于 static 目录）
 * @param format - 文件格式 ('yaml' | 'json' | 'text' | 'blob' | 'arraybuffer')
 * @param options - 加载选项
 * @returns 解析后的数据
 */
export async function loadFile<T>(
	path: string,
	format: 'yaml' | 'json' | 'text' | 'blob' | 'arraybuffer' = 'text',
	options: LoadOptions = {}
): Promise<T> {
	const { bypassCache = false, customFetch = fetch } = options;

	try {
		// 仅在需要时添加时间戳绕过缓存
		const finalPath = bypassCache
			? path.includes('?')
				? `${path}&t=${Date.now()}`
				: `${path}?t=${Date.now()}`
			: path;

		const response = await customFetch(finalPath);
		if (!response.ok) {
			throw new Error(`加载失败 ${path}: ${response.statusText}`);
		}

		switch (format) {
			case 'yaml': {
				const yamlText = await response.text();
				return yaml.load(yamlText) as T;
			}
			case 'json':
				return (await response.json()) as T;
			case 'text':
				return (await response.text()) as unknown as T;
			case 'blob':
				return (await response.blob()) as unknown as T;
			case 'arraybuffer':
				return (await response.arrayBuffer()) as unknown as T;
			default:
				throw new Error(`不支持的格式: ${format}`);
		}
	} catch (e) {
		console.error(`加载文件失败 ${path} (${format}):`, e);
		throw e;
	}
}

/**
 * 加载 YAML 文件
 */
export async function loadYaml<T>(path: string, options: LoadOptions = {}): Promise<T> {
	return loadFile<T>(path, 'yaml', options);
}

/**
 * 加载 JSON 文件
 */
export async function loadJson<T>(path: string, options: LoadOptions = {}): Promise<T> {
	return loadFile<T>(path, 'json', options);
}

/**
 * 加载纯文本文件
 */
export async function loadText(path: string, options: LoadOptions = {}): Promise<string> {
	return loadFile<string>(path, 'text', options);
}
