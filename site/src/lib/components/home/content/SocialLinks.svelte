<script lang="ts">
	/**
	 * 社交链接组件
	 *
	 * 异步加载并展示站长的社交媒体联系方式。
	 * 数据来源于 /data/social-links.yaml。
	 */
	import { SiGithub, SiTelegram, SiQq, SiX } from '@icons-pack/svelte-simple-icons';
	import { Mail } from 'lucide-svelte';
	import SectionHeader from '$lib/components/home/content/common/SectionHeader.svelte';
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import Skeleton from '$lib/components/ui/feedback/Skeleton.svelte';

	import { loadYaml } from '$lib/utils/network/loading';
	import { onMount } from 'svelte';
	import type { ComponentType } from 'svelte';

	interface SocialLinkData {
		name: string;
		href: string;
		icon: string;
	}

	type IconComponent = ComponentType;

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
	<SectionHeader icon="social" titleKey="home.hero.social_links.title" />

	<div class="h-[116px] w-full">
		{#if loading}
			<div class="grid h-full grid-cols-3 grid-rows-2 gap-2">
				{#each Array(6).keys() as index (index)}
					<Skeleton class="h-full w-full rounded-xl" />
				{/each}
			</div>
		{:else if error}
			<div
				class="flex h-full items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 text-sm text-destructive"
			>
				{error}
			</div>
		{:else}
			<div class="grid h-full grid-cols-3 grid-rows-2 gap-2">
				{#each socialLinks as link (link.href)}
					<LiquidGlass
						opaque={true}
						tag="a"
						role="button"
						href={link.href}
						target="_blank"
						class="rounded-xl p-3 text-sm font-medium text-foreground"
						tilt={true}
					>
						<div class="flex h-full items-center gap-2">
							<span class="flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
								<link.icon size={16} />
							</span>
							<span class="ml-auto flex min-w-0 flex-1 justify-end text-right leading-tight">
								<span class="max-w-full min-w-0 break-words">{link.name}</span>
							</span>
						</div>
					</LiquidGlass>
				{/each}
			</div>
		{/if}
	</div>
</div>
