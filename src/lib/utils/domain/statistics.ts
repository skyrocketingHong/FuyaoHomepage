/** 校验外部统计数据并按日期、语言规范化，避免重复记录进入 keyed each。 */
export interface DailyLanguageEntry {
	name: string;
	total_seconds?: number;
	seconds?: number;
	percent?: number;
	color?: string | null;
	text?: string;
}

export interface CodingDayEntry {
	range: { date: string; text: string };
	grand_total: { hours: number; minutes: number; total_seconds: number; text: string };
	languages?: DailyLanguageEntry[];
}

export interface AggregateLanguageEntry {
	name: string;
	percent: number;
	color: string | null;
}

export interface AnalyticsDay {
	date: string;
	pageViews: number;
	requests: number;
	uniques: number;
}

export interface AnalyticsData {
	days: AnalyticsDay[];
	totals: { pageViews: number; requests: number; uniques: number };
}

function record(value: unknown): Record<string, unknown> | null {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;
}

function metric(value: unknown): number | null {
	if (typeof value !== 'number' && (typeof value !== 'string' || value.trim() === '')) {
		return null;
	}
	const number = Number(value);
	return Number.isFinite(number) && number >= 0 ? number : null;
}

function nonnegative(value: unknown): number {
	return metric(value) ?? 0;
}

function validDate(value: unknown): value is string {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const parsed = new Date(`${value}T00:00:00Z`);
	return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function rows(value: unknown): unknown[] {
	const data = Array.isArray(value) ? value : record(value)?.data;
	if (!Array.isArray(data)) throw new Error('Invalid statistics response');
	return data;
}

function nameOf(value: unknown): string {
	return typeof value === 'string' ? value.trim() : '';
}

function colorOf(value: unknown): string | null {
	return typeof value === 'string' && /^#[\da-f]{3}(?:[\da-f]{3})?(?:[\da-f]{2})?$/i.test(value)
		? value
		: null;
}

/** 同一语言重复时保留后一条，避免重复计算同一份汇总。 */
function dailyLanguages(value: unknown): DailyLanguageEntry[] {
	const byName = new Map<string, DailyLanguageEntry>();
	for (const item of Array.isArray(value) ? value : []) {
		const language = record(item);
		const name = nameOf(language?.name);
		if (!language || !name) continue;
		byName.set(name, {
			name,
			total_seconds: nonnegative(language.total_seconds ?? language.seconds),
			color: colorOf(language.color)
		});
	}
	return [...byName.values()];
}

/** 重复日期采用后一条完整快照，不把相同日期累加为额外编程时间。 */
export function normalizeCodingDays(value: unknown): CodingDayEntry[] {
	const byDate = new Map<string, CodingDayEntry>();
	for (const item of rows(value)) {
		const day = record(item);
		const range = record(day?.range);
		const total = record(day?.grand_total);
		if (!day || !range || !validDate(range.date) || !total) continue;
		const seconds = metric(total.total_seconds);
		if (seconds === null) continue;
		let languages = dailyLanguages(day.languages);
		// 明细超过当天总时长时只保留可信的总时长，不缩放或编造每日语言分布。
		if (languages.reduce((sum, language) => sum + (language.total_seconds ?? 0), 0) > seconds) {
			languages = [];
		}
		byDate.set(range.date, {
			range: { date: range.date, text: typeof range.text === 'string' ? range.text : '' },
			grand_total: {
				hours: nonnegative(total.hours),
				minutes: nonnegative(total.minutes),
				total_seconds: seconds,
				text: typeof total.text === 'string' ? total.text : ''
			},
			languages
		});
	}
	if (rows(value).length > 0 && byDate.size === 0) throw new Error('Invalid activity data');
	return [...byDate.values()].sort((a, b) => a.range.date.localeCompare(b.range.date));
}

export function normalizeAggregateLanguages(value: unknown): AggregateLanguageEntry[] {
	const byName = new Map<string, AggregateLanguageEntry>();
	for (const item of rows(value)) {
		const language = record(item);
		const name = nameOf(language?.name);
		const percent = metric(language?.percent);
		if (!language || !name || percent === null) continue;
		byName.set(name, {
			name,
			percent: Math.min(percent, 100),
			color: colorOf(language.color)
		});
	}
	if (rows(value).length > 0 && byName.size === 0) throw new Error('Invalid language data');
	return [...byName.values()];
}

/** 真实语言 Other 与归并项共用一个键，始终只显示一次。 */
export function languageDisplayOrder(primaryNames: string[]): string[] {
	return [...new Set([...primaryNames.filter((name) => name !== 'Other'), 'Other'])];
}

export function normalizeAnalytics(value: unknown): AnalyticsData {
	const source = record(value);
	const totals = record(source?.totals);
	if (!source || !Array.isArray(source.days) || !totals) {
		throw new Error('Invalid analytics response');
	}
	const totalPageViews = metric(totals.pageViews);
	const totalRequests = metric(totals.requests);
	const totalUniques = metric(totals.uniques);
	if (totalPageViews === null || totalRequests === null || totalUniques === null) {
		throw new Error('Invalid analytics totals');
	}
	const byDate = new Map<string, AnalyticsDay>();
	for (const item of source.days) {
		const day = record(item);
		if (!day || !validDate(day.date)) continue;
		const pageViews = metric(day.pageViews);
		const requests = metric(day.requests);
		const uniques = metric(day.uniques);
		if (pageViews === null || requests === null || uniques === null) continue;
		byDate.set(day.date, { date: day.date, pageViews, requests, uniques });
	}
	return {
		days: [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)),
		// 去重日期不能通过逐日 uniques 累加重建跨日独立访客数量。
		totals: {
			pageViews: totalPageViews,
			requests: totalRequests,
			uniques: totalUniques
		}
	};
}
