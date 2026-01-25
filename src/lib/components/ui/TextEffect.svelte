<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Crossfade from '$lib/components/ui/Crossfade.svelte';

  let { 
    text = "Test Text", 
    effects = [
      'text-gradient-flow',
      'text-console-green',
      'text-fire',
      'text-chromatic'
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
