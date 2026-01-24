<script lang="ts">
	/**
	 * 友链页面
	 *
	 * 展示站长个人信息和友链列表。
	 */
	import { onMount } from 'svelte';
	import { loadYaml } from '$lib/utils/loading';
	import ProfileCard from '$lib/components/friends/ProfileCard.svelte';
	import FriendCard from '$lib/components/friends/FriendCard.svelte';
	import LoadingState from '$lib/components/ui/LoadingState.svelte';

	interface Friend {
		name: string;
		url: string;
		description: string;
		avatar: string;
	}

	let friendsData = $state<Friend[]>([]);
	let loading = $state(true);
	let error = $state('');

	onMount(async () => {
		try {
			friendsData = await loadYaml<Friend[]>('/data/friends.yaml');
		} catch (e) {
			console.error('Failed to load friends list', e);
			error = 'Failed to load friends list';
		} finally {
			loading = false;
		}
	});
</script>

<!-- 个人信息卡片 -->
<ProfileCard />

<!-- 友链列表 -->
<div class="flex w-full flex-col gap-10">
	<LoadingState {loading} {error}>
		<div class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
			{#each friendsData as friend}
				<FriendCard {friend} />
			{/each}
		</div>
	</LoadingState>
</div>
