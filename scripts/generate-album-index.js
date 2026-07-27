/**
 * 相册索引生成脚本
 *
 * 扫描外部内容目录中的图片文件，读取 EXIF 信息，生成版本化索引文件。
 * 默认仅刷新索引和缩略图；导入命令会将新照片重命名并移动到 yyyy/mm/dd 目录结构下。
 *
 * 使用方式：
 * npm run gen-album              # 仅生成索引和缩略图，不重命名
 * npm run gen-album:import       # 导入根目录新照片并重命名
 * npm run gen-album:public       # 生成公开索引，移除 GPS 信息
 *
 * 环境变量：
 * - FUYAO_ALBUM_COORD_TYPE: 坐标系类型，可选值：wgs84（默认）、gcj02
 * - FUYAO_ALBUM_PHOTOS_DIR: 原图目录
 * - FUYAO_ALBUM_THUMBNAILS_DIR: 缩略图目录
 * - FUYAO_ALBUM_METADATA_DIR: 索引输出目录
 *
 * 处理后的目录结构：
 * fixtures/content/albums/photos/
 * ├── 2023/07/24/d4f8e2a1.jpeg
 * ├── 2024/12/16/a3b2c1d4.jpg
 * ├── 2026/05/02/e5f6g7h8.jpeg
 * └── ...
 */
import fs from 'fs';
import path from 'path';
import exifr from 'exifr';
import sharp from 'sharp';

// ─── 常量 ───────────────────────────────────────────────────────────────────────

const DEFAULT_ALBUMS_ROOT = path.join(process.cwd(), 'fixtures/content/albums');
const ALBUMS_DIR =
	process.env.FUYAO_ALBUM_METADATA_DIR || path.join(DEFAULT_ALBUMS_ROOT, 'metadata');
const PHOTOS_DIR = process.env.FUYAO_ALBUM_PHOTOS_DIR || path.join(DEFAULT_ALBUMS_ROOT, 'photos');
const THUMBNAILS_DIR =
	process.env.FUYAO_ALBUM_THUMBNAILS_DIR || path.join(DEFAULT_ALBUMS_ROOT, 'thumbnails');
const OUTPUT_INDEX = path.join(ALBUMS_DIR, 'index.json');

const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.heic', '.webp', '.tiff', '.tif'];
const THUMBNAIL_WIDTHS = [480, 960, 1600];
const THUMBNAIL_QUALITY = 82;

/** 相机型号名称映射（内部型号 → 可读名称） */
const MODEL_NAME_MAP = {
	'2304FPN6DC': 'Xiaomi 13 Ultra',
	'24031PN0DC': 'Xiaomi 14 Ultra',
	'25010PN0DC': 'Xiaomi 15 Ultra',
	'25010PN3DC': 'Xiaomi 17 Ultra'
};

/** 是否跳过重命名 */
const SKIP_RENAME = process.argv.includes('--no-rename');

/** 是否从公开索引中移除精确位置数据 */
const STRIP_GPS = process.argv.includes('--strip-gps');

/** 仅重建元数据，不生成或修改持久化缩略图 */
const METADATA_ONLY = process.argv.includes('--metadata-only');

/** 元数据模式下发现缺少缩略图变体时阻止生产发布 */
const REQUIRE_EXISTING_THUMBNAILS = process.env.FUYAO_REQUIRE_EXISTING_THUMBNAILS === '1';

/** 坐标系类型 */
const COORD_TYPE = process.env.FUYAO_ALBUM_COORD_TYPE || 'wgs84';

// ─── 工具函数 ────────────────────────────────────────────────────────────────────

function getReadableModelName(model) {
	if (!model) return null;
	return MODEL_NAME_MAP[model] || model;
}

/**
 * 递归获取目录下的所有图片文件
 * @param {string} dir
 * @param {string} rootDir
 * @param {boolean} recursive - 是否递归子目录
 * @returns {Array<{filePath: string, relativePath: string}>}
 */
function getImageFiles(dir, rootDir = PHOTOS_DIR, recursive = true) {
	const files = [];
	if (!fs.existsSync(dir)) return files;

	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (recursive) {
				files.push(...getImageFiles(fullPath, rootDir, true));
			}
		} else if (entry.isFile()) {
			const ext = path.extname(entry.name).toLowerCase();
			if (SUPPORTED_EXTENSIONS.includes(ext)) {
				files.push({
					filePath: fullPath,
					relativePath: path.relative(rootDir, fullPath)
				});
			}
		}
	}
	return files;
}

async function readExifData(filePath) {
	try {
		const exif =
			(await exifr.parse(filePath, {
				gps: true,
				exif: true,
				ifd1: true,
				icc: true,
				translateKeys: true,
				translateValues: false,
				reviveValues: true
			})) ?? {};

		let actualWidth = null;
		let actualHeight = null;
		try {
			const meta = await sharp(filePath).metadata();
			actualWidth = meta.width || null;
			actualHeight = meta.height || null;
		} catch {
			// 图片尺寸是可选元数据，EXIF 尺寸仍可作为回退。
		}

		return {
			date: exif.DateTimeOriginal || exif.CreateDate || exif.DateTime || null,
			gps:
				exif.latitude && exif.longitude
					? { latitude: exif.latitude, longitude: exif.longitude }
					: null,
			altitude: exif.GPSAltitude ?? null,
			gpsDirection: exif.GPSImgDirection ?? null,
			make: exif.Make ?? null,
			model: exif.Model ?? null,
			lensModel: exif.LensModel ?? null,
			width: actualWidth || exif.ExifImageWidth || exif.ImageWidth || null,
			height: actualHeight || exif.ExifImageHeight || exif.ImageHeight || null,
			focalLength: exif.FocalLength ?? null,
			focalLengthIn35mm: exif.FocalLengthIn35mmFilm ?? null,
			aperture: exif.FNumber || exif.ApertureValue || null,
			iso: exif.ISO ?? null,
			exposureTime: exif.ExposureTime ?? null,
			exposureCompensation: exif.ExposureCompensation ?? null,
			exposureProgram: exif.ExposureProgram ?? null,
			meteringMode: exif.MeteringMode ?? null,
			whiteBalance: exif.WhiteBalance ?? null,
			flash: exif.Flash ?? null,
			colorSpace: exif.ColorSpaceData || exif.ColorSpace || null,
			colorProfile: exif.ProfileDescription || null,
			ImageDescription: exif.ImageDescription ?? null,
			UserComment: exif.UserComment ?? null
		};
	} catch (err) {
		console.warn(`  [警告] 无法读取 EXIF: ${path.basename(filePath)} (${err.message})`);
		return null;
	}
}

/**
 * 为网格生成响应式 WebP 缩略图。
 * 原图始终保留，仅在灯箱中加载。
 */
async function generateThumbnailVariants(filePath, relativePath, width, height) {
	if (!width || !height) return [];

	const relativeDir = path.dirname(relativePath);
	const basename = path.basename(relativePath, path.extname(relativePath));
	const targetWidths = [...new Set(THUMBNAIL_WIDTHS.filter((value) => value <= width))];
	if (targetWidths.length === 0) targetWidths.push(Math.min(width, THUMBNAIL_WIDTHS[0]));

	const outputDir = path.join(THUMBNAILS_DIR, relativeDir);
	fs.mkdirSync(outputDir, { recursive: true });

	const variants = [];
	for (const targetWidth of targetWidths) {
		const filename = `${basename}-${targetWidth}.webp`;
		const outputPath = path.join(outputDir, filename);
		if (
			!fs.existsSync(outputPath) ||
			fs.statSync(outputPath).mtimeMs < fs.statSync(filePath).mtimeMs
		) {
			await sharp(filePath)
				.rotate()
				.resize({ width: targetWidth, withoutEnlargement: true })
				.webp({ quality: THUMBNAIL_QUALITY })
				.toFile(outputPath);
		}

		variants.push({
			path: path.relative(THUMBNAILS_DIR, outputPath).split(path.sep).join('/'),
			width: targetWidth,
			height: Math.round((height / width) * targetWidth),
			type: 'image/webp'
		});
	}

	return variants;
}

function extractDateFromPath(relativePath) {
	const datePatterns = [/(\d{4})-(\d{2})-(\d{2})/, /(\d{4})(\d{2})(\d{2})/];
	for (const pattern of datePatterns) {
		const match = relativePath.match(pattern);
		if (match) {
			const [, year, month, day] = match;
			const date = new Date(`${year}-${month}-${day}`);
			if (!isNaN(date.getTime())) {
				return `${year}-${month}-${day}`;
			}
		}
	}
	return null;
}

/**
 * 获取照片的拍摄日期
 * 优先级：EXIF > 文件路径 > 文件修改时间
 */
function getPhotoDate(exifData, relativePath, filePath) {
	if (exifData?.date) {
		return new Date(exifData.date);
	}
	const pathDate = extractDateFromPath(relativePath);
	if (pathDate) {
		return new Date(pathDate);
	}
	return fs.statSync(filePath).mtime;
}

// ─── 重命名 + 移动逻辑 ──────────────────────────────────────────────────────────

/**
 * 从已有年份 JSON 文件中加载已知的 nanoid 集合
 * @returns {Set<string>}
 */
function loadKnownNanoids() {
	const known = new Set();
	if (!fs.existsSync(ALBUMS_DIR)) return known;

	const files = fs.readdirSync(ALBUMS_DIR);
	for (const file of files) {
		if (!/^\d{4}\.json$/.test(file)) continue;
		try {
			const data = JSON.parse(fs.readFileSync(path.join(ALBUMS_DIR, file), 'utf-8'));
			if (data.photos) {
				for (const photo of data.photos) {
					if (photo.filename) known.add(photo.filename);
				}
			}
		} catch {
			// 忽略损坏的旧索引，后续全量扫描会重建索引。
		}
	}
	return known;
}

/** 从旧的按年元数据中读取原图路径对应的缩略图变体。 */
function loadKnownVariants() {
	const known = new Map();
	if (!fs.existsSync(ALBUMS_DIR)) return known;
	for (const file of fs.readdirSync(ALBUMS_DIR)) {
		if (!/^\d{4}\.json$/.test(file)) continue;
		try {
			const data = JSON.parse(fs.readFileSync(path.join(ALBUMS_DIR, file), 'utf8'));
			for (const photo of data.photos ?? []) {
				if (typeof photo.path === 'string' && Array.isArray(photo.variants)) {
					known.set(photo.path, photo.variants);
				}
			}
		} catch {
			// 损坏的旧索引将在本次构建中被替换；生产校验会阻止缺少变体的照片发布。
		}
	}
	return known;
}

function validateExistingVariants(variants, relativePath) {
	const thumbnailRoot = fs.realpathSync(THUMBNAILS_DIR);
	for (const variant of variants) {
		if (!variant || typeof variant.path !== 'string' || path.isAbsolute(variant.path)) {
			throw new Error(`缩略图变体路径无效：${relativePath}`);
		}
		const candidate = path.resolve(thumbnailRoot, variant.path);
		if (!fs.existsSync(candidate)) {
			if (REQUIRE_EXISTING_THUMBNAILS) throw new Error(`缩略图文件不存在：${variant.path}`);
			continue;
		}
		const realCandidate = fs.realpathSync(candidate);
		const boundary = path.relative(thumbnailRoot, realCandidate);
		if (boundary === '..' || boundary.startsWith(`..${path.sep}`) || path.isAbsolute(boundary)) {
			throw new Error(`缩略图路径越过允许目录：${variant.path}`);
		}
	}
}

/**
 * 执行照片重命名 + 移动：
 * 1. 生成 nanoid 文件名
 * 2. 移动到 photos/yyyy/mm/dd/ 目录
 * @param {Array<{filePath: string, relativePath: string}>} imageFiles
 * @param {Set<string>} knownNanoids - 已知的 nanoid 集合（跳过）
 * @returns {Promise<Map<string, string>>} oldRelativePath → newRelativePath
 */
async function renameAndMovePhotos(imageFiles, knownNanoids) {
	const { nanoid } = await import('nanoid');

	/** @type {Map<string, string>} */
	const pathMap = new Map();
	let renamed = 0;
	let skipped = 0;

	for (const { filePath, relativePath } of imageFiles) {
		const ext = path.extname(filePath).toLowerCase();
		const nameWithoutExt = path.basename(filePath, ext);

		// 已知 nanoid → 已处理过，跳过
		if (knownNanoids.has(nameWithoutExt)) {
			skipped++;
			continue;
		}

		// 读取 EXIF 日期确定目标目录
		const exifData = await readExifData(filePath);
		const date = getPhotoDate(exifData, relativePath, filePath);
		const year = date.getUTCFullYear();
		const month = String(date.getUTCMonth() + 1).padStart(2, '0');
		const day = String(date.getUTCDate()).padStart(2, '0');

		// 生成 nanoid，确保不与已有 ID 冲突
		let id;
		do {
			id = nanoid(8);
		} while (knownNanoids.has(id));
		knownNanoids.add(id);

		// 创建目标目录并移动文件
		const targetDir = path.join(PHOTOS_DIR, String(year), month, day);
		fs.mkdirSync(targetDir, { recursive: true });

		const newFilename = `${id}${ext}`;
		const newPath = path.join(targetDir, newFilename);

		if (fs.existsSync(newPath) && newPath !== filePath) {
			console.warn(`  [警告] 目标文件已存在，跳过: ${newFilename}`);
			skipped++;
			continue;
		}

		fs.renameSync(filePath, newPath);

		const newRelativePath = path.relative(PHOTOS_DIR, newPath);
		pathMap.set(relativePath, newRelativePath);
		console.log(`  - ${path.basename(filePath)} -> ${newRelativePath}`);
		renamed++;
	}

	console.log(`\n处理完成: ${renamed} 张已重命名并移动, ${skipped} 张已是 nanoid 格式`);
	return pathMap;
}

/**
 * 清理空的旧目录（移动文件后遗留的空目录）
 */
function cleanupEmptyDirs(dir) {
	if (!fs.existsSync(dir)) return;
	const entries = fs.readdirSync(dir);
	if (entries.length === 0) {
		// 不删除 photos 根目录
		if (dir !== PHOTOS_DIR) {
			fs.rmdirSync(dir);
			cleanupEmptyDirs(path.dirname(dir));
		}
	}
}

// ─── 主流程 ──────────────────────────────────────────────────────────────────────

async function main() {
	console.log('=== 相册索引生成工具 ===\n');
	fs.mkdirSync(ALBUMS_DIR, { recursive: true });
	fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });

	if (!fs.existsSync(PHOTOS_DIR)) {
		console.warn(`照片目录不存在: ${PHOTOS_DIR}`);
		console.log('正在创建目录...');
		fs.mkdirSync(PHOTOS_DIR, { recursive: true });
		console.log(
			`目录已创建，请将照片放入 ${path.relative(process.cwd(), PHOTOS_DIR)}/ 目录后重新运行。`
		);
		process.exit(0);
	}

	// 扫描根目录下的新照片（不递归子目录，子目录里的已经处理过了）
	console.log('正在扫描根目录下的新照片...');
	const newFiles = getImageFiles(PHOTOS_DIR, PHOTOS_DIR, false);

	// 全量扫描（递归，用于最终索引生成）
	const allFiles = getImageFiles(PHOTOS_DIR, PHOTOS_DIR, true);

	if (newFiles.length === 0 && allFiles.length === 0) {
		console.log('未找到任何图片文件。');
		console.log(`请将照片放入 ${path.relative(process.cwd(), PHOTOS_DIR)}/ 目录。`);
		fs.writeFileSync(
			OUTPUT_INDEX,
			JSON.stringify(
				{
					schemaVersion: 1,
					generatedAt: new Date().toISOString(),
					totalPhotos: 0,
					years: [],
					devices: []
				},
				null,
				2
			)
		);
		console.log('\n已生成空索引文件。');
		process.exit(0);
	}

	// 重命名 + 移动根目录下的新照片
	const knownNanoids = loadKnownNanoids();

	if (!SKIP_RENAME && newFiles.length > 0) {
		console.log(`发现 ${newFiles.length} 张新照片，正在重命名并移动到 yyyy/mm/dd 目录...\n`);
		await renameAndMovePhotos(newFiles, knownNanoids);
		console.log('');
		cleanupEmptyDirs(PHOTOS_DIR);
	} else if (newFiles.length > 0) {
		console.log(`发现 ${newFiles.length} 张新照片，跳过重命名（--no-rename）\n`);
	} else {
		console.log('没有新照片需要处理\n');
	}

	// 重新全量扫描（包含刚移动的文件）
	const imageFiles = getImageFiles(PHOTOS_DIR, PHOTOS_DIR, true);
	const knownVariants = METADATA_ONLY ? loadKnownVariants() : new Map();
	console.log(`正在读取 ${imageFiles.length} 张照片的 EXIF 信息...`);
	const photos = [];
	let processed = 0;

	for (const { filePath, relativePath } of imageFiles) {
		processed++;
		const filename = path.basename(filePath);
		process.stdout.write(`\r处理中: ${processed}/${imageFiles.length} - ${filename}`);

		const exifData = await readExifData(filePath);
		const ext = path.extname(filePath).toLowerCase();
		const nameWithoutExt = path.basename(filePath, ext);

		const photo = {
			filename: nameWithoutExt,
			path: relativePath
		};

		// 日期
		const date = getPhotoDate(exifData, relativePath, filePath);
		photo.date = date.toISOString();

		// GPS
		if (exifData?.gps && !STRIP_GPS) {
			photo.gps = exifData.gps;
			photo.coordType = COORD_TYPE;
		}
		if (!STRIP_GPS && exifData?.altitude != null) {
			photo.altitude = Math.round(exifData.altitude * 100) / 100;
		}
		if (!STRIP_GPS && exifData?.gpsDirection != null) {
			photo.gpsDirection = Math.round(exifData.gpsDirection * 100) / 100;
		}

		// 相机信息
		if (exifData?.make) photo.make = exifData.make;
		if (exifData?.model) photo.model = getReadableModelName(exifData.model);
		if (exifData?.lensModel) photo.lensModel = exifData.lensModel;

		// 图片尺寸
		if (exifData?.width) photo.width = exifData.width;
		if (exifData?.height) photo.height = exifData.height;
		if (METADATA_ONLY) {
			photo.variants = knownVariants.get(relativePath) ?? [];
			validateExistingVariants(photo.variants, relativePath);
			if (REQUIRE_EXISTING_THUMBNAILS && photo.variants.length === 0) {
				throw new Error(`照片缺少已发布的缩略图变体：${relativePath}`);
			}
		} else {
			photo.variants = await generateThumbnailVariants(
				filePath,
				relativePath,
				photo.width,
				photo.height
			);
		}

		// 拍摄参数
		if (exifData?.focalLength) photo.focalLength = exifData.focalLength;
		if (exifData?.focalLengthIn35mm) photo.focalLengthIn35mm = exifData.focalLengthIn35mm;
		if (exifData?.aperture) photo.aperture = exifData.aperture;
		if (exifData?.iso) photo.iso = exifData.iso;
		if (exifData?.exposureTime) photo.exposureTime = exifData.exposureTime;
		if (exifData?.exposureCompensation != null)
			photo.exposureCompensation = exifData.exposureCompensation;
		if (exifData?.exposureProgram) photo.exposureProgram = exifData.exposureProgram;
		if (exifData?.meteringMode) photo.meteringMode = exifData.meteringMode;
		if (exifData?.whiteBalance) photo.whiteBalance = exifData.whiteBalance;
		if (exifData?.flash != null) photo.flash = exifData.flash;
		if (exifData?.colorSpace) photo.colorSpace = exifData.colorSpace;
		if (exifData?.colorProfile) photo.colorProfile = exifData.colorProfile;

		// 描述
		if (exifData?.ImageDescription) {
			photo.description = exifData.ImageDescription;
		} else if (exifData?.UserComment) {
			photo.description = exifData.UserComment;
		}

		photos.push(photo);
	}

	console.log('\n');

	photos.sort((a, b) => new Date(b.date) - new Date(a.date));

	// 按年份分组
	const yearMap = new Map();
	for (const photo of photos) {
		const year = new Date(photo.date).getUTCFullYear();
		if (!yearMap.has(year)) yearMap.set(year, []);
		yearMap.get(year).push(photo);
	}

	const years = [...yearMap.keys()].sort((a, b) => b - a);

	// 设备列表
	const deviceMap = new Map();
	for (const photo of photos) {
		if (photo.make) {
			if (!deviceMap.has(photo.make)) deviceMap.set(photo.make, new Set());
			if (photo.model) deviceMap.get(photo.make).add(photo.model);
		}
	}
	const devices = [...deviceMap.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([make, models]) => ({ make, models: [...models].sort() }));

	// 写入各年份文件
	for (const year of years) {
		const yearFile = path.join(ALBUMS_DIR, `${year}.json`);
		fs.writeFileSync(
			yearFile,
			JSON.stringify({ schemaVersion: 1, year, photos: yearMap.get(year) }, null, 2)
		);
	}
	for (const file of fs.readdirSync(ALBUMS_DIR)) {
		if (/^\d{4}\.json$/.test(file) && !years.includes(Number.parseInt(file, 10))) {
			fs.unlinkSync(path.join(ALBUMS_DIR, file));
		}
	}

	// 写入轻量索引
	const index = {
		schemaVersion: 1,
		generatedAt: new Date().toISOString(),
		totalPhotos: photos.length,
		years,
		devices
	};
	fs.writeFileSync(OUTPUT_INDEX, JSON.stringify(index, null, 2));

	console.log(`成功生成索引:`);
	console.log(`  - 照片数量: ${photos.length}`);
	console.log(`  - 年份: ${years.join(', ')}`);
	console.log(`  - 输出文件: ${years.map((y) => `${y}.json`).join(', ')}, index.json`);

	const stats = {
		gps: photos.filter((p) => p.gps).length,
		desc: photos.filter((p) => p.description).length,
		lens: photos.filter((p) => p.lensModel).length,
		program: photos.filter((p) => p.exposureProgram).length
	};
	console.log(`\n统计:`);
	console.log(`  - GPS 信息: ${stats.gps} 张`);
	console.log(`  - 描述信息: ${stats.desc} 张`);
	console.log(`  - 镜头信息: ${stats.lens} 张`);
	console.log(`  - 曝光程序: ${stats.program} 张`);
}

main().catch((err) => {
	console.error('\n生成索引时出错:', err);
	process.exit(1);
});
