<script lang="ts">
	/**
	 * 液态玻璃组件
	 *
	 * 高级玻璃拟态 UI 组件，包含光泽、模糊、噪点纹理以及跟随鼠标的聚光灯效果。
	 */
	import { cn } from '$lib/utils';

	// Props 定义
	let { children, class: className, tag = 'div', tilt = false, ...rest } = $props();

	let el: HTMLElement | undefined = $state();

	/**
	 * 处理鼠标移动事件
	 *
	 * 计算鼠标位置以支持聚光灯效果，如果开启倾斜效果则计算旋转角度。
	 */
	let rafId: number;

	/**
	 * 处理鼠标移动事件
	 *
	 * 计算鼠标位置以支持聚光灯效果，如果开启倾斜效果则计算旋转角度。
	 * 使用 requestAnimationFrame 进行节流以提高性能。
	 */
	function handleMouseMove(e: MouseEvent) {
		if (!el) return;

		cancelAnimationFrame(rafId);
		rafId = requestAnimationFrame(() => {
			const rect = el!.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

			// 更新 CSS 变量 (这对 GPU 是友好的，但频繁更新仍需节流)
			el!.style.setProperty('--mouse-x', `${x}px`);
			el!.style.setProperty('--mouse-y', `${y}px`);

			if (tilt) {
				const centerX = rect.width / 2;
				const centerY = rect.height / 2;
				// 限制最大旋转角度为 10 度
				const rotateX = ((y - centerY) / centerY) * -10;
				const rotateY = ((x - centerX) / centerX) * 10;

				el!.style.setProperty('--rotate-x', `${rotateX}deg`);
				el!.style.setProperty('--rotate-y', `${rotateY}deg`);
			}
		});
	}

	/**
	 * 处理鼠标移出事件
	 *
	 * 重置倾斜效果。
	 */
	function handleMouseLeave() {
		if (!el || !tilt) return;
		el.style.setProperty('--rotate-x', `0deg`);
		el.style.setProperty('--rotate-y', `0deg`);
	}

	// 默认美学参数 (CSS 变量)
	const cssVars = `
        --main-blur: 8px;
        --edge-blur: 6px;
        --edge-width: 1px;
        --sheen-width: 1px;
    `;
</script>

<svelte:element
	this={tag}
	bind:this={el}
	onmousemove={handleMouseMove}
	onmouseleave={handleMouseLeave}
	class={cn(
		'glass group relative isolate w-full overflow-hidden transition-[transform,background-color,box-shadow] duration-200 ease-out hover:z-50',
		// Base glass feel - 增加背景不透明度以补偿过渡时的模糊效果减弱
		'bg-white/15 shadow-lg dark:bg-black/25',
		// Defaults
		'rounded-2xl p-4',
		// Force GPU layer for stable backdrop filter immediately (only if not tilting)
		!tilt && '[transform:translateZ(0)]',
		tilt &&
			'[transform:perspective(1000px)_rotateX(var(--rotate-x,0deg))_rotateY(var(--rotate-y,0deg))] [transform-style:preserve-3d]',
		className
	)}
	style={cssVars}
	{...rest}
>
	<!-- 聚光灯效果 -->
	<!-- 聚光灯效果 - 优化：使用 Transform 移动而不是重绘渐变 -->
	<div
		class="pointer-events-none absolute z-10 h-[600px] w-[600px] opacity-0 transition-opacity duration-300 will-change-transform group-hover:opacity-100"
		style="
            top: 0; 
            left: 0;
            transform: translate(calc(var(--mouse-x, 150px) - 300px), calc(var(--mouse-y, 150px) - 300px));
            background: radial-gradient(closest-side, rgba(255,255,255,0.1), transparent 100%); 
            mix-blend-mode: overlay;
        "
	></div>

	<!-- 噪点纹理叠加 -->
	<div
		class="pointer-events-none absolute inset-0 z-0 opacity-[0.03] mix-blend-overlay"
		style="
            background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%221%22/%3E%3C/svg%3E');
            transform: translateZ(0);
        "
	></div>

	<!-- 高级玻璃图层 -->
	<!-- 注意：绝对定位以填充容器，忽略容器的内边距 -->
	<div class="glass-non-edge pointer-events-none absolute inset-0 z-0">
		<div class="glass-edge h-full w-full">
			<div class="glass-sheen h-full w-full"></div>
		</div>
	</div>

	<!-- 内容 - 相对定位并设置 z-index 以位于特效之上 -->
	<div class="relative z-10 h-full w-full">
		{@render children()}
	</div>
</svelte:element>

<style>
	.glass {
		/* Apply blur to the root element for consistent support */
		-webkit-backdrop-filter: blur(var(--main-blur, 16px));
		backdrop-filter: blur(var(--main-blur, 16px));
		/* Children inherit the border radius from THIS root element */
		& *,
		& *::before {
			border-radius: inherit;
		}

		/* 第一层：光泽 (Top Highlights) */
		:global(.glass-sheen > *) {
			position: relative;
			z-index: 1;
		}

		/* 光泽效果：微妙的渐变边框/叠加 */
		.glass-sheen::before {
			content: '';
			position: absolute;
			inset: 0;
			border-radius: inherit;
			padding: var(--sheen-width);

			background: linear-gradient(
				135deg,
				rgba(255, 255, 255, 0.1) 0%,
				rgba(255, 255, 255, 0.05) 50%,
				rgba(255, 255, 255, 0) 100%
			);
			pointer-events: none;
			z-index: 0;

			/* Masking to create the thin sheen line */
			-webkit-mask:
				linear-gradient(#fff 0 0) content-box,
				linear-gradient(#fff 0 0);
			mask:
				linear-gradient(#fff 0 0) content-box,
				linear-gradient(#fff 0 0);

			-webkit-mask-composite: xor;
			mask-composite: exclude;
		}

		/* 第二层：主体 (Frosted) */
		.glass-non-edge::before {
			content: '';
			position: absolute;
			inset: 0;
			border-radius: inherit;
			padding: var(--edge-width);

			/* 主体模糊 + 色调 */
			background: linear-gradient(
				180deg,
				rgba(255, 255, 255, 0.05) 0%,
				rgba(255, 255, 255, 0.02) 100%
			);

			pointer-events: none;
			z-index: -1;

			/* Inset the body to avoid overlap with edge - Optimized with background-clip */
			background-clip: content-box;
			/* -webkit-mask: linear-gradient(#fff 0 0) content-box; */
			/* mask: linear-gradient(#fff 0 0) content-box; */
		}

		/* 第三层：边缘 (Crisp Border) */
		.glass-edge:before {
			content: '';
			position: absolute;
			inset: 0;
			border-radius: inherit;
			pointer-events: none;
			z-index: 1;
			padding: var(--edge-width);

			/* 强烈的边缘高光 */
			background: linear-gradient(
				to bottom right,
				rgba(255, 255, 255, 0.4) 0%,
				rgba(255, 255, 255, 0.1) 50%,
				rgba(255, 255, 255, 0.4) 100%
			);

			/* Mask to isolate just the edge */
			-webkit-mask:
				linear-gradient(#fff 0 0) content-box,
				linear-gradient(#fff 0 0);
			mask:
				linear-gradient(#fff 0 0) content-box,
				linear-gradient(#fff 0 0);

			-webkit-mask-composite: xor;
			mask-composite: exclude;
		}
	}
</style>
