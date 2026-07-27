import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import {
	parseContentConfig,
	parsePublicSiteConfig,
	type ContentConfig,
	type PublicSiteConfig
} from './schema.ts';

export interface ResolvedContentPaths {
	posts: string;
	data: string;
	albumPhotos: string;
	albumThumbnails: string;
	albumMetadata: string;
}

function readYaml(filePath: string): unknown {
	const source = fs.readFileSync(filePath, 'utf8');
	return yaml.load(source, { json: false });
}

export function loadSiteConfig(filePath: string, production = false): PublicSiteConfig {
	return parsePublicSiteConfig(readYaml(filePath), { production });
}

export function loadContentConfig(filePath: string): ContentConfig {
	return parseContentConfig(readYaml(filePath));
}

function isWithin(root: string, candidate: string): boolean {
	const relative = path.relative(root, candidate);
	return (
		relative === '' ||
		(!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
	);
}

/**
 * 解析内容路径并验证 realpath 边界，阻止软链接和相对路径逃逸持久化根目录。
 */
export function resolveContentPaths(
	config: ContentConfig,
	contentRoot: string
): ResolvedContentPaths {
	const realRoot = fs.realpathSync(contentRoot);
	const resolveOne = (relativePath: string, label: string): string => {
		if (path.isAbsolute(relativePath)) throw new Error(`${label} 必须相对于内容根目录`);
		const resolved = fs.realpathSync(path.resolve(realRoot, relativePath));
		if (!isWithin(realRoot, resolved)) throw new Error(`${label} 解析后越过允许的内容根目录`);
		return resolved;
	};

	return {
		posts: resolveOne(config.paths.posts, 'paths.posts'),
		data: resolveOne(config.paths.data, 'paths.data'),
		albumPhotos: resolveOne(config.paths.albumPhotos, 'paths.albumPhotos'),
		albumThumbnails: resolveOne(config.paths.albumThumbnails, 'paths.albumThumbnails'),
		albumMetadata: resolveOne(config.paths.albumMetadata, 'paths.albumMetadata')
	};
}
