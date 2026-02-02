/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

import { build, files, version } from '$service-worker';

/**
 * Service Worker 缓存管理
 *
 * 实现离线访问和资源缓存策略。
 * 使用增量缓存策略，避免每次部署重新下载所有资源。
 */

// 为本次部署创建唯一的缓存名称
const CACHE = `cache-${version}`;

// 需要立即缓存的核心资源（仅 JS/CSS bundle）
const CORE_ASSETS = build;

// static 目录资源（按需缓存，不预加载）
const STATIC_FILES = new Set(files);

/**
 * 安装事件处理
 *
 * 只预缓存核心 bundle，静态资源按需缓存。
 */
self.addEventListener('install', (event) => {
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		// 只预缓存核心构建产物，减少初始下载量
		await cache.addAll(CORE_ASSETS);
	}

	event.waitUntil(addFilesToCache());
});

/**
 * 激活事件处理
 *
 * 删除旧版本缓存。
 */
self.addEventListener('activate', (event) => {
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key);
		}
	}

	event.waitUntil(deleteOldCaches());
});

/**
 * 请求拦截处理
 *
 * 核心资源: 缓存优先
 * 静态资源: 网络优先，成功后缓存
 * 数据文件: 始终网络请求
 */
self.addEventListener('fetch', (event) => {
	// 忽略非 GET 请求
	if (event.request.method !== 'GET') return;

	const url = new URL(event.request.url);
	
	// 跳过外部请求
	if (url.origin !== location.origin) return;

	// 数据文件始终从网络获取，不走 SW
	if (url.pathname.startsWith('/data/') || 
		url.pathname.endsWith('.json') || 
		url.pathname.endsWith('.yaml')) {
		return; // 不调用 respondWith，浏览器直接走网络
	}

	async function respond(): Promise<Response> {
		const cache = await caches.open(CACHE);

		// 核心构建资源 - 缓存优先
		if (CORE_ASSETS.includes(url.pathname)) {
			const cached = await cache.match(event.request);
			if (cached) return cached;
		}

		// 网络请求
		try {
			const response = await fetch(event.request);

			if (response.status === 200) {
				// 缓存静态资源和成功的响应
				if (STATIC_FILES.has(url.pathname) || CORE_ASSETS.includes(url.pathname)) {
					cache.put(event.request, response.clone());
				}
			}

			return response;
		} catch {
			// 离线时回退到缓存
			const cached = await cache.match(event.request);
			if (cached) return cached;

			return new Response('离线', { status: 408 });
		}
	}

	event.respondWith(respond());
});
