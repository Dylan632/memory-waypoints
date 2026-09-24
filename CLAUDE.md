# 交接说明

## 目标

复刻 [liuaaron.com](https://liuaaron.com/)（Aaron's Waypoints）的布局、节奏和动画，内容全部换成我们自己的。

**不搬**：Aaron 的源代码、名字、社交链接、路线数据、票根设计、照片、Mapbox token。

## 已定的方案

- 地图用 Mapbox `dark-v11`，token 放在 `VITE_MAPBOX_TOKEN`（本地写进 `.env.local`，线上加在 Vercel 环境变量里）。
- 票根：每张实体票用代码重现成一个组件，在 `src/components/tickets/index.tsx` 登记。不用照片。
- 不做后台，内容写在 `src/content/`。
- 新站在分支 `claude/youthful-darwin-053pgw`，对应 PR #1。`main` 连着线上旧站，**内容和动画完成前不要合并**。

## 参考资料

- 原站截图（2026-06-12 拍摄，1440×900 和 390×844，DPR 2）：
  - https://raw.githubusercontent.com/azusachino/felicia/HEAD/docs/research/liuaaron-desktop.png
  - https://raw.githubusercontent.com/azusachino/felicia/HEAD/docs/research/liuaaron-mobile.png
- 原站技术拆解：https://raw.githubusercontent.com/azusachino/felicia/HEAD/docs/research/liuaaron-teardown.md
  要点：纯静态 Vite SPA；票根是手写 HTML/CSS 组件；详情是纸色面板（顶部票根、标题、一段斜体短文、拍立得照片）。
- felicia 是 AGPL-3.0 协议：只能参考它的文档，不能抄它的代码。

## 已从截图量出的数值

- 地图：`dark-v11` 原生暗色，**不压暗、不去色**。路线 `#ff7b3a`、线宽 3、不透明度 0.8，每天一条线。`fitBounds` 的 padding 取 60。
- 首屏字号在手机和桌面上**完全一样**，手机只是把标题折成两行。
- 具体字号、字重、颜色、间距都在 `src/styles.css` 里，标了 `measured` 的就是量出来的。桌面和手机上每一行的位置误差都在 1px 以内。

## 怎么校准

用 Playwright 截取自己的页面（1440×900 和 390×844，`deviceScaleFactor: 2`，和原站截图同一规格），逐行扫描中间那一列的亮色像素，比较每行文字的上沿和宽度。校准时先临时把页面文字换成原站的英文，这样字形一致，能直接比；这个校准页只留在本地，**不要提交**。

## 下一步

1. **学原站的动画**（最重要，用户特别强调原站动画自然）。在本机打开 liuaaron.com：
   - 录下滚动、地图切换旅程、鼠标悬停票根、点开和关闭详情的全过程；
   - 逐帧记录元素位置，量出每个动画的时长和缓动曲线；
   - 读原站的 JS 代码，拿到地图飞行参数和可能用到的弹簧参数；
   - 把我们的版本和原站并排录屏对比，对上了才算完成。
   现在地图用的是 Mapbox 默认的 `fitBounds` 动画，还没有做任何校准。
2. 票根详情面板。
3. 按用户发来的实体票照片，一张张做成票根组件。
4. 用真实 GPX 路线替换占位路线。

## 注意

- 票根内部所有尺寸只能用 `cqw`，不能用 `vw`。旧站票根文字溢出，根因就在这里。
- 不要写位移不到 1px 的无限循环动画。
- 中文竖排不要用 `writing-mode`（有些字体会把字叠在一起），用 `<br>` 分行堆叠。

## 验证

```bash
npm test
npm run build
```
