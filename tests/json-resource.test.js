/** JSON 请求超时、取消及经过验证的成功缓存回归。 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { setImmediate as flush } from 'node:timers/promises';
import vm from 'node:vm';
import ts from 'typescript';

/** @typedef {typeof import('../src/lib/utils/network/jsonResource.ts').loadJsonResource} LoadJsonResource */

/** @param {{ storageBlocked?: boolean; now?: number }} [options] */
function createResource(options = {}) {
	let now = options.now ?? 10_000;
	let timerId = 0;
	/** @type {Map<number, { callback: () => void; duration: number }>} */
	const timers = new Map();
	/** @type {Map<string, string>} */
	const storage = new Map();
	const source = fs.readFileSync(
		new URL('../src/lib/utils/network/jsonResource.ts', import.meta.url),
		'utf8'
	);
	const context = vm.createContext({
		exports: {},
		AbortController,
		DOMException,
		Date: { now: () => now, parse: Date.parse },
		fetch,
		localStorage: {
			getItem: (/** @type {string} */ key) => {
				if (options.storageBlocked) throw new Error('Storage unavailable');
				return storage.get(key) ?? null;
			},
			setItem: (/** @type {string} */ key, /** @type {string} */ value) => {
				if (options.storageBlocked) throw new Error('Storage unavailable');
				storage.set(key, value);
			}
		},
		setTimeout: (/** @type {() => void} */ callback, /** @type {number} */ duration) => {
			timers.set(++timerId, { callback, duration });
			return timerId;
		},
		clearTimeout: (/** @type {number} */ id) => timers.delete(id)
	});
	vm.runInContext(
		ts.transpile(source, { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }),
		context
	);
	return {
		load: /** @type {LoadJsonResource} */ (context.exports.loadJsonResource),
		storage,
		timers,
		advance: (/** @type {number} */ milliseconds) => {
			now += milliseconds;
		},
		fireTimeout: () => {
			const entry = timers.entries().next().value;
			assert.ok(entry, 'Expected an active timeout');
			const [id, timer] = entry;
			timers.delete(id);
			now += timer.duration;
			timer.callback();
		}
	};
}

/** @param {unknown} payload */
function validateValue(payload) {
	if (
		!payload ||
		typeof payload !== 'object' ||
		!('value' in payload) ||
		typeof payload.value !== 'string'
	) {
		throw new Error('Invalid response');
	}
	return payload.value.toUpperCase();
}

const RESOURCE_URL = 'https://example.test/data';
const unavailable = async () => {
	throw new TypeError('Network unavailable');
};

test('转换型校验结果缓存原始响应，fresh 缓存命中不再发请求', async () => {
	const resource = createResource();
	let requests = 0;
	/** @type {typeof fetch} */
	const fetchValue = async () => {
		requests++;
		return Response.json({ value: 'live' });
	};
	assert.equal(
		await resource.load(RESOURCE_URL, { customFetch: fetchValue, validate: validateValue }),
		'LIVE'
	);
	assert.equal(
		await resource.load(RESOURCE_URL, { customFetch: fetchValue, validate: validateValue }),
		'LIVE'
	);
	assert.equal(requests, 1);
	assert.deepEqual(JSON.parse([...resource.storage.values()][0]).data, { value: 'live' });
	assert.equal(resource.timers.size, 0);
});

test('临时 HTTP 错误只重试一次，永久 HTTP 错误不重试', async () => {
	const resource = createResource();
	let requests = 0;
	/** @type {typeof fetch} */
	const transient = async () =>
		++requests === 1 ? new Response('', { status: 503 }) : Response.json({ value: 'recovered' });
	assert.equal(
		await resource.load(RESOURCE_URL, { customFetch: transient, validate: validateValue }),
		'RECOVERED'
	);
	assert.equal(requests, 2);
	const other = createResource();
	requests = 0;
	await assert.rejects(
		other.load(RESOURCE_URL, {
			customFetch: async () => {
				requests++;
				return new Response('', { status: 404 });
			}
		}),
		/JSON resource unavailable/
	);
	assert.equal(requests, 1);
});

test('响应正文挂起时超时覆盖整个读取过程，两次尝试后结束', async () => {
	const resource = createResource();
	/** @type {AbortSignal[]} */
	const signals = [];
	/** @type {typeof fetch} */
	const stalled = async (_url, init) => {
		assert.ok(init?.signal);
		signals.push(init.signal);
		return new Response(new ReadableStream());
	};
	const pending = resource.load(RESOURCE_URL, { customFetch: stalled, timeoutMs: 10 });
	const rejected = assert.rejects(pending, /JSON resource unavailable/);
	await flush();
	assert.equal(signals.length, 1);
	resource.fireTimeout();
	await flush();
	assert.equal(signals.length, 2);
	resource.fireTimeout();
	await rejected;
	assert.ok(signals.every((signal) => signal.aborted));
	assert.equal(resource.timers.size, 0);
});

test('刷新失败可使用仍在有效期内的最后成功结果', async () => {
	const resource = createResource();
	await resource.load(RESOURCE_URL, {
		customFetch: async () => Response.json({ value: 'previous' }),
		validate: validateValue
	});
	resource.advance(20);
	assert.equal(
		await resource.load(RESOURCE_URL, {
			customFetch: unavailable,
			validate: validateValue,
			maxAgeMs: 10,
			staleMaxAgeMs: 100
		}),
		'PREVIOUS'
	);
});

test('超时期间越过 stale 上限时不再回退过期数据', async () => {
	const resource = createResource();
	await resource.load(RESOURCE_URL, {
		customFetch: async () => Response.json({ value: 'previous' }),
		validate: validateValue
	});
	resource.advance(9);
	const pending = resource.load(RESOURCE_URL, {
		customFetch: async () => new Promise(() => {}),
		validate: validateValue,
		maxAgeMs: 1,
		staleMaxAgeMs: 10,
		timeoutMs: 2
	});
	const rejected = assert.rejects(pending, /JSON resource unavailable/);
	resource.fireTimeout();
	await flush();
	resource.fireTimeout();
	await rejected;
});

test('调用方同步中止时不会遗失取消事件、重试或返回 stale 数据', async () => {
	const resource = createResource();
	await resource.load(RESOURCE_URL, {
		customFetch: async () => Response.json({ value: 'previous' }),
		validate: validateValue
	});
	resource.advance(20);
	const caller = new AbortController();
	let requests = 0;
	await assert.rejects(
		resource.load(RESOURCE_URL, {
			customFetch: () => {
				requests++;
				caller.abort();
				return new Promise(() => {});
			},
			validate: validateValue,
			maxAgeMs: 10,
			signal: caller.signal
		}),
		{ name: 'AbortError' }
	);
	assert.equal(requests, 1);
	assert.equal(resource.timers.size, 0);
	await assert.rejects(
		resource.load(RESOURCE_URL, { signal: caller.signal, customFetch: unavailable }),
		{
			name: 'AbortError'
		}
	);
});

test('错误结构不覆盖最后成功缓存，且不会进行无意义的结构错误重试', async () => {
	const resource = createResource();
	await resource.load(RESOURCE_URL, {
		customFetch: async () => Response.json({ value: 'valid' }),
		validate: validateValue
	});
	const before = [...resource.storage.values()];
	resource.advance(20);
	let requests = 0;
	const result = await resource.load(RESOURCE_URL, {
		customFetch: async () => {
			requests++;
			return Response.json({ error: 'bad response' });
		},
		validate: validateValue,
		maxAgeMs: 10
	});
	assert.equal(result, 'VALID');
	assert.equal(requests, 1);
	assert.deepEqual([...resource.storage.values()], before);
});

test('浏览器禁止存储时仍正常返回经校验的网络数据', async () => {
	const resource = createResource({ storageBlocked: true });
	assert.equal(
		await resource.load(RESOURCE_URL, {
			customFetch: async () => Response.json({ value: 'live' }),
			validate: validateValue
		}),
		'LIVE'
	);
	assert.equal(resource.storage.size, 0);
	assert.equal(resource.timers.size, 0);
});

test('服务端数据更新时间延续原有效期，超龄响应不覆盖成功缓存', async () => {
	const now = Date.parse('2026-11-10T00:00:00Z');
	const resource = createResource({ now });
	const updatedAt = new Date(now - 23 * 60 * 60 * 1000).toISOString();
	assert.equal(
		await resource.load(RESOURCE_URL, {
			customFetch: async () =>
				Response.json(
					{ value: 'last-hour' },
					{
						headers: { 'X-Data-Updated-At': updatedAt }
					}
				),
			validate: validateValue
		}),
		'LAST-HOUR'
	);
	assert.equal(JSON.parse([...resource.storage.values()][0]).savedAt, Date.parse(updatedAt));
	resource.advance(59 * 60 * 1000);
	assert.equal(
		await resource.load(RESOURCE_URL, {
			customFetch: unavailable,
			validate: validateValue
		}),
		'LAST-HOUR'
	);
	resource.advance(2 * 60 * 1000);
	await assert.rejects(
		resource.load(RESOURCE_URL, {
			customFetch: unavailable,
			validate: validateValue
		}),
		/JSON resource unavailable/
	);

	/** @type {typeof fetch} */
	const expired = async () =>
		Response.json(
			{ value: 'expired' },
			{
				headers: { 'X-Data-Updated-At': new Date(now - 25 * 60 * 60 * 1000).toISOString() }
			}
		);
	const other = createResource({ now });
	await assert.rejects(
		other.load(RESOURCE_URL, {
			customFetch: expired,
			validate: validateValue
		}),
		/JSON resource unavailable/
	);
	assert.equal(other.storage.size, 0);
	await other.load(RESOURCE_URL, {
		customFetch: async () => Response.json({ value: 'previous' }),
		validate: validateValue
	});
	const before = [...other.storage.values()];
	other.advance(20);
	assert.equal(
		await other.load(RESOURCE_URL, {
			customFetch: expired,
			validate: validateValue,
			maxAgeMs: 10
		}),
		'PREVIOUS'
	);
	assert.deepEqual([...other.storage.values()], before);

	for (const header of ['invalid timestamp', new Date(now + 60 * 60 * 1000).toISOString()]) {
		const fallback = createResource({ now });
		assert.equal(
			await fallback.load(RESOURCE_URL, {
				customFetch: async () =>
					Response.json(
						{ value: 'live' },
						{
							headers: { 'X-Data-Updated-At': header }
						}
					),
				validate: validateValue
			}),
			'LIVE'
		);
		assert.equal(JSON.parse([...fallback.storage.values()][0]).savedAt, now);
	}
});
