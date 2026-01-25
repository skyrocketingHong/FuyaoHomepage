/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

import { build, files, version } from '$service-worker';

/**
 * Service Worker 缓存管理
 *
 * 实现离线访问和资源缓存策略。
 */

// 为本次部署创建唯一的缓存名称
const CACHE = `cache-${version}`;

// 需要缓存的资源列表
const ASSETS = [
    ...build, // 应用本身
    ...files  // static 目录下的所有文件
];

/**
 * 安装事件处理
 *
 * 创建新缓存并添加所有文件。
 */
self.addEventListener('install', (event) => {
    async function addFilesToCache() {
        const cache = await caches.open(CACHE);
        await cache.addAll(ASSETS);
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
 * 实现缓存优先策略，离线时回退到缓存。
 */
self.addEventListener('fetch', (event) => {
    // 忽略非 GET 请求
    if (event.request.method !== 'GET') return;

    async function respond(): Promise<Response> {
        const url = new URL(event.request.url);
        const cache = await caches.open(CACHE);

        // build/files 中的资源始终可以从缓存提供
        if (ASSETS.includes(url.pathname)) {
            const response = await cache.match(event.request);
            if (response) return response;
        }

        // 其他资源优先尝试网络，离线时回退到缓存
        try {
            const response = await fetch(event.request);

            if (response.status === 200) {
                cache.put(event.request, response.clone());
            }

            return response;
        } catch {
            const response = await cache.match(event.request);
            if (response) return response;

            return new Response('离线', { status: 408 });
        }
    }

    event.respondWith(respond());
});

