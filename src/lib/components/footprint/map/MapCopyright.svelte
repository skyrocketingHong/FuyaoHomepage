<script lang="ts">
	/**
	 * 地图版权信息组件
	 *
	 * 渲染从高德地图 (AMap) DOM 中提取的 Logo 和版权文本。
	 * 由于我们手动隐藏了地图容器内的默认版权信息 (以免遮挡地图内容或位于错误层级)，
	 * 该组件用于在侧边栏或其他 UI 区域重新展示这些信息，以符合高德 API 使用规范。
	 *
	 * @prop logoUrl - 提取的高德地图 Logo 地址
	 * @prop copyrightText - 提取的版权文本
	 */
	let {
		logoUrl = '',
		logoAlt = '',
		copyrightText = ''
	} = $props<{
		logoUrl?: string;
		logoAlt?: string;
		copyrightText?: string;
	}>();
</script>

<div class="flex w-full min-w-0 flex-wrap items-center justify-start gap-x-1.5 gap-y-1 text-left">
	{#if logoUrl}
		<!--
            渲染 Logo
            注意：此处样式在 style 块中通过 :global 修改，
            以强制覆盖 AMap 原生样式带来的绝对定位等干扰属性。
            shrink-0 禁止 Flex 压缩 Logo，保持原始长宽比。
        -->
		<div class="map-logo-container shrink-0">
			<img src={logoUrl} alt={logoAlt} />
		</div>
	{/if}
	{#if copyrightText}
		<!-- 渲染版权文本：短内容单行，空间不足时整段换行，禁止截断或缩放 -->
		<span class="text-[11px] leading-4 text-muted-foreground">
			{copyrightText}
		</span>
	{/if}
</div>

<style>
	/*
     * 强制覆盖高德 Logo 图片样式
     * 使其在 Flex 布局中保持原始长宽比正常显示
     */
	:global(.map-logo-container img) {
		display: block;
		width: auto !important;
		height: 15px !important;
		max-width: none;
		margin: 0;
		object-fit: contain;
	}

	/* 
     * 重置高德地图原生样式带来的定位干扰
     * 原生样式通常包含 position: absolute 和 pointer-events: none
     * 这里需要将其恢复为正常的文档流元素
     */
	:global(.map-logo-container .amap-logo) {
		position: static !important;
		display: block !important;
		transform: none !important;
		pointer-events: auto !important;
	}
</style>
