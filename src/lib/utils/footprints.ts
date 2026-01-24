import { loadYaml } from '$lib/utils/loading';

export interface Place {
    id: string;
    name: string | { zh: string; en: string };
    coordinates: { lng: number; lat: number };
    visitDate?: string;
    type?: 'city' | 'place';
    // Mapped fields
    title?: string;
    position?: [number, number];
}

export async function loadFootprints(): Promise<Place[]> {
    try {
        const data = await loadYaml<{ cities: any[] }>('/data/footprints.yaml');

        // Adaptation logic based on legacy format (cities -> places)
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
                // Add city itself if needed, or just places
                places.push({
                    ...city,
                    type: 'city'
                });
            });
        }

        // Flatten/Normalize
        return places.map(p => ({
            ...p,
            title: typeof p.name === 'object' ? (p.name as any).zh : p.name, // Handle i18n
            position: [p.coordinates.lng, p.coordinates.lat]
        }));
    } catch (e) {
        console.error('Error loading footprints:', e);
        throw e;
    }
}
