import yaml from 'js-yaml';

export async function loadYaml<T>(path: string, customFetch: typeof fetch = fetch): Promise<T> {
    try {
        // Add timestamp to prevent caching during edits
        const response = await customFetch(`${path}?t=${Date.now()}`);
        if (!response.ok) {
            throw new Error(`Failed to load ${path}: ${response.statusText}`);
        }
        const text = await response.text();
        return yaml.load(text) as T;
    } catch (e) {
        console.error(`Error loading YAML from ${path}:`, e);
        throw e;
    }
}
