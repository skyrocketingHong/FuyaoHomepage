<script lang="ts">
	/**
	 * 个人信息卡片组件
	 *
	 * 在友链页面顶部展示站长个人信息，方便友链交换。
	 */
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import Avatar from '$lib/components/ui/display/Avatar.svelte';
	import { SiGithub } from '@icons-pack/svelte-simple-icons';
	import { t, locale } from '$lib/i18n/store';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import { calculateAge } from '$lib/utils/datetime/age';
	import { getAvatarUrl, seoConfig, repoConfig } from '$lib/config';

	const age = calculateAge();
	const avatarUrl = getAvatarUrl();
	const siteUrl = seoConfig.baseURL;
	const issueUrl = `${repoConfig.url}/issues/new?q=is%3Aissue+state%3Aopen`;
</script>

<div class="mt-1">
	<LiquidGlass opaque={true} class="gap-1 rounded-xl p-3">
		<div class="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
			<div class="flex w-full flex-row gap-3 md:w-auto md:flex-row md:items-center">
				<div class="justify-center self-start md:self-auto">
					<Avatar
						src={avatarUrl}
						alt={$t('friends.profile.avatar_alt')}
						size="sm"
						adaptiveStatus
					/>
				</div>
				<div class="flex min-w-0 flex-1 flex-col gap-1 text-xs text-muted-foreground lg:flex-row lg:gap-6">
					<div class="shrink-0 space-y-0.5">
						<p>
							<Crossfade key={$locale} class="inline-grid">
								<span>{$t('friends.profile.name_label')}</span>
							</Crossfade>:
							<Crossfade key={$locale} class="inline-grid">
								<span>{$t('home.hero.profile.name', { age })}</span>
							</Crossfade>
						</p>
						<p>
							<Crossfade key={$locale} class="inline-grid">
								<span>{$t('friends.profile.desc_label')}</span>
							</Crossfade>:
							<Crossfade key={$locale} class="inline-grid">
								<span>{$t('home.hero.profile.quote')}</span>
							</Crossfade>
						</p>
					</div>
					<div class="min-w-0 space-y-0.5 break-all">
						<p>
							<Crossfade key={$locale} class="inline-grid">
								<span>{$t('friends.profile.link_label')}</span>
							</Crossfade>: {siteUrl}
						</p>
						<p>
							<Crossfade key={$locale} class="inline-grid">
								<span>{$t('friends.profile.icon_label')}</span>
							</Crossfade>: {avatarUrl}
						</p>
					</div>
				</div>
			</div>
			<div class="w-full md:w-auto">
				<a
					href={issueUrl}
					target="_blank"
					class="flex w-full items-center justify-center gap-1.5 rounded-lg bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/70 md:w-auto"
				>
					<div class="w-4 h-4 [&>svg]:w-full [&>svg]:h-full">
						<SiGithub />
					</div>
					<Crossfade key={$locale} class="inline-grid">
						<span>{$t('friends.exchange')}</span>
					</Crossfade>
				</a>
			</div>
		</div>
	</LiquidGlass>
</div>
