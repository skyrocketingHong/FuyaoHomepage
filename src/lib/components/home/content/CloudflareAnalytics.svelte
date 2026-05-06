<script lang="ts">
	/**
	 * Cloudflare 访问统计组件（半宽卡片）
	 *
	 * 从 CF Worker 获取近 7 天的访问数据，
	 * 左侧展示数字概览，右侧展示迷你折线图。
	 */
	import { onMount } from 'svelte';
	import { BarChart3, Eye, Users, Globe } from 'lucide-svelte';
	import SectionHeader from '$lib/components/home/content/common/SectionHeader.svelte';
	import ContentCard from '$lib/components/home/content/common/ContentCard.svelte';
	import { t, locale } from '$lib/i18n/store';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import Skeleton from '$lib/components/ui/feedback/Skeleton.svelte';

	import { formatDate } from '$lib/utils/datetime/date';

	/** 单日数据 */
	interface DayData {
		date: string;
		pageViews: number;
		requests: number;
		uniques: number;
	}

	/** API 返回结构 */
	interface AnalyticsData {
		days: DayData[];
		totals: {
			pageViews: number;
			requests: number;
			uniques: number;
		};
	}

	/** CF Worker 端点 URL */
	const WORKER_URL = import.meta.env.VITE_CF_ANALYTICS_WORKER_URL;

	let data = $state<AnalyticsData | null>(null);
	let loading = $state(true);
	let error = $state('');

	async function fetchAnalytics() {
		if (!WORKER_URL) {
			error = '未配置 VITE_CF_ANALYTICS_WORKER_URL';
			loading = false;
			return;
		}
		try {
			const res = await fetch(WORKER_URL);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			data = await res.json();
		} catch (e) {
			console.error('获取 Cloudflare 统计失败', e);
			error = 'Failed to load';
		} finally {
			loading = false;
		}
	}

	/** 格式化数字（1.2K / 3.4M） */
	function formatNumber(num: number): string {
		if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
		if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
		return num.toString();
	}

	// 图表配置
	const CHART_HEIGHT = 45; // Reduced height to fit in card
	const CHART_WIDTH = 300;
	const PADDING_TOP = 4;
	const PADDING_BOTTOM = 14;
	const PADDING_X = 2;

	/** 计算坐标点 */
	function getPoints(values: number[], w: number, h: number) {
		if (values.length === 0) return [];
		const max = Math.max(...values, 1);
		const min = Math.min(...values, 0);
		const range = max - min || 1;

		const drawH = h - PADDING_TOP - PADDING_BOTTOM;
		const drawW = w - PADDING_X * 2;
		const step = drawW / Math.max(values.length - 1, 1);

		return values.map((v, i) => {
			const x = PADDING_X + i * step;
			// y 坐标：值越大 y 越小（向上），加上顶部 padding
			const y = PADDING_TOP + drawH - ((v - min) / range) * drawH;
			return { x, y };
		});
	}

	/** 生成迷你折线图 SVG 路径 */
	function sparklinePath(values: number[], w: number, h: number): string {
		const points = getPoints(values, w, h);
		return points
			.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
			.join(' ');
	}

	/** 折线图下方填充区域路径 */
	function sparklineArea(values: number[], w: number, h: number): string {
		const points = getPoints(values, w, h);
		if (points.length === 0) return '';

		const line = points
			.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
			.join(' ');

		const bottomY = (h - PADDING_BOTTOM).toFixed(1);
		const firstX = points[0].x.toFixed(1);
		const lastX = points[points.length - 1].x.toFixed(1);

		return `${line} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
	}

	onMount(() => {
		fetchAnalytics();
	});
</script>

<div class="flex h-full flex-col pt-4">
	<SectionHeader
		icon={BarChart3}
		iconBgColor="bg-sky-500/20"
		iconColor="text-sky-400"
		titleKey="home.hero.analytics.title"
		subtitleKey="home.hero.analytics.powered_by"
		rightKey="home.hero.analytics.past_days"
	/>

	<ContentCard class="h-[116px] shrink-0" tilt={true} opaque={true}>
		{#if loading}
			<div class="flex h-full flex-col justify-between gap-2">
				<div class="flex justify-between gap-4 px-2">
					<Skeleton class="h-8 w-20" />
					<Skeleton class="h-8 w-20" />
					<Skeleton class="h-8 w-20" />
				</div>
				<Skeleton class="h-[60px] w-full" />
			</div>
		{:else if error}
			<p class="text-sm text-muted-foreground">{error}</p>
		{:else if data}
			<!-- 上下布局：上部统计数据，下部折线图 -->
			<div class="flex h-full flex-col justify-between overflow-hidden">
				<!-- 统计数字 (水平排列) -->
				<div class="flex shrink-0 items-center justify-between px-2 pt-0.5">
					<!-- Page Views -->
					<div class="flex flex-col items-center gap-0.5">
						<span class="text-lg leading-none font-bold text-sky-400">
							{formatNumber(data.totals.pageViews)}
						</span>
						<div class="flex items-center gap-1 text-[10px] text-muted-foreground/80">
							<Eye size={10} />
							<Crossfade key={$locale} class="inline-grid">
								<span>{$t('home.hero.analytics.page_views')}</span>
							</Crossfade>
						</div>
					</div>

					<!-- Unique Visitors -->
					<div class="flex flex-col items-center gap-0.5">
						<span class="text-lg leading-none font-bold text-emerald-400">
							{formatNumber(data.totals.uniques)}
						</span>
						<div class="flex items-center gap-1 text-[10px] text-muted-foreground/80">
							<Users size={10} />
							<Crossfade key={$locale} class="inline-grid">
								<span>{$t('home.hero.analytics.unique_visitors')}</span>
							</Crossfade>
						</div>
					</div>

					<!-- Total Requests -->
					<div class="flex flex-col items-center gap-0.5">
						<span class="text-lg leading-none font-bold text-violet-400">
							{formatNumber(data.totals.requests)}
						</span>
						<div class="flex items-center gap-1 text-[10px] text-muted-foreground/80">
							<Globe size={10} />
							<Crossfade key={$locale} class="inline-grid">
								<span>{$t('home.hero.analytics.total_requests')}</span>
							</Crossfade>
						</div>
					</div>
				</div>

				<!-- 迷你折线图 (全宽) -->
				<div
					class="relative mt-0.5 flex min-h-0 w-full flex-1 flex-col items-center justify-end overflow-hidden"
				>
					<svg
						viewBox="0 0 {CHART_WIDTH} {CHART_HEIGHT}"
						class="h-full w-full"
						preserveAspectRatio="none"
					>
						<defs>
							<linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stop-color="rgb(56,189,248)" stop-opacity="0.3" />
								<stop offset="100%" stop-color="rgb(56,189,248)" stop-opacity="0.02" />
							</linearGradient>
							<!-- 新增遮罩渐变：左右渐变透明 -->
							<linearGradient id="fadeMaskGradient" x1="0" y1="0" x2="1" y2="0">
								<stop offset="0%" stop-color="black" />
								<stop offset="5%" stop-color="white" />
								<stop offset="95%" stop-color="white" />
								<stop offset="100%" stop-color="black" />
							</linearGradient>
							<mask id="fadeMask" maskContentUnits="objectBoundingBox">
								<rect width="1" height="1" fill="url(#fadeMaskGradient)" />
							</mask>
						</defs>

						<!-- 仅对折线和填充应用遮罩 -->
						<g mask="url(#fadeMask)">
							<!-- 区域填充 -->
							<path
								d={sparklineArea(
									data.days.map((d) => d.pageViews),
									CHART_WIDTH,
									CHART_HEIGHT
								)}
								fill="url(#sparkGrad)"
							/>
							<!-- 折线 -->
							<path
								d={sparklinePath(
									data.days.map((d) => d.pageViews),
									CHART_WIDTH,
									CHART_HEIGHT
								)}
								fill="none"
								stroke="rgb(56,189,248)"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</g>
					</svg>

					<!-- 底部日期标签（HTML 覆盖层，避免 SVG 缩放导致文字变形） -->
					{#if data.days.length > 0}
						<div
							class="pointer-events-none absolute right-0 bottom-0.5 left-0 flex w-full justify-between px-0.5"
						>
							{#each data.days as day, i}
								<span class="text-[9px] leading-none text-muted-foreground/60">
									{formatDate(day.date, $locale, 'MM-DD')}
								</span>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</ContentCard>
</div>
