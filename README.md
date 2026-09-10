# NeuroSense AI

面向竞赛演示的多模态人因状态感知自适应交互平台。React + TypeScript + Vinext，展示版部署于 GitHub Pages，完整服务保留 Cloudflare Workers 兼容运行时；现有 FastAPI 示例保留在 `backend/`，服务端接口位于 `app/api/chat/route.ts`。

## 在线展示（GitHub Pages）

- 网站：https://modestteng.github.io/neurosense-ai/
- 工作区：https://modestteng.github.io/neurosense-ai/explore/
- 公开源码：https://github.com/modestteng/neurosense-ai

网页由 GitHub Pages 托管，提供交互演示、模拟状态图表、摄像头本地预览、会话导出与 PDF/TXT/Markdown 文字提取。真实问答通过 Cloudflare Workers 聊天后端调用 DeepSeek，检测到服务可用后默认选择在线生成，也可在设置中选择本地演示。状态与回答的演示逻辑复用现有模块。页面、脚本、图片和 PDF Worker 均由本站提供，字体使用本机系统字体，不依赖 Google Fonts 或外部 CDN。浏览器语音识别仍取决于浏览器厂商服务和网络支持。

```powershell
npm ci
npm run dev:pages
npm run build:pages
npm run preview:pages
```

GitHub Pages 使用 `/neurosense-ai/` 子路径，首页与 `explore/index.html` 分别构建，直接访问或刷新工作区均可使用。构建输出为 `dist-pages/`。源码保存在 `main`，网页构建产物发布到 `gh-pages`，Pages 的发布来源设置为该分支根目录。

更新网站时，先提交源码并推送到 `main`，再运行 `npm run deploy:pages`。此命令会重新构建并通过 `gh-pages` 工具推送网页，GitHub 随后自动发布。首次在另一台电脑使用时，先完成 GitHub 登录（`gh auth login`、`gh auth setup-git`）。不需要购买服务器或填写额外托管平台密钥。

国内访问速度与可达性取决于运营商和当地网络，GitHub Pages 与后端的 workers.dev 域名均不保证中国大陆稳定直连。此部署不需要另租服务器。

## 完整服务的本地运行

```powershell
npm install
npm run dev
```

打开终端返回的本地网址。生产构建：`npm run build`。类型检查：`npx tsc --noEmit --incremental false`。保持本地服务运行后执行 `node --experimental-strip-types --test tests/engine.test.mjs tests/api.test.mjs tests/speech.test.mjs`，覆盖状态闭环、接口与语音控制器。

首页 `/` 是沉浸式探索入口，“开始探索”进入 `/explore` 工作区。首页不会启动摄像头、麦克风或状态模拟定时器。界面方向及背景来源见 `DESIGN.md`。

## 当前可用

- 8 个场景配置，手动场景优先、模拟视觉场景冲突提示。
- 摄像头本地视频预览、拍照、放大、断开与重试。照片不上传。
- GCN、矩阵乘法、注意力机制的本地适配讲解，其他话题明确提示演示边界。
- 连续语义规则分析 → 场景加权融合 → 独立策略 → 文本、图示、动画、步骤与测验。
- 4 步学习演示、5 种状态模拟、动态通道图、48 维模拟嵌入、30/60 秒状态趋势。
- 浏览器语音转写、朗读、反馈；不支持的浏览器显示明确错误。
- PDF/TXT/Markdown 本地文字提取与关键词片段检索；PPT 请先导出 PDF，扫描型 PDF 尚无 OCR。
- 当前会话跨场景记录、JSON 导出与清除，最多保留最近 40 轮；切换场景开启独立对话上下文，旧记录仍可查看。刷新不保留数据。
- 每轮回答可展开感知依据、融合判断及输出策略快照。历史测验仅供练习，不修改当前状态。

## 真实生成

独立聊天后端入口为 `worker/chat.ts`，通过 `wrangler.chat.jsonc` 配置；它复用现有 `app/api/chat/route.ts`，不复制状态分析、融合和回答策略。只允许本项目 GitHub Pages 所在源的浏览器跨域请求，并配置每 IP、每 Cloudflare 节点每分钟 10 次请求限制。这是公开演示接口，来源检查与限流不等同于用户认证或全局费用上限。

本地密钥放在被 Git 忽略的 `.dev.vars`，变量名为 `DEEPSEEK_API_KEY`。`npm run dev:api` 启动本地接口；完成 Cloudflare 登录后，`npm run deploy:api` 将代码和密钥上传至后端，密钥作为 Secret 保存。把部署返回的 `/api/chat` 地址写到 `pages/config.ts` 的 `CHAT_API_URL`，再运行 `npm run deploy:pages`，网页即可调用后端。该地址为空时保持纯本地演示；后端已配置时网页自动选择在线生成，在线请求失败会显示错误，不冒充真实回答。

完整服务通过服务端环境变量设置 `DEEPSEEK_API_KEY`，`DEEPSEEK_MODEL` 默认为 `deepseek-v4-flash`。本地 Cloudflare 调试使用未跟踪的 `.dev.vars`（键名同 `.env.example`）；FastAPI 示例使用操作系统环境变量。禁止将密钥放到任何 `NEXT_PUBLIC_` 变量或客户端代码。

前端从 `GET /api/chat` 查询是否配置，通过 `POST /api/chat` 请求生成。后端校验输入、重算融合和策略、优先执行安全规则，再请求 DeepSeek。失败不会偷偷退回模拟并冒充真实回答。调用格式参考 [DeepSeek 官方接口文档](https://api-docs.deepseek.com/api/create-chat-completion/)。

GitHub Pages 不保存生产密钥，真实生成密钥仅保存在本地被忽略的配置与 Cloudflare 后端 Secret 中。访客的在线问答会消耗 DeepSeek 用量；当前的节点限流不能替代全局费用配额。

## 技术边界与扩展

`/api/vision/scene`、`/api/vision/state`、`/api/eeg/state`、`/api/eeg/embedding`、`/api/eeg/graph`、`/api/fusion/state`、`/api/policy/decision`、`/api/session/state`、`/api/simulation/scenario` 提供可调用的模拟契约，统一返回数据来源；真实感知模式返回 503。可用 GET 查询参数或 POST JSON 传入中文 `scene`、`scenario` 与 `message`。会话接口无服务端持久化，不读取前端私有会话；设备 WebSocket 流尚未接入。

`lib/neuro.ts` 是带类型的场景、对话分析、模拟感知、融合、策略与示例回答核心。模块独立，不向模型发送原始脑电。TCG-3DNet 图目前是架构示意与模拟结果，未实现或加载该论文模型的 PyTorch 权重。真正的脑电推理应由设备服务返回状态嵌入和动态边权，替换 `fuse` 的模拟输入；视觉服务同理。不要把模拟置信度当成经校准的识别准确率。

`components/neuro/` 分离摄像头、动态脑图、响应呈现、设置、技术与历史视图。`services/knowledge.ts` 提取资料，`app/api/chat/route.ts` 执行服务器生成。旧版未使用的页面样式已清理。旧 OpenAI Sites 部署关联已从源码移除；展示部署使用 GitHub Pages。完整服务端代码保留供后续扩展，不会打包进静态展示站。
