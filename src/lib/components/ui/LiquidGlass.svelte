<script lang="ts">
	/**
	 * 液态玻璃组件
	 */
	import { cn } from '$lib/utils';

	let { children, class: className, tag = 'div', tilt = false, ...rest } = $props();

	let el: HTMLElement | undefined = $state();
	let bounds: DOMRect | undefined = undefined;
	let rafId: number;
	let interactionTimer: ReturnType<typeof setTimeout> | undefined;

	function updateBounds() {
		if (el) bounds = el.getBoundingClientRect();
	}

	function handleMouseEnter() {
		clearTimeout(interactionTimer);
		updateBounds();
		isInteracting = true;
	}

	let lastTime = 0;
	const TARGET_FPS = 60;
	const FRAME_INTERVAL = 1000 / TARGET_FPS;

	let isInteracting = $state(false);

	function processInput(clientX: number, clientY: number) {
		if (!el) return;
		
		const currentTime = performance.now();
		if (currentTime - lastTime < FRAME_INTERVAL) return;
		lastTime = currentTime;

		// 如果 bounds 未初始化，则初始化一次
		if (!bounds) updateBounds();

		cancelAnimationFrame(rafId);
		rafId = requestAnimationFrame(() => {
			// 使用缓存的 bounds，避免每一帧都触发 Reflow
			// 注意：如果页面布局动态变化，需要额外监听 resize 事件更新 bounds
			const x = clientX - (bounds?.left ?? 0);
			const y = clientY - (bounds?.top ?? 0);

			el!.style.setProperty('--mouse-x', `${x}px`);
			el!.style.setProperty('--mouse-y', `${y}px`);

			if (tilt && bounds) {
				const centerX = bounds.width / 2;
				const centerY = bounds.height / 2;
				const rotateX = ((y - centerY) / centerY) * -10;
				const rotateY = ((x - centerX) / centerX) * 10;

				el!.style.setProperty('--rotate-x', `${rotateX}deg`);
				el!.style.setProperty('--rotate-y', `${rotateY}deg`);
			}
		});
	}

	function handleMouseMove(e: MouseEvent) {
		processInput(e.clientX, e.clientY);
	}

	function handleTouchStart(e: TouchEvent) {
		clearTimeout(interactionTimer);
		updateBounds();
		isInteracting = true;
		if (e.touches.length > 0) {
			processInput(e.touches[0].clientX, e.touches[0].clientY);
		}
	}

	function handleTouchMove(e: TouchEvent) {
		clearTimeout(interactionTimer);
		isInteracting = true;
		if (e.touches.length > 0) {
			processInput(e.touches[0].clientX, e.touches[0].clientY);
		}
	}

	function handleTouchEnd() {
		// 触摸结束时延迟 1 秒再隐藏，让用户有时间看清楚文本
		clearTimeout(interactionTimer);
		interactionTimer = setTimeout(() => {
			handleMouseLeave();
		}, 1000);
	}

	function handleMouseLeave() {
		isInteracting = false;
		if (!el || !tilt) return;
		el.style.setProperty('--rotate-x', `0deg`);
		el.style.setProperty('--rotate-y', `0deg`);
		// 离开时清空 bounds，防止下次进入时位置不准
		bounds = undefined;
	}

	const cssVars = `
        --main-blur: 4px; 
    `;
</script>

<svelte:element
	this={tag}
	bind:this={el}
	onmouseenter={handleMouseEnter}
	onmousemove={handleMouseMove}
	onmouseleave={handleMouseLeave}
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
	class={cn(
		'group relative isolate w-full overflow-hidden transition-[transform,box-shadow] duration-200 ease-out',
		// 基础样式
		'bg-white/10 dark:bg-black/20', 
		'rounded-2xl p-4',
		// 边框处理：使用真实的 border 代替 mask，减小边框宽度
		'border-[0.5px] border-white/20 dark:border-white/10',
		// 阴影处理
		'shadow-lg',
		// 强制硬件加速层，防止光栅化负担
		'will-change-transform [transform:translateZ(0)]',
		tilt && '[transform-style:preserve-3d]',
		className
	)}
	style={`
        ${cssVars}
        ${tilt ? 'transform: perspective(1000px) rotateX(var(--rotate-x,0deg)) rotateY(var(--rotate-y,0deg));' : ''}
    `}
	{...rest}
	data-interacting={isInteracting}
>
	<div 
		class="absolute inset-0 -z-10 pointer-events-none rounded-[inherit]"
		style="backdrop-filter: blur(var(--main-blur)); -webkit-backdrop-filter: blur(var(--main-blur));"
	></div>

	<div
		class={cn(
			"pointer-events-none absolute z-0 h-[500px] w-[500px] opacity-0 transition-opacity duration-300 will-change-transform",
			isInteracting && "opacity-100"
		)}
		style="
            top: 0; left: 0;
            transform: translate(calc(var(--mouse-x, 0px) - 250px), calc(var(--mouse-y, 0px) - 250px));
            background: radial-gradient(circle closest-side, rgba(255,255,255,0.15), transparent 100%);
        "
	></div>

	<div class="pointer-events-none absolute inset-0 z-10 rounded-[inherit] border border-white/20 shadow-[inset_0_0_15px_rgba(255,255,255,0.05)]"></div>
	
	<div 
		class="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-50"
		style="background: linear-gradient(120deg, rgba(255,255,255,0.1) 0%, transparent 40%);"
	></div>

	<div class="relative z-20 h-full w-full">
		{@render children()}
	</div>
</svelte:element>