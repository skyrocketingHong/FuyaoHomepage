/** 有界 JSON 请求与最近成功结果缓存；中止请求不会回退缓存或继续重试。 */
export interface JsonResourceOptions<T> {
	signal?: AbortSignal;
	cacheKey?: string;
	maxAgeMs?: number;
	staleMaxAgeMs?: number;
	timeoutMs?: number;
	validate?: (value: unknown) => T;
	customFetch?: typeof fetch;
}

class ResourceError extends Error {
	constructor(public retryable: boolean) {
		super('JSON resource unavailable');
	}
}

/** 只缓存校验成功的公开响应，过期结果仅在刷新失败时使用。 */
export async function loadJsonResource<T>(
	url: string,
	options: JsonResourceOptions<T> = {}
): Promise<T> {
	const {
		signal,
		maxAgeMs = 300_000,
		staleMaxAgeMs = 86_400_000,
		timeoutMs = 8_000,
		customFetch = fetch
	} = options;
	const validate = options.validate ?? ((value: unknown) => value as T);
	const key = `fuyao:json:${options.cacheKey ?? ''}:${url}`;
	const abortError = () => new DOMException('Request cancelled', 'AbortError');
	if (signal?.aborted) throw abortError();

	let cached: { data: T; savedAt: number } | undefined;
	try {
		const raw = localStorage.getItem(key);
		if (raw) {
			const stored = JSON.parse(raw);
			const age = Date.now() - stored.savedAt;
			if (Number.isFinite(age) && age >= 0 && age <= staleMaxAgeMs) {
				cached = { data: validate(stored.data), savedAt: stored.savedAt };
			}
		}
	} catch {
		// 存储受限或缓存损坏时，仍可直接请求网络。
	}
	if (signal?.aborted) throw abortError();
	if (cached && Date.now() - cached.savedAt <= maxAgeMs) return cached.data;

	for (let attempt = 0; attempt < 2; attempt++) {
		if (signal?.aborted) throw abortError();
		const controller = new AbortController();
		const cancel = () => controller.abort();
		signal?.addEventListener('abort', cancel, { once: true });
		let timer: ReturnType<typeof setTimeout> | undefined;
		try {
			const interrupted = new Promise<never>((_, reject) => {
				controller.signal.addEventListener('abort', () => reject(abortError()), { once: true });
				timer = setTimeout(() => controller.abort(), timeoutMs);
			});
			const task = (async () => {
				const response = await customFetch(url, { signal: controller.signal });
				if (!response.ok) {
					throw new ResourceError([408, 429].includes(response.status) || response.status >= 500);
				}
				const raw: unknown = await response.json();
				const now = Date.now();
				const updatedAt = Date.parse(response.headers.get('X-Data-Updated-At') ?? '');
				const savedAt = Number.isFinite(updatedAt) && updatedAt <= now ? updatedAt : now;
				if (now - savedAt > staleMaxAgeMs) throw new ResourceError(false);
				try {
					return { raw, data: validate(raw), savedAt };
				} catch {
					throw new ResourceError(false);
				}
			})();
			const { raw, data, savedAt } = await Promise.race([task, interrupted]);
			if (signal?.aborted) throw abortError();
			try {
				localStorage.setItem(key, JSON.stringify({ data: raw, savedAt }));
			} catch {
				// 隐私模式或配额不足不影响成功的网络响应。
			}
			return data;
		} catch (error) {
			if (signal?.aborted) throw abortError();
			if (attempt === 1 || (error instanceof ResourceError && !error.retryable)) {
				const age = cached ? Date.now() - cached.savedAt : Infinity;
				if (cached && age >= 0 && age <= staleMaxAgeMs) return cached.data;
				throw new ResourceError(false);
			}
		} finally {
			clearTimeout(timer);
			signal?.removeEventListener('abort', cancel);
		}
	}
	throw new ResourceError(false);
}
