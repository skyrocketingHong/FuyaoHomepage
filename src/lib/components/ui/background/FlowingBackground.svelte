<script lang="ts">
	/**
	 * 流动变色背景组件
	 * 
	 * 使用 CSS 动画实现三个径向渐变层的旋转叠加效果，
	 * 结合噪点滤镜产生具有质感的动态流动背景。
	 * 自动适配日间/夜间模式透明度。
	 */
</script>

<div class="absolute inset-0 -z-50 overflow-hidden bg-background transition-colors duration-500">
    <div class="absolute inset-0 opacity-60 dark:opacity-50">
        <!-- 渐变层 1 -->
        <div class="absolute -inset-[50%] animate-[spin_10s_linear_infinite] opacity-80 mix-blend-multiply blur-3xl filter dark:mix-blend-screen"
             style="background: radial-gradient(circle, var(--primary) 0%, transparent 50%); transform-origin: 40% 40%;">
        </div>
        
        <!-- 渐变层 2 -->
        <div class="absolute -inset-[50%] animate-[spin_7s_linear_infinite_reverse] opacity-70 mix-blend-multiply blur-3xl filter dark:mix-blend-screen"
             style="background: radial-gradient(circle, var(--theme-color) 0%, transparent 50%); transform-origin: 60% 60%;">
        </div>
        
        <!-- 渐变层 3 (强调色) -->
        <div class="absolute -inset-[50%] animate-[spin_13s_linear_infinite] opacity-60 mix-blend-multiply blur-3xl filter dark:mix-blend-screen"
             style="background: radial-gradient(circle, var(--secondary) 0%, transparent 50%); transform-origin: 50% 50%;">
        </div>
    </div>
    
    <!-- 噪点遮罩，增加质感 -->
    <div class="pointer-events-none absolute inset-0 opacity-[0.03]"
         style="background-image: url('data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E');">
    </div>
</div>
