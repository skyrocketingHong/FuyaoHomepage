<script lang="ts">
	/**
	 * 个人简介展示组件
	 *
	 * 在 Hero 区域展示个人头像、姓名、职业、年龄及个性签名。
	 * 使用 LiquidGlass、Avatar 和 TextEffect 组件。
	 */
	import { Quote, Github } from 'lucide-svelte';
	import LiquidGlass from '$lib/components/ui/effect/LiquidGlass.svelte';
	import Avatar from '$lib/components/ui/display/Avatar.svelte';
	import TextEffect from '$lib/components/ui/effect/TextEffect.svelte';
	import { t, locale } from '$lib/i18n/store';
	import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';
	import { calculateAge } from '$lib/utils/datetime/age';
	import { getAvatarUrl } from '$lib/config';

	const age = calculateAge();
	const avatarUrl = getAvatarUrl();
</script>

<!-- 个人信息与描述区域 -->
<LiquidGlass
	opaque={true}
	class="hover:border-primary/20"
	tilt={true}
>
	<div class="flex flex-col items-center gap-8 md:flex-row">
		<Avatar
			src={avatarUrl}
			alt="Avatar"
			size="lg"
			showStatus={true}
			statusTitle={$t('home.hero.profile.status')}
		/>

		<div class="flex-1 space-y-4 text-center md:text-left">
			<div>
				<Crossfade key={$locale} class="inline-grid">
					<h1 class="text-4xl font-bold whitespace-pre-line text-foreground">
						{$t('home.hero.profile.hello')}{$t('home.hero.profile.im')}<TextEffect text={$t('home.hero.profile.name')} />
					</h1>
				</Crossfade>
				<p class="mt-2 text-lg text-muted-foreground">
					<Crossfade key={$locale} class="inline-grid"
						><span>{$t('home.hero.profile.age', { age })}</span><span>{$t('common.comma')}</span><span>{$t('home.hero.profile.role')}</span></Crossfade
					>
				</p>
			</div>
			<div class="relative rounded-2xl border border-border bg-secondary/50 p-4">
				<span class="absolute top-2 left-2 h-4 w-4 scale-x-[-1] text-muted-foreground/30">
				<Quote size={16} />
				</span>
				<p class="pl-6 text-muted-foreground italic">
					<Crossfade key={$locale} class="inline-grid"
						><span>{$t('home.hero.profile.quote')}</span></Crossfade
					>
				</p>
			</div>
		</div>
	</div>
</LiquidGlass>
