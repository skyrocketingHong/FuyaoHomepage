/** 项目缺少上游类型声明时使用的最小模块接口。 */
declare module 'js-yaml' {
	interface LoadOptions {
		filename?: string;
		onWarning?: (error: YAMLException) => void;
		json?: boolean;
		reviver?: (key: string, value: unknown) => unknown;
	}

	interface DumpOptions {
		indent?: number;
		noArrayIndent?: boolean;
		skipInvalid?: boolean;
		flowLevel?: number;
		sortKeys?: boolean;
		lineWidth?: number;
		noRefs?: boolean;
		noCompatMode?: boolean;
		condenseFlow?: boolean;
	}

	interface YAMLException extends Error {
		name: 'YAMLException';
		reason: string;
		mark: {
			name: string;
			buffer: string;
			line: number;
			column: number;
			position: number;
		};
	}

	/** 解析 YAML 文本。 */
	export function load(str: string, options?: LoadOptions): unknown;
	/** 将数据序列化为 YAML 文本。 */
	export function dump(obj: unknown, options?: DumpOptions): string;
}

/** QRCode 浏览器生成接口的项目内最小声明。 */
declare module 'qrcode' {
	interface QRCodeToDataURLOptions {
		type?: 'image/png' | 'image/jpeg' | 'image/webp';
		quality?: number;
		margin?: number;
		color?: {
			dark?: string;
			light?: string;
		};
		width?: number;
		errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
	}

	/** 将文本编码为二维码 Data URL。 */
	export function toDataURL(text: string, options?: QRCodeToDataURLOptions): Promise<string>;
	/** 将文本二维码绘制到指定 Canvas。 */
	export function toCanvas(
		canvas: HTMLCanvasElement,
		text: string,
		options?: QRCodeToDataURLOptions
	): Promise<HTMLCanvasElement>;
}
