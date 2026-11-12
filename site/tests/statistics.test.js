/** 外部统计记录去重、Other 键和真实数据边界的行为回归。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
	languageDisplayOrder,
	normalizeAggregateLanguages,
	normalizeAnalytics,
	normalizeCodingDays
} from '../src/lib/utils/domain/statistics.ts';

/** @param {string} date @param {number} total @param {unknown[]} [languages] */
function day(date, total, languages = []) {
	return { range: { date }, grand_total: { total_seconds: total }, languages };
}

test('真实 Other、重复主语言和归并项只产生一个稳定 Other 键', () => {
	assert.deepEqual(languageDisplayOrder(['Other', 'Python', 'Python', 'Go']), [
		'Python',
		'Go',
		'Other'
	]);
});

test('每日日期采用后一条完整快照且语言去重，不累加重复时间', () => {
	const result = normalizeCodingDays({
		data: [
			day('2026-11-02', 200),
			day('2026-11-01', 100),
			day('2026-11-02', 150, [
				{ name: 'Python', total_seconds: 20 },
				{ name: 'Python', total_seconds: 100 },
				{ name: 'Other', total_seconds: 50 }
			])
		]
	});
	assert.deepEqual(
		result.map((entry) => entry.range.date),
		['2026-11-01', '2026-11-02']
	);
	assert.equal(result[1].grand_total.total_seconds, 150);
	assert.deepEqual(
		result[1].languages?.map((entry) => [entry.name, entry.total_seconds]),
		[
			['Python', 100],
			['Other', 50]
		]
	);
	assert.equal(
		result.reduce((sum, entry) => sum + entry.grand_total.total_seconds, 0),
		250
	);
	assert.deepEqual(normalizeCodingDays(result), result);
});

test('没有每日语言明细时保留空明细，不把周比例复制成每天的数据', () => {
	const result = normalizeCodingDays({ data: [day('2026-11-01', 3600)] });
	assert.deepEqual(result[0].languages, []);
	assert.equal(result[0].grand_total.total_seconds, 3600);
	const inconsistent = normalizeCodingDays({
		data: [day('2026-11-02', 60, [{ name: 'Python', total_seconds: 120 }])]
	});
	assert.deepEqual(inconsistent[0].languages, []);
	assert.equal(inconsistent[0].grand_total.total_seconds, 60);
});

test('语言汇总重复记录保留后者，并拒绝无效响应和错误计数', () => {
	const result = normalizeAggregateLanguages({
		data: [
			{ name: 'Python', percent: 30, color: '#3776ab' },
			{ name: 'Other', percent: 20 },
			{ name: 'Python', percent: 80, color: 'url(evil)' }
		]
	});
	assert.deepEqual(result, [
		{ name: 'Python', percent: 80, color: null },
		{ name: 'Other', percent: 20, color: null }
	]);
	assert.deepEqual(normalizeAggregateLanguages(result), result);
	assert.throws(() => normalizeAggregateLanguages({ data: 'rate limited' }));
	assert.throws(() => normalizeCodingDays({ data: [day('2026-02-31', 20)] }));
	assert.throws(() => normalizeCodingDays({ data: [day('2026-11-01', NaN)] }));
});

test('访问统计去重日期但保留上游跨日访客总数，不通过逐日求和重建', () => {
	const source = {
		days: [
			{ date: '2026-11-02', pageViews: 100, requests: 200, uniques: 15 },
			{ date: '2026-11-01', pageViews: 50, requests: 100, uniques: 10 },
			{ date: '2026-11-02', pageViews: 120, requests: 240, uniques: 16 }
		],
		totals: { pageViews: 170, requests: 340, uniques: 20 }
	};
	const result = normalizeAnalytics(source);
	assert.equal(result.days.length, 2);
	assert.equal(result.days[1].pageViews, 120);
	assert.equal(result.totals.uniques, 20);
	assert.deepEqual(normalizeAnalytics(result), result);
	assert.throws(() => normalizeAnalytics({ days: [], totals: { pageViews: NaN } }));
});
