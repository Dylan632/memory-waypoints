# 我们的旅行坐标

一个地图驱动的旅行票根网站。地图固定在底层，旅行章节在中央滚动；票根支持指针倾斜、排序和手账式详情展开。私密管理台可以上传轨迹、票根和照片，保存草稿并直接发布。

## 本地运行

```bash
npm install
npm run dev
```

本地查看管理界面，不连接云端数据：

```text
http://localhost:5173/admin?demo=1
```

## 使用管理台

部署后打开 `/admin`：

1. 填写旅行标题、地点和日期。
2. 上传 GPX、GeoJSON，或在地图上补充途经点。
3. 上传真实票根或创建样式票根，再加入照片和故事。
4. 在右侧检查网站效果。
5. 点击“发布到网站”。公开页面刷新后会读取最新内容，不需要重新部署。

电脑端提供完整编辑，手机端只保留票根和照片快速上传。

## 云端配置

Vercel 项目需要连接一个 Public Vercel Blob store，并配置：

- `BLOB_STORE_ID`、`BLOB_WEBHOOK_PUBLIC_KEY`：连接 Blob 后自动生成；线上函数通过 Vercel OIDC 访问存储，不保存长期读写令牌。
- `ADMIN_PASSWORD_HASH`：管理密码的 scrypt 哈希，不保存明文密码。
- `SESSION_SECRET`：至少 32 个字符，用于签名登录状态。
- `DRAFT_ENCRYPTION_KEY`：至少 32 个字符，只用于加密草稿。轮换前应先发布或备份现有草稿。

模板见 `.env.example`。照片和已发布旅行属于公开网站内容；未发布的草稿会先以 AES-256-GCM 加密再保存。

草稿和发布内容使用不可变版本，避免公开 Blob 覆盖缓存导致刷新后仍读到旧数据。后台删除旅行、票根或照片只会移除网页引用，最近发布版本和原图片仍保留在 Blob 中；如需彻底清除，应同时在 Vercel Storage 中删除对应文件。

生产项目还应为 `/api/admin/login` 配置按 IP 的登录限速。当前线上规则为 10 分钟最多 10 次请求。

## 代码内置内容

`src/data.ts` 保留三段示例旅行，既是首次打开时的内容，也是云端暂时不可用时的安全回退。

如需完全离线维护，仍可以把照片放到 `public/memories/`，并直接修改 `src/data.ts`。

路线坐标采用 `[经度, 纬度]`。每段旅行至少提供两个坐标点。

## 验证与构建

```bash
npm test
npm run build
```

Vercel 会自动识别 Vite，发布 `dist/`，并把 `api/` 部署为 Functions。

## 自动部署

GitHub `main` 分支已连接 Vercel。每次更新主分支后，线上网站会自动重新构建并发布。
