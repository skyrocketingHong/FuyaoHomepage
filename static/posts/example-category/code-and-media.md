---
layout: post
title: "代码高亮与媒体展示 (Code & Media)"
slug: "code-and-media-test"
date: 2026-02-03T14:00:00.000Z
lastmod: 2026-02-03T14:00:00.000Z
status: publish
author: "CodeMaster"
categories:
  - "example-category"
  - "tech"
tags:
  - "Code"
  - "Images"
  - "Videos"
description: "全面测试各种编程语言的语法高亮显示效果，以及图片、视频等媒体资源的嵌入表现。"
cover: "https://picsum.photos/seed/code/800/400"
---

## 1. 代码高亮 (Syntax Highlighting)

### JavaScript / TypeScript

```typescript
interface User {
  id: number;
  name: string;
}

function greet(user: User): string {
  return `Hello, ${user.name}!`;
}

const user: User = { id: 1, name: "World" };
console.log(greet(user));
```

### Rust

```rust
fn main() {
    let message = "Hello, world!";
    println!("{}", message);
    
    let numbers = vec![1, 2, 3, 4, 5];
    for n in numbers {
        match n {
            1 => println!("One"),
            _ => println!("Other"),
        }
    }
}
```

### Python

```python
def fibonacci(n):
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    
    sequence = [0, 1]
    while len(sequence) < n:
        sequence.append(sequence[-1] + sequence[-2])
    return sequence

print(fibonacci(10))
```

### HTML / CSS

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Document</title>
    <style>
        body {
            background-color: #f0f0f0;
            font-family: sans-serif;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Heading</h1>
        <p>Paragraph text.</p>
    </div>
</body>
</html>
```

### Bash / Shell

```bash
#!/bin/bash

echo "Starting deployment..."
npm install
npm run build

if [ $? -eq 0 ]; then
  echo "Build successful!"
else
  echo "Build failed!"
  exit 1
fi
```

### JSON

```json
{
  "name": "package",
  "version": "1.0.0",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.17.1"
  }
}
```

## 2. 行内代码 (Inline Code)

在 JavaScript 中，我们使用 `console.log()` 来输出信息。在 Python 中则是 `print()`。
无论是什么语言，`Map<String, Object>` 都是常见的数据结构。

## 3. 媒体嵌入 (Media)

### 图片 (Images)

普通图片：
![Mountain](https://picsum.photos/seed/mountain/800/500)

带标题的图片：
![Ocean](https://picsum.photos/seed/ocean/800/500 "Mystery Ocean")

### 动图 (GIFs)

假设这里应该有一个 GIF 动图（使用静态图模拟）：
![Animation Placeholder](https://picsum.photos/seed/gif/400/300)

### 链接点击测试

点击 [这里](https://github.com) 跳转到 GitHub。
点击 [这里](#) 什么都不做（锚点测试）。
