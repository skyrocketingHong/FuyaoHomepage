/**
 * Liquid Glass 折射滤镜参数。
 *
 * 折射仅用于小面积、悬浮于内容之上的交互控件。大面积侧栏和导航应继续使用
 * 静态磨砂材质，避免持续触发背景重采样。
 */
export interface LiquidGlassRefractionOptions {
	/** 组件宽度，单位为像素。 */
	width: number;
	/** 组件高度，单位为像素。 */
	height: number;
	/** 组件圆角，单位为像素。 */
	radius: number;
	/** 折射位移强度。 */
	strength?: number;
}

/**
 * 判断当前浏览器是否支持在 `backdrop-filter` 中使用 SVG URL 滤镜。
 *
 * @returns 支持 SVG 背景滤镜时返回 `true`
 */
export function supportsSvgBackdropFilter(): boolean {
	if (typeof document === 'undefined') return false;
	const probe = document.createElement('div');
	probe.style.backdropFilter = 'url(#fuyao-liquid-glass-probe)';
	return probe.style.backdropFilter.includes('url(');
}

/**
 * 为单个玻璃控件创建尺寸感知的 SVG 折射滤镜。
 *
 * 使用低频、固定种子的位移纹理模拟玻璃表面的轻微不均匀折射。
 * 单通道位移，不做 RGB 分通道合成，避免产生红蓝彩边。
 * 滤镜不包含动画，避免引入持续的 GPU 重绘。
 *
 * @param options - 尺寸、圆角与折射强度
 * @returns 可直接放入 CSS `url()` 的 data URL（包含滤镜 fragment）
 */
export function createLiquidGlassRefraction({
	width,
	height,
	radius,
	strength = 5
}: LiquidGlassRefractionOptions): string {
	const safeWidth = Math.max(1, Math.round(width));
	const safeHeight = Math.max(1, Math.round(height));
	const safeRadius = Math.max(0, Math.min(Math.round(radius), Math.min(safeWidth, safeHeight) / 2));
	const safeStrength = Math.max(0, Math.min(strength, 12));
	const frequencyX = (1.6 / safeWidth).toFixed(5);
	const frequencyY = (1.6 / safeHeight).toFixed(5);

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${safeWidth}" height="${safeHeight}" viewBox="0 0 ${safeWidth} ${safeHeight}">
	<defs>
		<filter id="fuyao-liquid-refraction" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
			<feTurbulence type="fractalNoise" baseFrequency="${frequencyX} ${frequencyY}" numOctaves="1" seed="27" stitchTiles="stitch" result="surface"/>
			<feGaussianBlur in="surface" stdDeviation="${Math.max(0.25, safeRadius / 80).toFixed(2)}" result="softSurface"/>
			<feDisplacementMap in="SourceGraphic" in2="softSurface" scale="${safeStrength.toFixed(2)}" xChannelSelector="R" yChannelSelector="G"/>
		</filter>
	</defs>
</svg>`;

	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}#fuyao-liquid-refraction`;
}
