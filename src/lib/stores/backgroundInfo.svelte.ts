export type BackgroundInfoSource = 'mosaic' | 'bing';

export class BackgroundInfoState {
	isOpen = $state(false);
	source = $state<BackgroundInfoSource>('mosaic');

	open(source: BackgroundInfoSource) {
		this.source = source;
		this.isOpen = true;
	}

	close() {
		this.isOpen = false;
	}
}

export const backgroundInfoState = new BackgroundInfoState();
