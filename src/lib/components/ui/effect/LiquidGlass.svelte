<script lang="ts">
	/**
	 * 液态玻璃组件
	 *
	 * 实现分层透射、单层边缘高光与可选单通道 SVG 折射，带有鼠标光照跟随和 3D 倾斜交互。
	 *
	 * 材质层级 (variant) 共用 --glass-surface 染色，仅 blur/edge/shadow/gloss 按职责区分：
	 * - panel: 大面积常驻区域 (侧栏、抽屉)。blur 20~24px，保留背景色块，低饱和度。
	 *   不绘制四周完整边框，分隔线由调用方按需提供。优先使用共享 GPU 合成器模糊，
	 *   回退到 CSS backdrop-filter，最终回退到静态磨砂材质 (.bg-frosted-static)。
	 * - card: 普通信息卡片 (默认)。GPU 合成器或 CSS backdrop-filter，
	 *   单层弱边界 + 柔和外阴影，无折射与鼠标跟随。
	 * - chrome: 连续系统材质 (顶栏、移动端底栏)。blur 22~28px，
	 *   不绘制完整圆角边框：仅顶部极弱内高光 + 底部 1px 分割线 + 底部柔和阴影。
	 *   覆盖实时 DOM，默认不注册 GPU 合成器。
	 * - control: 小面积交互控件 (按钮、搜索框)。blur 10~14px。
	 *   仅使用 CSS backdrop-filter，单层方向性高光边，可开启单通道折射与鼠标光照，禁止额外 ring。
	 * - icon: 图标底座 (48x48, 圆角 14~16px)。不模糊、不折射、不注册 GPU、无鼠标跟随，
	 *   固定顶部光源：主体底色由 --section-icon-surface-* token 提供 (见 theme.css)，
	 *   仅保留一层方向性顶部高光与一个有垂直位移的外投影 (见 components.css)。
	 *
	 * 边界规则:
	 * - 每个玻璃组件只保留一层常驻边界：.liquid-glass-edge 的方向性 1px 高光边 (panel/chrome 除外，
	 *   chrome 仅保留顶部内高光与底部分割线)。
	 * - 外部阴影只表现高度，不使用零偏移零模糊阴影模拟描边。
	 * - 键盘聚焦时通过 focus-visible 外环提示，普通状态不显示额外外环。
	 *
	 * 优化策略:
	 * 1. IntersectionObserver: 离屏时停止交互监听。
	 * 2. 动态图层提升 (Dynamic Layer Promotion): 仅在交互时提升为合成层 (will-change)。
	 * 3. CSS 包含 (CSS Containment): 使用 contain: layout paint 隔离布局和绘制；
	 *    liveBackdrop 模式下去掉 paint，避免建立错误的 backdrop root。
	 * 4. 可见性切换 (Visibility Toggle): 静态或不可见时光照层完全隐藏 (visible/invisible)。
	 * 5. 合并 Transform: 统一管理倾斜和硬件加速。
	 * 6. 延迟模糊 (Lazy Blur): 可选属性，静止时使用静态磨砂材质。
	 * 7. 按需折射：仅对显式开启 `refractive` 的小面积控件创建尺寸感知滤镜，
	 *    单通道位移，无 RGB 分通道色散。
	 * 8. 共享 GPU 合成器：panel/card 变体在 WebGL2 可用时注册到 GlassCompositor，
	 *    由合成器统一绘制模糊背景，DOM 只保留染色、高光、边框与内容。
	 *    liveBackdrop 模式下强制禁用，改用原生 backdrop-filter 实时模糊后方 DOM。
	 *
	 * @prop tag - 渲染的 HTML 标签类型 (默认 'div'；'button' 时内容层输出 span，避免无效嵌套)
	 * @prop variant - 材质变体：'panel' | 'card' | 'control' | 'chrome' | 'icon' (默认 'card')
	 * @prop tilt - 是否开启 3D 倾斜视差效果 (默认 false)
	 * @prop lazyBlur - 是否启用延迟模糊 (默认 false)。开启后，静止状态不使用 backdrop-filter，极大降低 GPU 占用。
	 * @prop opaque - 是否启用纯不透明模式 (默认 false)。开启后，不使用 backdrop-filter，背景保持不透明，保留交互动画。
	 * @prop staticGlass - (已废弃, 请使用 variant="panel") 静态玻璃模式。
	 * @prop gpuBlur - 是否允许注册到共享 GPU 合成器 (默认 panel/card 允许, control/chrome/icon 不允许)
	 * @prop liveBackdrop - 实时背景模糊模式 (默认 false)。强制关闭 WebGL 合成与 SVG 折射，
	 *   在最外层直接应用原生 backdrop-filter，用于覆盖实时 DOM 内容的常驻区域 (如移动端底栏)。
	 *   滤镜初始值 blur(24px) saturate(1.08) brightness(0.98) contrast(0.96)，由 --glass-* token 驱动。
	 * @prop chromeEdge - chrome 材质的边缘朝向：'top' (默认，顶栏：底部 1px 分割线 + 向下柔和阴影) |
	 *   'bottom' (移动端底栏：顶部极弱内高光 + 向上柔和分离阴影，底边不绘制线条)。
	 *   仅对 variant="chrome" 生效。
	 * @prop showLighting - 是否显示光照跟随层 (默认 control 为 true, 其余为 false)
	 * @prop showGloss - 是否显示表面光泽层 (默认 true；icon 变体强制关闭，光泽由 icon 专属层实现)
	 * @prop flat - 是否使用轻量阴影 (默认 false；icon 变体忽略，阴影由 .liquid-glass-icon 提供)
	 * @prop refractive - 是否开启小面积单通道 SVG 折射 (默认 false；icon 变体强制关闭)
	 * @prop blur - 背景模糊半径，单位 px (默认按变体读取 token: panel 22 / card 14 / chrome 24 / control 12 / icon 0；
	 *   liveBackdrop 固定使用 --glass-chrome-blur)
	 * @prop refractionStrength - 折射位移强度 (默认 5)
	 * @prop contentLayout - 内容层布局：'block' (默认，撑满) | 'fill' (撑满) | 'center' (居中 inline-flex)
	 * @prop contentClass - 内容层额外 CSS 类名
	 * @prop class - 额外的 CSS 类名
	 */
	import { cn } from '$lib/utils/index';
	import {
		createLiquidGlassRefraction,
		supportsSvgBackdropFilter
	} from '$lib/utils/effect/liquidGlass';
	import { glassCompositor } from '$lib/utils/effect/glassCompositor.svelte';
	import { onMount, untrack } from 'svelte';

	let {
		children,
		class: className,
		tag = 'div',
		variant = 'card',
		tilt = false,
		lazyBlur = false,
		opaque = false,
		staticGlass = false,
		gpuBlur = undefined,
		liveBackdrop = false,
		chromeEdge = 'top',
		showLighting = undefined,
		showGloss = true,
		flat = false,
		refractive = false,
		blur = undefined,
		refractionStrength = 5,
		contentLayout = 'block',
		contentClass = '',
		...rest
	} = $props();

	// staticGlass 为废弃别名，映射到 panel 变体
	let effectiveVariant = $derived(staticGlass ? 'panel' : variant);

	// 各变体默认模糊半径：字符串形式引用 theme.css 的 --glass-* token (随主题/偏好联动)，
	// 数值形式用于折射滤镜的拆分计算 (折射路径无法对 CSS 变量做数学运算)
	const VARIANT_BLUR_TOKEN: Record<string, string> = {
		panel: 'var(--glass-panel-blur)',
		card: 'var(--glass-card-blur)',
		chrome: 'var(--glass-chrome-blur)',
		control: 'var(--glass-control-blur)',
		icon: '0px'
	};
	const VARIANT_BLUR_PX: Record<string, number> = {
		panel: 22,
		card: 14,
		chrome: 24,
		control: 12,
		icon: 0
	};
	let effectiveBlur = $derived(
		blur !== undefined
			? `${Math.max(0, blur)}px`
			: (VARIANT_BLUR_TOKEN[effectiveVariant] ?? VARIANT_BLUR_TOKEN.card)
	);
	let effectiveBlurPx = $derived(blur ?? VARIANT_BLUR_PX[effectiveVariant] ?? 14);

	let effectiveShowLighting = $derived(showLighting ?? effectiveVariant === 'control');
	// icon 变体不渲染通用光泽层，高光由 .liquid-glass-icon-tint 的顶部高光单独承担
	let effectiveShowGloss = $derived(showGloss && effectiveVariant !== 'icon');
	// chrome 覆盖实时 DOM、icon 无需模糊：默认均不注册 GPU 合成器
	let gpuBlurAllowed = $derived(
		liveBackdrop || effectiveVariant === 'icon'
			? false
			: (gpuBlur ?? (effectiveVariant === 'panel' || effectiveVariant === 'card'))
	);

	let el: HTMLElement | undefined = $state();
	let bounds: DOMRect | undefined = undefined;
	let rafId: number;
	let interactionTimer: ReturnType<typeof setTimeout> | undefined;
	let resizeObserver: ResizeObserver | undefined;

	let isVisible = $state(false);
	let isInteracting = $state(false);
	let supportsRefraction = $state(false);
	let supportsBackdrop = $state(false);
	let refractionUrl = $state('');
	// prefers-reduced-transparency：关闭高成本模糊，tint 不透明度由 token 媒体查询提高
	let reducedTransparency = $state(false);

	// 状态用于控制是否启用硬件加速层
	// 仅在 可见且交互中 时启用 will-change，平时回退到普通文档流，节省显存
	let shouldPromoteLayer = $derived(isVisible && isInteracting);

	// 是否由共享 GPU 合成器绘制模糊背景 (reduced-transparency 下关闭高成本模糊)
	let useGpuBlur = $derived(
		gpuBlurAllowed && !opaque && !reducedTransparency && glassCompositor.active
	);

	// 是否应该激活 CSS 毛玻璃效果
	// GPU 合成器接管时不激活；opaque/icon/reduced-transparency 永远不激活；liveBackdrop 由独立分支处理
	// 离屏元素不激活，避免不可见区域持续合成
	// lazyBlur 为 true 时仅在交互时激活 (panel 变体忽略 lazyBlur)
	let shouldApplyBlur = $derived(
		!opaque &&
			!liveBackdrop &&
			!useGpuBlur &&
			!reducedTransparency &&
			effectiveVariant !== 'icon' &&
			isVisible &&
			supportsBackdrop &&
			(effectiveVariant === 'panel' || effectiveVariant === 'chrome' || !lazyBlur || isInteracting)
	);
	let shouldApplyRefraction = $derived(
		refractive && supportsRefraction && shouldApplyBlur && refractionUrl.length > 0
	);

	// 初始化 IntersectionObserver
	onMount(() => {
		if (!el) return;
		supportsRefraction = supportsSvgBackdropFilter();
		supportsBackdrop =
			CSS.supports('backdrop-filter', 'blur(1px)') ||
			CSS.supports('-webkit-backdrop-filter', 'blur(1px)');

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

		// 监听系统降低透明度偏好：关闭 backdrop-filter 与 GPU 合成，token 侧同步提高 tint 不透明度
		const transparencyQuery = matchMedia('(prefers-reduced-transparency: reduce)');
		reducedTransparency = transparencyQuery.matches;
		const handleTransparencyChange = (e: MediaQueryListEvent) => {
			reducedTransparency = e.matches;
		};
		transparencyQuery.addEventListener('change', handleTransparencyChange);

		if (refractive && supportsRefraction) {
			resizeObserver = new ResizeObserver(() => updateRefraction());
			resizeObserver.observe(el);
			updateRefraction();
		}

		return () => {
			observer.disconnect();
			resizeObserver?.disconnect();
			transparencyQuery.removeEventListener('change', handleTransparencyChange);
			cancelAnimationFrame(rafId);
			clearTimeout(interactionTimer);
		};
	});

	/** 根据组件当前尺寸更新折射滤镜。 */
	function updateRefraction() {
		if (!el || !refractive || !supportsRefraction) return;
		const rect = el.getBoundingClientRect();
		if (rect.width < 1 || rect.height < 1) return;
		const radius = Number.parseFloat(getComputedStyle(el).borderRadius) || 0;
		refractionUrl = createLiquidGlassRefraction({
			width: rect.width,
			height: rect.height,
			radius,
			strength: refractionStrength
		});
	}

	// 共享 GPU 合成器注册：panel/card 变体在合成器可用时注册矩形区域，
	// 由合成器统一绘制模糊背景，组件失活或卸载时注销。
	// register/unregister 内部访问的状态必须用 untrack 隔离，
	// 只跟踪 el 与 useGpuBlur，避免形成响应式死循环。
	$effect(() => {
		const target = el;
		const enabled = useGpuBlur;
		if (!target || !enabled) return;
		const regionId = untrack(() => glassCompositor.register(target));
		return () => {
			untrack(() => glassCompositor.unregister(regionId));
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
		if (tilt)
			parts.push('perspective(1000px) rotateX(var(--rotate-x,0deg)) rotateY(var(--rotate-y,0deg))');
		// 当需要提升图层时，添加 translateZ(0) 触发合成层，
		// 注意：它追加在 rotate 之后，确保在同一个 transform 属性中。
		if (shouldPromoteLayer) parts.push('translateZ(0)');
		return parts.length > 0 ? `transform: ${parts.join(' ')};` : '';
	});

	let backdropStyle = $derived.by(() => {
		// 实时背景模糊模式：原生 backdrop-filter 直接作用于最外层，
		// 可模糊后方实时 DOM，不经过 WebGL 合成器与 SVG 折射。
		// 滤镜参数全部由 --glass-* token 驱动 (初始 blur(24px) saturate(1.08) brightness(0.98) contrast(0.96))
		if (liveBackdrop) {
			if (!isVisible || !supportsBackdrop || opaque || reducedTransparency)
				return 'backdrop-filter: none; -webkit-backdrop-filter: none;';
			const live =
				'blur(var(--glass-chrome-blur)) saturate(var(--glass-saturation)) brightness(var(--glass-brightness)) contrast(var(--glass-contrast))';
			return `backdrop-filter: ${live}; -webkit-backdrop-filter: ${live};`;
		}
		if (!shouldApplyBlur) return 'backdrop-filter: none; -webkit-backdrop-filter: none;';
		// 克制的颜色调整 (saturate 1.08)：避免背景色块被过度强化或继续漂白灰阶与浅色区域
		const colorAdjust =
			'saturate(var(--glass-saturation)) brightness(var(--glass-brightness)) contrast(var(--glass-contrast))';
		if (!shouldApplyRefraction) {
			const base = `blur(${effectiveBlur}) ${colorAdjust}`;
			return `backdrop-filter: ${base}; -webkit-backdrop-filter: ${base};`;
		}
		const half = Math.max(0, effectiveBlurPx / 2);
		const refracted = `blur(${half}px) url("${refractionUrl}") blur(${half}px) ${colorAdjust}`;
		return `backdrop-filter: ${refracted}; -webkit-backdrop-filter: ${refracted};`;
	});

	// 表面材质类：
	// liveBackdrop -> 统一基准表面，模糊由最外层原生 backdrop-filter 提供
	// opaque -> 不透明背景 (Card color), 无开销
	// icon -> 无玻璃 tint (主体底色由 .liquid-glass-icon 读取 --section-icon-surface-* token)
	// GPU 合成器或 CSS 模糊激活时 -> 对应变体的 tint 材质 (模糊由合成器/backdrop-filter 提供)
	// 模糊不可用或 reduced-transparency 时 -> 静态磨砂材质作为降级背景 (避免纯白块)
	const VARIANT_SURFACE: Record<string, string> = {
		panel: 'bg-glass-panel',
		chrome: 'bg-glass-chrome',
		control: 'bg-glass-control',
		card: 'bg-glass-card'
	};
	let surfaceClass = $derived(
		liveBackdrop
			? effectiveVariant === 'chrome' && chromeEdge === 'bottom'
				? 'bg-glass-live-bottom'
				: 'bg-glass-live'
			: opaque
				? 'bg-card'
				: effectiveVariant === 'icon'
					? ''
					: shouldApplyBlur || useGpuBlur
						? (VARIANT_SURFACE[effectiveVariant] ?? 'bg-glass-card')
						: 'bg-frosted-static'
	);

	// 内容层：button 内只能包含 phrasing content，使用 span 避免无效嵌套；
	// a 为透明内容模型，继续使用 div
	let contentTag = $derived(tag === 'button' ? 'span' : 'div');
	let contentClasses = $derived(
		cn(
			'relative z-20',
			contentLayout === 'center'
				? 'inline-flex h-full w-full min-w-0 items-center justify-center text-center leading-none'
				: 'block h-full w-full',
			contentClass
		)
	);

	// 可交互标签的焦点与默认样式：
	// 清理浏览器默认按钮外观；键盘聚焦时显示 focus-visible 外环，普通状态无额外外环
	let interactiveClass = $derived(
		tag === 'button'
			? 'cursor-pointer appearance-none border-0 [font:inherit] focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-primary/60'
			: tag === 'a'
				? 'focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-primary/60'
				: ''
	);
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
		'liquid-glass-shell group relative isolate w-full overflow-hidden transition-[transform,box-shadow,background-color] duration-200 ease-out',
		surfaceClass,
		'rounded-2xl p-4',
		interactiveClass,
		// 阴影只表现高度，不使用零偏移零模糊阴影模拟描边；
		// icon 变体的投影由 .liquid-glass-icon 统一提供
		effectiveVariant === 'icon' ? 'liquid-glass-icon' : flat ? 'shadow-sm' : 'shadow-lg',
		// 优化：使用 contain 属性隔离布局和绘制，减少页面重排重绘范围
		// liveBackdrop 模式去掉 paint，避免建立错误的 backdrop root 导致实时模糊失效
		liveBackdrop ? '[contain:layout_style]' : '[contain:layout_paint_style]',
		className
	)}
	style={`
		${transformStyle}
		${shouldPromoteLayer ? 'will-change: transform;' : ''}
		${backdropStyle}
	`}
	{...rest}
	data-interacting={isInteracting}
	data-refractive={shouldApplyRefraction}
>
	<!-- 装饰层使用 span：tag 允许 button 等行内根元素，div 会造成无效嵌套 -->
	<!-- 透射染色层：与背景滤镜分离，确保静态降级模式也具有材质深度；
	     icon 变体使用该层实现唯一的方向性顶部高光，不参与鼠标跟随 -->
	<span
		class={cn(
			'pointer-events-none absolute inset-0 z-0 rounded-[inherit]',
			effectiveVariant === 'icon' ? 'liquid-glass-icon-tint' : 'liquid-glass-tint'
		)}
	></span>

	<!-- 光照层：仅在交互时显示，且跟随鼠标 -->
	{#if effectiveShowLighting}
		<span
			class={cn(
				'pointer-events-none absolute z-0 h-[250px] w-[250px] transition-opacity duration-300',
				// 当未处在交互状态时，使用 invisible 确保它完全从渲染树中剔除
				isInteracting ? 'visible opacity-100' : 'invisible opacity-0'
			)}
			style={`
				top: 0; left: 0;
				transform: translate(calc(var(--mouse-x, 0px) - 125px), calc(var(--mouse-y, 0px) - 125px));
				background: radial-gradient(circle closest-side, rgba(255,255,255,0.15), transparent 100%);
				/* 只有在交互时才提升该层的合成，彻底消除静态时的额外 Layer */
				${shouldPromoteLayer ? 'will-change: transform;' : ''}
			`}
		></span>
	{/if}

	<!-- 单层方向性边缘：panel 不绘制四周完整边框 (分隔线由调用方提供)；
	     chrome 仅保留顶部内高光与底部分割线；icon 不渲染边缘层，
	     边界感由 .liquid-glass-icon-tint 的方向性顶部高光单独承担 -->
	{#if effectiveVariant !== 'panel' && effectiveVariant !== 'icon'}
		<span
			class={cn(
				'pointer-events-none absolute inset-0 z-10 rounded-[inherit]',
				effectiveVariant === 'chrome'
					? chromeEdge === 'bottom'
						? 'liquid-glass-edge liquid-glass-edge--chrome-bottom'
						: 'liquid-glass-edge liquid-glass-edge--chrome'
					: 'liquid-glass-edge'
			)}
		></span>
	{/if}

	<!-- 表面光泽 -->
	{#if effectiveShowGloss}
		<span class="liquid-glass-gloss pointer-events-none absolute inset-0 z-10 rounded-[inherit]"
		></span>
	{/if}

	<!-- 内容层 -->
	<svelte:element this={contentTag} class={contentClasses}>
		{@render children()}
	</svelte:element>
</svelte:element>
