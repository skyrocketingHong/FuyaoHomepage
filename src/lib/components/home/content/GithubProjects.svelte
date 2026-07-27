<script lang="ts">
	/**
	 * GitHub 项目展示组件
	 *
	 * 通过 GitHub API 动态获取并展示置顶 (Pinned) 或最近更新的开源项目。
	 * 支持自动加载状态、骨架屏占位及响应式网格布局。
	 */
	import { onMount } from 'svelte';
	import { Star, GitFork, ArrowRight } from 'lucide-svelte';
	import SectionHeader from '$lib/components/home/content/common/SectionHeader.svelte';
	import ContentCard from '$lib/components/home/content/common/ContentCard.svelte';

	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import Skeleton from '$lib/components/ui/feedback/Skeleton.svelte';
	import { loadJson } from '$lib/utils/network/loading';
	import { cn } from '$lib/utils/index';

	import Marquee from '$lib/components/ui/display/Marquee.svelte';
	import { publicConfig } from '$lib/config/public';

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

	interface PinnedRepo {
		repo: string;
		description?: string;
		stars?: number | string;
		forks?: number | string;
		language?: string;
		link: string;
	}

	interface GithubApiRepo {
		name: string;
		description?: string;
		stargazers_count: number;
		forks_count: number;
		watchers_count: number;
		language?: string;
		html_url: string;
		updated_at: string;
	}

	/** GitHub 用户名来自经过白名单筛选的公开站点配置。 */
	const GITHUB_USERNAME = publicConfig.repository.owner;

	let githubData = $state<GithubRepo[]>([]);
	let loadingGithub = $state(true);

	/**
	 * 获取 GitHub 仓库数据
	 * 优先尝试获取 Pinned (置顶) 项目，如果失败或为空，则回退到获取最近更新的项目。
	 */
	async function fetchGithubData() {
		try {
			// 1. 尝试获取 Pinned 项目 (通过第三方 API)
			// 注意：官方 API 获取 Pinned 需要 GraphQL 和 Token，这里使用第三方开源服务无需 Token
			const data = await loadJson<PinnedRepo[]>(
				`https://gh-pinned-repos-tsj7ta5xfhep.deno.dev/?username=${GITHUB_USERNAME}`
			);

			if (Array.isArray(data) && data.length > 0) {
				githubData = data.map((repo) => ({
					name: repo.repo,
					description: repo.description ?? '',
					stars: Number(repo.stars) || 0,
					forks: Number(repo.forks) || 0,
					watchers: 0, // 置顶 API 不返回关注者数量
					language: repo.language ?? '',
					url: repo.link,
					updatedAt: '' // 置顶 API 不返回更新时间
				}));
				return; // 成功获取置顶项目，直接返回
			}

			// 2. 如果 Pinned 获取失败或为空，回退到原来的逻辑 (最近更新)
			const fallbackData = await loadJson<GithubApiRepo[]>(
				`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=6`
			);
			githubData = fallbackData.map((repo) => ({
				name: repo.name,
				description: repo.description ?? '',
				stars: repo.stargazers_count,
				forks: repo.forks_count,
				watchers: repo.watchers_count,
				language: repo.language ?? '',
				url: repo.html_url,
				updatedAt: repo.updated_at
			}));
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
								>{repo.language || 'N/A'}</span
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
		{#each loadingGithub ? Array(6).fill(null) : githubData as repo, index (repo?.url ?? index)}
			{@render projectCard(repo, loadingGithub)}
		{/each}
	</div>
</div>
