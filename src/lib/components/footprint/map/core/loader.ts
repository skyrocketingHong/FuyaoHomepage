/**
 * 高德地图加载工具
 *
 * 负责动态加载 AMap JS API 脚本并在 window 对象上初始化安全配置。
 */

/**
 * 加载 AMap 脚本
 *
 * @param apiKey - 高德地图 Web 端 API Key
 * @param securityCode - 安全验证码 (JsCode)
 * @returns Promise<void> - 加载完成时 resolve
 */
export function loadAMapScript(apiKey: string, securityCode: string): Promise<void> {
	if (typeof window === 'undefined') return Promise.resolve();

	// 1. 注入安全配置
	const securityConfig: Record<string, unknown> = {
		serviceHost: import.meta.env.VITE_AMAP_SERVICE_HOST
	};

	if (securityCode) {
		securityConfig.securityJsCode = securityCode;
	}

	(window as unknown as Record<string, unknown>)._AMapSecurityConfig = securityConfig;

	// 2. 检查是否已加载
	if ((window as unknown as Record<string, unknown>).AMap) {
		return Promise.resolve();
	}

	// 3. 动态加载脚本
	return new Promise((resolve, reject) => {
		const script = document.createElement('script');
		script.src = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}`;
		script.async = true;
		script.onload = () => resolve();
		script.onerror = (e) => reject(e);
		document.head.appendChild(script);
	});
}
