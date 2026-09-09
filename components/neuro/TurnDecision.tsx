import type { Turn } from '@/lib/neuro';

const outputNames = { text: '文字', diagram: '图示', animation: '动画', steps: '步骤' };
const percentage = (value: number) => `${Math.round(value * 100)}%`;

export function TurnDecision({ turn }: { turn: Turn }) {
  const { snapshot, policy } = turn;
  return <div className="turn-decision">
    <div className="decision-caption"><span>本轮生成时的依据</span><span>{turn.scene} · {turn.time}</span></div>
    <dl className="decision-evidence">
      <div><dt>视觉 · 模拟</dt><dd>注意力 {percentage(snapshot.vision.attention)}</dd></div>
      <div><dt>脑电 · 模拟</dt><dd>消极状态 {percentage(snapshot.eeg.negative)}</dd></div>
      <div><dt>对话 · 规则分析</dt><dd>{snapshot.dialogue.intent}</dd></div>
    </dl>
    <div className="decision-resolution"><span>融合判断</span><strong>{snapshot.human.emotion}</strong><span>策略选择</span><strong>{policy.strategy}</strong></div>
    <p>{policy.reason}。</p>
    <dl className="decision-output">
      <div><dt>回答长度</dt><dd>{policy.length}</dd></div>
      <div><dt>解释难度</dt><dd>{policy.difficulty}</dd></div>
      <div><dt>语气</dt><dd>{policy.tone}</dd></div>
      <div><dt>公式密度</dt><dd>{policy.formula}</dd></div>
      <div><dt>建议形式</dt><dd>{outputNames[policy.visual]}</dd></div>
      <div><dt>安全规则</dt><dd>{policy.safety ? '优先执行' : '未触发'}</dd></div>
    </dl>
    <small>记录保留本轮快照，不随当前模拟状态改写；百分比不是模型准确率。</small>
  </div>;
}
