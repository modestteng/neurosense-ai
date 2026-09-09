import { ArrowUpRight, AudioLines, BrainCircuit, ScanEye } from 'lucide-react';
import { EntranceAtmosphere } from '@/components/neuro/EntranceAtmosphere';
import './entrance.css';

export default function Home({ basePath = '/' }: { basePath?: string }) {
  return (
    <main className="entrance">
      <EntranceAtmosphere />
      <header className="entrance-header">
        <a className="entrance-brand" href={basePath} aria-label="NeuroSense AI 首页">
          <AudioLines size={28} strokeWidth={1.5}/><span>NeuroSense <b>AI</b></span>
        </a>
        <span className="entrance-edition"><i/>交互演示版</span>
      </header>

      <section className="entrance-center" aria-labelledby="entrance-title">
        <p className="entrance-eyebrow">多模态人因状态感知</p>
        <h1 id="entrance-title">不止理解你的问题。<br/><span>更懂此刻的你。</span></h1>
        <p className="entrance-description">从你说了什么，到你现在的状态。<br className="entrance-mobile-break"/>探索一种更有感知力的 AI 交互。</p>
        <a className="explore-button" href={`${basePath}explore/`}><span>开始探索</span><ArrowUpRight size={21} strokeWidth={1.7}/></a>
        <p className="entrance-permission">无需登录 · 进入后自主选择是否开启设备</p>
      </section>

      <footer className="entrance-footer">
        <div className="entrance-capabilities" aria-label="平台核心技术">
          <div><ScanEye size={20} strokeWidth={1.4}/><p><strong>视觉感知</strong><span>看见行为与环境</span></p></div>
          <div><BrainCircuit size={20} strokeWidth={1.4}/><p><strong>脑电智能</strong><span>TCG-3DNet 自主架构</span></p></div>
          <div><AudioLines size={20} strokeWidth={1.4}/><p><strong>自适应交互</strong><span>让回应随状态改变</span></p></div>
        </div>
        <div className="entrance-bottom"><span>感知 · 融合 · 决策 · 回应</span><span>感知状态为模拟数据，非生理测量</span></div>
      </footer>
    </main>
  );
}
