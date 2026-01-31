<script lang="ts">
	import ProfileSection from './content/ProfileSection.svelte';
	import TimeCapsule from './content/TimeCapsule.svelte';
	import GithubProjects from './content/GithubProjects.svelte';
	import SocialLinks from './content/SocialLinks.svelte';
</script>

<div class="mx-auto w-full max-w-3xl min-h-full flex flex-col justify-center">
	<!-- 个人简介与描述区域 -->
	<ProfileSection />

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<!-- 时间胶囊 -->
		<TimeCapsule />

		<!-- 社交链接 -->
		<SocialLinks />
	</div>

	<!-- Github 项目 -->
	<GithubProjects />
</div>
