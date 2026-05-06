<script lang="ts">
	/**
	 * WakaTime 编程统计组件
	 *
	 * 使用 WakaTime Coding Activity 嵌入式 JSON 获取近 7 天每日编码时间，
	 * 可选搭配 Languages 嵌入式 JSON 显示语言标签。
	 */
	import { onMount } from 'svelte';
	import { Code } from 'lucide-svelte';
	import SectionHeader from '$lib/components/home/content/common/SectionHeader.svelte';
	import ContentCard from '$lib/components/home/content/common/ContentCard.svelte';
	import Skeleton from '$lib/components/ui/feedback/Skeleton.svelte';
	import { t, locale } from '$lib/i18n/store';
	import { dayjs, formatDuration, formatDate } from '$lib/utils/datetime/date';
	import type { LocaleKey } from '$lib/i18n';

	/** 单日数据（匹配 WakaTime Coding Activity 嵌入式 JSON） */
	interface DayEntry {
		range: { date: string; text: string };
		grand_total: {
			hours: number;
			minutes: number;
			total_seconds: number;
			text: string;
		};
	}

	/** 语言数据（匹配 WakaTime Languages 嵌入式 JSON） */
	interface LangEntry {
		name: string;
		percent: number;
		color: string | null;
	}

	/** 环境变量 */
	const WAKATIME_URL = import.meta.env.VITE_WAKATIME_EMBED_URL;
	const LANGUAGES_URL = import.meta.env.VITE_WAKATIME_LANGUAGES_URL;

	let days = $state<DayEntry[]>([]);
	let languages = $state<LangEntry[]>([]);
	let totalText = $derived(
		formatDuration(
			days.reduce((sum, d) => sum + d.grand_total.total_seconds, 0),
			$locale
		)
	);
	let loading = $state(true);
	let error = $state('');

	/** 语言颜色备用映射 */
	const colorMap: Record<string, string> = {
		TypeScript: '#3178C6',
		JavaScript: '#F7DF1E',
		Python: '#3776AB',
		Rust: '#DEA584',
		Go: '#00ADD8',
		Java: '#ED8B00',
		Svelte: '#FF3E00',
		HTML: '#E34F26',
		CSS: '#1572B6',
		YAML: '#CB171E',
		Markdown: '#083FA1',
		Bash: '#4EAA25',
		Other: '#6B7280'
	};

	/** 获取星期缩写（根据当前 locale 本地化） */
	function getWeekday(dateStr: string, currentLocale: LocaleKey): string {
		const dayjsLocale = currentLocale.toLowerCase() === 'zh-cn' ? 'zh-cn' : 'en';
		return dayjs(dateStr).locale(dayjsLocale).format('dd');
	}

	/** 获取语言颜色 */
	function getLangColor(lang: LangEntry): string {
		return lang.color || colorMap[lang.name] || '#6B7280';
	}

	async function fetchWakaTime() {
		if (!WAKATIME_URL) {
			error = '未配置 VITE_WAKATIME_EMBED_URL';
			loading = false;
			return;
		}

		try {
			// 并行获取 Coding Activity 和 Languages（如有）
			const promises: Promise<any>[] = [fetch(WAKATIME_URL).then((r) => r.json())];
			if (LANGUAGES_URL) {
				promises.push(fetch(LANGUAGES_URL).then((r) => r.json()));
			}

			const results = await Promise.all(promises);

			// 解析每日编码时间
			const entries: DayEntry[] = results[0].data || [];
			days = entries;
			// totalText 现在是 derived 状态，无需手动计算

			// 解析语言分布（如有）
			if (results[1]?.data) {
				languages = results[1].data.slice(0, 4).map((l: any) => ({
					name: l.name,
					percent: l.percent,
					color: l.color || null
				}));
			}
		} catch (e) {
			console.error('获取 WakaTime 数据失败', e);
			error = 'Failed to load';
		} finally {
			loading = false;
		}
	}

	/** 柱状图最大值 */
	function maxSeconds(): number {
		return Math.max(...days.map((d) => d.grand_total.total_seconds), 1);
	}

	onMount(() => {
		fetchWakaTime();
	});
</script>

<div class="flex h-full flex-col pt-4">
	<SectionHeader
		icon={Code}
		iconBgColor="bg-teal-500/20"
		iconColor="text-teal-400"
		titleKey="home.hero.coding_activity.title"
		subtitleKey="home.hero.coding_activity.powered_by"
		rightKey="home.hero.coding_activity.past_week"
	/>

	<ContentCard class="h-[116px] shrink-0" tilt={true} opaque={true}>
		{#if loading}
			<div class="flex h-full flex-col justify-between">
				<Skeleton class="h-4 w-24" />
				<div class="flex h-10 items-end gap-1">
					{#each Array(7) as _}
						<Skeleton class="flex-1 rounded-t" style="height: {8 + Math.random() * 24}px" />
					{/each}
				</div>
			</div>
		{:else if error}
			<p class="text-sm text-muted-foreground">{error}</p>
		{:else}
			<div class="flex h-full flex-col justify-between">
				<!-- 顶部：总时间 + 语言标签 -->
				<div class="flex items-start justify-between gap-2 overflow-hidden">
					<span class="shrink-0 text-lg leading-tight font-bold text-teal-400">{totalText}</span>
					<!-- 语言标签（如有） -->
					{#if languages.length > 0}
						<div class="mt-1 flex flex-wrap content-start justify-end gap-1">
							{#each languages as lang}
								<span
									class="inline-flex items-center gap-0.5 rounded-full bg-secondary/30 px-1.5 py-px text-[10px] whitespace-nowrap text-muted-foreground"
								>
									<span
										class="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
										style="background-color: {getLangColor(lang)}"
									></span>
									{lang.name}
								</span>
							{/each}
						</div>
					{/if}
				</div>

				<!-- 柱状图 -->
				<div class="flex shrink-0 items-end gap-1" style="height: 60px;">
					{#each days as day}
						{@const pct = (day.grand_total.total_seconds / maxSeconds()) * 100}
						<div class="group/bar relative flex flex-1 flex-col items-center">
							<div
								class="w-full rounded-t bg-teal-400/70 transition-all duration-300 group-hover/bar:bg-teal-400"
								style="height: {Math.max(pct * 0.48, 2)}px;"
								title="{formatDate(day.range.date, $locale)}: {formatDuration(
									day.grand_total.total_seconds,
									$locale
								)}"
							></div>
							<span
								class="mt-0.5 origin-top scale-90 text-[8px] leading-none text-muted-foreground/60"
								>{getWeekday(day.range.date, $locale)}</span
							>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</ContentCard>
</div>
