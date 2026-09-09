'use client';
import { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';

export function EntranceAtmosphere() {
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(preference.matches);
    const visibility = () => setHidden(document.hidden);
    sync(); visibility();
    preference.addEventListener('change', sync);
    document.addEventListener('visibilitychange', visibility);
    return () => { preference.removeEventListener('change', sync); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  const stopped = paused || reduced || hidden;
  return <>
    <div className="entrance-atmosphere" data-paused={stopped} aria-hidden="true"><div className="entrance-scene" /></div>
    <button type="button" className="atmosphere-toggle" onClick={() => setPaused(value => !value)} disabled={reduced} aria-pressed={paused} title={reduced ? '跟随系统减少动态效果设置' : paused ? '播放背景动态' : '暂停背景动态'}>
      {stopped ? <Play size={13}/> : <Pause size={13}/>}<span>{reduced ? '静态模式' : paused ? '播放动态' : '暂停动态'}</span>
    </button>
  </>;
}
