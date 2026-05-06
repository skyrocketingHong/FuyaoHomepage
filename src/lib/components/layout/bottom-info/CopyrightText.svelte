<script lang="ts">
	/**
	 * 版权文本组件
	 *
	 * 显示版权年份、站名、版本号和 GitHub 仓库链接。
	 *
	 * @prop direction - 排列方向
	 */
	import { t } from '$lib/i18n/store';
	import { SiGithub } from '@icons-pack/svelte-simple-icons';
	import { repoConfig, seoConfig } from '$lib/config/index';

	/* iOS 风格版本号: Version (iOSBuildString) */
	/* 3.0.0 (build 1) -> 3.0 (3A1) */
	/* 3.0.0: Hide patch .0 -> 3.0 */
	/* 3A1: Major(3) + MinorLetter(A) + Build(1) */
	let versionDisplay = $derived.by(() => {
		const [vMajor, vMinor, vPatch] = __APP_VERSION__.split('.');
		const version = vPatch === '0' ? `${vMajor}.${vMinor}` : __APP_VERSION__;

		if (__BUILD_NUMBER__ === 0) return version;

		const major = parseInt(vMajor) || 0;
		const minor = parseInt(vMinor) || 0;
		const minorLetter = String.fromCharCode(65 + (minor % 26));
		const buildString = `${major}${minorLetter}${__BUILD_NUMBER__}`;

		return `${version} (${buildString})`;
	});

	let { direction = 'vertical' } = $props<{
		direction?: 'vertical' | 'horizontal' | 'auto';
	}>();

	const startYear = Number(import.meta.env.VITE_SITE_START_YEAR);
	const currentYear = new Date().getFullYear();

	/* 控制换行符的可见性 */
	let separatorClass = $derived.by(() => {
		if (direction === 'vertical') return 'hidden';
		if (direction === 'horizontal') return 'inline'; // 移动端强制两行
		return 'hidden md:inline';
	});

	/* 移动端使用更小的文字 */
	let textClass = $derived(direction === 'horizontal' ? 'text-[10px] leading-tight' : '');
</script>

<span class={textClass}>
	<span
		>© {$t('common.copyright', {
			startYear: String(startYear),
			currentYear: String(currentYear),
			siteName: seoConfig.siteName
		})}</span
	>
	<span class={separatorClass}><br /></span>
	<span class="inline-flex items-center justify-end gap-1 lg:pt-1">
		<a
			href={repoConfig.url}
			target="_blank"
			rel="noopener noreferrer"
			class="inline-flex items-center gap-1 transition-colors hover:text-foreground"
		>
			<div class="h-3 w-3 [&>svg]:h-full [&>svg]:w-full">
				<SiGithub />
			</div>
			<span>{repoConfig.name}</span>
		</a>
		<span>{versionDisplay}</span>
	</span>
</span>
