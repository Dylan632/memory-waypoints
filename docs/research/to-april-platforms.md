# 《To April》正规平台与网页嵌入调研

核验日期：2026-07-13。目标曲目为 Shan Gao（高姗）的《To April》，Spotify track ID 为 `3ikk4wT6AIhOCtXBsZd0YO`。以下只记录官方曲目页、官方播放器和官方开发者文档；实际播放结果以未登录浏览器复测为准。

| 平台 | 官方曲目 | 网页嵌入 | 完整播放与限制 | 自动播放 |
| --- | --- | --- | --- | --- |
| Spotify | [曲目页](https://open.spotify.com/track/3ikk4wT6AIhOCtXBsZd0YO) | 支持官方 [Track Embed](https://open.spotify.com/embed/track/3ikk4wT6AIhOCtXBsZd0YO)，也有 [oEmbed](https://open.spotify.com/oembed?url=https%3A%2F%2Fopen.spotify.com%2Ftrack%2F3ikk4wT6AIhOCtXBsZd0YO) 和 [嵌入说明](https://developer.spotify.com/documentation/embeds/tutorials/creating-an-embed)。 | 未登录实测显示 `Preview`，播放约 29 秒后提示前往 Spotify 听完整歌曲。完整播放依赖 Spotify 登录/服务状态；官方还说明浏览器或 iframe 缺少加密媒体权限时只能播放不足 30 秒的预览，见 [排障文档](https://developer.spotify.com/documentation/embeds/tutorials/troubleshooting)。 | 不能保证。官方 [iFrame API](https://developer.spotify.com/documentation/embeds/references/iframe-api) 明确说明，浏览器可能阻止没有用户操作的 `play()`。 |
| QQ 音乐 | [曲目页](https://y.qq.com/n/ryqq/songDetail/004bNJ8m3kiJAE) | 支持官方 [外链播放器](https://i.y.qq.com/n2/m/outchain/player/index.html?songid=101819133&songtype=0)。播放器返回《To April》—高姗、总时长 `03:52`，并标记 `pay_play=0`。 | 未登录实测可从 `00:00` 连续播放到 `00:34`，已越过常见的 30 秒试听限制；当前可按完整曲目处理，不要求订阅。平台仍可能按地区、版权或后续策略调整。 | 不会自动开始；打开后停在 `00:00`，需要访客点击播放。 |
| Apple Music | [曲目页](https://music.apple.com/us/album/to-april-single/1232434347?i=1232434358) | 支持官方嵌入播放器。Apple 的 [Marketing Tools 说明](https://artists.apple.com/support/1117-apple-music-marketing-tools) 提供生成嵌入代码的步骤。 | 官方说明：未登录访客只能听 30 秒；已登录且具备 Apple Music 订阅访问权限的用户可在嵌入播放器内听完整歌曲。 | 官方播放器按点击启动，不应依赖页面加载后自动播放。 |
| Amazon Music | [曲目页](https://music.amazon.com.au/tracks/B072BGSNDY) | 已确认曲目存在，但未找到面向普通网站的公开复制粘贴式播放器。Amazon 官方 [开发者入口](https://developer.amazon.com/docs/music/landing_home.html) 与 [Web Playback 概览](https://developer.amazon.com/docs/music/API_playback_overview.html) 均标明播放 API 仍是 closed beta。 | 未登录曲目页显示 `Preview`；完整、点播式播放受 Amazon 账号和 Free、Prime、Unlimited 等方案限制，见 [官方 FAQ](https://www.amazon.com/music/i/faq)。 | 没有可用于本项目的公开嵌入方案，因此不适用。 |

## 未纳入的平台

本次没有找到《To April》在 YouTube、YouTube Music 或 SoundCloud 上可由第一方页面确认的官方上传，因此不把搜索结果中的转载、用户上传或聚合下载页列为可用来源。

## 结论

- 如果目标是访客无需登录、直接在网页内听超过 30 秒，当前最合适的是 QQ 音乐官方外链播放器，但应接受地区和版权状态未来可能变化。
- 如果优先考虑海外可访问性与平台认知度，Spotify 最稳妥，但未登录访客目前只能试听约 29 秒；Apple Music 的匿名嵌入同样只有 30 秒。
- Amazon Music 有正规曲目页，但公开播放 API 尚未开放，不适合作为当前静态网站的嵌入方案。
- 无论选择哪家平台，都不应把“进入页面即有声自动播放”作为可靠功能；应提供明确的播放按钮，让访客主动开始。
