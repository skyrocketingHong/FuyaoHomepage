<script lang="ts">
	/**
	 * 友链页面
	 *
	 * 展示站长个人信息和友链列表，支持按状态分类筛选。
	 */
	import { onMount } from 'svelte';
	import { loadYaml } from '$lib/utils/network/loading';
	import ProfileCard from '$lib/components/friends/ProfileCard.svelte';
	import FriendCard from '$lib/components/friends/FriendCard.svelte';
	import LoadingState from '$lib/components/ui/feedback/LoadingState.svelte';
	import CategoryNav from '$lib/components/layout/header/nav/CategoryNav.svelte';
	import { t } from '$lib/i18n/store';

	interface Friend {
		name: string;
		url: string;
		description: string;
		avatar: string;
	}

	interface FriendsData {
		online: Friend[];
		offline: Friend[];
	}

	// 分类定义
	const categories = $derived([
		{ slug: 'online', title: $t('common.status.online') },
		{ slug: 'offline', title: $t('common.status.offline') }
	]);

	let friendsData = $state<FriendsData>({ online: [], offline: [] });
	let activeCategory = $state('online');
	let loading = $state(true);
	let error = $state('');

	// 根据分类获取友链
	let filteredFriends = $derived(
		activeCategory === 'online' ? friendsData.online : friendsData.offline
	);

	onMount(async () => {
		try {
			friendsData = await loadYaml<FriendsData>('/data/friends.yaml');
		} catch (e) {
			console.error('Failed to load friends list', e);
			error = 'Failed to load friends list';
		} finally {
			loading = false;
		}
	});

	function handleCategorySelect(slug: string) {
		activeCategory = slug;
	}
</script>

<!-- 个人信息卡片 -->
<ProfileCard />

<!-- 分类导航 -->
<div class="flex justify-center py-4">
	<CategoryNav
		{categories}
		{activeCategory}
		onSelect={handleCategorySelect}
	/>
</div>

<!-- 友链列表 -->
<div class="flex w-full flex-col gap-10">
	<LoadingState {loading} {error} class="w-full justify-center pt-10 pb-0">
		<div class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
			{#each filteredFriends as friend}
				<FriendCard {friend} isOnline={activeCategory === 'online'} />
			{/each}
		</div>
	</LoadingState>
</div>
