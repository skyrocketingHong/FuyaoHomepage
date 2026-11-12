/** AMap 脚本加载、鉴权模式与失败重试的行为验证。 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

/** @param {null | undefined | (() => void)} callback */
function fire(callback) {
	assert.ok(callback, '预期已注册加载事件或超时回调');
	callback();
}

/** @param {{ serviceHost?: string; preloaded?: boolean; ssr?: boolean }} [options] */
function createLoader(options = {}) {
	const source = fs
		.readFileSync(
			new URL('../src/lib/components/footprint/map/core/loader.ts', import.meta.url),
			'utf8'
		)
		.replace(
			"import { publicConfig } from '$lib/config/public';",
			'const publicConfig = testConfig;'
		);
	/** @type {Array<{ onload: null | (() => void); onerror: null | (() => void); src: string; async: boolean; removed: boolean; remove: () => void }>} */
	const scripts = [];
	/** @type {Map<number, () => void>} */
	const timers = new Map();
	let timerId = 0;
	/** @type {{ AMap?: object; _AMapSecurityConfig?: { serviceHost?: string; securityJsCode?: string } }} */
	const window = options.preloaded ? { AMap: {} } : {};
	const context = vm.createContext({
		exports: {},
		URL,
		testConfig: { services: { amap: { serviceHost: options.serviceHost } } },
		...(options.ssr ? {} : { window }),
		document: {
			createElement: () => ({
				onload: null,
				onerror: null,
				src: '',
				async: false,
				removed: false,
				remove() {
					this.removed = true;
				}
			}),
			head: {
				appendChild: (/** @type {(typeof scripts)[number]} */ script) => scripts.push(script)
			}
		},
		setTimeout: (/** @type {() => void} */ callback) => {
			timers.set(++timerId, callback);
			return timerId;
		},
		clearTimeout: (/** @type {number} */ id) => timers.delete(id)
	});
	vm.runInContext(ts.transpile(source, { module: ts.ModuleKind.CommonJS }), context);
	return { load: context.exports.loadAMapScript, window, scripts, timers };
}

test('并发地图挂载共享加载任务，代理鉴权在插入脚本前配置', async () => {
	const loader = createLoader({ serviceHost: 'https://maps.example.com/_AMapService' });
	const first = loader.load('browser-key', 'security-code');
	const second = loader.load('browser-key', 'security-code');
	assert.equal(first, second);
	assert.equal(loader.scripts.length, 1);
	assert.deepEqual(
		{ ...loader.window._AMapSecurityConfig },
		{
			serviceHost: 'https://maps.example.com/_AMapService'
		}
	);
	assert.equal(new URL(loader.scripts[0].src).searchParams.get('key'), 'browser-key');
	loader.window.AMap = {};
	fire(loader.scripts[0].onload);
	await first;
	assert.equal(loader.timers.size, 0);
	assert.equal(loader.scripts[0].onload, null);
});

test('无代理时使用显式安全码，不设置空 serviceHost', async () => {
	const loader = createLoader();
	const loading = loader.load('browser-key', 'security-code');
	assert.deepEqual({ ...loader.window._AMapSecurityConfig }, { securityJsCode: 'security-code' });
	loader.window.AMap = {};
	fire(loader.scripts[0].onload);
	await loading;
});

test('脚本网络失败后移除节点并允许重新加载', async () => {
	const loader = createLoader();
	const loading = loader.load('browser-key', 'security-code');
	fire(loader.scripts[0].onerror);
	await assert.rejects(loading, /^Error: AMap SDK failed to load$/);
	assert.equal(loader.scripts[0].removed, true);
	assert.equal(loader.timers.size, 0);
	const retry = loader.load('browser-key', 'security-code');
	assert.equal(loader.scripts.length, 2);
	loader.window.AMap = {};
	fire(loader.scripts[1].onload);
	await retry;
});

test('脚本超时后清理任务且重试不复用失败 Promise', async () => {
	const loader = createLoader();
	const loading = loader.load('browser-key', 'security-code');
	fire(loader.timers.values().next().value);
	await assert.rejects(loading, /AMap SDK failed to load/);
	assert.equal(loader.scripts[0].removed, true);
	const retry = loader.load('browser-key', 'security-code');
	assert.notEqual(retry, loading);
	loader.window.AMap = {};
	fire(loader.scripts[1].onload);
	await retry;
});

test('脚本加载完成但 SDK 未初始化时拒绝并允许重试', async () => {
	const loader = createLoader();
	const loading = loader.load('browser-key', 'security-code');
	fire(loader.scripts[0].onload);
	await assert.rejects(loading, /AMap SDK failed to load/);
	const retry = loader.load('browser-key', 'security-code');
	loader.window.AMap = {};
	fire(loader.scripts[1].onload);
	await retry;
});

test('已加载的 SDK 不重复插入脚本或重写鉴权配置', async () => {
	const loader = createLoader({ preloaded: true });
	await loader.load('browser-key', 'security-code');
	assert.equal(loader.scripts.length, 0);
	assert.equal(loader.window._AMapSecurityConfig, undefined);
});

test('服务端渲染跳过 SDK 与浏览器配置', async () => {
	const loader = createLoader({ ssr: true });
	await loader.load('browser-key', 'security-code');
	assert.equal(loader.scripts.length, 0);
});
