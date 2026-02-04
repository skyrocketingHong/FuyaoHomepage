/**
 * 博客阅读器模块专用的 Svelte Actions
 * 
 * 包含用于增强原生 HTML 交互能力的自定义逻辑。
 */
import { mount, unmount } from 'svelte';
import LinkPreview from '$lib/components/blog/viewer/LinkPreview.svelte';

/**
 * 链接增强 Action
 * 
 * 检测内容主体中的孤立链接（单独占一行的链接），并利用 Svelte 5 的 mount 功能
 * 动态将其替换为精美的内容预览卡片 (LinkPreview 组件)。
 * 
 * @param node - Action 作用的 DOM 节点
 * @param options - 配置项，当前包含源字符串 source (用于触发重新检测)
 * @returns 包含 update 和 destroy 钩子的 Action 对象
 */
export function linkEnhancer(node: HTMLElement, { source }: { source: string }) {
    const cleanupFns: (() => void)[] = [];

    const process = () => {
        cleanupFns.forEach(fn => fn());
        cleanupFns.length = 0;

        // 给 DOM 留出渲染时间
        setTimeout(() => {
            const paragraphs = node.querySelectorAll('p');
            paragraphs.forEach(p => {
                // 必须是段落且仅包含一个链接节点
                if (p.childNodes.length === 1 && p.childNodes[0].nodeName === 'A') {
                    // 链接内容必须与文本内容一致（即没有额外的文字说明）
                    if (p.textContent?.trim() !== (p.childNodes[0] as HTMLElement).textContent?.trim()) return;

                    const a = p.childNodes[0] as HTMLAnchorElement;
                    const href = a.getAttribute('href');
                    if (!href) return;
                    
                    // 创建预览容器替换原段落
                    const container = document.createElement('div');
                    container.className = 'my-8 not-prose w-full';
                    if (p.parentNode) {
                        p.parentNode.replaceChild(container, p);
                    }
                    
                    // 挂载 Svelte 5 组件
                    const component = mount(LinkPreview, {
                        target: container,
                        props: { url: href }
                    });

                    cleanupFns.push(() => {
                        unmount(component);
                    });
                }
            });
        }, 0);
    };

    // 初次处理
    process();

    return {
        update() {
            process();
        },
        destroy() {
            cleanupFns.forEach(fn => fn());
        }
    };
}
