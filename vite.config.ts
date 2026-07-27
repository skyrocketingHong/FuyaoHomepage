import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import blogWatcher from './src/lib/plugins/vite-plugin-blog-watcher';
import { formatVersionDisplay, readVersionManifest } from './scripts/update-version.js';

const versionManifest = readVersionManifest();
const buildContextPath = path.resolve('.fuyao/build-context.json');

if (!fs.existsSync(buildContextPath)) {
	throw new Error('缺少 .fuyao/build-context.json，请先运行 npm run inputs:prepare');
}

const buildContext = JSON.parse(fs.readFileSync(buildContextPath, 'utf8')) as {
	publicConfigFile: string;
	albumPublicBase: string;
};
const publicConfig = JSON.parse(fs.readFileSync(buildContext.publicConfigFile, 'utf8'));

export default defineConfig({
	plugins: [blogWatcher(), tailwindcss(), sveltekit()],
	ssr: {
		noExternal: ['@icons-pack/svelte-simple-icons']
	},
	define: {
		__FUYAO_PUBLIC_CONFIG__: JSON.stringify(publicConfig),
		__FUYAO_ALBUM_PUBLIC_BASE__: JSON.stringify(buildContext.albumPublicBase),
		__APP_VERSION__: JSON.stringify(versionManifest.version),
		__BUILD_TIME__: JSON.stringify(new Date().toISOString()),
		__BUILD_NUMBER__: JSON.stringify(versionManifest.build),
		__APP_VERSION_DISPLAY__: JSON.stringify(
			formatVersionDisplay(
				versionManifest.version,
				versionManifest.buildTrain,
				versionManifest.build
			)
		)
	}
});
