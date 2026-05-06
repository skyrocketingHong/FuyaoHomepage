<script lang="ts">
	/**
	 * 足迹页面操作按钮组件
	 *
	 * 提供足迹页面的头部操作入口，包括打开数据生成器模态框的按钮。
	 */
	import { Plus } from 'lucide-svelte';
	import { t } from '$lib/i18n/store';
	import GeneratorModal from './GeneratorModal.svelte';
	import HeaderActionButton from '$lib/components/layout/header/ActionButton.svelte';

	let showModal = $state(false);
</script>

<HeaderActionButton
	onclick={() => (showModal = true)}
	title={$t('footprint.actions.generate_data')}
	crossfadeKey="generate-data"
>
	{#snippet icon()}
		<Plus size={20} />
	{/snippet}
	{#snippet text()}
		<span class="hidden lg:inline">{$t('footprint.actions.generate_data')}</span>
	{/snippet}
</HeaderActionButton>

{#if showModal}
	<GeneratorModal onClose={() => (showModal = false)} />
{/if}
