/**
 * 共享玻璃合成器 (WebGL2)
 *
 * 全页面唯一的 GPU 合成器，负责为玻璃组件绘制模糊背景：
 * 1. 将马赛克背景 Canvas 上传为纹理 (texImage2D，无 readPixels 往返)；
 * 2. 降采样到 1/4 分辨率并执行两级高斯模糊 (第二级两倍步长，等效更大半径)，缓存模糊纹理；
 * 3. 先绘制清晰背景，再按注册的玻璃矩形叠加圆角模糊区域 (仅背景模糊，不叠加白色材质)；
 * 4. DOM 玻璃组件仅保留染色、边缘高光、边框与内容。
 *
 * 渲染按需触发 (背景帧、矩形变化、滚动、尺寸变化)，静止时无 GPU 渲染循环；
 * 页面不可见时停止合成器更新。
 * WebGL2 不可用或 prefers-reduced-transparency 时保持 inactive，
 * LiquidGlass 自动回退到 CSS backdrop-filter。
 *
 * 限制：GPU 只能采样上传为纹理的背景 Canvas，无法模糊任意 DOM 内容。
 */

/** 模糊纹理相对画布分辨率的缩放比例 */
const BLUR_SCALE = 0.25;
/** 合成器画布 DPR 上限 */
const MAX_DPR = 1.5;

/** 全屏三角形顶点着色器 (blit / blur / region 共用) */
const VERTEX_SHADER = `#version 300 es
out vec2 vUv;
void main() {
	vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
	vUv = p;
	gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

/** 纹理直绘 (降采样与清晰背景绘制) */
const BLIT_FRAGMENT = `#version 300 es
precision mediump float;
uniform sampler2D uTex;
in vec2 vUv;
out vec4 outColor;
void main() {
	outColor = texture(uTex, vUv);
}`;

/** 单通道高斯模糊 (9-tap，利用线性采样) */
const BLUR_FRAGMENT = `#version 300 es
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uDir;
in vec2 vUv;
out vec4 outColor;
void main() {
	vec4 c = texture(uTex, vUv) * 0.2270270270;
	c += texture(uTex, vUv + uDir * 1.3846153846) * 0.3162162162;
	c += texture(uTex, vUv - uDir * 1.3846153846) * 0.3162162162;
	c += texture(uTex, vUv + uDir * 3.2307692308) * 0.0702702703;
	c += texture(uTex, vUv - uDir * 3.2307692308) * 0.0702702703;
	outColor = c;
}`;

/** 玻璃区域绘制：圆角矩形 SDF 裁剪 + 克制的色彩调整 (saturate 1.08, brightness 0.98)；
 * 只输出模糊背景，不叠加白色材质，禁止 RGB 分通道偏移与色散 */
const REGION_FRAGMENT = `#version 300 es
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uResolution;
uniform vec4 uRect;
uniform float uRadius;
in vec2 vUv;
out vec4 outColor;
void main() {
	vec2 p = gl_FragCoord.xy;
	vec2 halfSize = uRect.zw * 0.5;
	vec2 center = uRect.xy + halfSize;
	float r = min(uRadius, min(halfSize.x, halfSize.y));
	vec2 q = abs(p - center) - (halfSize - vec2(r));
	float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
	float alpha = 1.0 - smoothstep(-0.75, 0.75, sd);
	if (alpha <= 0.001) discard;
	vec3 col = texture(uTex, p / uResolution).rgb;
	float luma = dot(col, vec3(0.299, 0.587, 0.114));
	col = mix(vec3(luma), col, 1.08) * 0.98;
	outColor = vec4(col, alpha);
}`;

interface GlassRegion {
	el: HTMLElement;
	/** CSS 像素圆角 */
	radius: number;
}

interface ShaderProgram {
	program: WebGLProgram;
	uniforms: Record<string, WebGLUniformLocation | null>;
}

function compileShader(
	gl: WebGL2RenderingContext,
	type: number,
	source: string
): WebGLShader | null {
	const shader = gl.createShader(type);
	if (!shader) return null;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error('[GlassCompositor] shader compile failed:', gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}
	return shader;
}

function createProgram(
	gl: WebGL2RenderingContext,
	fragmentSource: string,
	uniformNames: string[]
): ShaderProgram | null {
	const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
	const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
	if (!vs || !fs) return null;
	const program = gl.createProgram();
	if (!program) return null;
	gl.attachShader(program, vs);
	gl.attachShader(program, fs);
	gl.linkProgram(program);
	gl.deleteShader(vs);
	gl.deleteShader(fs);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error('[GlassCompositor] program link failed:', gl.getProgramInfoLog(program));
		gl.deleteProgram(program);
		return null;
	}
	const uniforms: Record<string, WebGLUniformLocation | null> = {};
	for (const name of uniformNames) {
		uniforms[name] = gl.getUniformLocation(program, name);
	}
	return { program, uniforms };
}

function createTexture(gl: WebGL2RenderingContext): WebGLTexture | null {
	const tex = gl.createTexture();
	if (!tex) return null;
	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	return tex;
}

class GlassCompositor {
	/** 合成器是否可用 (WebGL2 初始化成功且已挂载) */
	active = $state(false);
	/** 至少完成过一帧有效合成 (此时才可隐藏源 Canvas) */
	ready = $state(false);
	/** 初始化或首帧合成失败，进入 CSS 回退 */
	failed = $state(false);

	private canvas: HTMLCanvasElement | null = null;
	private gl: WebGL2RenderingContext | null = null;
	private source: HTMLCanvasElement | null = null;
	private sourceDirty = true;

	private blit: ShaderProgram | null = null;
	private blur: ShaderProgram | null = null;
	private region: ShaderProgram | null = null;
	private srcTex: WebGLTexture | null = null;
	private blurTexA: WebGLTexture | null = null;
	private blurTexB: WebGLTexture | null = null;
	private fboA: WebGLFramebuffer | null = null;
	private fboB: WebGLFramebuffer | null = null;
	private blurWidth = 0;
	private blurHeight = 0;
	private hasFrame = false;

	// 区域注册表仅为渲染器内部数据，无任何 Svelte 模板消费；
	// 必须使用非响应式 Map，否则 register/unregister 会把 Map 纳入调用方
	// $effect 的依赖，形成 注册 -> 重跑 -> 注销 的响应式死循环
	private regions = new Map<number, GlassRegion>();
	/** 元素 -> 区域 ID，防止水合/HMR/重挂载导致同一元素重复注册 */
	private regionIds = new WeakMap<HTMLElement, number>();
	private nextRegionId = 1;
	private observer: ResizeObserver | null = null;
	private renderScheduled = false;
	private contextLost = false;

	/**
	 * 挂载到画布并初始化 WebGL2。
	 *
	 * @param canvas 合成器画布元素
	 * @returns 初始化成功返回 true；WebGL2 不可用时返回 false (调用方回退 CSS)
	 */
	attach(canvas: HTMLCanvasElement): boolean {
		// prefers-reduced-transparency：关闭高成本 GPU 模糊，整体回退 CSS 路径
		// (组件侧通过 token 媒体查询同步提高 tint 不透明度)
		if (
			typeof matchMedia === 'function' &&
			matchMedia('(prefers-reduced-transparency: reduce)').matches
		) {
			this.failed = true;
			return false;
		}

		const gl = canvas.getContext('webgl2', {
			alpha: false,
			antialias: false,
			depth: false,
			stencil: false,
			powerPreference: 'low-power'
		});
		if (!gl) {
			this.failed = true;
			return false;
		}

		const blit = createProgram(gl, BLIT_FRAGMENT, ['uTex']);
		const blur = createProgram(gl, BLUR_FRAGMENT, ['uTex', 'uDir']);
		const region = createProgram(gl, REGION_FRAGMENT, ['uTex', 'uResolution', 'uRect', 'uRadius']);
		const srcTex = createTexture(gl);
		const blurTexA = createTexture(gl);
		const blurTexB = createTexture(gl);
		if (!blit || !blur || !region || !srcTex || !blurTexA || !blurTexB) {
			this.failed = true;
			return false;
		}

		this.canvas = canvas;
		this.gl = gl;
		this.blit = blit;
		this.blur = blur;
		this.region = region;
		this.srcTex = srcTex;
		this.blurTexA = blurTexA;
		this.blurTexB = blurTexB;
		this.fboA = gl.createFramebuffer();
		this.fboB = gl.createFramebuffer();
		this.contextLost = false;

		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

		canvas.addEventListener('webglcontextlost', this.handleContextLost);
		canvas.addEventListener('webglcontextrestored', this.handleContextRestored);

		this.observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.target === canvas) {
					this.handleResize();
				} else {
					this.updateRegionRadius(entry.target as HTMLElement);
				}
			}
			this.scheduleRender();
		});
		this.observer.observe(canvas);

		document.addEventListener('scroll', this.handleScroll, { capture: true, passive: true });
		document.addEventListener('visibilitychange', this.handleVisibility);

		this.handleResize();
		this.active = true;
		this.scheduleRender();
		return true;
	}

	/** 卸载并释放资源。 */
	detach() {
		this.active = false;
		this.ready = false;
		this.failed = false;
		this.observer?.disconnect();
		this.observer = null;
		document.removeEventListener('scroll', this.handleScroll, { capture: true });
		document.removeEventListener('visibilitychange', this.handleVisibility);
		if (this.canvas) {
			this.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
			this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);
		}
		this.gl?.getExtension('WEBGL_lose_context')?.loseContext();
		this.gl = null;
		this.canvas = null;
		this.source = null;
		this.regions.clear();
		this.regionIds = new WeakMap();
		this.hasFrame = false;
		this.sourceDirty = true;
	}

	/**
	 * 设置背景纹理来源 (马赛克 Canvas)。
	 * 来源 Canvas 无需可见，texImage2D 直接读取其后备存储。
	 */
	setSource(canvas: HTMLCanvasElement | null) {
		if (this.source === canvas) return;
		this.source = canvas;
		this.sourceDirty = true;
		this.hasFrame = false;
		this.scheduleRender();
	}

	/** 背景来源绘制了新帧后调用，标记纹理需要重新上传与模糊。 */
	notifySourceFrame() {
		if (!this.active || !this.source) return;
		this.sourceDirty = true;
		this.scheduleRender();
	}

	/**
	 * 注册玻璃区域。同一元素重复注册时直接返回原 ID。
	 *
	 * @param el 玻璃组件的根元素
	 * @returns 区域 ID，用于 unregister
	 */
	register(el: HTMLElement): number {
		const existing = this.regionIds.get(el);
		if (existing !== undefined && this.regions.has(existing)) return existing;

		const id = this.nextRegionId++;
		this.regions.set(id, { el, radius: 0 });
		this.regionIds.set(el, id);
		this.updateRegionRadius(el);
		this.observer?.observe(el);
		this.scheduleRender();
		return id;
	}

	/** 注销玻璃区域。 */
	unregister(id: number) {
		const region = this.regions.get(id);
		if (!region) return;
		this.observer?.unobserve(region.el);
		this.regionIds.delete(region.el);
		this.regions.delete(id);
		this.scheduleRender();
	}

	private updateRegionRadius(el: HTMLElement) {
		for (const region of this.regions.values()) {
			if (region.el === el) {
				region.radius = Number.parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
				return;
			}
		}
	}

	private handleContextLost = (e: Event) => {
		e.preventDefault();
		this.contextLost = true;
		// 上下文丢失期间回退 CSS，等待 restored 后恢复
		this.active = false;
	};

	private handleContextRestored = () => {
		this.contextLost = false;
		this.sourceDirty = true;
		this.active = true;
		this.scheduleRender();
	};

	private handleScroll = () => {
		// 滚动只改变玻璃矩形位置，不重新计算背景模糊
		this.scheduleRender();
	};

	private handleVisibility = () => {
		if (!document.hidden) this.scheduleRender();
	};

	private handleResize() {
		const canvas = this.canvas;
		if (!canvas) return;
		const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
		const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
		const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
		if (canvas.width !== width || canvas.height !== height) {
			canvas.width = width;
			canvas.height = height;
			this.blurWidth = 0; // 触发模糊纹理重建
		}
	}

	/** 合并连续的渲染请求，每帧最多渲染一次。 */
	private scheduleRender() {
		if (!this.gl || !this.active || this.renderScheduled || this.contextLost) return;
		if (document.hidden) return;
		this.renderScheduled = true;
		requestAnimationFrame(() => {
			this.renderScheduled = false;
			this.render();
		});
	}

	/** 上传背景纹理并重建低分辨率模糊纹理。 */
	private updateBackground() {
		const { gl, source, srcTex } = this;
		if (!gl || !source || !srcTex || source.width < 1 || source.height < 1) return;

		gl.bindTexture(gl.TEXTURE_2D, srcTex);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
		this.hasFrame = true;

		// 降采样到 1/4 分辨率
		const bw = Math.max(1, Math.round(source.width * BLUR_SCALE));
		const bh = Math.max(1, Math.round(source.height * BLUR_SCALE));
		if (bw !== this.blurWidth || bh !== this.blurHeight) {
			this.blurWidth = bw;
			this.blurHeight = bh;
			for (const tex of [this.blurTexA, this.blurTexB]) {
				gl.bindTexture(gl.TEXTURE_2D, tex);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, bw, bh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
			}
		}

		if (!this.blit || !this.blur || !this.fboA || !this.fboB) return;
		gl.disable(gl.BLEND);
		gl.viewport(0, 0, bw, bh);

		// 1. 降采样: srcTex -> A
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboA);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.blurTexA, 0);
		gl.useProgram(this.blit.program);
		gl.bindTexture(gl.TEXTURE_2D, srcTex);
		gl.drawArrays(gl.TRIANGLES, 0, 3);

		// 2. 第一级高斯 水平: A -> B
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboB);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.blurTexB, 0);
		gl.useProgram(this.blur.program);
		gl.uniform2f(this.blur.uniforms['uDir'], 1 / bw, 0);
		gl.bindTexture(gl.TEXTURE_2D, this.blurTexA);
		gl.drawArrays(gl.TRIANGLES, 0, 3);

		// 3. 第一级高斯 垂直: B -> A
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboA);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.blurTexA, 0);
		gl.uniform2f(this.blur.uniforms['uDir'], 0, 1 / bh);
		gl.bindTexture(gl.TEXTURE_2D, this.blurTexB);
		gl.drawArrays(gl.TRIANGLES, 0, 3);

		// 4. 第二级高斯 (两倍步长) 水平: A -> B，等效扩大模糊半径
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboB);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.blurTexB, 0);
		gl.uniform2f(this.blur.uniforms['uDir'], 2 / bw, 0);
		gl.bindTexture(gl.TEXTURE_2D, this.blurTexA);
		gl.drawArrays(gl.TRIANGLES, 0, 3);

		// 5. 第二级高斯 垂直: B -> A (最终模糊结果存放在 A)
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboA);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.blurTexA, 0);
		gl.uniform2f(this.blur.uniforms['uDir'], 0, 2 / bh);
		gl.bindTexture(gl.TEXTURE_2D, this.blurTexB);
		gl.drawArrays(gl.TRIANGLES, 0, 3);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		this.sourceDirty = false;
	}

	private render() {
		const { gl, canvas } = this;
		if (!gl || !canvas || this.contextLost) return;
		if (!this.active) return;
		// 页面不可见时停止合成器更新 (scheduleRender 已拦截，此处兜底)
		if (document.hidden) return;

		if (this.sourceDirty) this.updateBackground();
		if (!this.hasFrame) return;

		gl.viewport(0, 0, canvas.width, canvas.height);

		// 1. 绘制清晰背景
		gl.disable(gl.BLEND);
		gl.useProgram(this.blit!.program);
		gl.bindTexture(gl.TEXTURE_2D, this.srcTex);
		gl.drawArrays(gl.TRIANGLES, 0, 3);

		// 2. 按注册的玻璃矩形叠加圆角模糊区域
		if (this.regions.size > 0 && this.region) {
			gl.enable(gl.BLEND);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
			gl.useProgram(this.region.program);
			gl.uniform2f(this.region.uniforms['uResolution'], canvas.width, canvas.height);
			gl.bindTexture(gl.TEXTURE_2D, this.blurTexA);

			const dpr = canvas.width / Math.max(1, canvas.clientWidth);
			const uRect = this.region.uniforms['uRect'];
			const uRadius = this.region.uniforms['uRadius'];

			for (const { el, radius } of this.regions.values()) {
				if (!el.isConnected) continue;
				const rect = el.getBoundingClientRect();
				if (rect.width < 1 || rect.height < 1) continue;
				// 视口外裁剪
				if (
					rect.right < 0 ||
					rect.bottom < 0 ||
					rect.left > window.innerWidth ||
					rect.top > window.innerHeight
				) {
					continue;
				}
				const x = rect.left * dpr;
				const w = rect.width * dpr;
				const h = rect.height * dpr;
				// GL 坐标系原点在左下角
				const y = canvas.height - (rect.top + rect.height) * dpr;
				gl.uniform4f(uRect, x, y, w, h);
				gl.uniform1f(uRadius, radius * dpr);
				gl.drawArrays(gl.TRIANGLES, 0, 3);
			}
		}

		// 首帧合成结果校验：成功则标记 ready (允许隐藏源 Canvas)，
		// 失败则回退 CSS 路径，原始马赛克 Canvas 保持可见
		if (!this.ready) {
			if (gl.getError() === gl.NO_ERROR) {
				this.ready = true;
			} else {
				this.failed = true;
				this.active = false;
			}
		}
	}
}

/** 共享玻璃合成器全局单例 */
export const glassCompositor = new GlassCompositor();
