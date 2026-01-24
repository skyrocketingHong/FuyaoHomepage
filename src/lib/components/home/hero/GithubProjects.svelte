<script lang="ts">
	/**
	 * GitHub 项目展示组件
	 *
	 * 从 GitHub API 获取并展示最近更新的仓库列表。
	 */
	import { onMount } from 'svelte';
	import { Github, Star, GitFork } from 'lucide-svelte';
	import LiquidGlass from '$lib/components/ui/liquid-glass.svelte';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import { t, locale } from '$lib/i18n/store';
	import Crossfade from '$lib/components/ui/crossfade.svelte';

	interface GithubRepo {
		name: string;
		description: string;
		stars: number;
		forks: number;
		watchers: number;
		language: string;
		url: string;
		updatedAt: string;
	}

	const GITHUB_USERNAME = 'skyrocketinghong';

	let githubData = $state<GithubRepo[]>([]);
	let loadingGithub = $state(true);
	let loadingText = $state('');

	$effect(() => {
		// Simple i18n loading text
		loadingText = $t('home.hero.github.loading');
	});

	// Fetch GitHub Data
	async function fetchGithubData() {
		try {
			const response = await fetch(
				`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=6`
			);
			if (response.ok) {
				const data = await response.json();
				githubData = data.map((repo: any) => ({
					name: repo.name,
					description: repo.description,
					stars: repo.stargazers_count,
					forks: repo.forks_count,
					watchers: repo.watchers_count,
					language: repo.language,
					url: repo.html_url,
					updatedAt: repo.updated_at
				}));
			} else {
				githubData = [
					{
						name: 'fuyao-homepage',
						description: 'My personal homepage built with SvelteKit',
						stars: 12,
						forks: 2,
						watchers: 1,
						language: 'Svelte',
						url: 'https://github.com/skyrocketinghong/fuyao-homepage',
						updatedAt: new Date().toISOString()
					}
				];
			}
		} catch (e) {
			console.error('Failed to fetch GitHub data', e);
		} finally {
			loadingGithub = false;
		}
	}

	onMount(() => {
		fetchGithubData();
	});
</script>

<div class="pt-4">
	<div class="mb-4 flex items-center gap-4">
		<LiquidGlass class="h-12 w-12 rounded-2xl bg-purple-500/20 p-3 text-purple-400">
			<Github size={24} />
		</LiquidGlass>
		<h2 class="text-2xl font-bold">
			<Crossfade key={$locale} class="inline-grid"
				><span>{$t('home.hero.github.title')}</span></Crossfade
			>
		</h2>
	</div>

	{#if loadingGithub}
		<!-- Loading State -->
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			{#each Array(4) as _}
				<LiquidGlass class="flex h-32 flex-col items-center justify-center gap-4 p-4" tilt={true}>
					<LoadingSpinner size="md" />
					<span class="text-xs font-medium tracking-widest text-white/50 uppercase"
						><Crossfade key={$locale} class="inline-grid"><span>{loadingText}</span></Crossfade
						></span
					>
				</LiquidGlass>
			{/each}
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			{#each githubData as repo}
				<LiquidGlass
					tag="a"
					href={repo.url}
					target="_blank"
					class="block p-4 transition-all hover:border-purple-500/30 hover:bg-white/5"
					tilt={true}
				>
					<div class="mb-2 flex items-start justify-between">
						<h3
							class="truncate pr-4 text-lg font-bold transition-colors group-hover:text-purple-400"
						>
							{repo.name}
						</h3>
						<span
							class="rounded-full border border-white/5 bg-white/10 px-2 py-0.5 text-xs text-white/50"
							><Crossfade key={$locale} class="inline-grid"
								><span>{repo.language || $t('home.hero.github.language_default')}</span></Crossfade
							></span
						>
					</div>
					<p class="mb-4 line-clamp-2 h-10 text-sm text-white/60">
						{repo.description || $t('home.hero.github.no_description')}
					</p>
					<div class="flex items-center gap-4 text-xs text-white/40">
						<div class="flex items-center gap-1">
							<Star size={14} />
							<span>{repo.stars}</span>
						</div>
						<div class="flex items-center gap-1">
							<GitFork size={14} />
							<span>{repo.forks}</span>
						</div>
					</div>
				</LiquidGlass>
			{/each}
		</div>
	{/if}
</div>
