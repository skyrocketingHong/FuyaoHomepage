<script lang="ts">
	/**
	 * 时间胶囊组件 (运行时间统计)
	 *
	 * 实时计算并展示网站自 2016-11-20 启动以来的运行时间。
	 * 支持中英文切换，并可通过点击在“大写文字”和“阿拉伯数字”格式间切换。
	 */
	import { onMount, onDestroy } from 'svelte';
	import { Clock } from 'lucide-svelte';
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import { t, locale } from '$lib/i18n/store';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import { numberToChinese, numberToEnglish } from '$lib/utils/format/number';

	// 配置
	const SITE_START_DATE = '2016-11-20';

	// 状态
	let timeRunning = $state('');
	let useDigits = $state(false); // 是否使用阿拉伯数字格式
	let timer: ReturnType<typeof setInterval>;

	/**
	 * 计算并格式化运行时间
	 */
	function calculateTimeRunning() {
		const start = new Date(SITE_START_DATE);
		const now = new Date();
		const diff = now.getTime() - start.getTime();

		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
		const seconds = Math.floor((diff % (1000 * 60)) / 1000);

		if (useDigits) {
			// 阿拉伯数字格式
			const d = days.toString().padStart(2, '0');
			const h = hours.toString().padStart(2, '0');
			const m = minutes.toString().padStart(2, '0');
			const s = seconds.toString().padStart(2, '0');

			if ($locale === 'zh-CN') {
				timeRunning = `${d} 天\n${h} 小时 ${m} 分钟 ${s} 秒`;
			} else {
				timeRunning = `${d} Days\n${h} Hours ${m} Minutes ${s} Seconds`;
			}
			return;
		}

		if ($locale === 'zh-CN') {
			// 中文大写格式
			const format = (val: number) => {
				const converted = numberToChinese(val);
				if (val < 10) {
					return '零' + converted;
				} else if (val === 10) {
					return '壹拾';
				}
				return converted;
			};

			timeRunning = `${format(days)}天\n${format(hours)}小时${format(minutes)}分钟${format(seconds)}秒`;
		} else {
			// 英文单词格式
			const daysText = numberToEnglish(days) + (days === 1 ? ' Day' : ' Days');
			const hoursText = numberToEnglish(hours) + (hours === 1 ? ' Hour' : ' Hours');
			const minsText = numberToEnglish(minutes) + (minutes === 1 ? ' Minute' : ' Minutes');
			const secsText = numberToEnglish(seconds) + (seconds === 1 ? ' Second' : ' Seconds');
			timeRunning = `${daysText}\n${hoursText}, ${minsText}, ${secsText}`;
		}
	}

	function toggleFormat() {
		useDigits = !useDigits;
		calculateTimeRunning();
	}

	// 响应语言变化
	$effect(() => {
		const _ = $locale;
		calculateTimeRunning();
	});

	onMount(() => {
		calculateTimeRunning();
		timer = setInterval(calculateTimeRunning, 1000);
	});

	onDestroy(() => {
		if (timer) clearInterval(timer);
	});
</script>

<div class="pt-4">
	<div class="mb-4 flex items-center gap-4">
		<LiquidGlass
			class="h-12 w-12 rounded-2xl bg-orange-500/20 p-3 text-orange-400 transition-transform group-hover:scale-110"
		>
			<Clock size={24} />
		</LiquidGlass>
		<h2 class="text-2xl font-bold text-foreground">
			<Crossfade key={$locale} class="inline-grid"
				><span>{$t('home.hero.time_capsule.title')}</span></Crossfade
			>
		</h2>
	</div>
	<LiquidGlass
		opaque={true}
		class="cursor-pointer p-4"
		tilt={true}
		onclick={toggleFormat}
		role="button"
		tabindex="0"
		onkeydown={(e: { key: string }) => e.key === 'Enter' && toggleFormat()}
	>
		<div class="space-y-2">
			<p class="in:fade text-sm text-muted-foreground">
				<Crossfade key={$locale} class="inline-grid"
					><span>{$t('home.hero.time_capsule.subtitle')}</span></Crossfade
				>
			</p>
			<div class="min-h-14 font-mono text-xl font-bold text-orange-400 select-none">
				{#each timeRunning.split('') as char, i}
					{#if char === '\n'}
						<br />
					{:else if char === ' '}
						<span class="inline-block whitespace-pre">{'\u00A0'}</span>
					{:else}
						<Crossfade key={`${i}-${char}`} duration={150} class="inline-grid"
							><span>{char}</span></Crossfade
						>
					{/if}
				{/each}
			</div>
		</div>
	</LiquidGlass>
</div>
