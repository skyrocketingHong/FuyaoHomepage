import type { ClientInit } from '@sveltejs/kit';
import { hydrateSpaFallbackLoader } from '$lib/components/layout/loader/spaFallbackLoader';

/** 在 SvelteKit 等待目标路由数据前，让实际 GlobalLoader 接管 SPA fallback 首屏。 */
export const init: ClientInit = () => {
	hydrateSpaFallbackLoader();
};
