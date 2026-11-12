<script lang="ts">
	/**
	 * 足迹数据生成器模态框
	 *
	 * 允许用户通过搜索高德地图自动填充坐标，并生成 YAML 格式的数据。
	 *
	 * @prop onClose - 关闭模态框回调
	 */
	import { t } from '$lib/i18n/store';
	import { fade, scale } from 'svelte/transition';
	import { X, Copy, Check } from 'lucide-svelte';
	import { quintOut } from 'svelte/easing';
	import PlaceSearchDropdown from './PlaceSearchDropdown.svelte';
	import { generatePlaceYaml, type PlaceGeneratorInput } from '$lib/utils/domain/footprintYaml';
	import type { PlaceSearchResult } from './map/core/placeSearch';

	let { onClose } = $props<{ onClose: () => void }>();

	// 表单状态
	let placeType = $state<'city' | 'spot'>('city');
	let titleZh = $state('');
	let titleEn = $state('');
	let visitDate = $state('');
	let description = $state('');

	// 搜索状态
	let searchQuery = $state('');
	let selectedPlace = $state<PlaceSearchResult | null>(null);

	// 生成结果
	let generatedYaml = $state('');
	let isCopied = $state(false);

	/**
	 * 处理搜索结果选择
	 */
	function handlePlaceSelect(result: PlaceSearchResult) {
		selectedPlace = result;
		titleZh = result.name;
		// 英文名留空让用户填写
		titleEn = '';
	}

	/**
	 * 生成 YAML
	 */
	function handleGenerate() {
		if (!selectedPlace && !titleZh) return;

		const input: PlaceGeneratorInput = {
			type: placeType,
			titleZh,
			titleEn,
			visitDate,
			description,
			coordinates: selectedPlace?.location,
			adcode: selectedPlace?.adcode,
			poiId: selectedPlace?.id
		};

		generatedYaml = generatePlaceYaml(input);
	}

	/**
	 * 复制到剪贴板
	 */
	function handleCopy() {
		navigator.clipboard.writeText(generatedYaml);
		isCopied = true;
		setTimeout(() => (isCopied = false), 2000);
	}
</script>

<div
	class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
	transition:fade={{ duration: 200 }}
>
	<div
		class="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
		transition:scale={{ duration: 300, start: 0.95, easing: quintOut }}
	>
		<!-- 头部 -->
		<div
			class="flex items-center justify-between border-b border-zinc-100 p-4 dark:border-zinc-800"
		>
			<h3 class="text-lg font-bold">{$t('footprint.generator.title')}</h3>
			<button
				onclick={onClose}
				class="rounded-full p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
			>
				<X size={20} />
			</button>
		</div>

		<!-- 表单区域 -->
		<div class="space-y-4 overflow-y-auto p-6">
			<!-- 类型选择 -->
			<div class="flex gap-4 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
				<button
					class="flex-1 rounded-md py-1.5 text-sm font-medium transition-all {placeType === 'city'
						? 'bg-white shadow-sm dark:bg-zinc-700'
						: 'text-zinc-500'}"
					onclick={() => (placeType = 'city')}
				>
					{$t('footprint.generator.type_city')}
				</button>
				<button
					class="flex-1 rounded-md py-1.5 text-sm font-medium transition-all {placeType === 'spot'
						? 'bg-white shadow-sm dark:bg-zinc-700'
						: 'text-zinc-500'}"
					onclick={() => (placeType = 'spot')}
				>
					{$t('footprint.generator.type_spot')}
				</button>
			</div>

			<!-- 地点搜索 -->
			<PlaceSearchDropdown bind:searchQuery onSelect={handlePlaceSelect} />

			<!-- 名称输入 -->
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<label
						for="generator-title-zh"
						class="text-sm font-medium text-zinc-700 dark:text-zinc-300"
					>
						{$t('footprint.generator.name_zh')}
					</label>
					<input
						id="generator-title-zh"
						type="text"
						bind:value={titleZh}
						class="w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 outline-none dark:border-zinc-700"
					/>
				</div>
				<div class="space-y-2">
					<label
						for="generator-title-en"
						class="text-sm font-medium text-zinc-700 dark:text-zinc-300"
					>
						{$t('footprint.generator.name_en')}
					</label>
					<input
						id="generator-title-en"
						type="text"
						bind:value={titleEn}
						class="w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 outline-none dark:border-zinc-700"
						placeholder={$t('footprint.generator.name_en_placeholder')}
					/>
				</div>
			</div>

			<!-- 日期输入 -->
			<div class="space-y-2">
				<label for="generator-date" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
					{$t('footprint.generator.date')}
				</label>
				<input
					id="generator-date"
					type="text"
					bind:value={visitDate}
					class="w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 outline-none dark:border-zinc-700"
					placeholder="20240101"
				/>
			</div>

			<!-- 描述输入 -->
			<div class="space-y-2">
				<label
					for="generator-description"
					class="text-sm font-medium text-zinc-700 dark:text-zinc-300"
				>
					{$t('footprint.generator.description')}
				</label>
				<textarea
					id="generator-description"
					bind:value={description}
					class="h-20 w-full resize-none rounded-lg border border-zinc-200 bg-transparent px-3 py-2 outline-none dark:border-zinc-700"
				></textarea>
			</div>

			<!-- 已锁定坐标显示 -->
			{#if selectedPlace}
				<div
					class="rounded border border-zinc-100 bg-zinc-50 p-2 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50"
				>
					{$t('footprint.generator.locked_coordinates')}: [{selectedPlace.location.lng}, {selectedPlace
						.location.lat}]
					{#if selectedPlace.adcode}
						| Adcode: {selectedPlace.adcode}{/if}
				</div>
			{/if}

			<!-- 生成按钮 -->
			<button
				onclick={handleGenerate}
				class="w-full rounded-lg bg-black py-2.5 font-medium text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-black"
			>
				{$t('footprint.generator.generate_btn')}
			</button>

			<!-- 结果展示 -->
			{#if generatedYaml}
				<div class="relative mt-4">
					<pre
						class="w-full overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900 p-4 font-mono text-sm text-zinc-100">{generatedYaml}</pre>
					<button
						onclick={handleCopy}
						class="absolute top-2 right-2 rounded bg-zinc-700 p-1.5 text-white transition-colors hover:bg-zinc-600"
						title={$t('common.copy')}
					>
						{#if isCopied}
							<Check size={16} class="text-green-400" />
						{:else}
							<Copy size={16} />
						{/if}
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
