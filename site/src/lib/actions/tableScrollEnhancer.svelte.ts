/**
 * Markdown 表格滚动增强 Action。
 *
 * 在 Markdown 根节点上集中代理滚轮和键盘事件，仅对实际横向溢出的表格生效。
 */

interface HorizontalScrollTarget {
	clientWidth: number;
	scrollLeft: number;
	scrollWidth: number;
}

interface WheelInput {
	deltaMode: number;
	deltaX: number;
	deltaY: number;
	preventDefault(): void;
}

const LINE_HEIGHT_PX = 16;
const SCROLL_BOUNDARY_EPSILON = 1;
const KEYBOARD_SCROLL_STEP = 64;

/** 将 WheelEvent 的像素、行和页面单位统一换算为横向像素距离。 */
export function normalizeWheelDelta(
	deltaY: number,
	deltaMode: number,
	containerWidth: number
): number {
	if (deltaMode === 1) return deltaY * LINE_HEIGHT_PX;
	if (deltaMode === 2) return deltaY * Math.max(containerWidth, 1);
	return deltaY;
}

/**
 * 将一次以纵向为主的滚轮输入应用到横向溢出容器。
 *
 * @returns 是否已接管事件并调用 preventDefault。
 */
export function applyHorizontalWheel(
	container: HorizontalScrollTarget,
	event: WheelInput
): boolean {
	if (container.scrollWidth <= container.clientWidth) return false;
	if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return false;

	const delta = normalizeWheelDelta(event.deltaY, event.deltaMode, container.clientWidth);
	if (delta === 0) return false;

	const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
	const atStart = container.scrollLeft <= SCROLL_BOUNDARY_EPSILON;
	const atEnd = container.scrollLeft >= maxScrollLeft - SCROLL_BOUNDARY_EPSILON;
	if ((delta < 0 && atStart) || (delta > 0 && atEnd)) return false;

	event.preventDefault();
	container.scrollLeft = Math.min(maxScrollLeft, Math.max(0, container.scrollLeft + delta));
	return true;
}

/** 在 Markdown 根节点上挂载单一表格滚动事件代理。 */
export function tableScrollEnhancer(node: HTMLElement, { label }: { label: string }) {
	let currentLabel = label;

	const enhanceContainers = () => {
		node.querySelectorAll<HTMLElement>('.table-container').forEach((container) => {
			container.tabIndex = 0;
			container.setAttribute('role', 'region');
			container.setAttribute('aria-label', currentLabel);
		});
	};

	const findContainer = (target: EventTarget | null): HTMLElement | null => {
		if (!(target instanceof Element)) return null;
		const container = target.closest<HTMLElement>('.table-container');
		return container && node.contains(container) ? container : null;
	};

	const handleWheel = (event: WheelEvent) => {
		const container = findContainer(event.target);
		if (container) applyHorizontalWheel(container, event);
	};

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		const container = findContainer(event.target);
		if (!container || event.target !== container) return;

		const direction = event.key === 'ArrowLeft' ? -1 : 1;
		const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
		const canScroll =
			direction < 0
				? container.scrollLeft > SCROLL_BOUNDARY_EPSILON
				: container.scrollLeft < maxScrollLeft - SCROLL_BOUNDARY_EPSILON;
		if (!canScroll) return;

		event.preventDefault();
		container.scrollBy({ left: direction * KEYBOARD_SCROLL_STEP, behavior: 'smooth' });
	};

	const observer = new MutationObserver(enhanceContainers);
	observer.observe(node, { childList: true, subtree: true });
	enhanceContainers();
	node.addEventListener('wheel', handleWheel, { passive: false });
	node.addEventListener('keydown', handleKeydown);

	return {
		update({ label: nextLabel }: { label: string }) {
			currentLabel = nextLabel;
			enhanceContainers();
		},
		destroy() {
			observer.disconnect();
			node.removeEventListener('wheel', handleWheel);
			node.removeEventListener('keydown', handleKeydown);
		}
	};
}
