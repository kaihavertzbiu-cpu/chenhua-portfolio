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
- `public/`：v90 发布文件，页面切换由固定外壳管理，音乐可跨文章连续播放。
- 根目录 `index.html`：可直接打开的单文件展示副本，需要联网播放音频。
- `netlify/functions/` 与 `lib/`：音乐元数据服务；`tests/` 为模拟请求测试。

本地预览：`python -m http.server 8000 --directory public`，浏览 http://localhost:8000/。

## 部署

现有主页部署在 Netlify。本仓库上传不修改线上项目的绑定关系。另行导入 Netlify 时，保留 `netlify.toml`，发布目录为 `public/`；运行 `npm ci && npm test` 检查服务代码。

如需运行音乐服务，在部署平台设置至少 32 位随机 `MUSIC_SIGNING_SECRET`，不要提交密钥或账号 Cookie。它是服务签名密钥，不是网易云账号凭据。测试不访问真实音乐平台。

## 展示范围

本站版本为 v90。公开仓库只保留页面、源码和已用于展示的项目图片，不包含简历原文件、私人材料、内部制作记录或账号凭据。下载歌曲不放入源码仓库；播放配置沿用现有网站的公开资源地址，本仓库不构成音乐再分发包。

游戏数据看板使用合成数据；校园停车助手注明 Team 24 / SYSEN 5151 来源；角色图和宣传插画含 AI 辅助制作。具体来源见 `ATTRIBUTION.md`。

博客文章现仅保留作者原文《实习小录》《英雄联盟局内数值设计》《金铲铲》《FPS和SLG》《洛克王国世界和王者荣耀世界》《数值笔记》《AI策划团队讲座》，列表仅显示日期与标题。旧项目相册记录已移除。

相册收录作者提供的12张生活照片，按月份倒序排列；点击查看原图及作者配文。首页简介按作者最新原文更新。

两款游戏的介绍改为玩法说明：先攻介绍选人、先手与攻防；裂隙协议介绍破韧、处决、爆发和副本。首页对应标签只保留游戏类型。

先攻介绍页页脚不再展示日期；首页两款游戏统一标题、正文和标签字号，删除先攻卡片下方试玩说明。

两篇作者文章按原句修订；金铲铲段位截图移至文末，等级经验表和图注保留。

首页简介、实习小录开头及双世界文章的动画跳过建议按作者新原句更新。
