<script lang="ts">
	/**
	 * 地图版权信息组件
	 *
	 * 渲染从高德地图 (AMap) DOM 中提取的 Logo 和版权文本。
	 * 由于我们手动隐藏了地图容器内的默认版权信息 (以免遮挡地图内容或位于错误层级)，
	 * 该组件用于在侧边栏或其他 UI 区域重新展示这些信息，以符合高德 API 使用规范。
	 *
	 * @prop logoHtml - 提取的高德地图 Logo HTML 字符串
	 * @prop copyrightHtml - 提取的版权文本 HTML 字符串
	 */
	let { logoHtml = '', copyrightHtml = '' } = $props<{
		logoHtml?: string;
		copyrightHtml?: string;
	}>();
</script>

<div class="flex origin-right items-center gap-1.5">
	{#if logoHtml}
		<!-- 
            渲染 Logo
            注意：此处样式在 style 块中通过 :global 修改，
            以强制覆盖 AMap 原生样式带来的绝对定位等干扰属性。
        -->
		<div class="map-logo-container">
			{@html logoHtml}
		</div>
	{/if}
	{#if copyrightHtml}
		<!-- 渲染版权文本 -->
		<span class="pt-0.5 text-[12px] leading-none whitespace-nowrap text-muted-foreground">
			{@html copyrightHtml}
		</span>
	{/if}
</div>

<style>
	/* 
     * 强制覆盖高德 Logo 图片样式
     * 使其在 Flex 布局中能够正常显示大小 
     */
	:global(.map-logo-container img) {
		height: 15px !important;
		width: auto !important;
		display: block;
		margin-top: 7px; /* 微调垂直对齐 */
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
