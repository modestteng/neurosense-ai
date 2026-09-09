'use client';
import { useEffect, useRef, useState } from 'react';
import { Camera, Video, VideoOff, RefreshCw, X, Maximize2 } from 'lucide-react';

export function CameraPanel({ onStatus }: { onStatus: (value: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const request = useRef(0);
  const [status, setStatus] = useState<'idle'|'loading'|'live'|'error'>('idle');
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [expanded,setExpanded]=useState(false);
  const [needsPlay,setNeedsPlay]=useState(false);
  const stop = () => {
    request.current++;
    stream.current?.getTracks().forEach(t=>t.stop());
    stream.current=null;
    if(video.current)video.current.srcObject=null;
    setStatus('idle');setError('');setNeedsPlay(false);setExpanded(false);onStatus('未连接');
  };
  useEffect(()=>()=>{request.current++;stream.current?.getTracks().forEach(t=>t.stop());},[]);
  useEffect(()=>{if(!expanded)return;const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setExpanded(false)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[expanded]);
  const start = async () => {
    const id=++request.current;
    stream.current?.getTracks().forEach(t=>t.stop());
    stream.current=null;setStatus('loading');setError('');setNeedsPlay(false);
    try {
      if(!navigator.mediaDevices?.getUserMedia)throw new Error('当前浏览器无法访问摄像头，请使用 HTTPS 页面和支持摄像头的浏览器。');
      const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:720}},audio:false});
      if(request.current!==id){media.getTracks().forEach(t=>t.stop());return;}
      stream.current=media;
      // The preview element stays mounted, so the stream never targets a missing ref.
      const element=video.current;
      if(!element){media.getTracks().forEach(t=>t.stop());throw new Error('预览窗口未就绪，请重新连接。');}
      element.srcObject=media;element.muted=true;
      media.getVideoTracks().forEach(t=>t.addEventListener('ended',()=>{
        if(request.current===id){stream.current=null;setStatus('error');setError('摄像头已断开，请重新连接。');onStatus('已断开');}
      }));
      try {await element.play();} catch {if(request.current===id)setNeedsPlay(true);}
      if(request.current!==id)return;
      setStatus('live');onStatus('本机预览');
    } catch (err) {
      if(request.current!==id)return;
      const name=err instanceof Error?err.name:'';
      const messages:Record<string,string>={NotAllowedError:'摄像头权限被拒绝。请在地址栏的网站权限中允许摄像头，再点击重试。',NotFoundError:'没有检测到摄像头，请连接设备后重试。',NotReadableError:'摄像头可能被其他程序占用，请关闭占用它的程序再重试。'};
      setError(messages[name]??(err instanceof Error?err.message:'连接失败，请重试。'));setStatus('error');onStatus('连接失败');
    }
  };
  const capture=()=>{
    const element=video.current;
    if(!element?.videoWidth){setError('画面尚未就绪，请稍后再拍照。');return;}
    const canvas=document.createElement('canvas');canvas.width=element.videoWidth;canvas.height=element.videoHeight;
    canvas.getContext('2d')?.drawImage(element,0,0);setPhoto(canvas.toDataURL('image/jpeg',.85));setError('');
  };
  return <section className={`camera-panel ${expanded?'camera-expanded':''}`}>
    <div className="section-label"><span><Camera size={15}/>视觉输入</span>{expanded?<button className="icon-button" aria-label="关闭放大预览" onClick={()=>setExpanded(false)}><X size={16}/></button>:<span className={status==='live'?'live-dot-label':'muted'}>{status==='live'?'本机预览':'待连接'}</span>}</div>
    <div className="camera-view">
      <video ref={video} autoPlay muted playsInline aria-label="摄像头实时画面" className={status==='live'?'visible':''}/>
      {status!=='live'&&<div className="camera-placeholder"><Video size={27}/><strong>{status==='loading'?'等待摄像头权限…':status==='error'?'暂未获得画面':'摄像头未连接'}</strong><span>点击连接，开启实时预览</span></div>}
      {status==='live'&&<><span className="camera-live">实时</span><button className="camera-expand icon-button" title={expanded?'缩小预览':'放大预览'} onClick={()=>setExpanded(v=>!v)}>{expanded?<X size={16}/>:<Maximize2 size={16}/>}</button></>}
      {needsPlay&&status==='live'&&<button className="play-overlay" onClick={()=>void video.current?.play().then(()=>setNeedsPlay(false)).catch(()=>setError('无法播放，请断开后重连。'))}>点击播放画面</button>}
    </div>
    {error&&<p className="inline-error" role="alert">{error}</p>}
    <div className="camera-actions">{status==='live'?<><button onClick={capture}><Camera size={14}/>拍照</button><button onClick={stop}><VideoOff size={14}/>断开</button></>:<><button onClick={start} disabled={status==='loading'}><RefreshCw size={14}/>{status==='error'?'重试连接':'连接摄像头'}</button>{status==='loading'&&<button onClick={stop}>取消</button>}</>}</div>
    {photo&&<div className="camera-photo"><img src={photo} alt="本次拍摄的本地照片"/><button className="icon-button" title="删除本地照片" onClick={()=>setPhoto(null)}><X size={14}/></button><small>本地快照 · 未上传</small></div>}
    <p className="fine-print">画面仅在本机显示；场景与状态识别当前使用演示数据。</p>
  </section>;
}
