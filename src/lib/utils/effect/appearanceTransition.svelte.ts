/**
 * 外观过渡统一入口
 *
 * 背景模式切换 (普通背景 <-> 文章阅读背景) 与主题/系统主题切换共用同一过渡路径：
 * 支持 View Transition 时对应用根节点执行一次约 350ms 交叉淡化，背景、玻璃 Token
 * 与文字颜色在同一帧提交；不支持时由 BackgroundLayer 的单层 Crossfade 承担
 * 同样时长的回退动画 (背景模式切换)，主题切换直接提交最终状态。
 * prefers-reduced-motion: reduce 下不做任何交叉淡化，直接切换最终状态。
 *
 * 仅在客户端生效；SSR 环境下所有能力检测返回不可用，调用方同步执行更新。
 */

/** 外观过渡时长 (ms)，与 app.css 的 ::view-transition 动画时长及 BackgroundLayer 回退 Crossfade 一致 */
export const APPEARANCE_TRANSITION_MS = 350;

/** 本次外观切换是否由 View Transition 承担 (为 true 时 BackgroundLayer 的 Crossfade 跳过重复淡化) */
export const appearanceTransitionState = $state({ active: false });

type StartViewTransition = (callback: () => void | Promise<void>) => {
	finished: Promise<void>;
};

/**
 * 获取受能力检测保护的 startViewTransition。
 * 不支持 View Transition、SSR 或 prefers-reduced-motion 时返回 null。
 */
export function getStartViewTransition(): StartViewTransition | null {
	if (typeof document === 'undefined' || typeof window === 'undefined') return null;
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
	const start = (document as unknown as { startViewTransition?: StartViewTransition })
		.startViewTransition;
	return typeof start === 'function' ? start.bind(document) : null;
}

/**
 * 通过 View Transition 提交一次外观更新 (如主题切换)。
 * 不支持或 prefers-reduced-motion 时同步执行更新，直接呈现最终状态。
 *
 * @param update 提交最终状态的 DOM/类名更新
 */
export function runAppearanceTransition(update: () => void): void {
	const start = getStartViewTransition();
	if (!start) {
		update();
		return;
	}
	appearanceTransitionState.active = true;
	const clear = () => {
		appearanceTransitionState.active = false;
	};
	try {
		const transition = start(() => {
			update();
		});
		// finished 在过渡被跳过时可能拒绝，双分支清理避免未处理拒绝
		transition.finished.then(clear, clear);
	} catch {
		// startViewTransition 同步异常时直接提交最终状态
		clear();
		update();
	}
}
