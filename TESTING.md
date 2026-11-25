# 实际验收记录

日期：2026-11-25（Asia/Shanghai）。

生产地址：https://emoji-language-lab.pages.dev

源码：https://github.com/hehe1129/emoji-language-lab ，生产分支 main。

## 部署与数据模式

- Cloudflare Pages 的 Git Provider 已连接，main 推送触发构建与生产部署。
- 构建命令 `npm run build`，输出 `dist`，根目录 `functions/` 自动构建为 Pages Functions。
- 正式 D1 绑定为 `DB`，数据库 `emoji-language-lab`，迁移 `0001_initial.sql` 已实际应用。
- 匿名 HTTPS 浏览器能打开，`GET /api/status` 实际返回 HTTP 200、`{"mode":"public"}`。
- Vite 本地开发显示本地演示，数据存于当前浏览器。该模式与生产公共库分开验收。

## 已通过

### 核心逻辑（7 项自动测试）

`npm test` 实际通过。覆盖两种完整支线顺序、初始只有 01、01 同时打开 02/03、04 和 05 独立前置、仅保存结果更新进度、草稿和 pending ID 清理、重复素材、插入、双向换序、删除、空序列/超限/非法素材拦截。

合成手部关键点覆盖张掌激活、捏合防抖、不同捏合/松开阈值、离手取消与重新张掌、镜像和平滑。

### 实际 API（正式 D1 27 项，本地 D1 同样通过）

`node scripts/test-api.mjs https://emoji-language-lab.pages.dev` 实际通过：

- 未完成前置关卡返回 403；空序列、超上限、非法素材、无效关卡返回 400。
- 四个并发请求使用同一提交 ID，均返回同一作品，仅增加一条记录。
- 同 ID 改内容或跨会话复用返回 409；重复 Emoji 合法且顺序保持原样。
- PUT、PATCH、DELETE 返回 405；公开列表不含匿名会话凭证。
- 两条支线按 01 → 03 → 05 → 02 → 04 完成；个人恢复读取五份作品。
- 新匿名会话不继承旧进度，旧公共作品仍可读取；他人凭证不能读取个人回顾。
- 正式数据库执行 `UPDATE works SET sequence=sequence ...` 也被触发器拒绝，返回 `Published works are immutable`。该验证没有改变作品内容。

### 浏览器与鼠标（21 项）

Playwright CLI 在未登录浏览器、正式 HTTPS 地址实际执行五关流程：

- 新会话只开放 01，01 提交后同时开放两支线，03 不会解锁 04。
- 点击重复添加、鼠标拖入、插入到中间、已有项换序、拖入删除区、点击左移均验证。
- 空序列禁提交；第七项被拦截；清空取消保留，清空确认移除。
- 取消提交不解锁。
- 模拟“服务端已写入，但客户端收到 503”：界面保留原草稿与提交 ID，不解锁；重试只产生一份作品。
- 刷新后恢复当前编辑关卡和草稿。
- 五关完成显示个人完整回顾；结束重置后只开放 01，公共作品保留。
- 390、768、1440 宽度的布局检查；窄屏保留两支线，页面无横向溢出。

### 公共库跨会话共享

两个独立浏览器上下文分别创建匿名会话。A 通过界面提交后，B 的历史列表可读取并渲染该作品；B 的个人已完成进度仍为空。此为真实正式 D1 的跨浏览器共享测试，未以 localStorage 冒充。

### 手势、跨会话共享与摄像头逻辑（15 项）

正式页面的合成手势指针验收通过：稳定捏合/松开点击、重复添加、拖入、拖删除、失焦取消、拖拽经过提交按钮不误点击、捏合途中移出再回到按钮不触发点击、确认前不解锁、确认保存、地图导航与结束重置。

浏览器实际加载自托管 MediaPipe JS、WASM、模型，并对测试图像完成一次推理（无手，返回 0 个关键点组）。摄像头拒绝授权模拟返回可理解提示，鼠标仍可用。

### 构建、视觉与依赖

- `npm run build`：TypeScript 检查与 Vite 构建通过。
- `npm audit`：安装修复后的依赖为 0 漏洞；`npm audit --omit=dev` 同样为 0。
- 设计机械检测无问题；正式网页在 1440、768、390 宽度的 inspector 为 0 FAIL。展览开始页大标题和留白保留为有意设计，检测器有 2 个对应 WARN。

## 尚未验证 / 使用边界

- **未进行实体摄像头真人手势实测**，未验证展馆距离、现场光照、不同肤色/遮挡条件下的识别灵敏度。
- 尚未在两台物理设备和展馆实际大屏上验收；跨设备需求已用两个独立浏览器会话验证公共数据共享。
- 浏览器摄像头授权弹窗必须由用户或现场工作人员处理。浏览器要求 localhost 或 HTTPS。
- 没有后台编辑/删除作品的游客权限；正式作品不可修改删除是有意的数据约束。

## 复测

```sh
npm ci
npm test
npm run build
node scripts/test-api.mjs https://emoji-language-lab.pages.dev
npx --yes --package @playwright/cli playwright-cli -s=accept open https://emoji-language-lab.pages.dev --headed
npx --yes --package @playwright/cli playwright-cli -s=accept run-code --filename=tests/browser-flow.js
npx --yes --package @playwright/cli playwright-cli -s=extra open https://emoji-language-lab.pages.dev --headed
npx --yes --package @playwright/cli playwright-cli -s=extra run-code --filename=tests/browser-extra.js
```

线上测试会创建真实匿名作品且保留。日常开发复测建议将脚本里的 base 改为本地完整后端地址。
