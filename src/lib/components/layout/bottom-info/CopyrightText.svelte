<script lang="ts">
	/**
	 * 版权、仓库与版本信息组件。
	 *
	 * 移动端固定渲染两条 13px 静态单行：版权年份、GitHub 图标和版本号不压缩，
	 * 站点名与仓库名在溢出时省略，并通过 title/aria-label 保留完整内容。
	 *
	 * @prop direction - 排列方向。
	 * @prop alignment - 信息行对齐方式，默认左对齐。
	 */
	import { t } from '$lib/i18n/store';
	import { SiGithub } from '@icons-pack/svelte-simple-icons';
	import { repoConfig, seoConfig } from '$lib/config/index';
	import { publicConfig } from '$lib/config/public';

	let { direction = 'vertical', alignment = 'start' } = $props<{
		direction?: 'vertical' | 'horizontal' | 'auto';
		alignment?: 'start' | 'center';
	}>();

	const startYear = publicConfig.site.startYear;
	const currentYear = new Date().getFullYear();

	let textAlignmentClass = $derived(alignment === 'center' ? 'text-center' : 'text-left');
	let metadataAlignmentClass = $derived(
		alignment === 'center' ? 'justify-center text-center' : 'justify-start text-left'
	);
	let copyrightLabel = $derived(`© ${startYear} - ${currentYear} ${seoConfig.siteName}`);
	let repositoryLabel = $derived(`${repoConfig.name} ${__APP_VERSION_DISPLAY__}`);
</script>

{#if direction === 'horizontal'}
	<div
		class="flex h-[13px] w-full min-w-0 items-center justify-end gap-1 overflow-hidden text-right whitespace-nowrap"
		title={copyrightLabel}
		aria-label={copyrightLabel}
	>
		<span class="shrink-0">© {startYear} - {currentYear}</span>
		<span class="min-w-0 truncate">{seoConfig.siteName}</span>
	</div>
	<div
		class="flex h-[13px] w-full min-w-0 items-center justify-end gap-1 overflow-hidden text-right whitespace-nowrap"
		title={repositoryLabel}
		aria-label={repositoryLabel}
	>
		<a
			href={repoConfig.url}
			target="_blank"
			rel="noopener noreferrer"
			class="inline-flex h-full min-w-0 items-center justify-end gap-1 overflow-hidden text-right transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary/60"
			title={repoConfig.name}
			aria-label={repoConfig.name}
		>
			<span class="size-3 shrink-0 [&>svg]:size-full">
				<SiGithub />
			</span>
			<span class="min-w-0 truncate">{repoConfig.name}</span>
		</a>
		<span class="shrink-0">{__APP_VERSION_DISPLAY__}</span>
	</div>
{:else}
	<span class="block w-full text-foreground/45 {textAlignmentClass}"
		>© {$t('common.copyright', {
			startYear: String(startYear),
			currentYear: String(currentYear),
			siteName: seoConfig.siteName
		})}</span
	>
	<span
		class="inline-flex w-full min-w-0 items-center gap-1 overflow-hidden whitespace-nowrap text-foreground/45 {metadataAlignmentClass}"
	>
		<a
			href={repoConfig.url}
			target="_blank"
			rel="noopener noreferrer"
			class="inline-flex min-w-0 items-center gap-1 overflow-hidden transition-colors hover:text-foreground"
		>
			<span class="size-3 shrink-0 [&>svg]:size-full">
				<SiGithub />
			</span>
			<span class="truncate">{repoConfig.name}</span>
		</a>
		<span class="shrink-0">{__APP_VERSION_DISPLAY__}</span>
	</span>
{/if}
