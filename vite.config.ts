import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import blogWatcher from './src/lib/plugins/vite-plugin-blog-watcher';

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'));
const versionJson = JSON.parse(readFileSync(join(__dirname, 'version.json'), 'utf-8'));

export default defineConfig({
	plugins: [blogWatcher(), tailwindcss(), sveltekit()],
	ssr: {
		noExternal: ['@icons-pack/svelte-simple-icons']
	},
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version),
		__BUILD_TIME__: JSON.stringify(new Date().toISOString()),
		__BUILD_NUMBER__: JSON.stringify(versionJson.build)
	}
});
