// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { PublicSiteConfig } from '$lib/config/schema';
import type { BlogPageKind } from '$lib/config/index';

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		interface PageData {
			blogPageKind?: BlogPageKind;
		}
		interface PageState {
			albumLightbox?: boolean;
			photoId?: string;
		}
		// interface Platform {}
	}
	declare const __APP_VERSION__: string;
	declare const __BUILD_TIME__: string;
	declare const __BUILD_NUMBER__: number;
	declare const __APP_VERSION_DISPLAY__: string;
	declare const __FUYAO_PUBLIC_CONFIG__: PublicSiteConfig;
	declare const __FUYAO_ALBUM_PUBLIC_BASE__: string;
}

export {};
