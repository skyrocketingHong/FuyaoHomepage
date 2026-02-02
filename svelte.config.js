import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '200.html'
		}),
		prerender: {
			entries: ['*', '/blog'],
			handleUnseenRoutes: 'warn'
		}
	}
};

export default config;
