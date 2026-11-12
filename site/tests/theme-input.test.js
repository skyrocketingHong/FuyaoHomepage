import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
	BUILD_INPUT_CONTRACT,
	assertDisjointPaths,
	assertThemeConfigAllowed,
	computeContentDigest,
	compileThemeConfigSchema,
	createContractValidator,
	declaredConfigSchemaFile,
	fileDigest,
	readThemeManifest,
	stableStringify,
	themeConfigDigest,
	verifyFrozenSnapshot
} from '../scripts/lib/theme-input.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// npm test 的前置命令（inputs:prepare）保证该快照存在；本文件只读，不重跑 prepare，
// 避免与并行测试读取 build-context/build-assets 产生竞态。
const snapshotRoot = path.join(projectRoot, '.fuyao', 'build-inputs', 'current');

/** 构造一个最小可冻结快照副本，供正负例篡改。 @param {string} destination */
function cloneSnapshot(destination) {
	fs.cpSync(snapshotRoot, destination, {
		recursive: true,
		dereference: false,
		filter: (entry) => !fs.lstatSync(entry).isSymbolicLink()
	});
	// 递归解除冻结权限，便于测试篡改。
	/** @param {string} dir */
	const unlock = (dir) => {
		fs.chmodSync(dir, 0o755);
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const child = path.join(dir, entry.name);
			if (entry.isDirectory()) unlock(child);
			else fs.chmodSync(child, 0o644);
		}
	};
	unlock(destination);
	fs.rmSync(path.join(destination, 'private'), { recursive: true, force: true });
	fs.mkdirSync(path.join(destination, 'private'), { recursive: true });
	return destination;
}

/** @param {string} root @param {string} name @param {string | Buffer} content */
function writePrivateFile(root, name, content) {
	fs.writeFileSync(path.join(root, 'private', name), content, { mode: 0o600 });
}

test('theme.json 与 version.json 的身份绑定影响构建入口', () => {
	const manifest = readThemeManifest(projectRoot);
	assert.equal(manifest.id, 'fuyao-homepage');
	assert.equal(manifest.inputProtocol, BUILD_INPUT_CONTRACT);

	assert.throws(
		() => readThemeManifest(projectRoot, { expectedVersion: '0.0.0' }),
		/version\.json/
	);
});

test('真实 ci 快照通过冻结校验且三个摘要可复算', () => {
	const manifest = readThemeManifest(projectRoot);
	const { digests } = verifyFrozenSnapshot(snapshotRoot, manifest);
	const input = JSON.parse(
		fs.readFileSync(path.join(snapshotRoot, 'private', 'input.json'), 'utf8')
	);

	assert.equal(input.contract, BUILD_INPUT_CONTRACT);
	assert.equal(input.theme.id, 'fuyao-homepage');
	assert.equal(input.theme.version, manifest.version);
	assert.deepEqual(input.themeConfig, {});
	assert.deepEqual(digests, {
		contentDigest: computeContentDigest(path.join(snapshotRoot, 'public'), [
			path.join(snapshotRoot, 'private', 'content-config.json')
		]),
		siteConfigDigest: fileDigest(path.join(snapshotRoot, 'private', 'site-config.json')),
		themeConfigDigest: themeConfigDigest(input.themeConfig)
	});
	// 输入协议要求 site-config.json 取代旧 public-config.json。
	assert.ok(!fs.existsSync(path.join(snapshotRoot, 'private', 'public-config.json')));
});

test('摘要对内容、内容映射与站点配置的变化敏感', () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fuyao-theme-input-'));
	try {
		fs.mkdirSync(path.join(root, 'public', 'posts'), { recursive: true });
		fs.writeFileSync(path.join(root, 'public', 'posts', 'a.md'), 'hello\n');
		const mapping = path.join(root, 'content-config.json');
		fs.writeFileSync(mapping, '{"paths":{"posts":"posts"}}\n');

		const base = computeContentDigest(path.join(root, 'public'), [mapping]);
		assert.equal(base, computeContentDigest(path.join(root, 'public'), [mapping]));

		fs.writeFileSync(path.join(root, 'public', 'posts', 'a.md'), 'changed\n');
		assert.notEqual(base, computeContentDigest(path.join(root, 'public'), [mapping]));

		fs.writeFileSync(mapping, '{"paths":{"posts":"posts","data":"data"}}\n');
		const afterMapping = computeContentDigest(path.join(root, 'public'), [mapping]);
		assert.notEqual(base, afterMapping);

		// 相同内容在等价键序下摘要稳定。
		assert.equal(themeConfigDigest({ b: 1, a: 2 }), themeConfigDigest({ a: 2, b: 1 }));
		assert.equal(stableStringify({ b: [1, { y: 2, x: 1 }] }), '{"b":[1,{"x":1,"y":2}]}');
	} finally {
		fs.rmSync(root, { recursive: true, force: true });
	}
});

test('冻结校验拒绝结构缺失、身份冲突与摘要不一致的快照', (t) => {
	const manifest = readThemeManifest(projectRoot);
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fuyao-frozen-verify-'));
	t.after(() => fs.rmSync(root, { recursive: true, force: true }));

	// 以真实快照为基准构造完整私有元数据，保证正例成立后再逐项破坏。
	const reference = JSON.parse(
		fs.readFileSync(path.join(snapshotRoot, 'private', 'input.json'), 'utf8')
	);
	cloneSnapshot(root);
	writePrivateFile(
		root,
		'site-config.json',
		fs.readFileSync(path.join(snapshotRoot, 'private', 'site-config.json'))
	);
	writePrivateFile(
		root,
		'content-config.json',
		fs.readFileSync(path.join(snapshotRoot, 'private', 'content-config.json'))
	);
	writePrivateFile(root, 'input.json', `${JSON.stringify(reference, null, 2)}\n`);
	assert.doesNotThrow(() => verifyFrozenSnapshot(root, manifest));

	// 1. 缺少 private/site-config.json。
	fs.rmSync(path.join(root, 'private', 'site-config.json'));
	assert.throws(() => verifyFrozenSnapshot(root, manifest), /site-config\.json/);
	writePrivateFile(
		root,
		'site-config.json',
		fs.readFileSync(path.join(snapshotRoot, 'private', 'site-config.json'))
	);

	// 2. 主题身份冲突（input.json 面向另一版本）。
	const foreignTheme = structuredClone(reference);
	foreignTheme.theme.version = '0.0.1';
	writePrivateFile(root, 'input.json', `${JSON.stringify(foreignTheme, null, 2)}\n`);
	assert.throws(() => verifyFrozenSnapshot(root, manifest), /不匹配/);
	writePrivateFile(root, 'input.json', `${JSON.stringify(reference, null, 2)}\n`);

	// 3. 协议常量冲突。
	const foreignContract = structuredClone(reference);
	foreignContract.contract = 'fuyao.theme.build-input/v2';
	writePrivateFile(root, 'input.json', `${JSON.stringify(foreignContract, null, 2)}\n`);
	assert.throws(() => verifyFrozenSnapshot(root, manifest), /协议/);
	writePrivateFile(root, 'input.json', `${JSON.stringify(reference, null, 2)}\n`);

	// 4. 公开内容被篡改但摘要未更新。
	fs.appendFileSync(path.join(root, 'public', 'posts', 'all.json'), '\n');
	assert.throws(() => verifyFrozenSnapshot(root, manifest), /contentDigest/);

	// 5. private/ 出现契约未定义的文件。
	writePrivateFile(root, 'notes.txt', 'x');
	assert.throws(() => verifyFrozenSnapshot(root, manifest), /private\/ 仅允许/);
	fs.rmSync(path.join(root, 'private', 'notes.txt'));

	// 6. private/ 配置是指向快照根外的符号链接。
	const outsideConfig = path.join(path.dirname(root), 'outside-site-config.json');
	fs.writeFileSync(
		outsideConfig,
		fs.readFileSync(path.join(snapshotRoot, 'private', 'site-config.json'))
	);
	fs.rmSync(path.join(root, 'private', 'site-config.json'));
	fs.symlinkSync(outsideConfig, path.join(root, 'private', 'site-config.json'));
	// 符号链接条目既不是普通文件也可能先命中 private/ 白名单检查。
	assert.throws(() => verifyFrozenSnapshot(root, manifest), /符号链接|仅允许/);
	fs.rmSync(path.join(root, 'private', 'site-config.json'));
	writePrivateFile(
		root,
		'site-config.json',
		fs.readFileSync(path.join(snapshotRoot, 'private', 'site-config.json'))
	);
	fs.rmSync(outsideConfig, { force: true });
	writePrivateFile(root, 'input.json', `${JSON.stringify(reference, null, 2)}\n`);
});

test('摘要编码消除旧拼接算法的构造性碰撞', () => {
	// 旧算法按 “路径+NUL+内容+NUL” 拼接：树A 单文件 a 内容 X\0b\0Y 与
	// 树B 文件 a=X、b=Y 送入 SHA 的字节完全相同。长度前缀编码后两树必须
	// 得到不同摘要。
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fuyao-digest-collision-'));
	try {
		const treeA = path.join(root, 'a');
		const treeB = path.join(root, 'b');
		fs.mkdirSync(treeA);
		fs.mkdirSync(treeB);
		fs.writeFileSync(path.join(treeA, 'a'), Buffer.from('X\0b\0Y'));
		fs.writeFileSync(path.join(treeB, 'a'), 'X');
		fs.writeFileSync(path.join(treeB, 'b'), 'Y');
		assert.notEqual(computeContentDigest(treeA), computeContentDigest(treeB));
	} finally {
		fs.rmSync(root, { recursive: true, force: true });
	}
});

test('冻结输入与可重建工作目录相交时先拒绝再清理', () => {
	const work = fs.mkdtempSync(path.join(os.tmpdir(), 'fuyao-disjoint-'));
	try {
		const frozen = path.join(work, 'frozen-snapshot');
		const buildAssets = path.join(work, 'build-assets');
		fs.mkdirSync(frozen);
		fs.mkdirSync(path.join(buildAssets, 'nested'), { recursive: true });
		// 冻结输入位于工作目录内（会被清理删除）。
		assert.throws(
			() => assertDisjointPaths(path.join(buildAssets, 'nested', 'snap'), [buildAssets]),
			/相交/
		);
		// 工作目录位于冻结输入内（清理会破坏快照）。
		assert.throws(() => assertDisjointPaths(frozen, [path.join(frozen, 'build')]), /相交/);
		// 相同路径。
		assert.throws(() => assertDisjointPaths(buildAssets, [buildAssets]), /相交/);
		// 完全独立的合法快照目录。
		assert.doesNotThrow(() => assertDisjointPaths(frozen, [buildAssets]));
	} finally {
		fs.rmSync(work, { recursive: true, force: true });
	}
});

test('权威契约 schema 与主题配置约束真实生效', () => {
	const validator = createContractValidator();
	const manifest = readThemeManifest(projectRoot);
	assert.doesNotThrow(() => validator.assertManifest(manifest.raw));

	const broken = structuredClone(manifest.raw);
	broken.capabilities = [];
	assert.throws(() => validator.assertManifest(broken), /schema 校验/);

	const frozen = verifyFrozenSnapshot(snapshotRoot, manifest);
	assert.doesNotThrow(() => validator.assertInput(frozen.input));
	const brokenInput = structuredClone(frozen.input);
	brokenInput.mode = 'staging';
	assert.throws(() => validator.assertInput(brokenInput), /schema 校验/);

	// 主题配置 schema 编译与约束：首主题声明空对象 schema；携带任意
	// themeConfig 即使重算对应摘要也会被主题配置约束拒绝。
	assert.equal(declaredConfigSchemaFile(manifest.raw), 'theme.config.schema.json');
	const configValidator = compileThemeConfigSchema(
		JSON.parse(fs.readFileSync(path.join(projectRoot, 'theme.config.schema.json'), 'utf8'))
	);
	assert.doesNotThrow(() => assertThemeConfigAllowed(manifest, {}, configValidator));
	assert.throws(
		() => assertThemeConfigAllowed(manifest, { accentColor: '#006F6B' }, configValidator),
		/schema 校验/
	);
	assert.throws(
		() => compileThemeConfigSchema({ $schema: 'http://json-schema.org/draft-07/schema#' }),
		/2020-12/
	);
});

test('冻结快照私有配置含秘密字段时拒绝', () => {
	const manifest = readThemeManifest(projectRoot);
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fuyao-secret-scan-'));
	try {
		fs.cpSync(path.join(snapshotRoot, 'public'), path.join(root, 'public'), { recursive: true });
		fs.mkdirSync(path.join(root, 'private'));
		const leaky = JSON.parse(
			fs.readFileSync(path.join(snapshotRoot, 'private', 'site-config.json'), 'utf8')
		);
		leaky.services.amap.clientSecret = 'super-secret-value';
		for (const name of ['content-config.json', 'input.json']) {
			fs.copyFileSync(path.join(snapshotRoot, 'private', name), path.join(root, 'private', name));
		}
		fs.writeFileSync(
			path.join(root, 'private', 'site-config.json'),
			`${JSON.stringify(leaky, null, 2)}\n`
		);
		assert.throws(() => verifyFrozenSnapshot(root, manifest), /秘密字段/);
	} finally {
		fs.rmSync(root, { recursive: true, force: true });
	}
});
