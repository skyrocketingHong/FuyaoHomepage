<script lang="ts">
	/**
	 * 版权信息组件
	 *
	 * 展示网站的版权年份和所有者。
	 */
	import { t, locale } from '$lib/i18n/store';
	import Crossfade from '$lib/components/ui/Crossfade.svelte';
	import { Github } from 'lucide-svelte';
	import { repoConfig } from '$lib/config';

	const startYear = Number(import.meta.env.VITE_SITE_START_YEAR);
	const currentYear = new Date().getFullYear();
</script>

<div class="w-full flex-none border-t border-white/5 pt-2 text-center text-xs text-white/40">
	<Crossfade key={$locale} class="flex flex-col items-center justify-center gap-1 md:flex-row md:gap-3">
		<span>© {$t('common.copyright', { startYear, currentYear })}</span>
		<span class="hidden md:inline"><br></span>
		<span class="inline-flex items-center gap-1">
			<span>Version {__APP_VERSION__} of</span>
			<a
				href={repoConfig.url}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-1 hover:text-white/60 transition-colors">
				<Github size={14} />
				<span>{repoConfig.name}</span>
			</a>
		</span>
	</Crossfade>
</div>

