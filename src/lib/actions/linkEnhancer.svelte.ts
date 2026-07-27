/**
 * 博客阅读器模块专用的 Svelte Actions
 *
 * 包含用于增强原生 HTML 交互能力的自定义逻辑。
 */
import { mount, unmount } from 'svelte';
import LinkPreview from '$lib/components/blog/viewer/LinkPreview.svelte';
import { isStandalonePreviewLink } from '$lib/utils/domain/markdown';

interface PreviewMount {
	paragraph: HTMLParagraphElement;
	container: HTMLDivElement;
	component: Record<string, never>;
}

/**
 * 链接增强 Action
 *
 * 仅检测内容主体中“可见文字与 href 规范化后相同”的孤立 URL，并利用 Svelte 5 的 mount 功能
 * 动态将其替换为内容预览卡片 (LinkPreview 组件)。
 *
 * @param node - Action 作用的 DOM 节点
 * @param options - 配置项，当前包含源字符串 source (用于触发重新检测)
 * @returns 包含 update 和 destroy 钩子的 Action 对象
 */
export function linkEnhancer(node: HTMLElement, { source }: { source: string }) {
	const previews: PreviewMount[] = [];
	let currentSource = source;
	let processTimer: ReturnType<typeof setTimeout> | undefined;

	const cleanupPreviews = (restoreLinks: boolean) => {
		for (const preview of previews.splice(0)) {
			void unmount(preview.component);
			if (restoreLinks && preview.container.parentNode) {
				preview.container.replaceWith(preview.paragraph);
			}
		}
	};

	const process = () => {
		if (!currentSource && node.childElementCount === 0) return;

		for (let index = previews.length - 1; index >= 0; index--) {
			if (!previews[index].container.isConnected) {
				void unmount(previews[index].component);
				previews.splice(index, 1);
			}
		}

		node.querySelectorAll<HTMLParagraphElement>('p').forEach((paragraph) => {
			const meaningfulChildren = Array.from(paragraph.childNodes).filter(
				(child) => child.nodeType !== Node.TEXT_NODE || Boolean(child.textContent?.trim())
			);
			if (
				meaningfulChildren.length !== 1 ||
				!(meaningfulChildren[0] instanceof HTMLAnchorElement)
			) {
				return;
			}

			const anchor = meaningfulChildren[0];
			const href = anchor.getAttribute('href');
			if (!href || !isStandalonePreviewLink(href, anchor.textContent || '')) return;

			const container = document.createElement('div');
			container.className = 'my-8 not-prose w-full';
			container.dataset.linkPreview = 'true';
			paragraph.replaceWith(container);

			const component = mount(LinkPreview, {
				target: container,
				props: { url: href }
			}) as Record<string, never>;

			previews.push({ paragraph, container, component });
		});
	};

	const scheduleProcess = () => {
		if (processTimer) clearTimeout(processTimer);
		processTimer = setTimeout(process, 0);
	};

	const observer = new MutationObserver(scheduleProcess);
	observer.observe(node, { childList: true, subtree: true });

	// 初次处理
	scheduleProcess();

	return {
		update({ source: nextSource }: { source: string }) {
			if (nextSource === currentSource) return;
			if (processTimer) clearTimeout(processTimer);
			cleanupPreviews(true);
			currentSource = nextSource;
			scheduleProcess();
		},
		destroy() {
			observer.disconnect();
			if (processTimer) clearTimeout(processTimer);
			cleanupPreviews(true);
		}
	};
}
