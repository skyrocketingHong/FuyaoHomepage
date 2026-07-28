<script lang="ts">
	/**
	 * WakaTime 编程统计组件。
	 *
	 * 活动代理返回每日 `languages` 秒数明细时，图表按真实组成绘制堆叠柱；代理仅返回
	 * 每日总时长时，日柱保持中性色，并将独立语言代理的七日分布显示为单独分段条，
	 * 不把七日比例复制到每天。柱体可通过悬停或键盘聚焦查看日期、总时长和明细。
	 */
	import { onMount } from 'svelte';
	import SectionHeader from '$lib/components/home/content/common/SectionHeader.svelte';
	import ContentCard from '$lib/components/home/content/common/ContentCard.svelte';
	import Skeleton from '$lib/components/ui/feedback/Skeleton.svelte';
	import { locale, t } from '$lib/i18n/store';
	import { dayjs, formatDuration, formatDate } from '$lib/utils/datetime/date';
	import type { LocaleKey } from '$lib/i18n';
	import { publicConfig } from '$lib/config/public';

	interface DailyLanguageEntry {
		name: string;
		total_seconds?: number;
		seconds?: number;
		percent?: number;
		color?: string | null;
		text?: string;
	}

	interface DayEntry {
		range: { date: string; text: string };
		grand_total: {
			hours: number;
			minutes: number;
			total_seconds: number;
			text: string;
		};
		languages?: DailyLanguageEntry[];
	}

	interface LangEntry {
		name: string;
		percent: number;
		color: string | null;
	}

	interface WakaResponse<T> {
		data?: T[];
	}

	interface ChartLanguage {
		name: string;
		seconds: number;
		percent: number;
		color: string;
	}

	interface ChartDay {
		date: string;
		totalSeconds: number;
		segments: ChartLanguage[];
	}

	const OTHER_LANGUAGE = 'Other';
	const OTHER_COLOR = '#6b7280';
	const NEUTRAL_BAR_COLOR = 'color-mix(in oklab, var(--muted-foreground) 45%, transparent)';
	const WAKATIME_URL = publicConfig.services.codingActivityProxyUrl;
	const LANGUAGES_URL = publicConfig.services.codingLanguagesProxyUrl;

	const colorMap: Record<string, string> = {
		TypeScript: '#3178c6',
		JavaScript: '#f7df1e',
		Python: '#3776ab',
		Rust: '#dea584',
		Go: '#00add8',
		Java: '#ed8b00',
		Svelte: '#ff3e00',
		HTML: '#e34f26',
		CSS: '#1572b6',
		YAML: '#cb171e',
		Markdown: '#083fa1',
		Bash: '#4eaa25',
		Other: OTHER_COLOR
	};

	let days = $state<DayEntry[]>([]);
	let languages = $state<LangEntry[]>([]);
	let loading = $state(true);
	let errorKey = $state('');
	let activeDayIndex = $state<number | null>(null);

	let totalText = $derived(
		formatDuration(
			days.reduce((sum, day) => sum + getDayTotal(day), 0),
			$locale
		)
	);

	let aggregateLanguageMap = $derived.by(() => {
		return Object.fromEntries(languages.map((language) => [language.name, language] as const));
	});

	let hasDailyLanguageData = $derived(
		days.some((day) => (day.languages ?? []).some((language) => getLanguageSeconds(language) > 0))
	);

	let primaryLanguageNames = $derived.by(() => {
		if (!hasDailyLanguageData) {
			return languages
				.filter((language) => Number.isFinite(language.percent) && language.percent > 0)
				.sort((a, b) => b.percent - a.percent)
				.slice(0, 3)
				.map((language) => language.name);
		}

		const totals = createDictionary<number>();
		for (const day of days) {
			for (const language of day.languages ?? []) {
				const seconds = getLanguageSeconds(language);
				if (seconds <= 0) continue;
				totals[language.name] = (totals[language.name] ?? 0) + seconds;
			}
		}
		return Object.entries(totals)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 3)
			.map(([name]) => name);
	});

	let chartDays = $derived.by<ChartDay[]>(() => {
		return days.map((day) => {
			const totalSeconds = getDayTotal(day);
			if (!hasDailyLanguageData || totalSeconds <= 0) {
				return { date: day.range.date, totalSeconds, segments: [] };
			}

			const grouped = createDictionary<{ seconds: number; color?: string | null }>();
			for (const language of day.languages ?? []) {
				const seconds = getLanguageSeconds(language);
				if (seconds <= 0) continue;
				const name = primaryLanguageNames.includes(language.name) ? language.name : OTHER_LANGUAGE;
				const current = grouped[name];
				grouped[name] = {
					seconds: (current?.seconds ?? 0) + seconds,
					color: current?.color ?? language.color
				};
			}

			const representedSeconds = Object.values(grouped).reduce(
				(sum, language) => sum + language.seconds,
				0
			);
			if (representedSeconds < totalSeconds) {
				const other = grouped[OTHER_LANGUAGE];
				grouped[OTHER_LANGUAGE] = {
					seconds: (other?.seconds ?? 0) + (totalSeconds - representedSeconds),
					color: other?.color
				};
			}

			const segmentOrder = [...primaryLanguageNames, OTHER_LANGUAGE];
			const segments = segmentOrder.flatMap((name) => {
				const language = grouped[name];
				if (!language || language.seconds <= 0) return [];
				return [
					{
						name,
						seconds: language.seconds,
						percent: Math.min((language.seconds / totalSeconds) * 100, 100),
						color: resolveLanguageColor(name, language.color, aggregateLanguageMap[name]?.color)
					}
				];
			});

			return { date: day.range.date, totalSeconds, segments };
		});
	});

	let legendLanguages = $derived.by<ChartLanguage[]>(() => {
		if (!hasDailyLanguageData) {
			const topLanguages = languages
				.filter((language) => Number.isFinite(language.percent) && language.percent > 0)
				.sort((a, b) => b.percent - a.percent)
				.slice(0, 3);
			const topPercent = topLanguages.reduce((sum, language) => sum + language.percent, 0);
			const result: ChartLanguage[] = topLanguages.map((language) => ({
				name: language.name,
				seconds: 0,
				percent: language.percent,
				color: resolveLanguageColor(language.name, language.color)
			}));
			if (languages.length > topLanguages.length && topPercent < 100) {
				result.push({
					name: OTHER_LANGUAGE,
					seconds: 0,
					percent: Math.max(0, 100 - topPercent),
					color: OTHER_COLOR
				});
			}
			return result;
		}

		const totals = createDictionary<number>();
		for (const day of chartDays) {
			for (const segment of day.segments) {
				totals[segment.name] = (totals[segment.name] ?? 0) + segment.seconds;
			}
		}
		const allSeconds = Object.values(totals).reduce((sum, seconds) => sum + seconds, 0);
		return [...primaryLanguageNames, OTHER_LANGUAGE].flatMap((name) => {
			const seconds = totals[name] ?? 0;
			if (seconds <= 0 || allSeconds <= 0) return [];
			const firstSegment = chartDays
				.flatMap((day) => day.segments)
				.find((segment) => segment.name === name);
			return [
				{
					name,
					seconds,
					percent: (seconds / allSeconds) * 100,
					color: firstSegment?.color ?? resolveLanguageColor(name)
				}
			];
		});
	});

	let activeDay = $derived(activeDayIndex === null ? null : (chartDays[activeDayIndex] ?? null));

	function createDictionary<T>(): Record<string, T> {
		return Object.create(null) as Record<string, T>;
	}

	function getDayTotal(day: DayEntry): number {
		const seconds = Number(day.grand_total?.total_seconds);
		return Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
	}

	function getLanguageSeconds(language: DailyLanguageEntry): number {
		const seconds = Number(language.total_seconds ?? language.seconds ?? 0);
		return Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
	}

	function isValidColor(color: string | null | undefined): color is string {
		return typeof color === 'string' && /^#[\da-f]{3}(?:[\da-f]{3})?(?:[\da-f]{2})?$/i.test(color);
	}

	function resolveLanguageColor(
		name: string,
		primary?: string | null,
		secondary?: string | null
	): string {
		if (isValidColor(primary)) return primary;
		if (isValidColor(secondary)) return secondary;
		return colorMap[name] ?? OTHER_COLOR;
	}

	function getLanguageName(name: string): string {
		return name === OTHER_LANGUAGE ? $t('home.hero.coding_activity.other') : name;
	}

	function getWeekday(date: string, currentLocale: LocaleKey): string {
		const dayjsLocale = currentLocale.toLowerCase() === 'zh-cn' ? 'zh-cn' : 'en';
		return dayjs(date).locale(dayjsLocale).format('dd');
	}

	function formatPercent(percent: number): string {
		return new Intl.NumberFormat($locale, { maximumFractionDigits: 1 }).format(percent) + '%';
	}

	function getDayAriaLabel(day: ChartDay): string {
		const summary = [
			formatDate(day.date, $locale),
			$t('home.hero.coding_activity.total'),
			formatDuration(day.totalSeconds, $locale)
		];
		if (day.segments.length > 0) {
			for (const segment of day.segments) {
				summary.push(
					`${getLanguageName(segment.name)} ${formatDuration(segment.seconds, $locale)} ${formatPercent(segment.percent)}`
				);
			}
		} else {
			summary.push($t('home.hero.coding_activity.daily_breakdown_unavailable'));
		}
		return summary.join($t('common.comma'));
	}

	async function fetchJson<T>(url: string): Promise<T> {
		const response = await fetch(url);
		if (!response.ok) throw new Error(`WakaTime request failed: ${response.status}`);
		return response.json() as Promise<T>;
	}

	async function fetchWakaTime() {
		if (!WAKATIME_URL) {
			errorKey = 'home.hero.coding_activity.not_configured';
			loading = false;
			return;
		}

		try {
			const [activityResponse, languageResponse] = await Promise.all([
				fetchJson<WakaResponse<DayEntry>>(WAKATIME_URL),
				LANGUAGES_URL
					? fetchJson<WakaResponse<LangEntry>>(LANGUAGES_URL)
					: Promise.resolve<WakaResponse<LangEntry> | null>(null)
			]);
			days = activityResponse.data ?? [];
			languages = (languageResponse?.data ?? []).map((language) => ({
				name: language.name,
				percent: Number(language.percent) || 0,
				color: isValidColor(language.color) ? language.color : null
			}));
		} catch (fetchError) {
			console.error('获取 WakaTime 数据失败', fetchError);
			errorKey = 'home.hero.coding_activity.load_error';
		} finally {
			loading = false;
		}
	}

	function maxSeconds(): number {
		return Math.max(...chartDays.map((day) => day.totalSeconds), 1);
	}

	onMount(fetchWakaTime);
</script>

<div class="flex h-full flex-col pt-4">
	<SectionHeader
		icon="coding"
		titleKey="home.hero.coding_activity.title"
		subtitleKey="home.hero.coding_activity.powered_by"
		rightKey="home.hero.coding_activity.past_week"
	/>

	<ContentCard class="h-[116px] shrink-0" tilt={true} opaque={true}>
		{#if loading}
			<div class="flex h-full flex-col justify-between">
				<Skeleton class="h-4 w-24" />
				<div class="flex h-10 items-end gap-1">
					{#each [16, 27, 21, 34, 24, 39, 30] as height, index (index)}
						<Skeleton class="flex-1 rounded-t" style={`height: ${height}px`} />
					{/each}
				</div>
			</div>
		{:else if errorKey}
			<p class="text-sm text-muted-foreground">{$t(errorKey)}</p>
		{:else}
			<div class="relative flex h-full flex-col justify-between">
				<div class="flex min-h-7 items-start justify-between gap-2 overflow-hidden">
					<span class="shrink-0 text-lg leading-tight font-bold text-foreground">{totalText}</span>
					{#if legendLanguages.length > 0}
						<div
							class="mt-0.5 flex flex-wrap content-start justify-end gap-x-1.5 gap-y-0.5"
							aria-label={$t('home.hero.coding_activity.legend')}
						>
							{#each legendLanguages as language (language.name)}
								<span
									class="inline-flex items-center gap-1 text-[9px] leading-3 whitespace-nowrap text-muted-foreground"
								>
									<span
										class="size-1.5 shrink-0 rounded-full"
										style={`background-color: ${language.color}`}
									></span>
									{getLanguageName(language.name)}
								</span>
							{/each}
						</div>
					{/if}
				</div>

				{#if !hasDailyLanguageData && legendLanguages.length > 0}
					<div
						class="flex h-1.5 w-full shrink-0 overflow-hidden rounded-full bg-muted/50"
						aria-label={$t('home.hero.coding_activity.weekly_distribution')}
					>
						{#each legendLanguages as language (language.name)}
							<span style={`width: ${language.percent}%; background-color: ${language.color}`}
							></span>
						{/each}
					</div>
				{/if}

				<div class="flex h-[58px] shrink-0 items-end gap-1">
					{#each chartDays as day, index (day.date)}
						{@const height =
							day.totalSeconds > 0 ? Math.max((day.totalSeconds / maxSeconds()) * 46, 2) : 2}
						<button
							type="button"
							class="group/bar flex h-full min-w-0 flex-1 flex-col items-center justify-end rounded-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary/60"
							aria-label={getDayAriaLabel(day)}
							onmouseenter={() => (activeDayIndex = index)}
							onmouseleave={() => (activeDayIndex = null)}
							onfocus={() => (activeDayIndex = index)}
							onblur={() => (activeDayIndex = null)}
						>
							<div
								class="flex w-full max-w-7 flex-col-reverse overflow-hidden rounded-t-[3px] opacity-80 transition-opacity duration-200 group-hover/bar:opacity-100 group-focus-visible/bar:opacity-100"
								style={`height: ${height}px; ${day.totalSeconds <= 0 || day.segments.length === 0 ? `background: ${NEUTRAL_BAR_COLOR}` : ''}`}
								aria-hidden="true"
							>
								{#each day.segments as segment (segment.name)}
									<span style={`height: ${segment.percent}%; background-color: ${segment.color}`}
									></span>
								{/each}
							</div>
							<span class="mt-0.5 text-[8px] leading-none text-muted-foreground/70"
								>{getWeekday(day.date, $locale)}</span
							>
						</button>
					{/each}
				</div>

				{#if activeDay}
					<div
						role="tooltip"
						class="absolute inset-x-0 bottom-[17px] z-20 rounded-lg bg-popover/95 px-2 py-1.5 text-[9px] leading-3 text-popover-foreground shadow-lg backdrop-blur-sm"
					>
						<div class="flex items-center justify-between gap-2 font-semibold">
							<span>{formatDate(activeDay.date, $locale)}</span>
							<span>{formatDuration(activeDay.totalSeconds, $locale)}</span>
						</div>
						{#if activeDay.segments.length > 0}
							<div class="mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
								{#each activeDay.segments as segment (segment.name)}
									<span class="inline-flex items-center gap-1 whitespace-nowrap">
										<span class="size-1.5 rounded-full" style={`background-color: ${segment.color}`}
										></span>
										{getLanguageName(segment.name)}
										{formatDuration(segment.seconds, $locale)}
										{formatPercent(segment.percent)}
									</span>
								{/each}
							</div>
						{:else}
							<p class="mt-0.5 text-muted-foreground">
								{$t('home.hero.coding_activity.daily_breakdown_unavailable')}
							</p>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</ContentCard>
</div>
