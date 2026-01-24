<script lang="ts">
	import ProfileSection from './hero/ProfileSection.svelte';
	import TimeCapsule from './hero/TimeCapsule.svelte';
	import GithubProjects from './hero/GithubProjects.svelte';
	import SocialLinks from './hero/SocialLinks.svelte';
</script>

<div class="mx-auto w-full max-w-3xl">
	<!-- Profile & Description Section -->
	<ProfileSection />

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<!-- Time Capsule -->
		<TimeCapsule />

		<!-- Social Links -->
		<SocialLinks />
	</div>

	<!-- Github Projects -->
	<GithubProjects />
</div>

