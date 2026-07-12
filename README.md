# 我们的旅行坐标

一个地图驱动的旅行票根网站。地图固定在底层，旅行章节在中央滚动；票根支持指针倾斜、排序和手账式详情展开。

## 本地运行

```bash
npm install
npm run dev
```

## 替换成你们的内容

所有旅行、路线、票根、故事和照片地址都在 `src/data.ts`。

1. 把自己的照片放到 `public/memories/`。
2. 将照片地址写成 `/memories/文件名.jpg`。
3. 修改每段旅行的 `destination`、`dateLabel` 和 `route`。
4. 为票根选择 `scenic`、`rail`、`museum` 或 `cinema` 样式。
5. 调整 `width`、`offset` 和 `rotation`，改变票根的尺寸与错落位置。

路线坐标采用 `[经度, 纬度]`。每段旅行至少提供两个坐标点。

## 验证与构建

```bash
npm test
npm run build
```

Vercel 会自动识别 Vite，并发布 `dist/`。

## 自动部署

GitHub `main` 分支已连接 Vercel。每次更新主分支后，线上网站会自动重新构建并发布。
