<script lang="ts">
	/**
	 * 马赛克背景组件
	 * 
	 * 动态渲染 MTR 风格的马赛克平铺背景。
	 * 支持自动切换主题色、平滑颜色过渡以及 MTR 车站预设。
	 */
	import { onMount, onDestroy } from 'svelte';
	import { themeState, mosaicState } from '$lib/state.svelte';
    import { 
        MOSAIC_DEFAULT_CONFIG, 
        MTR_PRESETS_DAY, 
        MTR_PRESETS_NIGHT, 
        RAINBOW_COLORS,
        type MosaicConfig,
        type MtrStation 
    } from '$lib/mosaic';

	// ==========================================
	// 配置与内部状态
	// ==========================================
	
	// 可选：指定固定车站名称（英文）用于测试，如 'Choi Hung'、'Central' 等
	let { fixedStation = '' }: { fixedStation?: string } = $props();
	
	let config: MosaicConfig = MOSAIC_DEFAULT_CONFIG;

	// 内部状态
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null;
	let animationFrameId: number;
	let resizeObserver: ResizeObserver;
	let needsRedraw = true;
	let lastFrameTime = 0;
	let currentColorHex = '#000000';
	let isRainbowMode = false;
	let lastUpdate = 0;

	// 单元格结构定义
	class Cell {
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
			const RAINBOW_BAND_ROWS = 6;  // 每条彩虹色带固定行数
			const TOP_RATIO = 0.3;        // 顶部青绿占剩余空间的比例（0.3 = 彩虹偏上）
			
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
			const randomS = Math.max(0, Math.min(1, this.baseS + (Math.random() * randomness - randomness / 2)));
			const randomL = Math.max(0, Math.min(1, this.baseL + (Math.random() * randomness - randomness / 2)));
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

	let cells: Cell[] = [];
	let cols = 0;
	let rows = 0;
	let cellWidth = 0;
	let cellHeight = 0;

	// ==========================================
	// 工具函数
	// ==========================================
	function hexToRgb(hex: string) {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 0, g: 0, b: 0 };
	}

	function rgbToHsl(r: number, g: number, b: number) {
		(r /= 255), (g /= 255), (b /= 255);
		const max = Math.max(r, g, b), min = Math.min(r, g, b);
		let h = 0, s = 0, l = (max + min) / 2;
		if (max !== min) {
			const d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			switch (max) {
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
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
			const found = allPresets.find(p => p.name === fixedStation);
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
		
		// @ts-ignore
		mosaicState.setStation(selectedPreset.nameZh, selectedPreset.name);
		
		if (selectedPreset.isRainbow) {
			isRainbowMode = true;
			currentColorHex = selectedPreset.color;
		} else {
			isRainbowMode = false;
			currentColorHex = selectedPreset.color;
		}
	}


	function initGrid(forceReset = true, autoStart = true) {
		if (!canvas) return;
		
		// 设置画布分辨率
		// 优化：将 DPR 限制在 1.5 以减少马赛克效果的填充率消耗 (Fill Rate)
		const dpr = Math.min(window.devicePixelRatio || 1.5, 1.5);
		const rect = canvas.getBoundingClientRect();
		
		// 避免宽高为 0 的情况
		if (rect.width === 0 || rect.height === 0) return;

		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		
		if (ctx) {
             ctx.resetTransform(); // 重置变换以避免累积
             ctx.scale(dpr, dpr);
        }

		// Pick color if needed
		if (forceReset || !currentColorHex) {
			pickRandomPreset();
		}

		// 基于固定瓦片大小计算网格列数和行数
		// 默认让瓦片大小接近 config.baseTileSize
		cols = Math.ceil(rect.width / config.baseTileSize);
		rows = Math.ceil(rect.height / config.baseTileSize);

		// 计算实际单元格大小以完全填充容器
		// 总宽度 = cols * cellWidth + (cols - 1) * gap
		// cellWidth = (rect.width - (cols - 1) * gap) / cols
		cellWidth = (rect.width - (cols - 1) * config.gap) / cols;
		cellHeight = (rect.height - (rows - 1) * config.gap) / rows;

		// Initialize cells
		cells = [];
		const baseRgb = hexToRgb(currentColorHex);
		for (let row = 0; row < rows; row++) {
			for (let col = 0; col < cols; col++) {
				const cell = new Cell(baseRgb.r, baseRgb.g, baseRgb.b, row);
				// 初始引导：从基础颜色开始。仅在 autoStart 为 true（如重调大小/主题切换）时设置随机目标
				// 如果 autoStart 为 false（首次加载），目标设为当前色以保持初始平铺感
				if (autoStart) {
					cell.updateTarget(config.randomness, isRainbowMode, rows);
				}
				cells.push(cell);
			}
		}
        
        // 立即执行绘制（初始状态为平铺颜色）
        draw();
        
        // 标记需要更新以触发入场动画
        if (autoStart) {
            needsRedraw = true;
        }
	}


	function draw() {
		if (!ctx || !canvas) return;
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
                ctx.fillStyle = `rgb(${Math.round(cr + (255-cr)*0.2)}, ${Math.round(cg + (255-cg)*0.2)}, ${Math.round(cb + (255-cb)*0.2)})`;
                ctx.fillRect(x, y, cellWidth - 1, cellHeight - 1);

				// 3. 核心主体 - 正常颜色
				ctx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`;
				ctx.fillRect(x + 1, y + 1, cellWidth - 2, cellHeight - 2);
			}
		}
	}

	function loop(timestamp: number) {
        // 如果显式要求静态且已收敛，则停止循环
        // 使用比前一帧更严格的 'changing' 检查以确保停止
        if (config.duration === 0 && !needsRedraw) {
            animationFrameId = 0;
            return;
        }

        // 确定入场动画的有效 FPS
        // 如果 config.fps 为 0 (静态模式)，则入场动画使用 30fps
        const effectiveFps = config.fps > 0 ? config.fps : 30;

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
			cells.forEach(cell => cell.updateTarget(config.randomness, isRainbowMode, rows));
			lastUpdate = timestamp;
            needsRedraw = true; // 目标已变，开始插值
		}

		// 插值颜色计算
        let changing = false;
        // 如果 config.transitionSpeed 为 0 (静态模式)，入场动画使用 0.05 的速度
        const effectiveSpeed = config.transitionSpeed > 0 ? config.transitionSpeed : 0.05;

		cells.forEach(cell => {
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


	onMount(() => {
		ctx = canvas.getContext('2d', { alpha: false }); // 禁用 alpha 通道以提升性能
		
		// 初始加载：不自动运行动画，仅绘制固态
		initGrid(true, false);
        
        // 延迟 250ms 后触发入场动画
        setTimeout(() => {
             // 随机分配目标颜色并启动循环
             cells.forEach(cell => cell.updateTarget(config.randomness, isRainbowMode, rows));
             needsRedraw = true;
             startLoop();
        }, 250);

		resizeObserver = new ResizeObserver(() => {
			if (canvas) {
                // 容器重调大小：立即响应并刷新
                initGrid(false, true);
                startLoop(); 
            } 
		});
		resizeObserver.observe(canvas);
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			cancelAnimationFrame(animationFrameId);
			if (resizeObserver) resizeObserver.disconnect();
		}
	});

	// 监听主题变化
	// 防止挂载时的双重初始化
	let isFirstRun = true;

	$effect(() => {
		const isDark = themeState.isDark;
		
		if (isFirstRun) {
			isFirstRun = false;
			return;
		}

		// 主题切换时重新滚动预设
		setTimeout(() => {
			if (canvas) {
				initGrid(true, true); // 主题变化：立即自动启动动画
                startLoop();
			}
		}, 0);
	});

</script>

<div class="relative w-full h-full">
	<canvas 
		bind:this={canvas} 
		class="absolute inset-0 w-full h-full block"
		style="background-color: {config.gapColor}"
	></canvas>
</div>
