<script lang="ts">
	import {
		SiGithub,
		SiTelegram,
		SiQq,
		SiX
	} from '@icons-pack/svelte-simple-icons';
	import { Mail, Share2 } from 'lucide-svelte';
	import LiquidGlass from '$lib/components/ui/LiquidGlass.svelte';
	import Crossfade from '$lib/components/ui/Crossfade.svelte';
	import LoadingState from '$lib/components/ui/LoadingState.svelte';
	import { t, locale } from '$lib/i18n/store';
	import { loadYaml } from '$lib/utils/loading';
	import { onMount } from 'svelte';

	interface SocialLinkData {
		name: string;
		href: string;
		icon: string;
	}

	type IconComponent = any;

	interface SocialLink {
		name: string;
		href: string;
		icon: IconComponent;
	}

	const iconMap: Record<string, IconComponent> = {
		github: SiGithub,
		telegram: SiTelegram,
		qq: SiQq,
		x: SiX,
		mail: Mail
	};

	let socialLinks: SocialLink[] = $state([]);
	let loading = $state(true);
	let error = $state('');

	onMount(async () => {
		try {
			const data = await loadYaml<SocialLinkData[]>('/data/social-links.yaml');
			socialLinks = data.map((link) => ({
				name: link.name,
				href: link.href,
				icon: iconMap[link.icon] || SiGithub
			}));
		} catch (e) {
			console.error('Failed to load social links', e);
			error = 'Failed to load';
		} finally {
			loading = false;
		}
	});
</script>

<div class="flex h-full flex-col pt-4">
	<div class="mb-4 flex items-center gap-4">
		<LiquidGlass class="h-12 w-12 rounded-2xl bg-green-500/20 p-3 text-green-400">
			<Share2 size={24} />
		</LiquidGlass>
		<h2 class="text-2xl font-bold">
			<Crossfade key={$locale} class="inline-grid"
				><span>{$t('home.hero.social_links.title')}</span></Crossfade
			>
		</h2>
	</div>

	<LoadingState {loading} {error}>
		<div class="grid flex-1 grid-cols-3 grid-rows-2 gap-2">
			{#each socialLinks as link}
				<LiquidGlass
					tag="a"
					role="button"
					href={link.href}
					target="_blank"
					class="rounded-xl px-2 py-2 text-sm font-medium"
					tilt={true}
				>
					<div class="flex h-full items-center justify-between gap-2">
						<link.icon size={16} />
						<span>{link.name}</span>
					</div>
				</LiquidGlass>
			{/each}
		</div>
	</LoadingState>
</div>
