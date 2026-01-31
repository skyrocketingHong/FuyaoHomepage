此目录用于存储 Web 字体（例如 .woff2, .woff, .ttf）。
请确保更新您的 CSS 或 Tailwind 配置以引用这些字体。
CSS 中的使用示例：
@font-face {
  font-family: 'MyFont';
  src: url('/fonts/MyFont.woff2') format('woff2');
}
