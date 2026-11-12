<script lang="ts">
	/**
	 * GitHub 项目展示组件
	 *
	 * 通过同源代理或 GitHub 官方 API 获取最近更新的公开项目。
	 * 支持自动加载状态、骨架屏占位及响应式网格布局。
	 */
	import { onMount } from 'svelte';
	import { Star, GitFork, ArrowRight } from 'lucide-svelte';
	import SectionHeader from '$lib/components/home/content/common/SectionHeader.svelte';
	import ContentCard from '$lib/components/home/content/common/ContentCard.svelte';

	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import Skeleton from '$lib/components/ui/feedback/Skeleton.svelte';
	import { loadJsonResource } from '$lib/utils/network/jsonResource';
	import { normalizeGithubRepos, type GithubRepo } from '$lib/utils/domain/github';
	import { locale, t } from '$lib/i18n/store';
	import { cn } from '$lib/utils/index';

	import Marquee from '$lib/components/ui/display/Marquee.svelte';
	import { publicConfig } from '$lib/config/public';

	/** GitHub 用户名来自经过白名单筛选的公开站点配置。 */
	const GITHUB_USERNAME = publicConfig.repository.owner;

	const GITHUB_ENDPOINT =
		publicConfig.services.githubProxyUrl ??
		`https://api.github.com/users/${encodeURIComponent(GITHUB_USERNAME)}/repos?sort=updated&direction=desc&per_page=6`;
	const GITHUB_PROFILE = `https://github.com/${encodeURIComponent(GITHUB_USERNAME)}`;

	let githubData = $state<GithubRepo[]>([]);
	let loadingGithub = $state(true);
	let githubError = $state(false);
	let activeRequest: AbortController | null = null;
	let requestVersion = 0;
	let disposed = false;

	async function fetchGithubData() {
		activeRequest?.abort();
		const controller = new AbortController();
		activeRequest = controller;
		const version = ++requestVersion;
		loadingGithub = true;
		githubError = false;
		try {
			const repositories = await loadJsonResource<GithubRepo[]>(GITHUB_ENDPOINT, {
				signal: controller.signal,
				validate: normalizeGithubRepos
			});
			if (!disposed && version === requestVersion) githubData = repositories;
		} catch {
			if (!disposed && !controller.signal.aborted && version === requestVersion) githubError = true;
		} finally {
			if (!disposed && version === requestVersion) {
				loadingGithub = false;
				activeRequest = null;
			}
		}
	}

	onMount(() => {
		void fetchGithubData();
		return () => {
			disposed = true;
			activeRequest?.abort();
		};
	});
</script>

{#snippet projectCard(repo: GithubRepo | null, loading: boolean)}
	<ContentCard
		tag="div"
		class={cn(
			'group transition-all duration-300',
			loading ? 'h-[116px] border-border/50' : 'h-[116px] hover:border-purple-500/30'
		)}
		tilt={true}
		opaque={true}
	>
		<svelte:element
			this={loading ? 'div' : 'a'}
			href={repo?.url}
			target={repo?.url ? '_blank' : undefined}
			rel={repo?.url ? 'noopener noreferrer' : undefined}
			class={cn('block h-full w-full outline-none')}
		>
			<Crossfade key={loading ? 'loading' : 'loaded'} class="h-full w-full">
				{#if loading}
					<div class="flex h-full flex-col justify-between">
						<div class="flex shrink-0 items-start justify-between gap-2">
							<Skeleton class="h-5 w-2/3" />
							<Skeleton class="h-4 w-12 rounded-full" />
						</div>
						<div class="min-h-0 flex-1 space-y-1.5 py-2">
							<Skeleton class="h-3 w-full" />
							<Skeleton class="h-3 w-4/5" />
						</div>
						<div class="flex shrink-0 items-center gap-4">
							<Skeleton class="h-3 w-12" />
							<Skeleton class="h-3 w-12" />
						</div>
					</div>
				{:else if repo}
					<div class="flex h-full flex-col group-hover:no-underline">
						<!-- 顶部：项目名 + 语言 -->
						<div class="flex shrink-0 items-start justify-between gap-2">
							<h3
								class="w-0 min-w-0 flex-1 text-base font-semibold text-foreground transition-colors"
							>
								<Marquee text={repo.name} class="w-full" />
							</h3>
							<span
								class="shrink-0 rounded-full border border-border bg-secondary/20 px-2 py-0.5 text-[10px] whitespace-nowrap text-muted-foreground"
								>{repo.language || $t('home.hero.github.language_default')}</span
							>
						</div>

						<!-- 中部：描述 (自适应高度) -->
						<div class="mt-1 mb-1 min-h-0 flex-1 overflow-hidden text-sm text-muted-foreground">
							<Marquee
								text={repo.description || ''}
								direction="vertical"
								class="max-h-[43px] w-full"
								fadeSize="10%"
							/>
						</div>

						<!-- 底部：统计信息 -->
						<div class="mt-auto flex shrink-0 items-center justify-between">
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
							<div
								class="shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-1 group-hover:text-purple-400"
							>
								<ArrowRight size={16} />
							</div>
						</div>
					</div>
				{/if}
			</Crossfade>
		</svelte:element>
	</ContentCard>
{/snippet}

<div class="pt-4">
	<SectionHeader icon="github" titleKey="home.hero.github.title" />

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		{#if !loadingGithub && (githubError || githubData.length === 0)}
			<ContentCard class="flex min-h-[116px] flex-col justify-center gap-3 md:col-span-2" opaque>
				<Crossfade key={`${$locale}-${githubError ? 'error' : 'empty'}`}>
					<p class="text-sm text-muted-foreground">
						{$t(githubError ? 'home.hero.github.load_error' : 'home.hero.github.empty')}
					</p>
					<div class="mt-3 flex flex-wrap items-center gap-4 text-sm">
						{#if githubError}
							<button
								type="button"
								class="underline underline-offset-4"
								onclick={() => void fetchGithubData()}
							>
								{$t('home.hero.github.retry')}
							</button>
						{/if}
						<a
							href={GITHUB_PROFILE}
							target="_blank"
							rel="noopener noreferrer"
							class="underline underline-offset-4"
						>
							{$t('home.hero.github.open_profile')}
						</a>
					</div>
				</Crossfade>
			</ContentCard>
		{:else}
			{#each loadingGithub ? Array(6).fill(null) : githubData as repo, index (repo?.id ?? `loading-${index}`)}
				{@render projectCard(repo, loadingGithub)}
			{/each}
		{/if}
	</div>
</div>
