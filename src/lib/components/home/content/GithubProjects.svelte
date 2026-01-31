<script lang="ts">
	/**
	 * GitHub 项目展示组件
	 *
	 * 通过 GitHub API 动态获取并展示置顶 (Pinned) 或最近更新的开源项目。
	 * 支持自动加载状态、骨架屏占位及响应式网格布局。
	 */
	import { onMount } from 'svelte';
	import { Github, Star, GitFork } from 'lucide-svelte';
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import { t, locale } from '$lib/i18n/store';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import LoadingState from '$lib/components/ui/feedback/LoadingState.svelte';
	import { cn } from '$lib/utils';

	import Marquee from '$lib/components/ui/display/Marquee.svelte';

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

	/** GitHub 用户名，从环境变量读取 */
	const GITHUB_USERNAME = import.meta.env.VITE_GITHUB_USERNAME;

	let githubData = $state<GithubRepo[]>([]);
	let loadingGithub = $state(true);
	let loadingText = $state('');

	$effect(() => {
		// 国际化加载文本
		loadingText = $t('home.hero.github.loading');
	});

	/**
	 * 获取 GitHub 仓库数据
	 * 优先尝试获取 Pinned (置顶) 项目，如果失败或为空，则回退到获取最近更新的项目。
	 */
	async function fetchGithubData() {
		try {
			// 1. 尝试获取 Pinned 项目 (通过第三方 API)
			// 注意：官方 API 获取 Pinned 需要 GraphQL 和 Token，这里使用第三方开源服务无需 Token
			const pinnedResponse = await fetch(
				`https://gh-pinned-repos-tsj7ta5xfhep.deno.dev/?username=${GITHUB_USERNAME}`
			);

			if (pinnedResponse.ok) {
				const data = await pinnedResponse.json();
				if (Array.isArray(data) && data.length > 0) {
					githubData = data.map((repo: any) => ({
						name: repo.repo,
						description: repo.description,
						stars: Number(repo.stars) || 0,
						forks: Number(repo.forks) || 0,
						watchers: 0, // 置顶 API 不返回关注者数量
						language: repo.language,
						url: repo.link,
						updatedAt: '' // 置顶 API 不返回更新时间
					}));
					return; // 成功获取置顶项目，直接返回
				}
			}

			// 2. 如果 Pinned 获取失败或为空，回退到原来的逻辑 (最近更新)
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
				throw new Error('Github API failed');
			}
		} catch (e) {
			console.error('获取 GitHub 数据失败', e);
			// API 请求失败时使用备用数据
			githubData = [
				{
					name: 'LoadError',
					description: 'Failed to load GitHub data, maybe rate limited',
					stars: 114,
					forks: 514,
					watchers: 1919810,
					language: 'LoadError',
					url: `https://github.com/${GITHUB_USERNAME}/fuyao-homepage`,
					updatedAt: new Date().toISOString()
				}
			];
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
		<h2 class="text-2xl font-bold text-foreground">
			<Crossfade key={$locale} class="inline-grid"
				><span>{$t('home.hero.github.title')}</span></Crossfade
			>
		</h2>
	</div>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		{#each loadingGithub ? Array(6).fill(null) : githubData as repo}
			<LiquidGlass
				opaque={true}
				tag="a"
				href={repo?.url}
				target={repo?.url ? '_blank' : undefined}
				class={cn(
					'transition-all duration-300',
					loadingGithub
						? 'flex h-[142px] items-center justify-center border-border'
						: 'block p-4 hover:border-purple-500/30'
				)}
				tilt={true}
			>
				<Crossfade key={loadingGithub ? 'loading' : 'loaded'} class="h-full w-full">
					{#if loadingGithub}
						<div class="flex h-full w-full items-center justify-center">
							<LoadingState loading={true} variant="inline" text={loadingText} />
						</div>
					{:else if repo}
						<div class="h-full">
							<div class="mb-2 flex items-start justify-between gap-2">
								<h3
									class="min-w-0 w-0 flex-1 text-lg font-bold transition-colors text-foreground"
								>
									<Marquee text={repo.name} class="w-full" />
								</h3>
								<span
									class="shrink-0 rounded-full border border-border bg-secondary/20 px-2 py-0.5 text-xs text-muted-foreground"
									>{repo.language || "N/A"}</span
								>
							</div>
							<div class="mb-4 h-9 text-sm text-muted-foreground">
								<Marquee
									text={repo.description || ""}
									direction="vertical"
									class="h-full w-full"
								/>
							</div>
							<div class="flex items-center gap-4 text-xs text-muted-foreground/70">
								<div class="flex items-center gap-1">
									<Star size={14} />
									<span>{repo.stars}</span>
								</div>
								<div class="flex items-center gap-1">
									<GitFork size={14} />
									<span>{repo.forks}</span>
								</div>
							</div>
						</div>
					{/if}
				</Crossfade>
			</LiquidGlass>
		{/each}
	</div>
</div>
