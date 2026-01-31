<script lang="ts">
	import { formatDate } from '$lib/utils/datetime/date';
    import { t, locale } from '$lib/i18n/store';
    import { Link as LinkIcon } from 'lucide-svelte';
    import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';

    // Svelte 5 Props
    let { 
        title, 
        date, 
        category = 'Update', 
        subtitle = '' 
    }: {
        title: string;
        date: string | Date;
        category?: string;
        subtitle?: string;
    } = $props();

    // Derived state for date formatting using utility
    let formattedDate = $derived(formatDate(date, $locale));
    
    // Copy link handler
    let showCopied = $state(false);
    function copyLink() {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.href);
            showCopied = true;
            setTimeout(() => showCopied = false, 2000);
        }
    }
</script>

<!-- 
    Apple Newsroom 头部样式
    - 最大宽度：653px (与正文匹配)
    - 左对齐
    - 极简排版
    
    精细度量参考 (基于原型分析)：
    H1: 移动端 32/36 | 平板 40/44 | 桌面端 48/52
    导语: 移动端 21/25 | 平板 21/25 | 桌面端 24/28
-->
<header class="w-full max-w-[653px] mx-auto px-0 mb-10">
    
    <!-- Top Metadata: Stacked Category and Date -->
    <div class="mb-4 flex flex-col items-start gap-1">
        <span class="text-[12px] font-bold tracking-wider uppercase text-[#6e6e73] dark:text-neutral-400">{category}</span>
        <span class="text-[14px] font-semibold text-[#6e6e73] dark:text-neutral-400">
            <Crossfade key={'header-date-' + $locale} class="inline-grid">
                <span>{formattedDate}</span>
            </Crossfade>
        </span>
    </div>

    <!-- Title (H1) -->
    <!-- 
      Mobile: text-[32px] leading-[36px]
      Tablet (md): text-[40px] leading-[44px]
      Desktop (lg): text-[48px] leading-[52px]
    -->
    <h1 class="text-[32px] leading-[36px] md:text-[40px] md:leading-[44px] lg:text-[48px] lg:leading-[52px] font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7] mb-0 text-balance">
        {title}
    </h1>

    <!-- Subtitle / Lead (Intro) -->
    <!--
      Mobile/Tablet: text-[21px] leading-[25px]
      Desktop (lg): text-[24px] leading-[28px]
    -->
    {#if subtitle}
        <p class="text-[21px] leading-[25px] lg:text-[24px] lg:leading-[28px] text-[#1d1d1f] dark:text-[#f5f5f7] font-medium mt-5 text-balance">
            {subtitle}
        </p>
    {/if}

    <!-- Action Bar (Only Copy Link) -->
    <div class="flex items-center gap-3 mt-4">
        <div class="relative">
            <button 
                class="text-[#6e6e73] hover:text-[#1d1d1f] dark:text-neutral-400 dark:hover:text-[#f5f5f7] transition-colors p-1" 
                aria-label="Copy Link"
                onclick={copyLink}
            >
                <LinkIcon size={18} />
            </button>
            {#if showCopied}
                <span class="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-foreground text-background px-2 py-1 rounded shadow-sm whitespace-nowrap animate-in fade-in zoom-in">
                    {$t('common.copied')}
                </span>
            {/if}
        </div>
    </div>
</header>

