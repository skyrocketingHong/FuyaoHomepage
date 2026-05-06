/**
 * 马赛克背景状态管理
 *
 * 管理当前展示的港铁车站信息，供 MosaicBackground 和 MosaicInfo 组件消费。
 */
export class MosaicState {
	/** 当前展示的车站信息 (null 表示无选中) */
	currentStation = $state<{ name: string; nameEn: string; nameZh: string } | null>(null);

	/**
	 * 设置当前车站
	 * @param nameZh - 车站中文名称
	 * @param nameEn - 车站英文名称
	 */
	setStation(nameZh: string, nameEn: string) {
		this.currentStation = { name: nameZh, nameEn, nameZh };
	}

	/**
	 * 清除当前车站
	 */
	clear() {
		this.currentStation = null;
	}
}

/** 马赛克背景全局单例 */
export const mosaicState = new MosaicState();
