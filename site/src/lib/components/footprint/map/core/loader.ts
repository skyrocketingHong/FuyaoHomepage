/**
 * 高德地图加载工具
 *
 * 负责动态加载 AMap JS API 脚本并在 window 对象上初始化安全配置。
 */
import { publicConfig } from '$lib/config/public';

let loadingScript: Promise<void> | null = null;

/**
 * 加载 AMap 脚本
 *
 * @param apiKey - 高德地图 Web 端 API Key
 * @param securityCode - 安全验证码 (JsCode)
 * @returns Promise<void> - 加载完成时 resolve
 */
export function loadAMapScript(apiKey: string, securityCode: string): Promise<void> {
	if (typeof window === 'undefined') return Promise.resolve();

	const global = window as unknown as Record<string, unknown>;
	if (global.AMap) {
		return Promise.resolve();
	}
	if (loadingScript) return loadingScript;

	const serviceHost = publicConfig.services.amap.serviceHost;
	// ASVS 13.3.1：代理模式由服务端附加安全码，浏览器只配置代理地址。
	global._AMapSecurityConfig = serviceHost
		? { serviceHost }
		: securityCode
			? { securityJsCode: securityCode }
			: {};

	loadingScript = new Promise<void>((resolve, reject) => {
		const script = document.createElement('script');
		const url = new URL('https://webapi.amap.com/maps');
		url.searchParams.set('v', '2.0');
		url.searchParams.set('key', apiKey);
		script.src = url.toString();
		script.async = true;

		const cleanup = () => {
			clearTimeout(timeout);
			script.onload = null;
			script.onerror = null;
		};
		const fail = () => {
			cleanup();
			script.remove();
			// ASVS 16.5.1：不将包含 Key 的脚本 URL 或原始网络事件带入错误信息。
			reject(new Error('AMap SDK failed to load'));
		};
		const timeout = setTimeout(fail, 15_000);
		script.onload = () => {
			if (!global.AMap) {
				fail();
				return;
			}
			cleanup();
			resolve();
		};
		script.onerror = fail;
		try {
			document.head.appendChild(script);
		} catch {
			fail();
		}
	}).catch((error: unknown) => {
		loadingScript = null;
		throw error;
	});
	return loadingScript;
}
