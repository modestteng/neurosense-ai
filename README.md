# NeuroSense AI

面向竞赛演示的多模态人因状态感知自适应交互平台。React + TypeScript + Vinext，部署为 Cloudflare Worker；现有 FastAPI 示例保留在 `backend/`，线上使用 `app/api/chat/route.ts`。

## 运行

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

通过 Sites 的服务端环境变量设置 `DEEPSEEK_API_KEY`，`DEEPSEEK_MODEL` 默认为 `deepseek-v4-flash`。本地 Cloudflare 调试使用未跟踪的 `.dev.vars`（键名同 `.env.example`）；FastAPI 示例使用操作系统环境变量。禁止将密钥放到任何 `NEXT_PUBLIC_` 变量或客户端代码。

前端从 `GET /api/chat` 查询是否配置，通过 `POST /api/chat` 请求生成。后端校验输入、重算融合和策略、优先执行安全规则，再请求 DeepSeek。失败不会偷偷退回模拟并冒充真实回答。调用格式参考 [DeepSeek 官方接口文档](https://api-docs.deepseek.com/api/create-chat-completion/)。

当前没有生产密钥，公开站点默认本地演示。配置密钥代表开放站点访客可能产生用量，请在正式开放真实生成前配置访问控制和部署层限流；当前仅有单实例每分钟请求限制，不能替代分布式配额。

## 技术边界与扩展

`/api/vision/scene`、`/api/vision/state`、`/api/eeg/state`、`/api/eeg/embedding`、`/api/eeg/graph`、`/api/fusion/state`、`/api/policy/decision`、`/api/session/state`、`/api/simulation/scenario` 提供可调用的模拟契约，统一返回数据来源；真实感知模式返回 503。可用 GET 查询参数或 POST JSON 传入中文 `scene`、`scenario` 与 `message`。会话接口无服务端持久化，不读取前端私有会话；设备 WebSocket 流尚未接入。

`lib/neuro.ts` 是带类型的场景、对话分析、模拟感知、融合、策略与示例回答核心。模块独立，不向模型发送原始脑电。TCG-3DNet 图目前是架构示意与模拟结果，未实现或加载该论文模型的 PyTorch 权重。真正的脑电推理应由设备服务返回状态嵌入和动态边权，替换 `fuse` 的模拟输入；视觉服务同理。不要把模拟置信度当成经校准的识别准确率。

`components/neuro/` 分离摄像头、动态脑图、响应呈现、设置、技术与历史视图。`services/knowledge.ts` 提取资料，`app/api/chat/route.ts` 执行服务器生成。旧版未使用的页面样式已清理。公开访问权限由 Sites 管理，项目 id 保留在 `.openai/hosting.json`。
