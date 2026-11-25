# Emoji 语言实验室

面向博物馆、展览空间和公共文化场所的开放式 Emoji 创作应用。五个命题，两条独立支线；没有标准答案、积分、排名或惩罚。

## 启动

要求 Node.js 22.13+。首次运行：

```sh
npm ci
npm run dev
```

打开 http://localhost:5173 。Vite 本地开发使用**浏览器本地演示库**，不会跨设备共享。页面明确标示模式。刷新后点击“继续本次体验”恢复会话、进度和草稿。

完整后端本地验收：

```sh
npm run db:local
npm run dev:full
```

Wrangler 会显示本地 HTTPS/HTTP 地址（默认 localhost:8788）。此模式使用本机 D1 SQLite 模拟数据库，不是正式云数据库。不同浏览器可访问同一个本地服务验证共享。

## 操作

- 开始 → 地图 → 关卡 → 新增方案。点击素材添加，拖动素材到排列区插入；拖动已有图形换序，拖到删除区删除。
- 点击排列项后，可用“左移 / 右移 / 删除”完成不拖拽的编辑。同一种 Emoji 可重复使用。
- 清空、提交、结束体验均需确认。提交中禁止重复触发；失败锁定原草稿和提交 ID，点击“重试保存”。保存得到服务端确认才解锁。
- 01 同时解锁 02、03；02 解锁 04；03 解锁 05。五关完成展示本次全部作品。
- 结束重置个人会话，公共作品保留。公共历史每页六件，顺序保持原样。

## 摄像头

主动点击“启用摄像头”。手掌张开激活光标，拇指食指捏合抓取，保持捏合拖动，松开放置。按钮上稳定捏合再松开点击一次。鼠标和手势都通过同一指针控制器与放置规则处理。

`src/input/gesture.ts` 集中管理镜像、平滑、捏合/松开阈值、防抖、丢手时限和点击移动距离。失焦、离手、切换页面或设备断开取消抓取；识别恢复后必须张开手掌。摄像头跨内部页面复用，关闭或结束体验释放视频轨道。

MediaPipe 模型、WASM 和 JS 自托管，视频与关键点仅在浏览器本地处理，不上传。模型资源已附带；更新依赖后可运行 `node scripts/prepare-assets.mjs` 重新下载。实体摄像头和展馆远距离调参需单独实测，不用合成测试冒充实机结果。

## 工程结构

```text
src/config.ts             命题、素材 ID、上限、前置关系、地图坐标
src/main.tsx              页面流程、地图、作品浏览、确认和回顾
src/navigation.ts         导航状态
src/ui/Editor.tsx         独立 Emoji 编辑器
src/ui/Emoji.tsx          素材与有序作品呈现
src/data/session.ts       匿名会话、草稿与待确认提交
src/data/api.ts           公共 API 与明确标示的本地演示适配
src/input/rules.ts        鼠标/手势共用的插入、换序和删除
src/input/useInput.ts     统一指针控制器
src/input/gesture.ts      可测试的手势状态机与参数
src/input/Camera.tsx      MediaPipe、视频、关键点与手势光标
src/style.css             视觉样式、集中令牌、响应式与减少动态
functions/api/[[path]].ts Pages Functions 服务端校验和只读/新增 API
migrations/               D1 表、索引、禁止改删触发器
public/emoji/             稳定 ID 映射的 Twemoji SVG 与授权
public/vision/            MediaPipe WASM、模型与 Apache 许可
tests/                    分支、输入、会话、手势与 API 验收
```

## Cloudflare Pages + D1

GitHub 独立仓库： https://github.com/hehe1129/emoji-language-lab 。生产分支 `main`。

1. `npx wrangler login`，创建数据库：`npx wrangler d1 create emoji-language-lab`。
2. 将返回的真实数据库 ID 写入 `wrangler.toml`，保持绑定名 **DB**。
3. `npm run db:remote` 初始化正式表和不可修改约束。
4. Cloudflare → Workers & Pages → Create application → Pages → Connect to Git，选择该独立仓库。
5. 生产分支 **main**，构建命令 **npm run build**，输出目录 **dist**，根目录留空。Node 版本 **22** 或更高。
6. 仓库根 `functions/` 自动部署为 Pages Functions；`wrangler.toml` 声明 D1 绑定。生产与预览如需隔离，请使用单独的预览数据库 ID。
7. 打开匿名 HTTPS 页面检查 `/api/status` 返回 `{"mode":"public"}`。缺少绑定或初始化时 API 返回 503，界面阻止开始，不伪装保存成功。

若明确部署纯本地演示，可在 Pages 环境变量设置 `DEMO_MODE=true`，页面显示本地演示，不应以此验收公共库。

`npm run deploy` 适合已有项目的 CLI 直接部署，但首次创建应按上述 Git 集成流程，让 main 推送自动部署。正式 D1 绑定方式遵循 [Cloudflare Pages 官方文档](https://developers.cloudflare.com/pages/functions/bindings/)。

## API 与数据权限

`POST /api/sessions` 创建高熵匿名会话凭证，D1 仅保存凭证 SHA-256。凭证只在当前浏览器存储，不进公开列表。

`GET /api/works?level=01&page=1` 返回有序作品与总数，不返回会话或凭证。`POST /api/works` 需要 Bearer 凭证、会话 ID、提交 UUID、关卡 ID 和有序素材 ID 数组。

后端校验有效关卡、本关素材、1 到本关上限、前置关卡和提交 ID。重复素材合法。一次 SQL 条件插入原子检查前置记录；唯一提交 ID 保证并发重试不重复。已有 ID 用于不同内容或不同会话返回 409。

更新和删除 HTTP 方法返回 405。数据库 UPDATE / DELETE 触发器同时拒绝改删。客户端无数据库访问凭证，无服务端密钥。公开仓库的 D1 ID 和账户 ID 是标识符，不是密钥。

## 测试与状态

```sh
npm test
npm run build
node scripts/test-api.mjs http://localhost:8788
```

实际验收记录见 [TESTING.md](TESTING.md)。本地库、云公共库、摄像头合成逻辑和实体摄像头分别记录。

## 许可

应用代码采用 MIT。Twemoji SVG：Twitter, Inc. 及贡献者，来自 [jdecked/twemoji v17.0.3](https://github.com/jdecked/twemoji/tree/v17.0.3)，[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，原样随包附带。完整图形许可见 `public/emoji/LICENSE-GRAPHICS.txt`。字体 IBM Plex Sans：SIL Open Font License（`public/fonts/OFL.txt`）。MediaPipe 模型和运行资源：Google，Apache 2.0（`public/vision/LICENSE.txt`）。
