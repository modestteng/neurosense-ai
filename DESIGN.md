# NeuroSense 入口视觉

方向：从密集科研工作区前置一个安静、有空间感的探索入口。参考用户描述的 Gemini 首屏节奏，不复制标识、配色或布局细节。

- 首屏只承担介绍与进入：品牌、两行主标题、开始探索、三类核心能力。
- 深墨色、冷银色与低饱和青色。浅色主按钮作为唯一强操作焦点。
- 自适应大标题、清晰中文、留白；背景为概念性氛围，不代表脑电测量。
- 开始探索指向 `/explore`，保留完整工作区；首页不启动设备、不收集数据。
- 使用具象背景图片，不使用粒子、霓虹、玻璃卡片或无意义动画。
- 首屏保留背景原图，撤去纹理扭动与 WebGL 渲染；仅用 16 秒单程水平镜头缓移，固定缩放比例，不产生呼吸式放大、形变或鼠标跟随。支持暂停、页面隐藏停动、系统减少动态效果。
- 银白主按钮只做细腻材质层次，动态开关保留 44 像素触控高度；不增加装饰内容或改变工作区结构。
- 语音区显示真实启动、实时转写、结束与错误状态；连续结果整段替换而不是重复追加，不自动发送。没有转写时可执行 10 秒本地音量检测，不上传音频；浏览器识别服务不可用时提示系统听写。
- 工作区为一张连贯的仪器操作面，外壳墨黑、工具区石墨色、中央阅读面略亮，冷银主控件、低饱和青色数据。不是重复的浮动卡片。顶部紧凑分段导航对应交互、引擎、记录；摄像头预览和展开功能保留。
- 对话、图示、脑图、设置与历史页共享深色表面；每轮回复只有短暂出现过渡，不让整个工作区持续晃动。
- 精修层：工作区桌面约 238 / 自适应 / 310 像素三列，正文 16 像素、关键控件 14 像素、元信息 12–13 像素。输入控件约 38–40 像素触控高度；对话最大阅读宽度 760 像素。平板先横排输入设备区，手机单列；保留状态切换反馈，不持续晃动工作区。
- `app/atelier.css` 作为统一视觉精修层，覆盖交互、引擎、记录和弹窗；不修改状态、场景、语音或策略业务逻辑。
- 背景资产：`public/neurosense-horizon.png`。内置图像生成工具制作，非 CLI。

## 背景提示词

Use case: stylized-concept. Asset type: fullscreen website background for NeuroSense human-state-aware AI exploration entrance. 16:9 wide cinematic 3D environment, deep ink-black and graphite-blue, an immense calm sculptural landscape of flowing dark metallic silk ridges in lower third, fine silver-blue edge lighting like quiet signal trajectories, a restrained pale ice-blue horizon slightly off-center. Top two thirds almost empty dark atmospheric space, especially center for white headline and central button. Rich material detail, subtle photographic grain, sophisticated scientific product art, contemplative sense of discovery, not outer-space cliche. Only charcoal, silver and low saturation cyan. No text, letters, UI, logos, people, brains, planets, stars, particles, neon, rainbow, purple gradients or glowing orbs. Background is conceptual atmosphere not measured data.
