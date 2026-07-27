import type { LayoutLoad } from './$types';
import { publicConfig } from '$lib/config/public';

/**
 * 根布局数据加载函数
 *
 * 负责在页面加载前获取全局配置和背景壁纸地址。
 */
export const load: LayoutLoad = async () => {
	const appConfig = {
		wallpaper: {
			default: publicConfig.services.wallpaper.defaultUrl
		}
	};

	return {
		appConfig
	};
};

export const prerender = true;
export const trailingSlash = 'always';
