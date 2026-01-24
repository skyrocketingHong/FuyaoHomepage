import type { LayoutLoad } from './$types';

/**
 * 根布局数据加载函数
 * Root Layout Data Load Function
 * 
 * 负责在页面加载前获取全局配置和背景壁纸地址。
 * Fetches global configuration and background wallpaper URL before page load.
 */
export const load: LayoutLoad = async ({ fetch }) => {
    const appConfig = {
        wallpaper: {
            default: "https://img.youpin.mi-img.com/ferriswheel/c5238eb3_63a6_4987_bc3d_4e1f252bb91f.jpeg"
        }
    };

    let spotlightUrl: string | null = null;
    try {
        // 使用配置中的 API URL 获取壁纸
        // Use the API URL from config to fetch wallpaper
        const wallpaperApi = import.meta.env.VITE_WALLPAPER_API;
        if (wallpaperApi) {
            const spotRes = await fetch(wallpaperApi);
            if (spotRes.ok) {
                spotlightUrl = await spotRes.text();
                spotlightUrl = spotlightUrl.trim();
            }
        }
    } catch (e) {
        console.error("Failed to load Spotlight URL", e);
    }

    return {
        appConfig,
        spotlightUrl
    };
};

export const prerender = true;
