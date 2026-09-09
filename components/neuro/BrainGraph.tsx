'use client';
import { useState } from 'react';
import type { Snapshot } from '@/lib/neuro';
const nodes=[['Fp1',100,48],['Fp2',200,48],['F7',54,91],['F3',109,99],['Fz',150,85],['F4',191,99],['F8',246,91],['T3',43,152],['C3',98,152],['Cz',150,150],['C4',202,152],['T4',257,152],['P3',103,206],['Pz',150,217],['P4',197,206],['O1',117,259],['O2',183,259]] as const;
export function BrainGraph({ snapshot, windowIndex, large=false }: {snapshot:Snapshot;windowIndex:number;large?:boolean}) {
  const [selected,setSelected]=useState<string|null>(null);
  const neg=snapshot.eeg.negative;
  const edges=nodes.flatMap((a,i)=>nodes.slice(i+1).map((b,j)=>{
    const k=i+j+1;const distance=Math.hypot(a[1]-b[1],a[2]-b[2]);
    const weight=(Math.sin(i*2.4+k*1.8+windowIndex*.51+neg*4)+1)/2;
    return {a,b,weight,distance};
  })).filter(e=>e.distance<175&&e.weight>.63);
  const visibleEdges=selected?edges.filter(edge=>edge.a[0]===selected||edge.b[0]===selected):edges;
  const meanWeight=visibleEdges.length?visibleEdges.reduce((sum,edge)=>sum+edge.weight,0)/visibleEdges.length:0;
  return <div className={`brain-visual ${large?'large':''}`}>
    <svg viewBox="0 0 300 310" role="group" aria-label={`观察窗 ${windowIndex+1}，${edges.length} 条模拟通道连接`}>
      <defs><pattern id={large?'grid-large':'grid-small'} width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".65" fill="#536a80"/></pattern></defs>
      <rect width="300" height="310" fill={`url(#${large?'grid-large':'grid-small'})`} opacity=".3"/>
      <ellipse cx="150" cy="155" rx="119" ry="137" fill="#172635" fillOpacity=".6" stroke="#3b5369"/>
      <path d="M135 19 150 7 165 19 M150 25V281 M34 124Q15 141 34 172 M266 124Q285 141 266 172" fill="none" stroke="#506b83" strokeDasharray="4 5"/>
      {edges.map(({a,b,weight})=><line key={`${a[0]}-${b[0]}`} x1={a[1]} y1={a[2]} x2={b[1]} y2={b[2]} stroke={neg>.6&&a[2]<110?'#c2a37c':'#85a9c5'} strokeWidth={weight*1.7} opacity={selected?(a[0]===selected||b[0]===selected?.95:.08):weight*.55} className="brain-edge"/>)}
      {nodes.map(([name,x,y])=><g key={name} onClick={()=>setSelected(s=>s===name?null:name)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(s=>s===name?null:name);}}} tabIndex={0} role="button" aria-pressed={selected===name} aria-label={`查看 ${name} 通道连接`}><circle cx={x} cy={y} r={name===selected?8:5.5} fill={name===selected?'#d5e8f7':'#172b3e'} stroke="#94b5cf" strokeWidth="1.5"/><text x={x} y={y-13} textAnchor="middle" fill="#a9bfd2" fontSize="11">{name}</text></g>)}
    </svg>
    <div className="graph-caption"><span><i/>{selected?`${selected} 的连接`:'轨迹条件化动态软图'}</span><b>窗 {String(windowIndex+1).padStart(2,'0')}</b></div>
    <div className="graph-readout"><span>{selected?`${visibleEdges.length} 条关联连接`:`${nodes.length} 通道 · ${edges.length} 条连接`}</span>{selected?<button onClick={()=>setSelected(null)} title="取消通道筛选">显示全部</button>:<span>点击通道查看</span>}</div>
    {selected&&<div className="graph-inspection" role="status"><strong>{selected}</strong><span>平均连接权重 <b>{meanWeight.toFixed(2)}</b><small>当前窗口 · 模拟值</small></span></div>}
  </div>;
}
