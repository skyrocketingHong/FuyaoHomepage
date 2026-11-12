/**
 * 主题输入协议 v1 的共享实现。
 *
 * 职责：解析并校验主题 theme.json、用权威契约 schema（contracts/theme，
 * ajv 2020-12 编译，与 Go 侧消费同一份文件，杜绝两套字段清单）校验主题
 * 文档、计算冻结输入快照的三个摘要、读写 private/input.json，以及校验
 * 平台传入的已冻结快照。快照准备（prepare-build-inputs.js 正常模式）与
 * 受控消费（frozen 模式及 T3 构建执行器）必须共用本模块。
 *
 * 摘要算法（contentDigest，无歧义长度前缀编码；契约 README 同步记录）：
 * 逐条目按序送入 SHA-256，条目编码为
 *   u8(domain) + u32be(labelUtf8Length) + label + u64be(contentLength) + content
 * - domain 1：public/ 树内普通文件，label 为快照内相对路径；
 * - domain 2：参与内容版本化的私有配置（如 content-config.json），
 *   label 为 `private/<basename>`；
 * - 两个域内部均按 label 的 UTF-8 字节序升序排序。
 * 树内与附加条目因域字节不同而不可互换；长度前缀使文件边界不可伪造，
 * 消除了旧“路径+NUL+内容+NUL”拼接下的同摘要构造。
 *
 * - siteConfigDigest：private/site-config.json 的文件字节。
 * - themeConfigDigest：themeConfig 稳定键序序列化后的字节；缺省等价空对象。
 */

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

import { scanSecretFields } from '../../src/lib/config/schema.ts';

export const MANIFEST_CONTRACT = 'fuyao.theme.manifest/v1';
export const BUILD_INPUT_CONTRACT = 'fuyao.theme.build-input/v1';
export const SUPPORTED_ADAPTER = 'node22-sveltekit-static';
export const CONFIG_SCHEMA_DIALECT = 'https://json-schema.org/draft/2020-12/schema';

/** 本模块位于 site/scripts/lib/，site 根为上两级。 */
export const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const PRIVATE_SNAPSHOT_FILES = ['content-config.json', 'input.json', 'site-config.json'];

/**
 * 解析权威契约目录：环境变量 FUYAO_THEME_CONTRACTS 优先，否则使用仓库
 * 布局下的 contracts/theme。契约是主题构建的必需输入，缺失即失败。
 *
 * @param {string} [explicit]
 * @returns {string}
 */
export function resolveContractsDir(explicit) {
	const dir =
		explicit ??
		(process.env.FUYAO_THEME_CONTRACTS || path.resolve(siteRoot, '..', 'contracts', 'theme'));
	if (!fs.existsSync(path.join(dir, 'manifest.schema.json'))) {
		throw new Error(`找不到主题契约 schema（manifest.schema.json）：${dir}`);
	}
	return dir;
}

/**
 * @param {string} label
 * @param {unknown} doc
 * @returns {void}
 */
/**
 * @param {import('ajv/dist/2020').ValidateFunction} validator
 * @param {string} label
 * @param {unknown} doc
 * @returns {void}
 */
function assertSchemaValid(validator, label, doc) {
	if (!validator(doc)) {
		const details = (validator.errors ?? [])
			.map((error) => `${error.instancePath || '/'} ${error.message ?? ''}`.trim())
			.join('；');
		throw new Error(`${label} 未通过权威契约 schema 校验：${details}`);
	}
}

/**
 * 用权威契约 schema 编译校验器。manifest 校验 theme.json，input 校验
 * input.json；两侧与 Go 侧 `fuyao-admin validate-theme` 消费同一份文件。
 *
 * @param {string} [contractsDir]
 */
export function createContractValidator(contractsDir) {
	const dir = resolveContractsDir(contractsDir);
	const ajv = new Ajv2020({ allErrors: true });
	// ajv-formats 的类型面向 ajv 默认类；2020 子类在运行时完全兼容。
	// ajv-formats 类型指向其嵌套的 ajv 副本；运行时与 2020 子类完全兼容。
	addFormats(/** @type {any} */ (ajv));
	const manifestSchema = ajv.compile(
		JSON.parse(fs.readFileSync(path.join(dir, 'manifest.schema.json'), 'utf8'))
	);
	const inputSchema = ajv.compile(
		JSON.parse(fs.readFileSync(path.join(dir, 'build-input.schema.json'), 'utf8'))
	);
	return {
		assertManifest: (/** @type {unknown} */ doc) =>
			assertSchemaValid(manifestSchema, 'theme.json', doc),
		assertInput: (/** @type {unknown} */ doc) => assertSchemaValid(inputSchema, 'input.json', doc)
	};
}

/**
 * 编译主题配置 schema（manifest configSchema.file 指向的文档）。
 * 仅接受 draft 2020-12 方言；返回可直接调用的校验函数。
 *
 * @param {unknown} schemaDoc
 */
export function compileThemeConfigSchema(schemaDoc) {
	if (!schemaDoc || typeof schemaDoc !== 'object' || Array.isArray(schemaDoc)) {
		throw new Error('theme config schema: 顶层必须是对象');
	}
	const dialect = /** @type {Record<string, unknown>} */ (schemaDoc)['$schema'];
	if (dialect !== CONFIG_SCHEMA_DIALECT) {
		throw new Error(`theme config schema: $schema 必须声明 ${CONFIG_SCHEMA_DIALECT}`);
	}
	const ajv = new Ajv2020({ allErrors: true });
	// ajv-formats 类型指向其嵌套的 ajv 副本；运行时与 2020 子类完全兼容。
	addFormats(/** @type {any} */ (ajv));
	/** @type {import('ajv/dist/2020').ValidateFunction} */
	let validator;
	try {
		validator = ajv.compile(schemaDoc);
	} catch (error) {
		throw new Error(`theme config schema 无法编译：${String(error)}`);
	}
	return (/** @type {unknown} */ config) => {
		if (!validator(config)) {
			const details = (validator.errors ?? [])
				.map((error) => `${error.instancePath || '/'} ${error.message ?? ''}`.trim())
				.join('；');
			throw new Error(`theme config 未通过主题配置 schema 校验：${details}`);
		}
		return true;
	};
}

/**
 * 校验 themeConfig 是否被主题声明允许：声明了 configSchema 时按其校验，
 * 未声明时仅允许空对象（与契约 README 及 Go 侧 ValidateEmptyThemeConfig
 * 同语义）。
 *
 * @param {{ raw: Record<string, unknown> }} manifest
 * @param {unknown} themeConfig
 * @param {((config: unknown) => boolean) | null} configValidator 已编译的主题配置校验器
 */
export function assertThemeConfigAllowed(manifest, themeConfig, configValidator) {
	const declared = manifest.raw.configSchema;
	if (!declared) {
		if (
			!themeConfig ||
			typeof themeConfig !== 'object' ||
			Array.isArray(themeConfig) ||
			Object.keys(themeConfig).length !== 0
		) {
			throw new Error('主题未声明 configSchema，themeConfig 仅允许空对象 {}');
		}
		return;
	}
	if (!configValidator) throw new Error('缺少主题配置校验器');
	configValidator(themeConfig);
}

/**
 * 提取清单声明的主题配置 schema 文件名（主题根内相对路径，合法性已由
 * manifest schema 的 safeRelativePath 约束）；未声明返回 null。
 *
 * @param {Record<string, unknown>} raw 已通过 schema 校验的 theme.json
 * @returns {string | null}
 */
export function declaredConfigSchemaFile(raw) {
	const declared = raw.configSchema;
	if (!declared || typeof declared !== 'object' || Array.isArray(declared)) return null;
	const file = /** @type {Record<string, unknown>} */ (declared).file;
	return typeof file === 'string' ? file : null;
}

/**
 * 读取并快速校验主题根目录的 theme.json：契约常量、必填字段、适配器与
 * 输入协议。完整结构校验由 createContractValidator 的权威 schema 承担，
 * 两层共同构成构建入口防线。
 *
 * @param {string} themeRoot 主题根目录
 * @param {{ expectedVersion?: string }} [options]
 * @returns {{ id: string, version: string, adapter: string, inputProtocol: string, raw: Record<string, unknown> }}
 */
export function readThemeManifest(themeRoot, options = {}) {
	const manifestPath = path.join(themeRoot, 'theme.json');
	let raw;
	try {
		raw = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
	} catch {
		throw new Error(`theme.json 无法读取或不是合法 JSON：${manifestPath}`);
	}
	if (raw.contract !== MANIFEST_CONTRACT) {
		throw new Error(
			`theme.json contract 必须为 ${MANIFEST_CONTRACT}，实际为 ${String(raw.contract)}`
		);
	}
	for (const field of ['id', 'version', 'adapter', 'inputProtocol']) {
		if (typeof raw[field] !== 'string' || !raw[field].trim()) {
			throw new Error(`theme.json 缺少有效的 ${field} 字段`);
		}
	}
	if (raw.adapter !== SUPPORTED_ADAPTER) {
		throw new Error(`theme.json adapter 必须为 ${SUPPORTED_ADAPTER}，实际为 ${raw.adapter}`);
	}
	if (raw.inputProtocol !== BUILD_INPUT_CONTRACT) {
		throw new Error(
			`主题只支持输入协议 ${BUILD_INPUT_CONTRACT}，theme.json 声明为 ${raw.inputProtocol}`
		);
	}
	if (options.expectedVersion !== undefined && raw.version !== options.expectedVersion) {
		throw new Error(
			`theme.json 版本 ${raw.version} 与 version.json 版本 ${options.expectedVersion} 不一致，拒绝构建`
		);
	}
	return {
		id: raw.id,
		version: raw.version,
		adapter: raw.adapter,
		inputProtocol: raw.inputProtocol,
		raw
	};
}

/** @param {Buffer | string} data */
export function sha256Hex(data) {
	return `sha256:${createHash('sha256').update(data).digest('hex')}`;
}

/** 以稳定键序序列化 JSON 值，使等价内容不因键序产生不同摘要。 @param {unknown} value @returns {string} */
export function stableStringify(value) {
	if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
	if (value && typeof value === 'object') {
		/** @type {string[]} */
		const entries = Object.entries(value)
			.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
			.map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`);
		return `{${entries.join(',')}}`;
	}
	return JSON.stringify(value);
}

/** @param {string} domain @param {string} label @param {Buffer} content */
/**
 * @param {import('node:crypto').Hash} hash
 * @param {number} domain
 * @param {string} label
 * @param {Buffer} content
 */
function hashEntry(hash, domain, label, content) {
	const labelBytes = Buffer.from(label, 'utf8');
	const head = Buffer.alloc(5);
	head.writeUInt8(domain, 0);
	head.writeUInt32BE(labelBytes.length, 1);
	hash.update(head);
	hash.update(labelBytes);
	const length = Buffer.alloc(8);
	length.writeBigUInt64BE(BigInt(content.length));
	hash.update(length);
	hash.update(content);
}

/**
 * 计算 public 树摘要，并附加参与内容版本化的私有配置文件。
 * 条目编码与排序规则见文件头注释；标签按 UTF-8 字节序排序。
 *
 * @param {string} publicRoot 快照 public 目录
 * @param {string[]} [extraFiles] 附加文件（绝对路径），如 content-config.json
 * @returns {string}
 */
export function computeContentDigest(publicRoot, extraFiles = []) {
	const hash = createHash('sha256');
	/** @type {{ relative: string, full: string }[]} */
	const files = [];
	/** @param {string} dir @param {string} prefix */
	const walk = (dir, prefix) => {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
			const full = path.join(dir, entry.name);
			if (entry.isSymbolicLink()) throw new Error(`构建输入禁止符号链接：${full}`);
			if (entry.isDirectory()) walk(full, relative);
			else if (entry.isFile()) files.push({ relative, full });
			else throw new Error(`构建输入只允许普通文件和目录：${full}`);
		}
	};
	walk(publicRoot, '');
	files.sort((a, b) =>
		Buffer.compare(Buffer.from(a.relative, 'utf8'), Buffer.from(b.relative, 'utf8'))
	);
	for (const file of files) {
		hashEntry(hash, 1, file.relative, fs.readFileSync(file.full));
	}
	const extras = [...extraFiles]
		.map((full) => ({ label: `private/${path.basename(full)}`, full }))
		.sort((a, b) => Buffer.compare(Buffer.from(a.label, 'utf8'), Buffer.from(b.label, 'utf8')));
	for (const extra of extras) {
		hashEntry(hash, 2, extra.label, fs.readFileSync(extra.full));
	}
	return `sha256:${hash.digest('hex')}`;
}

/** @param {string} file 以文件字节计算摘要。 */
export function fileDigest(file) {
	return sha256Hex(fs.readFileSync(file));
}

/** themeConfig 缺省为空对象；摘要基于稳定序列化。 @param {unknown} themeConfig */
export function themeConfigDigest(themeConfig) {
	return sha256Hex(stableStringify(themeConfig ?? {}));
}

/**
 * 写入 private/input.json（输入协议元数据）并返回文档。
 *
 * @param {string} privateRoot 快照 private 目录
 * @param {{ mode: string, theme: { id: string, version: string }, themeConfig?: object, digests: { contentDigest: string, siteConfigDigest: string, themeConfigDigest: string }, preparedAt?: string }} input
 * @returns {Record<string, unknown>}
 */
export function writeInputMetadata(privateRoot, input) {
	const document = {
		contract: BUILD_INPUT_CONTRACT,
		preparedAt: input.preparedAt ?? new Date().toISOString(),
		mode: input.mode,
		theme: input.theme,
		...(input.themeConfig !== undefined ? { themeConfig: input.themeConfig } : {}),
		inputs: input.digests
	};
	fs.writeFileSync(path.join(privateRoot, 'input.json'), `${JSON.stringify(document, null, 2)}\n`, {
		mode: 0o600
	});
	return document;
}

/**
 * 断言 frozenRoot 与任何可重建工作目录（构建资产镜像、构建输出、常规
 * 快照目录）互不相交：任一方向包含都会让后续清理删除或改写输入。必须
 * 在任何清理/写入动作之前调用。
 *
 * @param {string} frozenRoot 已解析的冻结快照根
 * @param {string[]} workDirs 可重建工作目录列表
 */
export function assertDisjointPaths(frozenRoot, workDirs) {
	/** @param {string} parent @param {string} child */
	const contains = (parent, child) => {
		const relative = path.relative(parent, child);
		return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
	};
	for (const workDir of workDirs) {
		for (const root of [workDir, fs.existsSync(workDir) ? fs.realpathSync(workDir) : null]) {
			if (root === null) continue;
			if (contains(root, frozenRoot) || contains(frozenRoot, root)) {
				throw new Error(
					`冻结快照 ${frozenRoot} 与可重建工作目录 ${root} 相交，拒绝消费（清理会破坏输入）`
				);
			}
		}
	}
}

/**
 * 校验平台传入的已冻结快照可被当前主题消费：目录结构（private 仅允许
 * 契约定义的三个文件，全树拒绝符号链接）、协议常量、主题身份、三个
 * 摘要重算一致，且两个私有配置不含秘密字段。本函数只读快照。
 *
 * @param {string} snapshotRoot 快照根目录（含 public/ 与 private/）
 * @param {{ id: string, version: string, inputProtocol: string }} manifest 已校验的主题清单
 * @returns {{ input: Record<string, unknown>, digests: { contentDigest: string, siteConfigDigest: string, themeConfigDigest: string } }}
 */
export function verifyFrozenSnapshot(snapshotRoot, manifest) {
	const publicRoot = path.join(snapshotRoot, 'public');
	const privateRoot = path.join(snapshotRoot, 'private');
	for (const required of [publicRoot, privateRoot]) {
		if (!fs.existsSync(required)) throw new Error(`冻结快照缺少目录：${required}`);
	}
	for (const entry of fs.readdirSync(privateRoot, { withFileTypes: true })) {
		if (!PRIVATE_SNAPSHOT_FILES.includes(entry.name) || !entry.isFile()) {
			throw new Error(
				`冻结快照 private/ 仅允许 ${PRIVATE_SNAPSHOT_FILES.join('/')}，发现：${entry.name}`
			);
		}
	}
	const siteConfigFile = path.join(privateRoot, 'site-config.json');
	const contentConfigFile = path.join(privateRoot, 'content-config.json');
	const inputFile = path.join(privateRoot, 'input.json');
	for (const required of [siteConfigFile, contentConfigFile, inputFile]) {
		if (fs.lstatSync(required).isSymbolicLink()) {
			throw new Error(`冻结快照 private/ 内禁止符号链接：${required}`);
		}
	}

	/** @param {string} file @param {string} label */
	const parsePrivateJson = (file, label) => {
		try {
			return JSON.parse(fs.readFileSync(file, 'utf8'));
		} catch (error) {
			throw new Error(`冻结快照 ${label} 不是合法 JSON：${String(error)}`);
		}
	};
	const siteConfig = parsePrivateJson(siteConfigFile, 'site-config.json');
	const contentConfig = parsePrivateJson(contentConfigFile, 'content-config.json');
	for (const [label, doc] of [
		['site-config.json', siteConfig],
		['content-config.json', contentConfig]
	]) {
		const issues = /** @type {string[]} */ ([]);
		scanSecretFields(doc, label, issues);
		if (issues.length) throw new Error(`冻结快照 ${label} 含秘密字段：${issues.join('；')}`);
	}

	const input = parsePrivateJson(inputFile, 'input.json');
	if (input.contract !== BUILD_INPUT_CONTRACT) {
		throw new Error(`冻结快照协议为 ${String(input.contract)}，主题仅支持 ${BUILD_INPUT_CONTRACT}`);
	}
	if (input.theme?.id !== manifest.id || input.theme?.version !== manifest.version) {
		throw new Error(
			`冻结快照面向主题 ${String(input.theme?.id)}@${String(input.theme?.version)}，` +
				`与当前主题 ${manifest.id}@${manifest.version} 不匹配，拒绝消费`
		);
	}

	const digests = {
		contentDigest: computeContentDigest(publicRoot, [contentConfigFile]),
		siteConfigDigest: fileDigest(siteConfigFile),
		themeConfigDigest: themeConfigDigest(input.themeConfig)
	};
	for (const [key, actual] of Object.entries(digests)) {
		if (input.inputs?.[key] !== actual) {
			throw new Error(
				`冻结快照摘要不一致：${key} 期望 ${actual}，快照声明 ${String(input.inputs?.[key])}`
			);
		}
	}
	return { input, digests };
}
