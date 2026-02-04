---
layout: post
title: "数学公式与复杂表格展示 (Math & Tables)"
slug: "math-and-tables-test"
date: 2026-02-03T13:00:00.000Z
lastmod: 2026-02-03T13:00:00.000Z
status: publish
author: "MathGenius"
categories:
  - "life"
tags:
  - "MathJax"
  - "KaTeX"
  - "Tables"
description: "测试 Markdown 中数学公式的渲染（如 KaTeX）以及各种复杂表格样式的展示效果。"
cover: "https://picsum.photos/seed/math/800/400"
---

## 1. 数学公式 (Physics & Math)

本博客支持 LaTeX 格式的数学公式渲染。

### 行内公式 (Inline)

爱因斯坦的质能方程是 $E=mc^2$。
欧拉公式被誉为最美的公式：$e^{i\pi} + 1 = 0$。

### 块级公式 (Block)

高斯积分：

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

麦克斯韦方程组：

$$
\begin{aligned}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\
\nabla \cdot \mathbf{B} &= 0 \\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
\nabla \times \mathbf{B} &= \mu_0\mathbf{J} + \mu_0\varepsilon_0\frac{\partial \mathbf{E}}{\partial t}
\end{aligned}
$$

矩阵：

$$
A = \begin{pmatrix}
a_{11} & a_{12} & \cdots & a_{1n} \\
a_{21} & a_{22} & \cdots & a_{2n} \\
\vdots & \vdots & \ddots & \vdots \\
a_{m1} & a_{m2} & \cdots & a_{mn}
\end{pmatrix}
$$

## 2. 表格样式 (Tables)

### 基础表格 (默认对齐)

| 姓名 | 年龄 | 职业 |
|------|------|------|
| 张三 | 25 | 工程师 |
| 李四 | 30 | 设计师 |
| 王五 | 28 | 产品经理 |

### 指定对齐方式

| 左对齐 (Left) | 居中对齐 (Center) | 右对齐 (Right) |
| :--- | :---: | ---: |
| 靠左内容 | 居中内容 | 靠右内容 |
| 1 | 2 | 3 |
| Long text content | Long text content | Long text content |

### 混合内容表格

| 样式 | 示例 | 备注 |
|---|---|---|
| **粗体** | **Bold** | 用于强调 |
| *斜体* | *Italic* | 用于引用 |
| `代码` | `const a = 1;` | 变量声明 |
| 链接 | [Google](https://google.com) | 外部链接 |
| 图片 | ![Icon](https://picsum.photos/seed/icon/50/50) | 小图标 |

### 长表格 (滚动测试)

| ID | Title | Description | Date | Status | Author | Category | Tags |
|----|-------|-------------|------|--------|--------|----------|------|
| 001 | Test | A long description to test table overflow scroll behavior on mobile devices. | 2026-02-03 | Active | Admin | Tech | A, B, C |
| 002 | Demo | Another row with substantial content. | 2026-02-04 | Inactive | Guest | Life | D, E, F |
| 003 | Sample | Yet another row to fill space. | 2026-02-05 | Pending | Robot | News | G, H, I |
