<script lang="ts">
	/**
	 * 液态玻璃组件 (Optimized V5 - Lazy Blur)
	 *
	 * 实现类似苹果 visionOS 的玻璃拟态效果，带有鼠标光照跟随和可选的 3D 倾斜交互。
	 * 
	 * 优化策略:
	 * 1. IntersectionObserver: 离屏时停止交互监听。
	 * 2. 动态图层提升 (Dynamic Layer Promotion): 仅在交互时提升为合成层 (will-change)。
	 * 3. CSS 包含 (CSS Containment): 使用 contain: layout paint 隔离布局和绘制。
	 * 4. 可见性切换 (Visibility Toggle): 静态或不可见时光照层完全隐藏 (visible/invisible)。
	 * 5. 合并 Transform: 统一管理倾斜和硬件加速。
	 * 6. 延迟模糊 (Lazy Blur): 可选属性，静止时仅背景色，交互时才开启昂贵的 backdrop-filter。
	 *
	 * @prop tag - 渲染的 HTML 标签类型 (默认 'div')
	 * @prop tilt - 是否开启 3D 倾斜视差效果 (默认 false)
	 * @prop lazyBlur - 是否启用延迟模糊 (默认 false)。开启后，静止状态不使用 backdrop-filter，极大降低 GPU 占用。
	 * @prop opaque - 是否启用纯不透明模式 (默认 false)。开启后，不使用 backdrop-filter，背景保持不透明，保留交互动画。
	 * @prop class - 额外的 CSS 类名
	 */
	import { cn } from '$lib/utils';
	import { onMount } from 'svelte';

	let { children, class: className, tag = 'div', tilt = false, lazyBlur = false, opaque = false, ...rest } = $props();

	let el: HTMLElement | undefined = $state();
	let bounds: DOMRect | undefined = undefined;
	let rafId: number;
	let interactionTimer: ReturnType<typeof setTimeout> | undefined;

	let isVisible = $state(false);
	let isInteracting = $state(false);

	// 状态用于控制是否启用硬件加速层
	// 仅在 可见且交互中 时启用 will-change，平时回退到普通文档流，节省显存
	let shouldPromoteLayer = $derived(isVisible && isInteracting);

	// 是否应该激活毛玻璃效果
	// 如果 opaque 为 true，永远不激活
	// 如果 lazyBlur 为 false (默认)，则一直激活
	// 如果 lazyBlur 为 true，则仅在交互时激活
	let shouldApplyBlur = $derived(!opaque && (!lazyBlur || isInteracting));

	// 初始化 IntersectionObserver
	onMount(() => {
		if (!el) return;
		
		const observer = new IntersectionObserver(
			(entries) => {
				isVisible = entries[0].isIntersecting;
				if (!isVisible) {
					// 离屏时强制清理状态
					isInteracting = false;
					cancelAnimationFrame(rafId);
				}
			},
			{ threshold: 0 } // 只需进入视口即触发
		);

		observer.observe(el);

		return () => {
			observer.disconnect();
			cancelAnimationFrame(rafId);
			clearTimeout(interactionTimer);
		};
	});

	function updateBounds() {
		if (el) bounds = el.getBoundingClientRect();
	}

	function handleMouseEnter() {
		if (!isVisible) return;
		clearTimeout(interactionTimer);
		updateBounds();
		isInteracting = true;
	}

	let lastTime = 0;
	const TARGET_FPS = 60;
	const FRAME_INTERVAL = 1000 / TARGET_FPS;

	function processInput(clientX: number, clientY: number) {
		if (!el || !isVisible) return;
		
		const currentTime = performance.now();
		if (currentTime - lastTime < FRAME_INTERVAL) return;
		lastTime = currentTime;

		// 确保 bounds 存在
		if (!bounds) updateBounds();

		cancelAnimationFrame(rafId);
		rafId = requestAnimationFrame(() => {
			if (!bounds || !el) return;

			const x = clientX - bounds.left;
			const y = clientY - bounds.top;

			el.style.setProperty('--mouse-x', `${x}px`);
			el.style.setProperty('--mouse-y', `${y}px`);

			if (tilt) {
				const centerX = bounds.width / 2;
				const centerY = bounds.height / 2;
				const rotateX = ((y - centerY) / centerY) * -10;
				const rotateY = ((x - centerX) / centerX) * 10;

				el.style.setProperty('--rotate-x', `${rotateX}deg`);
				el.style.setProperty('--rotate-y', `${rotateY}deg`);
			}
		});
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isInteracting) return;
		processInput(e.clientX, e.clientY);
	}

	function handleTouchStart(e: TouchEvent) {
		if (!isVisible) return;
		clearTimeout(interactionTimer);
		updateBounds();
		isInteracting = true;
		if (e.touches.length > 0) {
			processInput(e.touches[0].clientX, e.touches[0].clientY);
		}
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isVisible) return;
		clearTimeout(interactionTimer);
		isInteracting = true; // 确保移动时也保持交互状态
		if (e.touches.length > 0) {
			processInput(e.touches[0].clientX, e.touches[0].clientY);
		}
	}

	function handleTouchEnd() {
		clearTimeout(interactionTimer);
		// 触摸结束后的延迟清理，防止动画瞬间中断
		interactionTimer = setTimeout(() => {
			handleMouseLeave();
		}, 1000);
	}

	function handleMouseLeave() {
		isInteracting = false;
		if (!el || !tilt) return;
		
		// 重置旋转
		el.style.setProperty('--rotate-x', `0deg`);
		el.style.setProperty('--rotate-y', `0deg`);
		
		bounds = undefined;
	}

	// 动态计算 transform 样式，防止多个 transform 属性覆盖
	let transformStyle = $derived.by(() => {
		const parts = [];
		if (tilt) parts.push('perspective(1000px) rotateX(var(--rotate-x,0deg)) rotateY(var(--rotate-y,0deg))');
		// 当需要提升图层时，添加 translateZ(0) 触发合成层，
		// 注意：它追加在 rotate 之后，确保在同一个 transform 属性中。
		if (shouldPromoteLayer) parts.push('translateZ(0)');
		return parts.length > 0 ? `transform: ${parts.join(' ')};` : '';
	});

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
		'group relative isolate w-full overflow-hidden transition-[transform,box-shadow,background-color,backdrop-filter] duration-200 ease-out',
		// 基础样式：根据 lazyBlur 和 opaque 状态切换背景
		// opaque -> 不透明背景 (Card color), 无开销
		// lazyBlur && !interacting -> 不透明背景 (Card color), 无开销
		// !lazyBlur || interacting -> 液体背景 (Transparent), 昂贵
		(opaque || !shouldApplyBlur) ? 'bg-card' : 'bg-liquid',
		'rounded-2xl p-4',
		// 边框处理：使用真实的 border 代替 mask，减小边框宽度
		'border-[0.1px] border-border',
		// 阴影处理
		'shadow-lg',
		// 优化：使用 contain 属性隔离布局和绘制，减少页面重排重绘范围
		'[contain:layout_paint_style]',
		className
	)}
	style={`
        ${cssVars}
        ${transformStyle}
        ${shouldPromoteLayer ? 'will-change: transform;' : ''} 
        /* 仅在应该应用模糊时才应用 backdrop-filter，彻底节省 GPU */
        ${shouldApplyBlur ? 'backdrop-filter: blur(var(--main-blur)); -webkit-backdrop-filter: blur(var(--main-blur));' : 'backdrop-filter: none; -webkit-backdrop-filter: none;'}
    `}
	{...rest}
	data-interacting={isInteracting}
>

	<!-- 光照层：仅在交互时显示，且跟随鼠标 -->
	<div
		class={cn(
			"pointer-events-none absolute z-0 h-[250px] w-[250px] transition-opacity duration-300",
			// 当未处在交互状态时，使用 invisible 确保它完全从渲染树中剔除
			isInteracting ? "opacity-100 visible" : "opacity-0 invisible"
		)}
		style={`
            top: 0; left: 0;
            transform: translate(calc(var(--mouse-x, 0px) - 125px), calc(var(--mouse-y, 0px) - 125px));
            background: radial-gradient(circle closest-side, rgba(255,255,255,0.15), transparent 100%);
            /* 只有在交互时才提升该层的合成，彻底消除静态时的额外 Layer */
            ${shouldPromoteLayer ? 'will-change: transform;' : ''}
        `}
	></div>

	<!-- 内发光/边框高光 -->
	<div class="pointer-events-none absolute inset-0 z-10 rounded-[inherit] border border-white/20 shadow-[inset_0_0_15px_rgba(255,255,255,0.05)]"></div>
	
	<!-- 表面光泽 -->
	<div 
		class="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-50"
		style="background: linear-gradient(120deg, rgba(255,255,255,0.1) 0%, transparent 40%);"
	></div>

	<!-- 内容层 -->
	<div class="relative z-20 h-full w-full">
		{@render children()}
	</div>
</svelte:element>