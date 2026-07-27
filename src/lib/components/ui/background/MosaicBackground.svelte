<script lang="ts">
	/**
	 * 马赛克背景组件
	 *
	 * 动态渲染 MTR 风格的马赛克平铺背景。
	 * 支持自动切换主题色、平滑颜色过渡以及 MTR 车站预设。
	 */
	import { onMount, onDestroy, tick } from 'svelte';
	import { themeState, backgroundState } from '$lib/stores/app.svelte';
	import { mosaicState } from '$lib/stores/mosaic.svelte';
	import { glassCompositor } from '$lib/utils/effect/glassCompositor.svelte';
	import GlassCompositor from '$lib/components/ui/effect/GlassCompositor.svelte';
	import {
		MOSAIC_DEFAULT_CONFIG,
		MTR_PRESETS_DAY,
		MTR_PRESETS_NIGHT,
		RAINBOW_COLORS,
		type MosaicConfig,
		type MtrStation
	} from '$lib/config/mosaic';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';

	// ==========================================
	// 配置与内部状态
	// ==========================================

	// 可选：指定固定车站名称（英文）用于测试，如 'Choi Hung'、'Central' 等
	let { fixedStation = '' }: { fixedStation?: string } = $props();

	let config: MosaicConfig = MOSAIC_DEFAULT_CONFIG;

	// 内部状态
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let animationFrameId = 0;
	let resizeObserver: ResizeObserver | undefined;
	let needsRedraw = true;
	let lastFrameTime = 0;
	let currentColorHex = $state('#000000');
	let isRainbowMode = false;
	let lastUpdate = 0;

	// 入场动画与定时器句柄（需在销毁时清理）
	let entranceTimeout: ReturnType<typeof setTimeout> | undefined;
	let themeTimeout: ReturnType<typeof setTimeout> | undefined;
	let resizeDebounceTimer: ReturnType<typeof setTimeout> | undefined;
	let resizeFallbackTimer: ReturnType<typeof setTimeout> | undefined;
	const pendingFrameIds = new SvelteSet<number>();
	// 记录上次布局尺寸，避免 ResizeObserver 重复触发时重建网格
	let lastRectWidth = 0;
	let lastRectHeight = 0;
	let pendingSize: SurfaceSize | null = null;
	let resizeSequence = 0;
	let activeResizeLoadingId: number | null = null;
	let destroyed = false;
	// 是否处于减少动态效果模式
	let reduceMotion = false;
	// 入场动画起始时间（用于限制入场阶段的帧率与时长）
	let entranceStartTime = 0;

	/** 入场动画最长持续时间 (ms) */
	const ENTRANCE_MAX_MS = 500;
	/** 入场阶段帧率上限 */
	const ENTRANCE_FPS = 30;
	/** ResizeObserver 停止触发后执行最终重建的防抖时间 */
	const RESIZE_DEBOUNCE_MS = 175;
	/** 忽略不足 2px 的浏览器布局抖动 */
	const RESIZE_EPSILON_PX = 2;
	/** 尺寸重建故障兜底时间 */
	const RESIZE_FALLBACK_MS = 2500;

	interface SurfaceSize {
		width: number;
		height: number;
	}

	interface CanvasCell {
		r: number;
		g: number;
		b: number;
		targetR: number;
		targetG: number;
		targetB: number;
		baseH: number;
		baseS: number;
		baseL: number;
		rowIndex: number;
		updateTarget(randomness: number, isRainbow: boolean, totalRows: number): void;
		step(speed: number): void;
	}

	// 单元格结构定义
	class Cell implements CanvasCell {
		r: number;
		g: number;
		b: number;
		targetR: number;
		targetG: number;
		targetB: number;
		baseH: number;
		baseS: number;
		baseL: number;
		rowIndex: number; // 行索引，用于彩虹模式

		constructor(r: number, g: number, b: number, rowIndex: number = 0) {
			this.r = this.targetR = r;
			this.g = this.targetG = g;
			this.b = this.targetB = b;
			this.rowIndex = rowIndex;
			const hsl = rgbToHsl(r, g, b);
			this.baseH = hsl.h;
			this.baseS = hsl.s;
			this.baseL = hsl.l;
		}

		updateTarget(randomness: number, isRainbow: boolean, totalRows: number) {
			if (isRainbow) {
				// ========================================
				// 彩虹站布局计算
				// ========================================
				// 布局结构（从上到下）：
				//   - 顶部青绿区：填充剩余空间的 30%
				//   - 中间彩虹区：6条色带，每条固定 RAINBOW_BAND_ROWS 行
				//   - 底部青绿区：填充剩余空间的 70%
				//
				// 调整位置：修改 TOP_RATIO 值（0-1）
				//   - 0.0 = 彩虹贴顶
				//   - 0.5 = 彩虹居中（默认）
				//   - 1.0 = 彩虹贴底
				// ========================================
				const RAINBOW_BAND_ROWS = 6; // 每条彩虹色带固定行数
				const TOP_RATIO = 0.3; // 顶部青绿占剩余空间的比例（0.3 = 彩虹偏上）

				const rainbowTotalRows = 6 * RAINBOW_BAND_ROWS; // 中间6条彩虹总行数（红橙黄绿蓝紫）
				const remainingRows = totalRows - rainbowTotalRows; // 剩余空间（顶部+底部）
				const topRows = Math.floor(remainingRows * TOP_RATIO); // 顶部青绿行数
				const bottomStartRow = topRows + rainbowTotalRows; // 底部青绿起始行

				let hex: string;
				if (this.rowIndex < topRows) {
					// 顶部青绿区域
					hex = RAINBOW_COLORS[0];
				} else if (this.rowIndex >= bottomStartRow) {
					// 底部青绿区域
					hex = RAINBOW_COLORS[7];
				} else {
					// 中间彩虹区域（6条色带）
					const rainbowRow = this.rowIndex - topRows;
					const bandIndex = Math.floor(rainbowRow / RAINBOW_BAND_ROWS);
					// 颜色索引 1-6 对应红橙黄绿蓝紫
					hex = RAINBOW_COLORS[Math.min(bandIndex + 1, 6)];
				}

				const rgb = hexToRgb(hex);
				// 添加轻微随机扰动模拟瓷砖质感
				const variation = 0.05;
				this.targetR = Math.round(rgb.r * (1 + (Math.random() - 0.5) * variation));
				this.targetG = Math.round(rgb.g * (1 + (Math.random() - 0.5) * variation));
				this.targetB = Math.round(rgb.b * (1 + (Math.random() - 0.5) * variation));
				return;
			}

			// HSL 偏移计算（光感随机化）
			const randomS = Math.max(
				0,
				Math.min(1, this.baseS + (Math.random() * randomness - randomness / 2))
			);
			const randomL = Math.max(
				0,
				Math.min(1, this.baseL + (Math.random() * randomness - randomness / 2))
			);
			const rgb = hslToRgb(this.baseH, randomS, randomL);
			this.targetR = rgb.r;
			this.targetG = rgb.g;
			this.targetB = rgb.b;
		}

		step(speed: number) {
			this.r += (this.targetR - this.r) * speed;
			this.g += (this.targetG - this.g) * speed;
			this.b += (this.targetB - this.b) * speed;
		}
	}

	interface CanvasSnapshot {
		bitmap: HTMLCanvasElement;
		width: number;
		height: number;
		transform: DOMMatrix;
		lastWidth: number;
		lastHeight: number;
		cells: CanvasCell[];
		cols: number;
		rows: number;
		cellWidth: number;
		cellHeight: number;
	}

	let cells: CanvasCell[] = [];
	let cols = 0;
	let rows = 0;
	let cellWidth = 0;
	let cellHeight = 0;

	// ==========================================
	// 工具函数
	// ==========================================
	function hexToRgb(hex: string) {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result
			? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
			: { r: 0, g: 0, b: 0 };
	}

	function rgbToHsl(r: number, g: number, b: number) {
		r /= 255;
		g /= 255;
		b /= 255;
		const max = Math.max(r, g, b),
			min = Math.min(r, g, b);
		let h = 0,
			s = 0,
			l = (max + min) / 2;
		if (max !== min) {
			const d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			switch (max) {
				case r:
					h = (g - b) / d + (g < b ? 6 : 0);
					break;
				case g:
					h = (b - r) / d + 2;
					break;
				case b:
					h = (r - g) / d + 4;
					break;
			}
			h /= 6;
		}
		return { h, s, l };
	}

	function hslToRgb(h: number, s: number, l: number) {
		let r, g, b;
		if (s === 0) r = g = b = l;
		else {
			const hue2rgb = (p: number, q: number, t: number) => {
				if (t < 0) t += 1;
				if (t > 1) t -= 1;
				if (t < 1 / 6) return p + (q - p) * 6 * t;
				if (t < 1 / 2) return q;
				if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
				return p;
			};
			const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			const p = 2 * l - q;
			r = hue2rgb(p, q, h + 1 / 3);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 1 / 3);
		}
		return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
	}

	// ==========================================
	// 核心业务逻辑
	// ==========================================

	function pickRandomPreset() {
		const dayPresets = MTR_PRESETS_DAY;
		const nightPresets = MTR_PRESETS_NIGHT;
		const allPresets = [...dayPresets, ...nightPresets];

		let selectedPreset: MtrStation;

		// 如果指定了固定车站，优先使用
		if (fixedStation) {
			const found = allPresets.find((p) => p.name === fixedStation);
			if (found) {
				selectedPreset = found;
			} else {
				console.warn(`[MosaicBackground] fixedStation "${fixedStation}" not found, using random`);
				const presets = themeState.isDark ? nightPresets : dayPresets;
				selectedPreset = presets[Math.floor(Math.random() * presets.length)];
			}
		} else {
			const presets = themeState.isDark ? nightPresets : dayPresets;
			selectedPreset = presets[Math.floor(Math.random() * presets.length)];
		}

		mosaicState.setStation(selectedPreset.nameZh, selectedPreset.name);

		if (selectedPreset.isRainbow) {
			isRainbowMode = true;
			currentColorHex = selectedPreset.color;
		} else {
			isRainbowMode = false;
			currentColorHex = selectedPreset.color;
		}
	}

	function initGrid(forceReset = true, autoStart = true): boolean {
		if (!canvas || !ctx) return false;

		// 设置画布分辨率
		// 优化：将 DPR 限制在 1.25 以减少马赛克效果的填充率消耗 (Fill Rate)
		const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
		const rect = canvas.getBoundingClientRect();

		// 避免宽高为 0 的情况
		if (rect.width === 0 || rect.height === 0) return false;

		canvas.width = Math.round(rect.width * dpr);
		canvas.height = Math.round(rect.height * dpr);

		if (ctx) {
			ctx.resetTransform(); // 重置变换以避免累积
			ctx.scale(dpr, dpr);
		}

		// Pick color if needed
		if (forceReset || !currentColorHex) {
			pickRandomPreset();
		}

		// 1. 保存旧网格状态 (Map<"row,col", Cell>)
		const oldCellMap = new SvelteMap<string, CanvasCell>();
		if (!forceReset && cells.length > 0 && cols > 0) {
			for (let r = 0; r < rows; r++) {
				for (let c = 0; c < cols; c++) {
					const cell = cells[r * cols + c];
					if (cell) {
						oldCellMap.set(`${r},${c}`, cell);
					}
				}
			}
		}

		// 2. 计算新网格尺寸 (基于固定 Tile Size)
		// 不再拉伸格子，而是固定格子大小，计算能容纳多少列/行
		// 向上取整，确保覆盖整个区域
		const tileSizeWithGap = config.baseTileSize + config.gap;
		cols = Math.ceil(rect.width / tileSizeWithGap);
		rows = Math.ceil(rect.height / tileSizeWithGap);

		cellWidth = config.baseTileSize;
		cellHeight = config.baseTileSize;

		// 3. 重建网格 (复用旧 Cell)
		const newCells: CanvasCell[] = [];
		const baseRgb = hexToRgb(currentColorHex);

		for (let row = 0; row < rows; row++) {
			for (let col = 0; col < cols; col++) {
				const key = `${row},${col}`;
				let cell: CanvasCell;

				if (oldCellMap.has(key)) {
					// 复用旧格子 (位置稳定，颜色状态保留)
					cell = oldCellMap.get(key)!;
					// 注意：如果是彩虹模式，如果 row 索引变了可能会导致颜色错位？
					// 实际上 row 没变，cell 是跟 (row, col) 绑定的。
					// 这里的逻辑是：(0,0) 永远在左上角。扩大的区域会有新坐标。
				} else {
					// 新增区域：创建新格子
					cell = new Cell(baseRgb.r, baseRgb.g, baseRgb.b, row);
					// 仅为新格子计算随机目标，让其从 baseRgb 过渡到目标
					// 或者如果是首次加载(forceReset)，所有格子都算。
					// 如果是增量更新(Resize)，新格子也应该开始变化。
					if (autoStart) {
						cell.updateTarget(config.randomness, isRainbowMode, rows);
					}
				}
				newCells.push(cell);
			}
		}

		cells = newCells;

		// 立即执行完整绘制；成功后才提交本次有效布局尺寸
		if (!draw()) return false;
		lastRectWidth = rect.width;
		lastRectHeight = rect.height;

		// 标记需要更新以触发动画（如果有新格子或首次）
		if (autoStart) {
			needsRedraw = true;
		}

		return true;
	}

	function draw(): boolean {
		if (!ctx || !canvas) return false;
		const rect = canvas.getBoundingClientRect();

		// 清除背景（间隙颜色）
		ctx.fillStyle = config.gapColor;
		ctx.fillRect(0, 0, rect.width, rect.height);

		// 绘制不透明色块 + 模拟倒角效果
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				const i = r * cols + c;
				const cell = cells[i];
				const x = c * (cellWidth + config.gap);
				const y = r * (cellHeight + config.gap);

				const cr = Math.round(cell.r);
				const cg = Math.round(cell.g);
				const cb = Math.round(cell.b);

				// 1. 阴影 (右下边缘) - 较深
				// 混入 10% 黑色 ~= 0.9 * color
				ctx.fillStyle = `rgb(${Math.round(cr * 0.9)}, ${Math.round(cg * 0.9)}, ${Math.round(cb * 0.9)})`;
				ctx.fillRect(x, y, cellWidth, cellHeight);

				// 2. 高光 (左上边缘) - 较浅
				// 混入 20% 白色 ~= color + (255-color)*0.2
				ctx.fillStyle = `rgb(${Math.round(cr + (255 - cr) * 0.2)}, ${Math.round(cg + (255 - cg) * 0.2)}, ${Math.round(cb + (255 - cb) * 0.2)})`;
				ctx.fillRect(x, y, cellWidth - 1, cellHeight - 1);

				// 3. 核心主体 - 正常颜色
				ctx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`;
				ctx.fillRect(x + 1, y + 1, cellWidth - 2, cellHeight - 2);
			}
		}

		// 通知共享玻璃合成器：背景产生了新帧，需要重新上传纹理与模糊
		glassCompositor.notifySourceFrame();
		return true;
	}

	/** 是否采用静态渲染（单次绘制，不启动循环） */
	function isStaticRender() {
		return config.duration === 0 || reduceMotion;
	}

	/** 将所有格子颜色直接置为目标色 */
	function snapCellsToTargets() {
		for (const cell of cells) {
			cell.r = cell.targetR;
			cell.g = cell.targetG;
			cell.b = cell.targetB;
		}
	}

	/** 静态模式：计算最终颜色并只绘制一次 */
	function renderStatic(): boolean {
		cells.forEach((cell) => cell.updateTarget(config.randomness, isRainbowMode, rows));
		snapCellsToTargets();
		needsRedraw = false;
		return draw();
	}

	function loop(timestamp: number) {
		// 如果显式要求静态且已收敛，则停止循环
		// 使用比前一帧更严格的 'changing' 检查以确保停止
		if (config.duration === 0 && !needsRedraw) {
			animationFrameId = 0;
			return;
		}

		// 入场阶段限制帧率与时长，降低启动阶段的绘制开销
		if (entranceStartTime && timestamp - entranceStartTime >= ENTRANCE_MAX_MS) {
			entranceStartTime = 0;
		}
		const baseFps = config.fps > 0 ? config.fps : 30;
		const effectiveFps = entranceStartTime ? Math.min(baseFps, ENTRANCE_FPS) : baseFps;

		if (!lastFrameTime) lastFrameTime = timestamp;
		const elapsed = timestamp - lastFrameTime;
		if (elapsed < 1000 / effectiveFps) {
			animationFrameId = requestAnimationFrame(loop);
			return;
		}
		lastFrameTime = timestamp - (elapsed % (1000 / effectiveFps));

		if (!lastUpdate) lastUpdate = timestamp;
		const delta = timestamp - lastUpdate;

		// 定期更新颜色目标
		// 如果 duration 为 0，视为静态模式（从不更新目标）
		if (config.duration > 0 && delta > config.duration * 1000) {
			cells.forEach((cell) => cell.updateTarget(config.randomness, isRainbowMode, rows));
			lastUpdate = timestamp;
			needsRedraw = true; // 目标已变，开始插值
		}

		// 插值颜色计算
		let changing = false;
		// 如果 config.transitionSpeed 为 0 (静态模式)，入场动画使用 0.05 的速度
		const effectiveSpeed = config.transitionSpeed > 0 ? config.transitionSpeed : 0.05;

		cells.forEach((cell) => {
			const dr = cell.targetR - cell.r;
			const dg = cell.targetG - cell.g;
			const db = cell.targetB - cell.b;

			// 简单的阈值检查，判断是否足够接近以停止更新，节省 CPU
			if (Math.abs(dr) > 0.1 || Math.abs(dg) > 0.1 || Math.abs(db) > 0.1) {
				cell.step(effectiveSpeed);
				changing = true;
			}
		});

		if (changing) {
			needsRedraw = true;
		}

		if (needsRedraw) {
			draw();
			// 关键：如果 changing 为 false，标记 needsRedraw 为 false 以在下一帧停止循环
			// 确保最后一帧绘制（收敛）后静止
			needsRedraw = changing;
		}

		// Re-check sleep condition before requesting next frame
		if (config.duration === 0 && !needsRedraw) {
			animationFrameId = 0;
			return;
		}

		animationFrameId = requestAnimationFrame(loop);
	}

	function startLoop() {
		// 如果不需要重绘且配置为静态模式，则不启动循环
		if (!needsRedraw && config.duration === 0 && config.fps === 0) {
			return;
		}

		if (!animationFrameId) {
			animationFrameId = requestAnimationFrame(loop);
		}
	}

	function getSurfaceSize(): SurfaceSize {
		const rect = canvas.getBoundingClientRect();
		return { width: rect.width, height: rect.height };
	}

	function hasSignificantSizeChange(previous: SurfaceSize, next: SurfaceSize): boolean {
		return (
			Math.abs(previous.width - next.width) >= RESIZE_EPSILON_PX ||
			Math.abs(previous.height - next.height) >= RESIZE_EPSILON_PX
		);
	}

	function waitForAnimationFrame(): Promise<void> {
		return new Promise((resolve) => {
			const frameId = requestAnimationFrame(() => {
				pendingFrameIds.delete(frameId);
				resolve();
			});
			pendingFrameIds.add(frameId);
		});
	}

	/** 等待一次 DOM 更新和一次已提交的浏览器绘制 */
	async function waitForLoaderPaint() {
		await tick();
		await waitForAnimationFrame();
		await waitForAnimationFrame();
	}

	/** Canvas 绘制后跨过一次真实绘制提交，再允许加载页退出 */
	async function waitForCanvasCommit() {
		await waitForAnimationFrame();
		await waitForAnimationFrame();
	}

	async function completeInitialLoadingAfterPaint(loadingId: number) {
		await waitForCanvasCommit();
		if (!destroyed) {
			backgroundState.completeLoading(loadingId);
		}
	}

	function captureCanvasSnapshot(): CanvasSnapshot | null {
		if (!ctx || canvas.width === 0 || canvas.height === 0) return null;
		const bitmap = document.createElement('canvas');
		bitmap.width = canvas.width;
		bitmap.height = canvas.height;
		const bitmapContext = bitmap.getContext('2d', { alpha: false });
		if (!bitmapContext) return null;
		bitmapContext.drawImage(canvas, 0, 0);

		return {
			bitmap,
			width: canvas.width,
			height: canvas.height,
			transform: ctx.getTransform(),
			lastWidth: lastRectWidth,
			lastHeight: lastRectHeight,
			cells,
			cols,
			rows,
			cellWidth,
			cellHeight
		};
	}

	function restoreCanvasSnapshot(snapshot: CanvasSnapshot) {
		if (!ctx) return;
		canvas.width = snapshot.width;
		canvas.height = snapshot.height;
		ctx.resetTransform();
		ctx.drawImage(snapshot.bitmap, 0, 0);
		ctx.setTransform(snapshot.transform);
		lastRectWidth = snapshot.lastWidth;
		lastRectHeight = snapshot.lastHeight;
		cells = snapshot.cells;
		cols = snapshot.cols;
		rows = snapshot.rows;
		cellWidth = snapshot.cellWidth;
		cellHeight = snapshot.cellHeight;
		glassCompositor.notifySourceFrame();
	}

	function isCurrentResize(sequence: number, loadingId: number): boolean {
		return (
			!destroyed && sequence === resizeSequence && backgroundState.isLoading(loadingId, 'resize')
		);
	}

	function finishResize(sequence: number, loadingId: number) {
		if (!isCurrentResize(sequence, loadingId)) return;
		clearTimeout(resizeDebounceTimer);
		clearTimeout(resizeFallbackTimer);
		resizeDebounceTimer = undefined;
		resizeFallbackTimer = undefined;
		pendingSize = null;
		activeResizeLoadingId = null;
		backgroundState.completeLoading(loadingId);
	}

	async function rebuildForSize(sequence: number, loadingId: number, requestedSize: SurfaceSize) {
		await waitForLoaderPaint();
		if (!isCurrentResize(sequence, loadingId)) return;

		const finalSize = getSurfaceSize();
		if (hasSignificantSizeChange(requestedSize, finalSize)) {
			queueResize(finalSize);
			return;
		}

		if (!hasSignificantSizeChange({ width: lastRectWidth, height: lastRectHeight }, finalSize)) {
			finishResize(sequence, loadingId);
			return;
		}

		const snapshot = captureCanvasSnapshot();
		if (!snapshot) {
			console.error('[MosaicBackground] Unable to preserve the current canvas before resize');
			finishResize(sequence, loadingId);
			return;
		}

		try {
			if (!initGrid(false, true)) {
				throw new Error('Canvas resize initialization did not produce a complete frame');
			}

			if (isStaticRender()) {
				snapCellsToTargets();
				needsRedraw = false;
				if (!draw()) throw new Error('Static canvas resize draw failed');
			} else {
				entranceStartTime = performance.now();
				startLoop();
			}

			await waitForCanvasCommit();
			finishResize(sequence, loadingId);
		} catch (error) {
			console.error('[MosaicBackground] Canvas resize failed:', error);
			restoreCanvasSnapshot(snapshot);
			finishResize(sequence, loadingId);
		}
	}

	function queueResize(size: SurfaceSize) {
		const reference = pendingSize ?? { width: lastRectWidth, height: lastRectHeight };
		if (!hasSignificantSizeChange(reference, size)) return;

		pendingSize = size;
		const sequence = ++resizeSequence;
		const loadingId = backgroundState.beginLoading('resize');
		activeResizeLoadingId = loadingId;

		clearTimeout(resizeDebounceTimer);
		clearTimeout(resizeFallbackTimer);

		resizeFallbackTimer = setTimeout(() => {
			if (!isCurrentResize(sequence, loadingId)) return;
			clearTimeout(resizeDebounceTimer);
			resizeDebounceTimer = undefined;
			resizeFallbackTimer = undefined;
			pendingSize = null;
			activeResizeLoadingId = null;
			backgroundState.completeLoading(loadingId);
			resizeSequence += 1;
		}, RESIZE_FALLBACK_MS);

		resizeDebounceTimer = setTimeout(() => {
			resizeDebounceTimer = undefined;
			void rebuildForSize(sequence, loadingId, size);
		}, RESIZE_DEBOUNCE_MS);
	}

	function handleVisibilityChange() {
		if (document.hidden) {
			// 页面不可见时立即停止绘制
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
				animationFrameId = 0;
			}
		} else {
			// 恢复可见：动态模式恢复循环，静态模式按需重绘一次
			lastFrameTime = 0;
			lastUpdate = 0;
			if (!isStaticRender()) {
				startLoop();
			} else {
				draw();
			}
		}
	}

	onMount(() => {
		ctx = canvas.getContext('2d', { alpha: false }); // 禁用 alpha 通道以提升性能
		reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const initialLoadingId =
			backgroundState.loadingKind === 'initial' ? backgroundState.activeLoadingId : null;

		// 注册为共享玻璃合成器的背景纹理来源
		glassCompositor.setSource(canvas);

		try {
			// 初始加载：先绘制基础色
			if (!initGrid(true, false)) throw new Error('Canvas initialization did not draw a frame');

			if (isStaticRender()) {
				// 静态模式：直接计算最终颜色并只绘制一次，不启动动画循环
				if (!renderStatic()) throw new Error('Static canvas initialization draw failed');
			} else {
				// 延迟 250ms 后触发入场动画
				entranceTimeout = setTimeout(() => {
					// 随机分配目标颜色并启动循环
					cells.forEach((cell) => cell.updateTarget(config.randomness, isRainbowMode, rows));
					needsRedraw = true;
					entranceStartTime = performance.now();
					startLoop();
				}, 250);
			}

			if (initialLoadingId !== null) {
				void completeInitialLoadingAfterPaint(initialLoadingId);
			}
		} catch (error) {
			// BackgroundLayer 的 2.5 秒首次加载兜底负责放行页面。
			console.error('[MosaicBackground] Canvas initialization failed:', error);
		}

		resizeObserver = new ResizeObserver(() => {
			if (!canvas || destroyed) return;
			queueResize(getSurfaceSize());
		});
		resizeObserver.observe(canvas);

		document.addEventListener('visibilitychange', handleVisibilityChange);
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			destroyed = true;
			resizeSequence += 1;
			if (animationFrameId) cancelAnimationFrame(animationFrameId);
			for (const frameId of pendingFrameIds) cancelAnimationFrame(frameId);
			pendingFrameIds.clear();
			clearTimeout(entranceTimeout);
			clearTimeout(themeTimeout);
			clearTimeout(resizeDebounceTimer);
			clearTimeout(resizeFallbackTimer);
			if (resizeObserver) resizeObserver.disconnect();
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			glassCompositor.setSource(null);
			if (activeResizeLoadingId !== null) {
				backgroundState.completeLoading(activeResizeLoadingId);
			}
		}
	});

	// 监听主题变化
	// 防止挂载时的双重初始化
	let isFirstRun = true;

	$effect(() => {
		const requestedTheme = themeState.isDark;

		if (isFirstRun) {
			isFirstRun = false;
			return;
		}

		// 主题切换时重新滚动预设
		themeTimeout = setTimeout(() => {
			if (canvas && requestedTheme === themeState.isDark) {
				if (isStaticRender()) {
					// 静态模式：直接绘制最终颜色
					initGrid(true, false);
					renderStatic();
				} else {
					initGrid(true, true); // 主题变化：立即自动启动动画
					entranceStartTime = performance.now();
					startLoop();
				}
			}
		}, 0);
	});

	// 侧边栏信息注入
	import { sidebarState } from '$lib/stores/app.svelte';
	import MosaicInfo from '$lib/components/ui/background/MosaicInfo.svelte';

	onMount(() => {
		// 组件挂载时，注入 MosaicInfo 到侧边栏
		const id = sidebarState.setExtraInfo(MosaicInfo, {}, 'mosaic');

		return () => {
			// 组件销毁时清理
			sidebarState.clearExtraInfo(id);
		};
	});

	// 共享合成器完成首帧有效合成后，才隐藏原始画布
	let compositorLive = $derived(glassCompositor.active && glassCompositor.ready);
</script>

<div class="relative h-full w-full">
	<!-- 合成器接管显示时隐藏原始画布 (仍离屏绘制，作为纹理来源) -->
	<canvas
		bind:this={canvas}
		class="absolute inset-0 block h-full w-full"
		style="background-color: {config.gapColor}; visibility: {compositorLive
			? 'hidden'
			: 'visible'};"
	></canvas>
	<GlassCompositor />
</div>
