import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: undefined
		}),
		prerender: {
			handleUnseenRoutes: 'warn'
		}
	}
};

export default config;
