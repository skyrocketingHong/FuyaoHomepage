<script lang="ts">
	/**
	 * 个人信息区组件
	 *
	 * 展示个人头像、姓名、职业和签名等信息。
	 */
	import { Quote, Github } from 'lucide-svelte';
	import LiquidGlass from '$lib/components/ui/liquid-glass.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import { t, locale } from '$lib/i18n/store';
	import Crossfade from '$lib/components/ui/crossfade.svelte';
	import { calculateAge } from '$lib/utils/age';

	const age = calculateAge();
</script>

<!-- Profile & Description Section -->
<LiquidGlass
	class="hover:border-cyan-500/20 hover:bg-white/10 hover:shadow-cyan-500/10"
	tilt={true}
>
	<div class="flex flex-col items-center gap-8 md:flex-row">
		<Avatar
			src="https://github.com/skyrocketinghong.png"
			alt="Avatar"
			size="lg"
			showStatus={true}
			statusTitle={$t('home.hero.profile.status')}
		/>

		<div class="flex-1 space-y-4 text-center md:text-left">
			<div>
				<Crossfade key={$locale} class="inline-grid">
					<h1
						class="bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-4xl font-bold whitespace-pre-line text-transparent"
					>
						<span>{$t('home.hero.profile.name', { age })}</span>
					</h1>
				</Crossfade>
				<p class="mt-2 text-lg text-white/60">
					<Crossfade key={$locale} class="inline-grid"
						><span>{$t('home.hero.profile.role')}</span></Crossfade
					>
				</p>
			</div>
			<div class="relative rounded-2xl border border-white/5 bg-black/20 p-4">
				<span class="absolute top-2 left-2 h-4 w-4 scale-x-[-1] text-white/20">
				<Quote size={16} />
				</span>
				<p class="pl-6 text-white/80 italic">
					<Crossfade key={$locale} class="inline-grid"
						><span>{$t('home.hero.profile.quote')}</span></Crossfade
					>
				</p>
			</div>
		</div>
	</div>
</LiquidGlass>
