'use client';
import { useEffect, useRef, useState } from 'react';

export function MicrophoneCheck() {
  const [checking, setChecking] = useState(false), [level, setLevel] = useState(0), [message, setMessage] = useState('');
  const generation = useRef(0), cleanup = useRef<() => void>(() => {});
  useEffect(() => () => { generation.current++; cleanup.current(); }, []);
  const check = async () => {
    if (checking) { generation.current++; cleanup.current(); setChecking(false); setLevel(0); setMessage('已停止检测，麦克风已释放。'); return; }
    const id = ++generation.current;
    setChecking(true); setMessage('等待麦克风权限…');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('当前环境不提供麦克风访问。请使用 HTTPS 网址或系统浏览器。');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
      if (generation.current !== id) { stream.getTracks().forEach(t => t.stop()); return; }
      let context: AudioContext;
      try { context = new AudioContext(); } catch { stream.getTracks().forEach(t => t.stop()); throw new Error('浏览器不支持音量检测。请检查系统输入设备。'); }
      let frame = 0, timer: ReturnType<typeof setTimeout> | undefined;
      cleanup.current = () => { cancelAnimationFrame(frame); clearTimeout(timer); stream.getTracks().forEach(t => t.stop()); void context.close().catch(() => {}); };
      await context.resume();
      if (generation.current !== id) return;
      const analyser = context.createAnalyser(); analyser.fftSize = 1024;
      context.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      let detected = false, last = 0;
      setMessage('请说一句话。检测持续 10 秒，不保存或上传音频。');
      const sample = (now: number) => {
        if (generation.current !== id) return;
        if (now - last > 90) {
          analyser.getByteTimeDomainData(data);
          const rms = Math.sqrt(data.reduce((sum, value) => sum + ((value - 128) / 128) ** 2, 0) / data.length);
          if (rms > .012) detected = true;
          setLevel(Math.min(100, rms * 700)); last = now;
        }
        frame = requestAnimationFrame(sample);
      };
      frame = requestAnimationFrame(sample);
      timer = setTimeout(() => {
        if (generation.current !== id) return;
        generation.current++; cleanup.current(); setChecking(false); setLevel(0);
        setMessage(detected ? '浏览器确实收到了声音。如果仍不出字，请使用系统听写，或检查浏览器识别服务。' : '未检测到明显声音。请检查系统默认麦克风、静音开关和输入音量后重试。');
      }, 10000);
    } catch (error) {
      if (generation.current !== id) return;
      cleanup.current(); setChecking(false); setLevel(0);
      const name = error instanceof Error ? error.name : '';
      setMessage(name === 'NotAllowedError' ? '麦克风权限被拒绝，请在网站权限和系统隐私设置中允许访问。' : name === 'NotFoundError' ? '未找到麦克风，请连接输入设备。' : name === 'NotReadableError' ? '麦克风无法读取，可能被其他程序占用。' : error instanceof Error ? error.message : '检测失败，请检查系统输入设备。');
    }
  };
  return <div className="microphone-check">
    <button type="button" onClick={()=>void check()}>{checking ? '停止检测' : '检测麦克风'}</button>
    {checking && <div className="microphone-level" role="meter" aria-label="实时麦克风音量" aria-valuenow={Math.round(level)} aria-valuemin={0} aria-valuemax={100}><i style={{width:`${level}%`}}/></div>}
    {message && <p role="status">{message}</p>}
  </div>;
}
