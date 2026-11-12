import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveInitialLocale } from '../src/lib/i18n/initial-locale.ts';

test('已保存的访客语言选择优先于浏览器语言与站点默认语言', () => {
	assert.equal(
		resolveInitialLocale({ defaultLocale: 'zh-CN', saved: 'en-US', browserLanguages: ['zh-CN'] }),
		'en-US'
	);
	assert.equal(
		resolveInitialLocale({ defaultLocale: 'en-US', saved: 'zh-CN', browserLanguages: ['en-US'] }),
		'zh-CN'
	);
});

test('未保存选择时按浏览器语言精确或主代码匹配', () => {
	assert.equal(
		resolveInitialLocale({
			defaultLocale: 'en-US',
			saved: null,
			browserLanguages: ['zh_TW', 'zh']
		}),
		'zh-CN'
	);
	assert.equal(
		resolveInitialLocale({
			defaultLocale: 'zh-CN',
			saved: null,
			browserLanguages: ['fr-FR', 'en-GB']
		}),
		'en-US'
	);
});

test('无浏览器语言信息或均不匹配时回退到站点配置默认语言', () => {
	assert.equal(
		resolveInitialLocale({ defaultLocale: 'en-US', saved: null, browserLanguages: null }),
		'en-US'
	);
	assert.equal(
		resolveInitialLocale({ defaultLocale: 'zh-CN', saved: null, browserLanguages: null }),
		'zh-CN'
	);
	assert.equal(
		resolveInitialLocale({
			defaultLocale: 'en-US',
			saved: null,
			browserLanguages: ['fr-FR', 'de']
		}),
		'en-US'
	);
});

test('无效的已保存值被忽略，不影响后续优先级', () => {
	assert.equal(
		resolveInitialLocale({ defaultLocale: 'zh-CN', saved: 'jp-JP', browserLanguages: null }),
		'zh-CN'
	);
	assert.equal(
		resolveInitialLocale({ defaultLocale: 'zh-CN', saved: 'garbage', browserLanguages: ['en-US'] }),
		'en-US'
	);
});

test('站点配置的 defaultLocale 是被消费的回退值而非仅存在于 schema', () => {
	// 同样的访客状态（无保存、无浏览器语言），默认语言跟随站点配置变化。
	const quietVisitor = { saved: null, browserLanguages: null };
	assert.equal(resolveInitialLocale({ defaultLocale: 'zh-CN', ...quietVisitor }), 'zh-CN');
	assert.equal(resolveInitialLocale({ defaultLocale: 'en-US', ...quietVisitor }), 'en-US');
});
