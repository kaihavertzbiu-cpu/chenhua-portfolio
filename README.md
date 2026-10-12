# 陈华 · 个人主页

个人项目、游戏制作记录和博客。浅色纸感首页，四项项目展示、文章与相册，以及共享的唱片播放器。

**线上浏览：[huachenblog.netlify.app](https://huachenblog.netlify.app/)**

## 项目

- [FIRST MOVE](https://github.com/kaihavertzbiu-cpu/first-move-roblox)：Roblox 双人回合制策略游戏。
- [RIFT PROTOCOL](https://github.com/kaihavertzbiu-cpu/rift-protocol-roblox)：Roblox 动作 RPG 垂直切片。
- [游戏数据看板](https://github.com/kaihavertzbiu-cpu/game-data-dashboard)：使用合成样本的交互看板。
- [校园停车助手](https://github.com/kaihavertzbiu-cpu/campus-parking-assistant)：课程项目基础上的决策展示原型。

## 源码与运行

- `src/site/`：可编辑的原始页面与前端资源；首页入口为 `src/site/index.html`。
- `public/`：v81 发布文件，页面切换由固定外壳管理，音乐可跨文章连续播放。
- 根目录 `index.html`：可直接打开的单文件展示副本，需要联网播放音频。
- `netlify/functions/` 与 `lib/`：音乐元数据服务；`tests/` 为模拟请求测试。

本地预览：`python -m http.server 8000 --directory public`，浏览 http://localhost:8000/。

## 部署

现有主页部署在 Netlify。本仓库上传不修改线上项目的绑定关系。另行导入 Netlify 时，保留 `netlify.toml`，发布目录为 `public/`；运行 `npm ci && npm test` 检查服务代码。

如需运行音乐服务，在部署平台设置至少 32 位随机 `MUSIC_SIGNING_SECRET`，不要提交密钥或账号 Cookie。它是服务签名密钥，不是网易云账号凭据。测试不访问真实音乐平台。

## 展示范围

本站版本为 v81。公开仓库只保留页面、源码和已用于展示的项目图片，不包含简历原文件、私人材料、内部制作记录或账号凭据。下载歌曲不放入源码仓库；播放配置沿用现有网站的公开资源地址，本仓库不构成音乐再分发包。

游戏数据看板使用合成数据；校园停车助手注明 Team 24 / SYSEN 5151 来源；角色图和宣传插画含 AI 辅助制作。具体来源见 `ATTRIBUTION.md`。

博客文章现仅保留作者原文《实习小录》《英雄联盟局内数值设计》《金铲铲》《射击》，列表仅显示日期与标题。旧项目相册记录已移除。
