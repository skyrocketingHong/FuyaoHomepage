<script lang="ts">
	/**
	 * 最新博客文章组件
	 *
	 * 从 search.json 读取文章列表，展示最近 3 篇。
	 * 点击可跳转到文章详情页。
	 */
	import { onMount } from 'svelte';
	import { BookOpen, ArrowRight } from 'lucide-svelte';
	import SectionHeader from '$lib/components/home/content/common/SectionHeader.svelte';
	import ContentCard from '$lib/components/home/content/common/ContentCard.svelte';
	import Skeleton from '$lib/components/ui/feedback/Skeleton.svelte';
	import { formatDate } from '$lib/utils/datetime/date';
	import { loadJson } from '$lib/utils/network/loading';
	import Marquee from '$lib/components/ui/display/Marquee.svelte';
	import { locale } from '$lib/i18n/store';

	/** 文章数据结构（与 search.json 一致） */
	interface PostData {
		title: string;
		slug: string;
		categories: string[];
		tags: string[];
		description: string;
		date: string;
	}

	/** 最多展示的文章数 */
	const MAX_POSTS = 3;

	let posts = $state<PostData[]>([]);
	let loading = $state(true);

	/**
	 * 加载文章数据
	 */
	async function fetchPosts() {
		try {
			const allPosts = await loadJson<PostData[]>('/posts/all.json');
			// 取前 MAX_POSTS 篇
			posts = allPosts.slice(0, MAX_POSTS);
		} catch (e) {
			console.error('加载博客文章失败', e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		fetchPosts();
	});
</script>

<div class="pt-4">
	<SectionHeader
		icon={BookOpen}
		iconBgColor="bg-rose-500/20"
		iconColor="text-rose-400"
		titleKey="home.hero.latest_posts.title"
	/>

	<div class="space-y-3">
		{#if loading}
			{#each Array(MAX_POSTS) as _}
				<ContentCard opaque={true}>
					<div class="flex h-full items-center gap-4">
						<div class="flex h-full min-w-0 flex-1 flex-col justify-between">
							<div class="space-y-1">
								<Skeleton class="h-5 w-2/3" />
								<Skeleton class="h-3 w-full" />
							</div>
							<div class="mt-auto flex gap-2">
								<Skeleton class="h-4 w-12 rounded-full" />
								<Skeleton class="h-4 w-16 rounded-full" />
							</div>
						</div>
						<div class="flex h-full items-center">
							<Skeleton class="h-8 w-8 rounded-full" />
						</div>
					</div>
				</ContentCard>
			{/each}
		{:else}
			{#each posts as post}
				<ContentCard
					tag="a"
					href="/blog/{post.categories[0]}/{post.slug}"
					class="group block transition-all duration-300 hover:border-rose-500/30"
					tilt={true}
					opaque={true}
				>
					<div class="flex h-full items-center gap-4">
						<div class="flex h-full min-w-0 flex-1 flex-col">
							<!-- 上部：标题和描述 -->
							<div>
								<div class="flex items-start justify-between gap-2">
									<h3 class="min-w-0 flex-1 pr-2 text-base font-semibold text-foreground">
										<Marquee text={post.title} class="w-full" />
									</h3>
									<span
										class="shrink-0 pt-0.5 text-xs whitespace-nowrap text-muted-foreground/60 tabular-nums"
									>
										{formatDate(post.date, $locale)}
									</span>
								</div>
								<div class="mt-1 min-h-0 flex-1 overflow-hidden text-sm text-muted-foreground">
									<Marquee
										text={post.description}
										direction="vertical"
										class="h-[36px] w-full"
										fadeSize="10%"
									/>
								</div>
							</div>

							<!-- 底部：标签和箭头 -->
							<div class="mt-auto flex items-end justify-between pt-1">
								<div class="flex flex-wrap gap-1.5 pr-2">
									{#if post.categories.length > 0}
										{#each post.categories as cat}
											<span
												class="rounded-full border border-border bg-secondary/20 px-2 py-0.5 text-[10px] whitespace-nowrap text-muted-foreground"
												>{cat}</span
											>
										{/each}
									{/if}
								</div>
								<div
									class="shrink-0 pb-0.5 text-muted-foreground/50 transition-transform group-hover:translate-x-1 group-hover:text-rose-400"
								>
									<ArrowRight size={16} />
								</div>
							</div>
						</div>
					</div>
				</ContentCard>
			{/each}
		{/if}
	</div>
</div>
