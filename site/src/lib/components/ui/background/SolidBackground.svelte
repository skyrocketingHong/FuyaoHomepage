<script lang="ts">
	/**
	 * 阅读背景组件 (博客文章页 solid 模式)
	 *
	 * 使用 --reader-background 阅读语义 token 绘制纯色阅读背景 (日间浅色 / 夜间近黑)，
	 * 由 BackgroundLayer 统一渲染与切换；自身不做任何颜色过渡动画，
	 * 背景过渡的唯一入口是 BackgroundLayer (View Transition 或单层 Crossfade 回退)。
	 */
</script>

<div class="absolute inset-0 -z-50 bg-(--reader-background)"></div>
