<script lang="ts">
	/**
	 * 文本特效组件
	 *
	 * 循环展示多种文本特效（如流光、代码风格、火焰、色散等）。
	 *
	 * @prop text - 显示的文本内容 (默认 "Test Text")
	 * @prop effects - 特效 CSS 类名数组 (默认包含渐变流、控制台绿、火焰)
	 * @prop interval - 特效切换间隔时间 (毫秒，默认 3000)
	 */
  import { onMount, onDestroy } from 'svelte';
  import Crossfade from '$lib/components/ui/effect/Crossfade.svelte';

  let { 
    text = "Test Text", 
    effects = [
      'text-gradient-flow',
      'text-console-green',
      'text-fire',
      // 'text-chromatic'
    ],
    interval = 3000
  } = $props<{ 
    text?: string; 
    effects?: string[];
    interval?: number;
  }>();

  let currentEffectIndex = $state(0);
  let timer: NodeJS.Timeout;

  // Derived state for current class
  let currentEffectClass = $derived(effects[currentEffectIndex]);

  onMount(() => {
    if (effects.length > 1) {
      timer = setInterval(() => {
        currentEffectIndex = (currentEffectIndex + 1) % effects.length;
      }, interval);
    }
  });

  onDestroy(() => {
    if (timer) clearInterval(timer);
  });
</script>

<div class="inline-block">
  <Crossfade key={currentEffectClass} duration={600} class="inline-grid">
    <span class="{currentEffectClass} inline-block py-2 px-1">
      {text}
    </span>
  </Crossfade>
</div>
