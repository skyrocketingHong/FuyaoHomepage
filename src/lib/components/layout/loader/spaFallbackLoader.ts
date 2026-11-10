import { hydrate, unmount } from 'svelte';
import GlobalLoader from './GlobalLoader.svelte';

const hostId = 'fuyao-prerendered-loader';

let loader: { finishLoading: () => Promise<void> } | undefined;
let releasePromise: Promise<void> | undefined;

/** 在 SvelteKit 解析目标路由前，直接水合 SPA fallback 中的 GlobalLoader SSR 输出。 */
export function hydrateSpaFallbackLoader(): boolean {
	const host = document.getElementById(hostId);
	if (!host || loader) return Boolean(loader);

	try {
		loader = hydrate(GlobalLoader, {
			target: host,
			props: { showContent: false }
		});
		host.dataset.svelteHydrated = 'true';
		return true;
	} catch (error) {
		console.error('SPA fallback GlobalLoader 水合失败', error);
		host.remove();
		return false;
	}
}

/** 当前页面是否由 hooks.client 水合的 GlobalLoader 承担首次加载状态。 */
export function hasSpaFallbackLoader(): boolean {
	return Boolean(loader);
}

/** 让 GlobalLoader 自己切换 showContent，完成其 Crossfade 后再卸载实例。 */
export function releaseSpaFallbackLoader(): Promise<void> {
	if (releasePromise) return releasePromise;
	if (!loader) return Promise.resolve();

	const activeLoader = loader;
	const host = document.getElementById(hostId);
	releasePromise = activeLoader
		.finishLoading()
		.then(() => unmount(activeLoader))
		.then(() => {
			loader = undefined;
			host?.remove();
			releasePromise = undefined;
		});
	return releasePromise;
}
