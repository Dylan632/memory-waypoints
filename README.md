# 我们的旅行坐标

地图驱动的旅行票根网站。全屏暗色地图固定在底层，旅程和票根在上面滚动；滚到哪段旅程，地图就飞到哪段路线。

纯静态站点，没有后台和数据库：所有内容都写在 `src/content/` 里，改完推送到 `main`，Vercel 会自动重新部署。

## 本地运行

```bash
npm install
cp .env.example .env.local   # 填入 Mapbox token
npm run dev
```

不填 token 也能打开，只是没有地图。

## Mapbox token

地图使用 Mapbox `dark-v11` 样式，需要一个以 `pk.` 开头的公开 token：

1. 在 [mapbox.com](https://www.mapbox.com/) 注册，复制默认的 public token。每月 5 万次地图加载以内免费。
2. 在 Mapbox 后台给这个 token 加上 URL 限制，只允许你的网站域名和 `localhost`。
3. 在 Vercel 项目的 Settings → Environment Variables 里添加 `VITE_MAPBOX_TOKEN`。

公开 token 本来就会随网页发到浏览器里，URL 限制是防止别人盗用它的方式。

## 修改内容

| 想改的 | 文件 |
| --- | --- |
| 网站标题、副标题、社交链接 | `src/content/site.ts` |
| 旅程、路线、票根文字、短文、照片 | `src/content/trips.ts` |
| 票根长什么样 | `src/components/tickets/` |

**路线**按天分段，每天一条线，坐标是 `[经度, 纬度]`。分天画可以让夜里和飞机航段留出真实的断口，不会被连成一条直线。

**票根**是用代码重现的实体票，不是照片。每种票面是一个组件，在 `src/components/tickets/index.tsx` 里登记，旅程数据里的 `kind` 决定用哪个。票面上所有尺寸都相对票根自身的宽度（`cqw`），所以大小票都不会溢出。

## 验证

```bash
npm test
npm run build
```
