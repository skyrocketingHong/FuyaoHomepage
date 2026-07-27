<script lang="ts">
	/**
	 * 版权文本组件
	 *
	 * 显示版权年份、站名、版本号和 GitHub 仓库链接。
	 *
	 * @prop direction - 排列方向
	 * @prop alignment - 信息行对齐方式，默认左对齐
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
	let horizontalTextAlignmentClass = $derived(
		alignment === 'center' ? 'text-center' : 'text-right'
	);
	let horizontalMetadataAlignmentClass = $derived(
		alignment === 'center' ? 'justify-center text-center' : 'justify-end text-right'
	);
</script>

{#if direction === 'horizontal'}
	<!-- 移动端水平布局：紧凑排列，强制两行 -->
	<span class="block text-[10px] leading-tight {horizontalTextAlignmentClass}">
		<span
			>© {$t('common.copyright', {
				startYear: String(startYear),
				currentYear: String(currentYear),
				siteName: seoConfig.siteName
			})}</span
		>
		<span class="inline"><br /></span>
		<span class="inline-flex items-center gap-1 {horizontalMetadataAlignmentClass}">
			<a
				href={repoConfig.url}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-1 transition-colors hover:text-foreground"
			>
				<span class="h-3 w-3 [&>svg]:h-full [&>svg]:w-full">
					<SiGithub />
				</span>
				<span>{repoConfig.name}</span>
			</a>
			<span>{__APP_VERSION_DISPLAY__}</span>
		</span>
	</span>
{:else}
	<!-- 桌面端/垂直布局：两行内容由外层列表统一控制间距 -->
	<span class="block w-full text-foreground/45 {textAlignmentClass}"
		>© {$t('common.copyright', {
			startYear: String(startYear),
			currentYear: String(currentYear),
			siteName: seoConfig.siteName
		})}</span
	>
	<span class="inline-flex w-full items-center gap-1 text-foreground/45 {metadataAlignmentClass}">
		<a
			href={repoConfig.url}
			target="_blank"
			rel="noopener noreferrer"
			class="inline-flex items-center gap-1 transition-colors hover:text-foreground"
		>
			<span class="h-3 w-3 [&>svg]:h-full [&>svg]:w-full">
				<SiGithub />
			</span>
			<span>{repoConfig.name}</span>
		</a>
		<span>{__APP_VERSION_DISPLAY__}</span>
	</span>
{/if}
