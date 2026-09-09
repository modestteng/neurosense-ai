'use client';
import { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Check } from 'lucide-react';
import type { Reply, Visual } from '@/lib/neuro';
export function ResponseVisual({reply,mode,onAnswer}:{reply:Reply;mode:Visual;onAnswer?:(correct:boolean)=>void}){
  const [step,setStep]=useState(0);const [playing,setPlaying]=useState(false);const [answer,setAnswer]=useState<number|null>(null);
  useEffect(()=>{setStep(0);setPlaying(false);setAnswer(null)},[reply]);
  useEffect(()=>{setPlaying(false)},[mode]);
  useEffect(()=>{if(!playing)return;const timer=setTimeout(()=>{if(step>=reply.steps.length-1)setPlaying(false);else setStep(step+1)},1200);return()=>clearTimeout(timer)},[playing,step,reply.steps.length]);
  return <>
    {mode!=='text'&&reply.steps.length>0&&<div className="response-visual">
      <div className="visual-heading"><strong>{reply.topic==='gcn'?'信息如何传递':reply.topic==='matrix'?'一行 × 一列':reply.topic==='attention'?'从查询到汇总':'下一步'}</strong>{mode==='animation'&&<div><button onClick={()=>{if(step>=reply.steps.length-1)setStep(0);setPlaying(v=>!v)}}>{playing?<Pause size={14}/>:<Play size={14}/>} {playing?'暂停':'播放'}</button><button title="重置动画" onClick={()=>{setStep(0);setPlaying(false)}}><RotateCcw size={14}/></button></div>}</div>
      {reply.topic==='gcn'&&mode!=='steps'&&<svg className="gcn-visual" viewBox="0 0 520 120" role="img" aria-label="A 与 B 相连，B 与 C 相连，逐步传递邻居信息"><line x1="90" y1="52" x2="430" y2="52" stroke="#a1bdc5" strokeWidth="2"/>{[90,260,430].map((x,i)=><g key={x}><circle cx={x} cy="52" r="24" fill={mode==='animation'&&step===2?'#aecde3':i===1?'#314f66':'#1a2d3e'} stroke="#779bb6"/><text x={x} y="58" textAnchor="middle" fill={mode==='animation'&&step===2?'#162a3b':'#c3dcec'} fontSize="17">{'ABC'[i]}{mode==='animation'&&step===2?'′':''}</text><text x={x} y="100" textAnchor="middle" fill="#a0b8cd" fontSize="12">{i===1?'聚合邻居信息':'保留自身信息'}</text></g>)}{mode==='animation'&&step===1&&<><circle className={playing?'packet packet-left':''} cx="130" cy="52" r="5" fill="#cc9665"/><circle className={playing?'packet packet-right':''} cx="390" cy="52" r="5" fill="#cc9665"/></>}</svg>}
      {reply.topic==='matrix'&&mode!=='steps'&&<div className="matrix-visual"><span>[ 2　3 ]</span><b>×</b><span>[ 4　5 ]ᵀ</span><b>=</b><strong>{mode==='animation'&&step===0?'?':mode==='animation'&&step===1?'8 + 15':'23'}</strong></div>}
      <div className="step-row">{reply.steps.map((text,i)=><button key={text} className={mode==='animation'&&step===i?'current':''} aria-current={mode==='animation'&&step===i?'step':undefined} onClick={()=>{setStep(i);setPlaying(false)}}><span>0{i+1}</span>{text}</button>)}</div>
    </div>}
    {mode==='animation'&&reply.steps.length>0&&<p className="animation-progress" role="status">第 {step+1} / {reply.steps.length} 步 · {playing?'正在演示':step===reply.steps.length-1?'演示完成，可再次播放':'可播放或点击步骤查看'}</p>}
    {reply.question&&reply.options&&<details className="check-understanding"><summary>用一道小题确认理解</summary><p>{reply.question}</p><div className="quiz-options">{reply.options.map((text,i)=><button key={text} disabled={answer!==null} className={answer===i?(i===reply.correct?'correct':'incorrect'):''} onClick={()=>{setAnswer(i);onAnswer?.(i===reply.correct)}}>{answer===i&&i===reply.correct&&<Check size={14}/>} {text}</button>)}</div>{answer!==null&&<p role="status">{answer===reply.correct?'回答正确。':`参考答案：${reply.options[reply.correct??0]}。`}{onAnswer?(answer===reply.correct?'已反馈给策略层，可以逐步增加难度。':'已反馈给策略层，下一轮将继续巩固。'):'这是历史回答的练习，不改变当前状态。'}</p>}</details>}
  </>;
}
