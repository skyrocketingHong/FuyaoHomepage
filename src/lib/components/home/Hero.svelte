<script lang="ts">
	import ProfileSection from './content/ProfileSection.svelte';
	import TimeCapsule from './content/TimeCapsule.svelte';
	import GithubProjects from './content/GithubProjects.svelte';
	import SocialLinks from './content/SocialLinks.svelte';
	import CloudflareAnalytics from './content/CloudflareAnalytics.svelte';
	import CodingActivity from './content/CodingActivity.svelte';
	import LatestPosts from './content/LatestPosts.svelte';
</script>

<div class="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center">
	<!-- 个人简介与描述区域 -->
	<ProfileSection />

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<!-- 时间胶囊 -->
		<TimeCapsule />

		<!-- 社交链接 -->
		<SocialLinks />
	</div>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<!-- Cloudflare 访问统计 -->
		<CloudflareAnalytics />

		<!-- WakaTime 编程统计 -->
		<CodingActivity />
	</div>

	<!-- 最新博客文章（全宽） -->
	<LatestPosts />

	<!-- Github 项目 -->
	<GithubProjects />
</div>
