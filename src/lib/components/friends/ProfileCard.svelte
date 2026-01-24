<script lang="ts">
	/**
	 * 个人信息卡片组件
	 *
	 * 在友链页面顶部展示站长个人信息，方便友链交换。
	 */
	import LiquidGlass from '$lib/components/ui/liquid-glass.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import { Github } from 'lucide-svelte';
	import { t, locale } from '$lib/i18n/store';
	import Crossfade from '$lib/components/ui/crossfade.svelte';
	import { calculateAge } from '$lib/utils/age';

	const age = calculateAge();
</script>

<div class="mt-1 pb-4">
	<LiquidGlass class="gap-1 rounded-xl p-3">
		<div class="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
			<div class="flex w-full flex-row gap-3 md:w-auto md:flex-row md:items-center">
				<div class="justify-center self-start md:self-auto">
					<Avatar
						src="https://github.com/skyrocketinghong.png"
						alt="Fuyao skyrocketing's avatar"
						size="sm"
					/>
				</div>
				<div class="flex min-w-0 flex-1 flex-col gap-1 text-xs text-white lg:flex-row lg:gap-6">
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
							</Crossfade>: https://fuyaoskyrocket.ing
						</p>
						<p>
							<Crossfade key={$locale} class="inline-grid">
								<span>{$t('friends.profile.icon_label')}</span>
							</Crossfade>: https://github.com/skyrocketinghong.png
						</p>
					</div>
				</div>
			</div>
			<div class="w-full md:w-auto">
				<a
					href="https://github.com/skyrocketinghong/fuyao-homepage/issues"
					target="_blank"
					class="flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20 md:w-auto"
				>
					<Github size={16} />
					<Crossfade key={$locale} class="inline-grid">
						<span>{$t('friends.exchange')}</span>
					</Crossfade>
				</a>
			</div>
		</div>
	</LiquidGlass>
</div>
