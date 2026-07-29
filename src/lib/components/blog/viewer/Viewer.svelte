<script lang="ts">
	/**
	 * 博客文章阅读器组件
	 *
	 * 负责处理 Markdown 加载、解析、侧边栏 TOC 注入以及滚动监听逻辑。
	 *
	 * @prop post - 当前展示的文章元数据对象
	 * @prop onClose - 关闭阅读器时的回调
	 * @prop categories - 全部分类配置列表
	 */
	import LoadingState from '$lib/components/ui/feedback/LoadingState.svelte';
	import { slugify } from '$lib/utils/format/slugify';
	import { t, locale } from '$lib/i18n/store';
	import { tick, untrack, onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import { sidebarState, headerState } from '$lib/stores/app.svelte';
	import { loadPostContent } from '$lib/utils/domain/loader';
	import type { BlogPost } from '$lib/utils/domain/blog';

	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';

	import Header from './Header.svelte';
	import TableOfContents from './TableOfContents.svelte';
	import BackButton from './BackButton.svelte';
	import MarkdownRenderer from './MarkdownRenderer.svelte';

	let {
		post,
		onClose,
		categories = [],
		initialArticle
	} = $props<{
		post: BlogPost;
		onClose: () => void;
		categories: { slug: string; title: string }[];
		initialArticle?: {
			content: string;
			html: string;
			toc: { id: string; text: string; depth: number }[];
			loadedFile: string;
			displayPost: BlogPost & {
				categoryTitles?: { slug: string; title: string }[];
			};
		};
	}>();

	const initialArticleValue = untrack(() => initialArticle);
	let content = $state(initialArticleValue?.content ?? '');
	let loading = $state(!initialArticleValue);
	let loadedFile = $state(initialArticleValue?.loadedFile ?? '');
	let initialHtml = $state(initialArticleValue?.html ?? '');
	let toc: { id: string; text: string; depth: number }[] = $state(initialArticleValue?.toc ?? []);
	let tocListId = '';
	let leftActionId = '';

	// 文章数据状态
	let displayPost = $state(untrack(() => initialArticleValue?.displayPost ?? post));

	$effect(() => {
		if (post) {
			loadContent(post);
		}
	});

	// 头部与侧边栏注入
	$effect(() => {
		if (onClose) {
			leftActionId = headerState.setLeft(BackButton, { onclick: onClose }, 'blog-back');
		}
		return () => {
			if (leftActionId) headerState.clearLeft(leftActionId);
		};
	});

	$effect(() => {
		if (toc.length > 0) {
			tocListId = sidebarState.setList(
				TableOfContents,
				{
					toc: toc,
					onItemClick: (id: string) => {
						handleTocClick(id);
						sidebarState.closeMobileDrawer();
					},
					activeId: activeHeaderId
				},
				'blog.toc'
			);
		} else if (tocListId && sidebarState.currentListId === tocListId) {
			sidebarState.clearList(tocListId);
			tocListId = '';
		}
	});

	onDestroy(() => {
		if (tocListId && sidebarState.currentListId === tocListId) {
			sidebarState.clearList(tocListId);
		}
		if (leftActionId) {
			headerState.clearLeft(leftActionId);
		}
	});

	async function loadContent(currentPost: typeof post) {
		if (currentPost.file === loadedFile) {
			const hash = untrack(() => page.url.hash);
			if (hash) {
				await tick();
				handleTocClick(slugify(decodeURIComponent(hash.substring(1))));
			}
			return;
		}

		loading = true;
		initialHtml = '';
		if (typeof window !== 'undefined') window.scrollTo(0, 0);

		toc = [];
		try {
			const result = await loadPostContent(currentPost, categories);
			content = result.content;
			displayPost = result.displayPost;
			loadedFile = result.loadedFile;
		} catch {
			content = `<p class="text-red-400">${$t('blog.loading_error')}</p>`;
		} finally {
			loading = false;
			const hash = untrack(() => page.url.hash);
			if (hash) {
				await tick();
				handleTocClick(slugify(decodeURIComponent(hash.substring(1))));
			}
		}
	}

	async function handleTocClick(id: string, retryCount = 0) {
		await tick();
		const el = document.getElementById(id);

		if (el) {
			isManualNavigation = true;
			el.scrollIntoView({ behavior: 'smooth', block: 'start' });

			if (window.location.hash !== `#${id}`) {
				replaceState(
					resolve(`${window.location.pathname}${window.location.search}#${id}` as Pathname),
					page.state
				);
			}

			activeHeaderId = id;
			updateSidebar();
			setTimeout(() => {
				isManualNavigation = false;
			}, 1000);
		} else if (retryCount < 50) {
			setTimeout(() => handleTocClick(id, retryCount + 1), 100);
		}
	}

	let activeHeaderId = $state('');
	let isManualNavigation = false;
	let observer: IntersectionObserver;

	function updateSidebar() {
		if (tocListId) {
			sidebarState.updateList(tocListId, {
				toc: toc,
				onItemClick: (id: string) => {
					handleTocClick(id);
					sidebarState.closeMobileDrawer();
				},
				activeId: activeHeaderId
			});
		}
	}

	$effect(() => {
		if (!toc || toc.length === 0 || typeof window === 'undefined') return;

		tick().then(() => {
			if (observer) observer.disconnect();
			observer = new IntersectionObserver(
				(entries) => {
					if (isManualNavigation) return;
					const visible = entries
						.filter((e) => e.isIntersecting)
						.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
					if (visible.length > 0) {
						const targetId = visible[0].target.id;
						if (targetId !== activeHeaderId) {
							activeHeaderId = targetId;
							updateSidebar();
						}
					}
				},
				{
					rootMargin: '-10% 0px -80% 0px',
					threshold: 0
				}
			);

			toc.forEach((item) => {
				const el = document.getElementById(item.id);
				if (el) observer.observe(el);
			});
		});

		return () => {
			if (observer) observer.disconnect();
		};
	});
</script>

<div class="article-surface min-h-[calc(100dvh-52px)] w-full lg:min-h-[calc(100dvh-80px)]">
	<article class="relative mx-auto w-full max-w-[980px] px-5 pt-6 md:px-8 xl:max-w-[1100px]">
		{#if loading}
			<div class="flex h-[50vh] w-full items-center justify-center">
				<LoadingState loading={true} />
			</div>
		{:else}
			<Crossfade key={displayPost.file} class="w-full">
				<Header
					title={displayPost.title}
					date={displayPost.date}
					lastmod={displayPost.lastmod}
					categories={displayPost.categoryTitles || []}
					subtitle={displayPost.description}
					tags={displayPost.tags}
					cover={displayPost.cover}
				/>
				<MarkdownRenderer source={content} {initialHtml} initialToc={toc} bind:toc />
			</Crossfade>
		{/if}
	</article>
	{#if !loading}
		<div class="mx-auto w-full max-w-[980px] px-5 pt-2 pb-10 md:px-8 xl:max-w-[1100px]">
			<div class="text-center">
				<button
					type="button"
					class="inline-flex cursor-pointer appearance-none items-center justify-center rounded-full border border-(--reader-border) bg-(--reader-interactive) px-4 py-2 text-sm text-(--reader-foreground) transition-colors hover:bg-(--reader-interactive-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--reader-secondary)"
					onclick={onClose}
				>
					<Crossfade key={$locale} inline class="inline-grid"
						><span>{$t('blog.back_to_list')}</span></Crossfade
					>
				</button>
			</div>
		</div>
	{/if}
</div>
