'use client';
import { Mic, Square } from 'lucide-react';
import type { SpeechStatus } from '@/services/speech';
import { MicrophoneCheck } from './MicrophoneCheck';

export function VoiceInputStatus({ status, onStop, onRetry }: { status: SpeechStatus; onStop: () => void; onRetry: () => void }) {
  if (!status.message) return null;
  const active = status.phase !== 'idle';
  return <div className={`voice-input-status ${status.error ? 'voice-input-error' : ''}`}>
    <div className="voice-input-heading"><Mic size={16}/><strong>{status.phase === 'starting' ? '连接语音服务' : active ? '普通话 · 实时转写' : status.error ? '语音输入未完成' : '语音输入已结束'}</strong>
      {active ? <button type="button" onClick={onStop} disabled={status.phase === 'stopping'}><Square size={12}/>完成输入</button> : status.error && <button type="button" onClick={onRetry}>重新尝试</button>}
    </div>
    <p role="status" aria-live="polite">{status.message}</p>
    {status.error && <><MicrophoneCheck/><details open><summary>使用系统听写输入</summary><p>先点击下方输入框，再按 Windows + H 开启 Windows 听写；Mac 可使用系统设置中的“听写”快捷键。识别文字可以编辑后发送。</p></details></>}
    {active && <small>由浏览器提供识别，音频可能交由浏览器厂商处理；不会自动发送问题。</small>}
  </div>;
}
