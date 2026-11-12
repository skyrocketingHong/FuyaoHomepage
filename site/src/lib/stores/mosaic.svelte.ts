import type { MtrStation } from '$lib/config/mosaic';

/**
 * 马赛克背景状态管理
 *
 * 管理当前车站和用户指定的车站，供背景、来源入口和全屏详情视图消费。
 */
export class MosaicState {
	/** 当前展示的车站信息 (null 表示无选中) */
	currentStation = $state<MtrStation | null>(null);
	/** 用户从全部背景中选中的固定车站；空字符串表示随机预设。 */
	selectedStationName = $state('');

	/**
	 * 设置当前车站
	 * @param station - 完整车站预设
	 */
	setStation(station: MtrStation) {
		this.currentStation = station;
	}

	/** 指定需要切换到的车站背景。 */
	selectStation(name: string) {
		this.selectedStationName = name;
	}

	/**
	 * 清除当前车站
	 */
	clear() {
		this.currentStation = null;
		this.selectedStationName = '';
	}
}

/** 马赛克背景全局单例 */
export const mosaicState = new MosaicState();
