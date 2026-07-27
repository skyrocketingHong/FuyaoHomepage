/**
 * 灯箱全局状态管理
 *
 * 使用 Svelte 5 runes 实现响应性，供页面设置状态、布局渲染灯箱。
 * 灯箱需在布局层级渲染以避免被侧边栏的 stacking context 遮挡。
 */
import type { Photo } from '$lib/types/album';

class LightboxState {
	isOpen = $state(false);
	currentIndex = $state(0);
	photos = $state<Photo[]>([]);
	/** 关闭灯箱后要恢复的完整相册 URL（含月份筛选与查询参数） */
	returnUrl = $state('');
	/** 灯箱打开时的页面标题（用于覆盖 SEO 标题） */
	pageTitle = $state('');

	/** 关闭回调（由页面组件注册） */
	onClose: (() => void) | null = null;
	/** 导航回调（由页面组件注册） */
	onNavigate: ((index: number) => void) | null = null;

	/** 打开灯箱 */
	open(photos: Photo[], index: number) {
		this.photos = photos;
		this.currentIndex = index;
		this.isOpen = true;
	}

	/** 关闭灯箱 */
	close() {
		this.isOpen = false;
		this.pageTitle = '';
	}

	/** 清理页面卸载后不应保留的状态和回调 */
	reset() {
		this.close();
		this.currentIndex = 0;
		this.photos = [];
		this.returnUrl = '';
		this.onClose = null;
		this.onNavigate = null;
	}

	/** 切换照片 */
	navigate(index: number) {
		if (index >= 0 && index < this.photos.length) {
			this.currentIndex = index;
		}
	}
}

export const lightboxState = new LightboxState();
