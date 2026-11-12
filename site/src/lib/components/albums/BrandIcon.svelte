<script lang="ts">
	/**
	 * 品牌图标组件
	 *
	 * 根据相机制造商/型号自动识别品牌，显示对应图标。
	 * 支持 Apple、Xiaomi、Leica 品牌识别，其余显示通用相机图标。
	 *
	 * @prop make - 相机制造商（如 "Apple"、"Xiaomi"）
	 * @prop model - 相机型号（用于 Leica 识别）
	 * @prop size - 图标尺寸（默认 'size-4'）
	 */
	import { Camera } from 'lucide-svelte';
	import { SiApple, SiXiaomi, SiLeica } from '@icons-pack/svelte-simple-icons';
	import { isApple, isXiaomi, hasLeica } from '$lib/utils/domain/exif';

	interface Props {
		make?: string;
		model?: string;
		size?: string;
	}

	let { make, model, size = 'size-4' }: Props = $props();
</script>

<span class="inline-flex items-center gap-1">
	{#if isApple(make)}
		<div class="{size} [&>svg]:h-full [&>svg]:w-full"><SiApple /></div>
	{:else if isXiaomi(make)}
		<div class="{size} [&>svg]:h-full [&>svg]:w-full"><SiXiaomi /></div>
	{:else}
		<Camera size={parseFloat(size.replace('size-', '')) * 4 || 16} />
	{/if}
	{#if hasLeica(make, model)}
		<div class="{size} [&>svg]:h-full [&>svg]:w-full"><SiLeica /></div>
	{/if}
</span>
