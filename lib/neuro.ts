export const scenes = ['学习', '驾驶', '办公', '职业培训', '客服', '游戏 / VR', '工业安全', '智能陪伴'] as const;
export type Scene = typeof scenes[number];
export const scenarios = ['normal', 'confused', 'frustrated', 'fatigued', 'recovered'] as const;
export type Scenario = typeof scenarios[number];
export type Mode = 'demo' | 'live';
export type Visual = 'text' | 'diagram' | 'animation' | 'steps';
export type Topic = 'gcn' | 'matrix' | 'attention' | 'scene' | 'other';
export interface HumanState { attention: number; confusion: number; fatigue: number; load: number; frustration: number; engagement: number; confidence: number; emotion: string; trend: string }
export interface Dialogue { confusion: number; frustration: number; fatigue: number; recovery: boolean; repeated: boolean; intent: string }
export interface Snapshot { scenario: Scenario; human: HumanState; dialogue: Dialogue; eeg: { positive: number; neutral: number; negative: number; confidence: number; frontal: number; temporal: number; graphChange: number; stability: number; embedding: number[] }; vision: { attention: number; fatigue: number; affect: string }; weights: number[] }
export interface Policy { strategy: string; reason: string; difficulty: string; length: string; tone: string; formula: string; visual: Visual; rest: boolean; safety: boolean; ask: boolean; voice: boolean }
export interface Reply { text: string; topic: Topic; steps: string[]; question?: string; options?: string[]; correct?: number; source: 'demo' | 'deepseek' | 'safety'; citations?: string[] }
export interface Turn { id: string; question: string; reply: Reply; snapshot: Snapshot; policy: Policy; time: string; scene: Scene; feedback?: 'yes' | 'no' }
export interface Knowledge { id: string; name: string; text: string; pages?: number }
export const labels: Record<Scenario,string> = { normal:'平稳', confused:'困惑', frustrated:'烦躁', fatigued:'疲劳', recovered:'恢复' };
export const profiles: Record<Scene,{focus: string; threshold: number; weights: number[]; action: string; prompts: string[]; intro: string}> = {
  学习:{focus:'理解程度 · 认知负荷 · 专注',threshold:.7,weights:[.25,.4,.35],action:'调整解释难度',prompts:['为什么 GCN 需要邻接矩阵？','讲一下矩阵乘法','注意力机制是什么？'],intro:'从一个问题开始，让解释跟上你的理解节奏。'},
  驾驶:{focus:'疲劳 · 注意力 · 视线',threshold:.62,weights:[.55,.35,.1],action:'安全提醒优先',prompts:['我有点疲劳','减少不必要的信息','我已经安全停车'],intro:'驾驶交互演示。请在停车状态操作屏幕。'},
  办公:{focus:'信息负荷 · 工作节奏 · 疲劳',threshold:.75,weights:[.3,.3,.4],action:'压缩任务信息',prompts:['帮我整理今天的任务','事情太多了，怎么排序？','总结当前讨论'],intro:'整理任务、减少信息负担，找到下一步。'},
  职业培训:{focus:'操作理解 · 训练负荷 · 错误',threshold:.65,weights:[.35,.35,.3],action:'分步提示与确认',prompts:['开始操作流程训练','这个步骤没理解','暂停训练'],intro:'逐步练习，每一步都可以确认、回退或暂停。'},
  客服:{focus:'重复沟通 · 烦躁 · 解决进度',threshold:.72,weights:[.15,.3,.55],action:'缩短沟通路径',prompts:['我的问题一直没解决','帮我整理转人工摘要','不要再重复问了'],intro:'记录问题与已尝试的方法，减少重复沟通。'},
  '游戏 / VR':{focus:'紧张程度 · 疲劳 · 沉浸',threshold:.7,weights:[.3,.5,.2],action:'建议调整节奏',prompts:['我感觉有点紧张','降低难度','继续挑战'],intro:'根据体验调整建议。设备控制需接入游戏接口。'},
  工业安全:{focus:'疲劳 · 注意力 · 操作风险',threshold:.6,weights:[.5,.4,.1],action:'安全规则优先',prompts:['现在很疲劳','开始安全检查','暂停当前任务'],intro:'风险提示演示。操作应遵循现场规程与负责人指示。'},
  智能陪伴:{focus:'表达意愿 · 情绪语义 · 疲劳',threshold:.75,weights:[.2,.25,.55],action:'跟随交流意愿',prompts:['你好，聊一会儿吧','今天有点累','我想说说今天的事'],intro:'可以慢慢说，也可以随时暂停。'},
};
const baseline: Record<Scenario,number[]> = {
  normal:[.82,.18,.16,.29,.13,.81,.12], confused:[.58,.73,.27,.67,.4,.59,.52],
  frustrated:[.46,.85,.35,.83,.78,.42,.76], fatigued:[.33,.45,.86,.7,.43,.3,.55], recovered:[.85,.17,.19,.33,.14,.87,.08],
};
export const clamp=(n:number)=>Math.max(0,Math.min(1,Number.isFinite(n)?n:0));
const confusionExpression=/(?:没|不)(?:有)?(?:太|完全|怎么|能)?(?:理解|明白|懂)|理解不了|没听懂|看不懂|太复杂|简单一点|换.*方式|还是不/;
export const simulationPrompts:Record<Scenario,string>={normal:'请按正常难度继续解释。',confused:'这一步没太懂，请简单一点。',frustrated:'还是不懂，太复杂了，请换一种方式。',fatigued:'我有点累，请暂停一下。',recovered:'我理解了，请继续。'};
export function understand(text: string, history: string[] = []): Dialogue {
  const confused=confusionExpression.test(text);
  const recovery=!confused&&/懂了|明白了|理解了|好多了|会了/.test(text);
  const repeated=confused&&history.slice(-3).some(t=>confusionExpression.test(t));
  return {confusion:confused?(repeated?.96:.84):.16,frustration:/烦|生气|受不了|重复|崩溃/.test(text)?.9:repeated?.75:confused?.5:.12,fatigue:/累|疲劳|困了|休息/.test(text)?.9:.15,recovery,repeated,intent:recovery?'理解确认':repeated?'连续理解受阻':confused?'请求简化':/你好|您好|嗨/.test(text)?'问候交流':/暂停|休息/.test(text)?'暂停任务':'提出问题'};
}
export function fuse(scene: Scene, scenario: Scenario, dialogue: Dialogue, windowIndex=0): Snapshot {
  const [attention,confusion,fatigue,load,frustration,engagement,negative]=baseline[scenario];
  const weights=profiles[scene].weights;
  const [wv,we,wd]=weights;
  const cognitive=clamp(confusion*(wv+we)+dialogue.confusion*wd);
  const tired=clamp(fatigue*(wv+we)+dialogue.fatigue*wd);
  const frust=clamp(frustration*(wv+we)+dialogue.frustration*wd);
  const positive=scenario==='recovered'?.72:scenario==='normal'?.22:.09;
  return {scenario,dialogue,weights,vision:{attention,fatigue,affect:scenario==='frustrated'?'皱眉示例':scenario==='fatigued'?'低头示例':'自然示例'},
    eeg:{positive,negative,neutral:1-positive-negative,confidence:.88,frontal:clamp(negative+.1),temporal:clamp(negative*.8+.13),graphChange:clamp(.17+negative*.7),stability:scenario==='normal'?.89:.64,embedding:Array.from({length:48},(_,i)=>Number((Math.sin(i*.8+negative*3+windowIndex*.08)*.6).toFixed(3)))},
    human:{attention,confusion:cognitive,fatigue:tired,load:clamp(load*.65+cognitive*.25+frust*.1),frustration:frust,engagement,confidence:clamp(.76+.1*(1-Math.abs(confusion-dialogue.confusion))),emotion:scenario==='recovered'?'状态恢复':tired>.65?'疲劳偏高':cognitive>.65?'持续困惑':frust>.6?'烦躁偏高':'状态平稳',trend:scenario==='recovered'?'改善':scenario==='normal'?'稳定':'需要关注'}};
}
export function decide(scene: Scene, state: HumanState, preference: 'auto' | Visual='auto'): Policy {
  const safety=(scene==='驾驶'||scene==='工业安全')&&(state.fatigue>profiles[scene].threshold||state.attention<.45);
  const rest=state.fatigue>.65;
  const reduce=state.confusion>.57||state.load>.65||state.frustration>.6;
  const strategy=safety?'安全提醒优先':rest?'暂停并降低信息量':reduce?(scene==='客服'?'减少重复沟通':'降低认知负荷'):scene==='办公'?'提取任务与优先级':scene==='职业培训'?'逐步操作确认':state.engagement>.83?'巩固理解后进阶':profiles[scene].action;
  return {strategy,reason:safety?'注意力或疲劳达到场景风险阈值':rest?'疲劳高于 65%，建议先恢复状态':reduce?'困惑或认知负荷偏高，减少当前轮的信息量':'当前状态允许保持交流节奏',difficulty:reduce?'基础':'适中',length:safety?'一句话':reduce||rest?'简短':'标准',tone:reduce?'耐心支持':'清晰自然',formula:reduce?'不使用':'按需',visual:safety||rest?'text':preference!=='auto'?preference:reduce&&scene==='学习'?'diagram':scene==='职业培训'||scene==='办公'?'steps':'text',rest,safety,ask:!safety&&!rest,voice:scene==='驾驶'};
}
export function topicOf(message:string, prior:Topic='other'):Topic {
  if(/GCN|邻接|图卷积|节点/i.test(message))return 'gcn';
  if(/矩阵|乘法/.test(message))return 'matrix';
  if(/注意力机制|attention|QKV/i.test(message))return 'attention';
  if(/你好|您好|嗨|天气|是谁|名字/.test(message))return 'other';
  if(confusionExpression.test(message)||/还是|继续|简单|懂了|明白|换.*方式|例子|公式|动画|为什么|再讲/.test(message))return prior;
  return 'other';
}
export function retrieve(message:string, docs:Knowledge[]) {
  const tokens=message.toLowerCase().match(/[a-z]{2,}|[\u4e00-\u9fff]{2}/g)??[];
  return docs.flatMap(d=>d.text.match(/[\s\S]{1,600}/g)?.map((text,index)=>({name:d.name,text,index,score:tokens.reduce((score,t)=>score+(text.toLowerCase().includes(t)?t.length:0),0)}))??[]).filter(c=>c.score>0).sort((a,b)=>b.score-a.score).slice(0,3);
}
export function demoReply(message:string, scene:Scene, snapshot:Snapshot, policy:Policy, prior:Topic='other', docs:Knowledge[]=[]):Reply {
  let topic=topicOf(message,prior);
  const base:Reply={text:'',topic,steps:[],source:policy.safety?'safety':'demo'};
  if(policy.safety)return {...base,text:scene==='驾驶'?'疲劳或注意力指标触发了演示安全规则。请在安全地点停车休息。':'当前状态触发了演示安全规则。请按现场规程暂停操作，并联系负责人。',topic:'scene'};
  if(/^(你好|您好|嗨|hello|hi)[！!。，\s]*$/i.test(message.trim()))return {...base,topic:'other',text:`你好，我是 NeuroSense。你可以告诉我想解决的问题，也可以点击“完整演示”，体验状态变化如何改变交流方式。`};
  if(/你是谁|名字|能做什么/.test(message))return {...base,text:'我是 NeuroSense 多模态交互平台。当前演示可讲解 GCN、矩阵乘法和注意力机制，也能演示不同场景的状态适配。自由问答需要接入生成服务。'};
  if(policy.rest)return {...base,text:'我们先停一下。当前演示指标提示疲劳偏高，可以休息片刻，准备好后点击状态模拟台中的“恢复”。我会保留本次对话。'};
  const hits=retrieve(message,docs);
  if(hits.length&&/资料|文档|文件|根据|总结/.test(message))return {...base,text:`在本次资料中检索到以下相关原文：\n\n${hits.map(h=>h.text.slice(0,policy.length==='简短'?160:320)).join('\n\n')}\n\n以上为关键词检索摘录，未调用大模型生成总结。`,citations:hits.map(h=>`${h.name} · 片段 ${h.index+1}`)};
  if(scene!=='学习'){
    const examples:Record<string,string[]>={办公:['列出待办事项和截止时间','优先处理有明确截止时间的任务','每次专注一个任务，再检查结果'],职业培训:['确认任务与防护要求','按规程完成当前一步','核对结果，再进入下一步'],客服:['描述尚未解决的问题','整理已经尝试的方法','携带摘要联系人工客服'], '游戏 / VR':['暂停高强度挑战','降低难度或刺激强度','状态恢复后再逐渐提高'],工业安全:['确认设备与防护状态','遵循现场标准操作规程','有风险时停止并联系负责人'],驾驶:['停车后设置交互','行驶中减少屏幕操作','疲劳时在安全地点休息'],智能陪伴:['说说今天发生了什么','选择想聊的事情','按你舒服的节奏继续']};
    return {...base,topic:'scene',text:scene==='客服'?'我可以帮你整理问题与已尝试的步骤，便于后续联系人工客服。此演示不会实际查询订单或转接人员。':scene==='办公'?'我们先把任务拆小。请补充任务清单与截止时间，我会围绕这些信息继续；下面是演示中的整理顺序。':scene==='智能陪伴'?'我在。你想说说今天发生了什么，还是先轻松聊几句？':`当前采用“${policy.strategy}”。以下是${scene}场景的交互建议，未向外部设备发送控制指令。`,steps:examples[scene]??[]};
  }
  const simple=policy.formula==='不使用';
  if(topic==='gcn')return {...base,text:snapshot.dialogue.recovery?'看来“谁向谁传信息”的解释有帮助。我们先用一道小题确认，再增加一点难度。':simple?'先不看公式。把 A、B、C 想成三位同学，邻接矩阵就是一张“可以和谁交流”的名单。GCN 按这份名单收集邻居的信息，再更新自己。': '邻接矩阵记录图中哪些节点相连。GCN 用它决定每个节点从哪些邻居接收信息，再聚合这些信息、更新节点表示。通常还会加入自环，并对连接进行归一化，避免度数不同造成尺度差异。',steps:['保留每个节点自己的信息','按连接关系读取邻居信息','聚合邻居与自身信息并更新'],question:'在 A—B—C 中，B 的邻居是谁？',options:['只有 A','A 和 C','只有 C'],correct:1};
  if(topic==='matrix')return {...base,text:simple?'把矩阵乘法看成算一张购物清单的总价：左边一行是数量，右边一列是单价。对应相乘，再把结果加起来。': '矩阵乘法用“左矩阵的一行”与“右矩阵的一列”计算一个结果。对应元素相乘后求和。左矩阵的列数必须等于右矩阵的行数。比如 [2, 3] 与 [4, 5]ᵀ 相乘，结果是 2×4 + 3×5 = 23。',steps:['选择左边的一行与右边的一列','把对应位置的数字相乘','将乘积相加，填入结果位置'],question:'[2, 3] 与 [4, 5]ᵀ 相乘是多少？',options:['14','23','32'],correct:1};
  if(topic==='attention')return {...base,text:simple?'注意力机制像查资料：先带着一个问题，再看哪些资料最相关，最后把相关内容按重要程度组合起来。': '注意力机制通过查询 Q 与键 K 的匹配得到权重，再对值 V 加权汇总。它让模型根据当前上下文，选择更相关的信息。Q 是当前要找什么，K 是每条信息的索引，V 是信息本身。',steps:['查询：现在需要什么信息？','匹配：哪些内容更相关？','汇总：按相关程度组合内容'],question:'注意力权重主要决定什么？',options:['信息的重要程度','文本的字体','节点的颜色'],correct:0};
  return {...base,topic:'other',text:'这个问题不在本地演示的知识范围内，我不会用固定的 GCN 回答替代。你可以体验“GCN 邻接矩阵”“矩阵乘法”“注意力机制”，或在生成服务配置后切换到真实问答。'};
}
