---
layout: post
title: "给个人主页加了个相册，记录一下技术实现"
slug: "album-feature"
date: 2026-05-08T22:00:00.000Z
status: publish
author: "Skyrocketing"
categories:
  - "技术开发 💻"
tags:
  - "Svelte"
  - "TypeScript"
  - "前端"
  - "摄影"
cover: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1600&auto=format&fit=crop"
description: "记录个人主页相册功能的开发过程，包括 nanoid 文件管理、justified gallery 布局、灯箱设计、URL 深度链接、统一筛选机制等技术细节。"
---

## 起因

之前个人主页一直只有博客和足迹两个模块，这次想把拍的照片也展示出来。需求不复杂：从照片里读取 EXIF 信息，按时间分组展示，点开能看大图和拍摄参数，支持按设备筛选。但实际做下来发现细节还挺多的，把一些有意思的设计决策记一下。

## 数据层：构建时处理，运行时只读

照片放在 `content/albums/photos/` 目录下，通过 SFTP 维护，不在前端做上传。所有 EXIF 解析都放在构建阶段，用 `exifr` 库读取元数据，再用 `sharp` 读取实际像素尺寸。

这里有个坑：EXIF 里的 `ExifImageWidth` 和 `ExifImageHeight` 存的是传感器原始分辨率，不是最终输出尺寸。有些照片（比如 iPhone 拍的竖构图）这两个值反而是宽>高。所以用 `sharp` 直接读图片的真实宽高，准确得多。

最终生成两类文件：

```
content/albums/
├── index.json        # 轻量索引，只有年份列表和设备列表
├── 2024.json         # 按年拆分的照片数据
├── 2025.json
└── photos/           # 实际照片文件
    └── 2025/
        └── 05/
            └── 07/
                ├── MxwR33ll.jpeg
                └── kP9F4x2B.jpeg
```

`index.json` 只有几 KB，包含年份数组和设备列表。每个年份一个 JSON 文件，按需加载。这样切换年份时不用重新请求全部数据，Cloudflare 也能独立缓存每个年份的文件。

照片存储结构默认会规范化：文件名改成 8 位 nanoid（URL-safe），然后按 EXIF 拍摄日期移到 `yyyy/mm/dd/` 子目录下。这个过程是幂等的——脚本通过已有索引判断照片是否已经处理过，重复运行不会重复移动。如果不想要重命名，`--no-rename` 参数可以跳过这一步，直接按原文件名存储。日期来源按优先级从 EXIF 的 `DateTimeOriginal` 往下找，找不到就用文件修改时间。

URL 里照片的 ID 就是文件名本身（不带扩展名），比如 `/albums/2025/05/07/MxwR33ll`。这样不需要额外的映射文件，文件系统本身就是 ID 的来源。

## 网格布局：Justified Gallery

照片展示用的是 justified gallery 布局——就是 Google Photos 那种每行高度一致、宽度填满的效果。

核心算法是个贪心的行填充：

```typescript
const GAP = 8;
const TARGET_HEIGHT = 260;
const MAX_HEIGHT = 400;

function getRows(photos: Photo[], containerWidth: number) {
    let currentRow: { photo: Photo; ratio: number }[] = [];
    let sumRatios = 0;
    const rows: RowData[] = [];

    for (const photo of photos) {
        const ratio = photo.width && photo.height
            ? photo.width / photo.height
            : 4 / 3;

        currentRow.push({ photo, ratio });
        sumRatios += ratio;

        const rowHeight = (containerWidth - (currentRow.length - 1) * GAP) / sumRatios;

        if (rowHeight < TARGET_HEIGHT * 0.5 && currentRow.length > 1) {
            currentRow.pop();
            sumRatios -= ratio;
            rows.push({ photos: [...currentRow], height: Math.min(/* 计算高度 */, MAX_HEIGHT) });
            currentRow = [{ photo, ratio }];
            sumRatios = ratio;
        }
    }
    // 处理最后一行
}
```

每张照片的宽度 = `宽高比 × 行高`，这样同一行所有照片高度一致，总宽度刚好填满容器。行高上限 400px，避免只有两三张照片的行变得过大。

有个细节：这个函数是纯函数，没有状态，直接在模板里调用。容器宽度用 `bind:clientWidth` 绑定，窗口大小变化时 Svelte 自动重新计算，不需要手动监听 resize。

每个照片卡片用 `LiquidGlass` 组件包了一层，带毛玻璃效果和 `tilt` 倾斜视差。鼠标悬停时显示一个渐变遮罩，上面放设备名、品牌 Logo、拍摄参数和 GPS 坐标。遮罩加了 `pointer-events-none`，这样鼠标事件能穿透到 `LiquidGlass` 上，tilt 效果才正常工作。

## 灯箱：稳定的 4:3 视口

灯箱是最费心思的部分。核心矛盾是：照片横竖比例不一，但右侧信息面板的布局不能跟着每张照片跳来跳去。

解决方案是给照片区域一个固定的 4:3 容器，实际照片按真实比例居中显示在里面：

```svelte
<!-- 4:3 占位容器 -->
<div style="aspect-ratio: {CONTAINER_ASPECT}; max-height: {maxPhotoHeight}px;">
    <!-- 实际照片，绝对定位居中 -->
    <div style="width: {photoDisplay.width}px; height: {photoDisplay.height}px;"
         class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg">
        <Crossfade key={currentIndex} inDuration={200} outDuration={150}>
            <LazyImage src={photo.path} fit="cover" />
        </Crossfade>
    </div>
</div>
```

照片实际显示尺寸用 `calcPhotoDisplay` 计算：宽高比大于 4:3 的（横构图）宽度撑满，高度等比缩放；小于等于 4:3 的（竖构图）高度撑满，宽度等比缩放。本质就是个 letterbox 算法。

容器宽度和高度的关系：
- 最大高度 = `min(视口高度 × 85%, (视口宽度 - 侧边栏 - 信息面板 - 间距) / 4:3)`
- 容器宽度 = `最大高度 × 4/3`
- 外层 wrapper 总宽度 = 容器宽度 + 间距 + 信息面板宽度（320px）

这样不管照片是横是竖，信息面板永远在同一位置，不会跳。

移动端布局改成上下结构：照片在上面固定不动，信息面板在下面可以滚动。容器宽度直接用 `100%`，不再做额外计算。

这里有个坑：信息面板用了 `Crossfade` 组件做过渡动画，而 `Crossfade` 内部默认用 CSS Grid 实现堆叠（`grid grid-cols-[minmax(0,1fr)]`）。Grid 的 `min-height: auto` 和子元素的 `height: 100%` 会形成循环引用——Grid 单元格高度由内容撑开，子元素又要 100% 继承父级高度，结果 `overflow-y-auto` 永远不会触发，因为 Grid 认为内容没有溢出。

解决方案是给 `Crossfade` 加一个 `scrollable` 属性。`scrollable={false}`（默认）时用 Grid 堆叠，适合内容自适应高度的场景（项目里有 79 处在用）；`scrollable={true}` 时改用 `position: absolute; inset: 0`，子元素高度从 flex 父级获取，支持滚动。灯箱信息面板用 `scrollable={isMobile}`——移动端用 absolute（可滚动），桌面端用 Grid（内容自适应）。

```svelte
<!-- Crossfade 双模式 -->
{#if scrollable}
    <!-- absolute 模式：高度从 flex 父级获取 -->
    <div class="relative min-h-0">
        <div class="absolute inset-0 overflow-y-auto">
            {@render children()}
        </div>
    </div>
{:else}
    <!-- Grid 模式：内容自适应高度 -->
    <div class="grid grid-cols-[minmax(0,1fr)]">
        <div class="size-full">
            {@render children()}
        </div>
    </div>
{/if}
```

叠加层加了 `overscroll-none` 防止滚动穿透——当信息面板滚到底部继续滑动时，不会带动底层页面滚动。

### 溢出文本的渐隐与自动滚动

灯箱信息面板里有些值很长（比如色彩空间 `Display P3`、镜头型号 `iPhone 16 Pro Max back triple camera 6.765mm f/1.76`），在移动端会溢出。用 `Marquee` 组件处理这个问题：内部用 `ResizeObserver` 检测是否溢出，溢出时在右侧显示一个 `FadeEdge` 渐隐遮罩（`mask-image: linear-gradient`），用户 hover 或 touch 时自动滚动显示完整内容。

```svelte
<!-- infoRow snippet 里使用 Marquee -->
<Marquee class="text-neutral-500" autoPlay>
    <span>{photo.cameraModel}</span>
</Marquee>
```

`autoPlay` 属性让 Marquee 在挂载后自动开始滚动，不需要用户 hover。`FadeEdge` 的 `visible` 属性和 Marquee 的溢出状态绑定——文字没溢出时没有渐隐效果，溢出时才显示。

### 页面滚动的统一方案

相册页面的滚动一开始是自己管理的——在页面组件里用 `h-full overflow-y-auto` 创建滚动容器，监听 `svelte:window onscroll`。但这样有个问题：`svelte:window onscroll` 捕获不到内部滚动容器的事件，因为 scroll 事件不冒泡到 window。而且自建滚动容器会导致布局层的底部占位元素（`h-30`，用来避开移动端底部导航栏）被裁切。

最终改成和其他页面一样，用 `layoutState.setScrollable(true)` 启用 `MainContent` 的滚动能力。`MainContent` 内部有 `ScrollContainer` 组件，底部有 `<div class="h-30 w-full shrink-0 md:h-4">` 占位元素，滚动时自然生效。页面卸载时调 `layoutState.setScrollable(false)` 清理状态。

灯箱右上角有个「复制链接」按钮，用 `LiquidGlass` 渲染，点击后把当前照片的完整 URL 复制到剪贴板。URL 格式是 `/albums/2025/05/07/MxwR33ll`（没有扩展名），从照片的 `date` 字段和 `filename` 拼出来。图标在 Copy 和 Check 之间切换，带 `Crossfade` 过渡。

灯箱打开时，页面标题会改成 `yyyy.mm.dd hh:mm | 相册 | 站点名` 的格式。这是通过 `lightboxState.pageTitle` 实现的——页面组件设置这个值，布局层的 `effectiveTitle` 优先读它。灯箱关闭后自动恢复原来的标题。

灯箱的状态集中在一个全局 store（`lightbox.svelte.ts`）里：`isOpen`、`currentIndex`、`photos`、`yearUrl`、`pageTitle`，加上 `onClose` 和 `onNavigate` 两个回调。页面组件通过 `open()` 方法写入状态，layout 层读取状态渲染灯箱并调用回调。这种「页面定义逻辑、layout 负责渲染」的模式解决了层叠上下文的问题，后面会详细说。

## 触摸滑动

移动端需要支持左右滑动切换照片。实现比较朴素，就是 `touchstart` / `touchmove` / `touchend` 三个事件。

判断逻辑：

```typescript
function handleTouchMove(e: TouchEvent) {
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;

    // 水平移动距离 > 垂直移动距离，且水平距离超过 10px
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        touchSwiping = true;
        touchDeltaX = dx;
    }
}
```

滑动超过 50px 触发切换，不到 50px 回弹。滑动过程中在照片边缘显示一个半透明渐变作为视觉反馈。手指抬起后，如果没有产生滑动（就是点了一下），则关闭灯箱。

有个小问题：点击关闭和滑动切换会冲突。所以用 `touchSwiping` 标记来区分——滑动过程中不触发点击关闭。

灯箱的左右切换按钮提取成了独立组件 `LightboxNavButton`，内部用 `LiquidGlass` 渲染成圆形按钮。桌面端默认隐藏，鼠标悬停照片区域时才显示；移动端始终可见。这里用了命名 group `group/photo`，避免和 `LiquidGlass` 内部的 `group` 类冲突。

## URL 与历史管理

灯箱、月份筛选、年份切换都涉及 URL 变化，但它们的行为不同。这里用了一个统一的策略：**用 `history.pushState` 而不是 SvelteKit 的 `goto()`**。

原因是 `goto()` 会触发 SvelteKit 的 load 函数重新执行。这意味着每次打开灯箱、切换月份都会重新加载数据、重置网格状态。而灯箱本质上是当前页面的一个「叠加层」，不应该影响底层页面的状态。

灯箱的 URL 策略：
- 打开：`history.pushState({ photoId }, '', '/albums/2025/05/07/MxwR33ll')`
- 关闭：`history.pushState(null, '', '/albums/2025')` 回到年份页
- 前后切换：`history.pushState({ photoId }, '', newPhotoUrl)`
- 浏览器后退/前进：`popstate` 事件处理，读取 URL 里的照片路径打开对应灯箱

这样浏览器的后退按钮能正确关闭灯箱，前进能重新打开。用户还可以直接复制灯箱里的 URL 分享，打开就是对应的照片——深度链接天然支持。

月份筛选也走 URL 路径而不是 hash：`/albums/2025/03` 表示 2025 年 3 月。首次加载时通过 catch-all route 的 load 函数解析路径，拿到 `activeMonthId`。之后用户点击侧边栏月份时，`selectMonth()` 同时更新 `activeMonthId` 和 URL（用 `history.pushState`），再注册一个侧边栏筛选器。`activeMonthId` 变化时通过 `$effect` 自动同步 URL，不需要额外的循环检测标记。

## 侧边栏：统一的筛选机制

侧边栏支持两种视图模式：按日期和按设备。模式切换用 `Crossfade` 做过渡动画。

日期模式比较简单，就是平铺的月份列表，点哪个月就滚动到对应的月份区块。每个区块有 `id="month-{monthId}"`，用 `scrollIntoView({ behavior: 'smooth' })` 实现平滑滚动。

设备模式是个树形结构：顶层是设备名，展开后是该设备下各个月份的照片数量。设备名前面会显示品牌图标——通过 `BrandIcon` 组件统一处理，内部用 `isApple`/`isXiaomi`/`hasLeica` 函数匹配，匹配到了就用对应的 `@icons-pack/svelte-simple-icons` 里的图标。这个组件在网格悬浮层和灯箱信息面板里也共用，消除了三处重复的图标渲染逻辑。

设备列表从当前年份的照片里提取，不做跨年汇总。年份切换在页面顶部的 `YearNav` 组件里（用 `SegmentedControl`），通过 URL 路径驱动。

月份筛选和设备筛选共用同一套清除机制。`SidebarState` 里有一个通用的 `setFilter(label, clearCallback)` 方法——月份或设备激活筛选时调用它，传入显示标签和清除回调。布局层的侧边栏（`Sidebar.svelte`）监听 `filterLabel` 变化，有值就显示清除按钮，点一下就调 `onFilterClear()`。按钮用 `Crossfade` 做切换动画，key 是 `filterLabel`，这样从月份切换到设备时按钮内容会平滑过渡。

模式切换时自动清除所有筛选。`setViewMode()` 内部会先调 `clearFilter()`，然后触发页面注册的 `onViewModeChange` 回调。页面在这个回调里清除 `activeMonthId`、`activeDevice` 等本地状态，并把 URL 重置到年份页。这样用户从日期模式切到设备模式时，不会残留上一个模式的筛选状态。

## 灯箱的渲染层级

灯箱需要盖住侧边栏，但侧边栏是 `z-50`（控件层）。如果灯箱在页面组件里渲染，会被侧边栏的层叠上下文挡住。

所以灯箱的渲染放在 `+layout.svelte` 里，用一个全局 store 控制。页面组件调用 `lightboxState.open()`，同时注册 `onClose` 和 `onNavigate` 回调——这两个回调里包含 URL 更新逻辑（`history.pushState`），由页面组件定义，layout 层只负责调用。这样 layout 不需要知道具体的 URL 结构，灯箱的 `z-100` 也不受页面组件的层叠上下文限制。

## 国际化和格式化

EXIF 里的枚举值（曝光程序、测光模式、白平衡等）存的是原始数字，不做翻译。前端根据 locale 映射成对应语言的文字。这样同一份 JSON 数据可以同时服务中英文界面。

一些格式化细节：
- 光圈用 `ƒ/` 前缀而不是 `f/`，和相机界面对齐
- 快门速度 ≥ 1 秒显示 `1s`，否则显示分数形式 `1/200s`
- GPS 坐标转成度分秒格式 ` 30° 10' 19.300" N`，度数用 `\u00A0` 补前导空格至 3 位，经纬度对齐显示，和 macOS 照片应用一致
- GPS 方向根据 locale 显示中文或英文方位词

这些格式化函数抽到了 `src/lib/utils/domain/exif.ts` 里，网格的悬浮层和灯箱的信息面板共用一套。

## 小结

整个相册功能涉及的文件不多，但每个组件里都有些值得推敲的细节。Justified gallery 的纯函数设计让响应式变得很简单；4:3 视口解决了灯箱布局跳动的问题；构建时处理 EXIF 让运行时完全没有解析开销；`history.pushState` 让灯箱和筛选的 URL 变化不干扰 SvelteKit 的路由生命周期；统一的筛选机制让月份和设备共用一套清除逻辑；`Crossfade` 的双模式（Grid vs absolute）解决了移动端信息面板的滚动问题；`Marquee` + `FadeEdge` 让长文本在小屏幕上优雅处理。这些决策单独看都不复杂，但组合起来让整个功能的实现变得比较干净。
