import { loadYaml } from '$lib/utils/network/loading';

/**
 * 足迹数据接口
 */
export interface Place {
    id: string;
    name: string | { zh: string; en: string };
    coordinates: { lng: number; lat: number };
    visitDate?: string;
    type?: 'city' | 'place';
    // 映射字段
    title?: string;
    position?: [number, number];
}

/**
 * 加载足迹数据
 *
 * 从 YAML 文件加载数据，并规范化为统一格式。
 */
export async function loadFootprints(): Promise<Place[]> {
    try {
        const data = await loadYaml<{ cities: any[] }>('/data/footprints.yaml');

        // 基于旧格式的适配逻辑 (cities -> places)
        const places: Place[] = [];

        if (data && data.cities) {
            data.cities.forEach((city: any) => {
                if (city.places) {
                    city.places.forEach((p: any) => {
                        places.push({
                            ...p,
                            type: 'place'
                        });
                    });
                }
                // 如果需要，添加城市本身，或者只添加地点
                places.push({
                    ...city,
                    type: 'city'
                });
            });
        }

        // 扁平化/规范化
        return places.map(p => ({
            ...p,
            title: typeof p.name === 'object' ? (p.name as any).zh : p.name, // 处理多语言
            position: [p.coordinates.lng, p.coordinates.lat]
        }));
    } catch (e) {
        console.error('加载足迹数据失败:', e);
        throw e;
    }
}
