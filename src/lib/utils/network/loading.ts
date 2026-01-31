/**
 * 文件加载工具
 *
 * 提供从 static 目录加载各种格式文件的功能。
 */
import yaml from 'js-yaml';

/**
 * 加载并解析文件
 *
 * @param path - 文件路径（相对于 static 目录）
 * @param format - 文件格式 ('yaml' | 'json' | 'text' | 'blob' | 'arraybuffer')
 * @param customFetch - 可选的自定义 fetch 函数
 * @returns 解析后的数据
 */
export async function loadFile<T>(
    path: string,
    format: 'yaml' | 'json' | 'text' | 'blob' | 'arraybuffer' = 'text',
    customFetch: typeof fetch = fetch
): Promise<T> {
    try {
        // 添加时间戳防止缓存
        const response = await customFetch(path);
        if (!response.ok) {
            throw new Error(`加载失败 ${path}: ${response.statusText}`);
        }

        switch (format) {
            case 'yaml':
                const yamlText = await response.text();
                return yaml.load(yamlText) as T;
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
export async function loadYaml<T>(path: string, customFetch: typeof fetch = fetch): Promise<T> {
    return loadFile<T>(path, 'yaml', customFetch);
}

/**
 * 加载 JSON 文件
 */
export async function loadJson<T>(path: string, customFetch: typeof fetch = fetch): Promise<T> {
    return loadFile<T>(path, 'json', customFetch);
}

/**
 * 加载纯文本文件
 */
export async function loadText(path: string, customFetch: typeof fetch = fetch): Promise<string> {
    return loadFile<string>(path, 'text', customFetch);
}

