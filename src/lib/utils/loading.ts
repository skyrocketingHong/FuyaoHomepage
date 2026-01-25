/**
 * YAML 加载工具
 *
 * 提供从 static/data 目录加载 YAML 配置文件的功能。
 */
import yaml from 'js-yaml';

/**
 * 加载 YAML 文件
 *
 * @param path - YAML 文件路径（相对于 static 目录）
 * @param customFetch - 可选的自定义 fetch 函数
 * @returns 解析后的 YAML 数据
 */
export async function loadYaml<T>(path: string, customFetch: typeof fetch = fetch): Promise<T> {
    try {
        // 添加时间戳防止编辑时缓存
        const response = await customFetch(`${path}?t=${Date.now()}`);
        if (!response.ok) {
            throw new Error(`加载失败 ${path}: ${response.statusText}`);
        }
        const text = await response.text();
        return yaml.load(text) as T;
    } catch (e) {
        console.error(`加载 YAML 文件失败 ${path}:`, e);
        throw e;
    }
}

