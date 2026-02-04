import type { LayoutLoad } from './$types';

/**
 * 根布局数据加载函数
 *
 * 负责在页面加载前获取全局配置和背景壁纸地址。
 */
export const load: LayoutLoad = async () => {
    const appConfig = {
        wallpaper: {
            default: "https://img.youpin.mi-img.com/ferriswheel/c5238eb3_63a6_4987_bc3d_4e1f252bb91f.jpeg"
        }
    };

    return {
        appConfig
    };
};

export const prerender = true;
export const trailingSlash = 'always';

