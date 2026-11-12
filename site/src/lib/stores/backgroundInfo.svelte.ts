export type BackgroundInfoSource = 'mosaic' | 'bing';

export function getBackgroundInfoSource(pathname: string): BackgroundInfoSource | null {
	if (pathname.startsWith('/background/mtr')) return 'mosaic';
	if (pathname.startsWith('/background/wallpaper')) return 'bing';
	return null;
}

export function isBackgroundInfoPath(pathname: string): boolean {
	return getBackgroundInfoSource(pathname) !== null;
}

export class BackgroundInfoState {
	isOpen = $state(false);
	source = $state<BackgroundInfoSource>('mosaic');
	returnUrl = $state('/');
	wallpaperUrl = $state('');

	open(source: BackgroundInfoSource) {
		this.source = source;
		this.isOpen = true;
	}

	close() {
		this.isOpen = false;
	}

	setWallpaperUrl(url: string) {
		this.wallpaperUrl = url;
	}
}

export const backgroundInfoState = new BackgroundInfoState();
