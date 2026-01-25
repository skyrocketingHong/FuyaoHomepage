import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'));

export default defineConfig({
    plugins: [tailwindcss(), sveltekit()],
    ssr: {
        noExternal: ['@icons-pack/svelte-simple-icons']
    },
    define: {
        __APP_VERSION__: JSON.stringify(pkg.version)
    }
});
