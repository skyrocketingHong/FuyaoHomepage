/**
 * 版权提取工具
 *
 * 负责从 AMap DOM 中提取 Logo 和 Copyright 信息。
 */
import type { CopyrightData } from '../types';

/**
 * 从地图容器中提取版权信息
 *
 * 由于 AMap 异步渲染版权元素，需要通过轮询方式获取。
 *
 * @param container - 地图容器元素
 * @param timeout - 超时时间 (ms)，默认 10000
 * @returns Promise<CopyrightData>
 */
export function extractCopyright(
	container: HTMLElement,
	timeout: number = 10000
): Promise<CopyrightData> {
	return new Promise((resolve) => {
		let attempts = 0;
		const intervalMs = 500;
		const maxAttempts = timeout / intervalMs;

		const checkInterval = setInterval(() => {
			attempts++;

			if (!container) {
				clearInterval(checkInterval);
				return;
			}

			const logo = container.querySelector('.amap-logo');
			const copyright = container.querySelector('.amap-copyright');

			if (logo && copyright) {
				const logoImage = logo.querySelector('img');
				const logoUrl = logoImage?.src ?? '';
				const logoAlt = logoImage?.alt ?? '高德地图';
				const copyrightText = copyright.textContent?.trim() ?? '';

				if (logoUrl || copyrightText) {
					clearInterval(checkInterval);
					resolve({
						logoUrl,
						logoAlt,
						copyrightText
					});
				}
			}

			if (attempts >= maxAttempts) {
				clearInterval(checkInterval);
				// 超时返回空
				resolve({ logoUrl: '', logoAlt: '', copyrightText: '' });
			}
		}, intervalMs);
	});
}
