# IMG Confusion

> 纯客户端 · 隐私优先的图片混淆 / 还原工具

IMG Confusion 是一款基于浏览器的图片视觉混淆工具。所有图片处理均在本地 Web Worker 中完成，**图片永远不会上传到任何服务器**。支持可选密钥加密、PNG 元数据嵌入与 EXIF 保留，让图片在分享前可被快速视觉打码，并在需要时通过密钥还原。

## 功能特性

- 🔒 **图片混淆**：基于密钥种子的像素置换算法，混淆后图片呈随机噪点 / 色彩错乱状
- 🔑 **图片还原**：使用相同密钥与算法恢复原始图像
- 🧠 **两种混淆算法**
  - **像素洗牌**（`pixel-shuffle`）：基于密码种子的像素位置重排
  - **通道洗牌**（`channel-shuffle`）：基于密码种子的 RGB 通道值重排
- 🛡️ **纯客户端处理**：所有运算在浏览器内完成，无网络请求
- ⚡ **Web Worker 加速**：重计算放入 Worker，主线程不卡顿，支持进度回调
- 🏷️ **元数据自包含**：混淆结果以 PNG `tEXt` 块嵌入原始文件名 / 尺寸 / 算法 / EXIF，还原时自动恢复
- 🌗 **明暗双主题** + 拖拽上传 + 历史记录（localStorage）
- ⌨️ **快捷键**：`1` / `2` 切换模式，`Ctrl/Cmd + Enter` 执行处理
- 🛡️ **大图内存保护**：处理前预估内存占用，超阈值时弹出警告，超硬限直接拒绝

## 技术栈

| 类别 | 选型 |
| --- | --- |
| 框架 | React 18 |
| 语言 | TypeScript 5 |
| 构建 | Vite 6 |
| 样式 | Tailwind CSS 3 |
| 并行计算 | Web Workers（ES Module 格式） |
| 部署 | Vercel（含安全响应头配置） |

## 快速开始

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 类型检查 + 生产构建
npm run build

# 预览构建产物
npm run preview
```

## 目录结构

```
.
├── public/                     # 静态资源与 _headers
├── src/
│   ├── algorithms/             # 混淆算法核心
│   │   ├── prng.ts             # 种子化 PRNG（xorshift128）+ 密钥派生
│   │   ├── shuffle.ts          # 像素洗牌 / 通道洗牌 + 置换生成与逆置换
│   │   └── index.ts
│   ├── components/             # UI 组件（上传、密钥输入、预览、进度、历史等）
│   ├── workers/
│   │   └── imageProcessor.worker.ts  # Worker 入口，承接混淆/还原任务
│   ├── utils/
│   │   ├── imageUtils.ts       # Image ↔ ImageData、缩略图、内存估算
│   │   ├── pngChunks.ts        # PNG tEXt 块读写、JPEG EXIF 提取与回填
│   │   └── storage.ts          # localStorage 历史记录（含渐进裁剪）
│   ├── types/
│   ├── App.tsx                 # 应用主入口与处理编排
│   ├── main.tsx
│   └── index.css
├── index.html
├── vite.config.ts              # 分包策略 + Worker 配置
├── vercel.json                 # 构建命令与安全响应头
├── tailwind.config.js
└── tsconfig.json
```

## 工作原理

1. **密钥派生**：用户密钥经 FNV-style 哈希 + 多轮 fmix64 混合生成 32 位种子（[prng.ts](src/algorithms/prng.ts)）。
2. **置换生成**：以种子初始化 `SeededPRNG`（xorshift128 变体），用 Fisher–Yates 洗牌生成确定性的像素 / 通道置换表（[shuffle.ts](src/algorithms/shuffle.ts)）。
3. **混淆**：按置换表将源像素 / 通道值重写到目标位置。
4. **还原**：对置换表求逆，按逆置换写回即可无损还原。
5. **元数据嵌入**：混淆结果统一导出为 PNG，将原始文件名、尺寸、算法 ID、EXIF 等以 `tEXt` 块写入；还原时读回并恢复 EXIF（[pngChunks.ts](src/utils/pngChunks.ts)）。
6. **并行执行**：主线程将 `ImageData` 通过 `postMessage` 传给 Worker，处理结果以 `Transferable` 形式零拷贝回传（[imageProcessor.worker.ts](src/workers/imageProcessor.worker.ts)）。

## 使用流程

1. 选择「混淆」模式，上传图片（可选设置密钥）
2. 选择混淆算法，点击「开始混淆」并下载结果
3. 选择「还原」模式，上传混淆后的图片
4. 输入与混淆时相同的密钥（若设置了），点击「开始还原」

## ⚠️ 安全定位说明

本工具采用基于密钥种子的像素置换算法，属于**视觉混淆**而非密码学加密。

- ✅ 适合：防止图片被 casual 浏览 / 识别、对截图做快速打码、在公开渠道分享前遮蔽内容
- ❌ 不适合：对抗专业图像分析或密码学攻击；如需高强度加密，请使用 AES 等专业加密方案
- 🔑 **密钥丢失将无法还原图片**，请妥善保管

## 许可证

[MIT License](LICENSE) © 2026 逐梦星辰
