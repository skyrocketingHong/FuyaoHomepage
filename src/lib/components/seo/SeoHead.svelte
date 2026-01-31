<script lang="ts">
	/**
	 * SEO 头部组件
	 *
	 * 为页面提供标题、描述、关键词和 Open Graph / Twitter 卡片元标签。
	 * 
	 * @prop title - 页面标题
	 * @prop description - 页面描述
	 * @prop keywords - 关键词数组
	 * @prop author - 作者名称
	 * @prop image - 预览图 URL
	 * @prop type - 页面类型 (website | article | profile)
	 * @prop jsonLd - 结构化数据对象
	 */
	import { seoConfig } from '$lib/config';
	import { page } from '$app/state';

	const siteName = import.meta.env.VITE_SITE_NAME ?? '扶摇 Skyrocketing';

	let {

		title = siteName,
		description = seoConfig.description,
		keywords = seoConfig.keywords,
		author = seoConfig.author,
		image,
		type = 'website',
		jsonLd
	}: Props = $props();

	interface Props {
		title?: string;
		description?: string;
		keywords?: string[];
		author?: string;
		image?: string;
		type?: 'website' | 'article' | 'profile';
		/** 结构化数据 (JSON-LD) */
		jsonLd?: Record<string, any>;
	}

	// 生成最终标题（非首页添加站点名后缀）
	let finalTitle = $derived(title === siteName ? title : `${title} | ${siteName}`);
	// 生成完整 URL
	let finalUrl = $derived(`${seoConfig.baseURL}${page.url.pathname}`);
	// 如果关键词是数组则连接为字符串
	let keywordsString = $derived(Array.isArray(keywords) ? keywords.join(', ') : keywords);
	// 回退图片逻辑：优先使用传入图片，否则使用默认 favicon
	let finalImage = $derived(image ? (image.startsWith('http') ? image : `${seoConfig.baseURL}${image}`) : `${seoConfig.baseURL}/favicon/android-chrome-512x512.png`);
</script>

<svelte:head>
	<title>{finalTitle}</title>
	<meta name="description" content={description} />
	<meta name="keywords" content={keywordsString} />
	<meta name="author" content={author} />
	<link rel="canonical" href={finalUrl} />

	<!-- Open Graph / Facebook 元标签 -->
	<meta property="og:type" content={type} />
	<meta property="og:url" content={finalUrl} />
	<meta property="og:title" content={finalTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={finalImage} />
	<meta property="og:site_name" content={siteName} />

	<!-- Twitter 卡片元标签 -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content={finalUrl} />
	<meta property="twitter:title" content={finalTitle} />
	<meta property="twitter:description" content={description} />
	<meta property="twitter:image" content={finalImage} />
	{#if seoConfig.twitterId}
		<meta name="twitter:creator" content={seoConfig.twitterId} />
		<meta name="twitter:site" content={seoConfig.twitterId} />
	{/if}

	{#if jsonLd}
		{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`}
	{/if}
</svelte:head>

