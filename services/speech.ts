export type SpeechPhase = 'idle' | 'starting' | 'listening' | 'stopping';
export type SpeechStatus = { phase: SpeechPhase; message: string; error?: boolean };
type Result = ArrayLike<{ transcript: string }> & { isFinal: boolean };
export type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number;
  onstart: (() => void) | null; onaudiostart: (() => void) | null; onspeechstart: (() => void) | null;
  onresult: ((event: { results: ArrayLike<Result> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null; onend: (() => void) | null;
  start: () => void; stop: () => void; abort: () => void;
};
export type RecognitionConstructor = new () => Recognition;

export function recognitionError(code: string) {
  const messages: Record<string, string> = {
    'not-allowed': '麦克风权限被拒绝。请在网址旁的网站权限中允许麦克风，并检查系统麦克风权限。',
    'service-not-allowed': '浏览器不允许使用语音识别服务。请在系统浏览器打开本页，或使用系统听写输入。',
    network: '语音识别服务连接失败；打开麦克风不代表能完成转写。请检查网络，或使用系统听写输入。',
    'audio-capture': '没有可用的麦克风输入。请检查系统默认输入设备，关闭占用麦克风的应用后重试。',
    'no-speech': '没有检测到语音。请靠近麦克风说一句话，并检查系统选中的输入设备。',
    'language-not-supported': '当前语音服务不支持普通话，请使用系统中文听写。',
    aborted: '语音输入已结束，已有文字保留。',
  };
  return messages[code] ?? `语音识别未完成（${code}）。已有文字保留，可以重试或使用系统听写。`;
}

// Each result event contains the entire recognition session, not just the latest sentence.
export function speechText(results: ArrayLike<Result>) {
  return Array.from(results, result => result[0]?.transcript ?? '').join('').trim();
}

export class SpeechInput {
  private recognition: Recognition | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private phase: SpeechPhase = 'idle';
  private value: (text: string) => void;
  private status: (state: SpeechStatus) => void;

  constructor(value: (text: string) => void, status: (state: SpeechStatus) => void) {
    this.value = value; this.status = status;
  }
  private report(phase: SpeechPhase, message: string, error = false) {
    this.phase = phase; this.status({ phase, message, error });
  }
  private deadline(callback: () => void, delay: number) {
    clearTimeout(this.timer); this.timer = setTimeout(callback, delay);
  }
  cancel() {
    const rec = this.recognition; this.recognition = null;
    clearTimeout(this.timer); this.phase = 'idle';
    if (rec) {
      rec.onstart = rec.onaudiostart = rec.onspeechstart = rec.onresult = rec.onerror = rec.onend = null;
      try { rec.abort(); } catch { /* It may already have ended. */ }
    }
  }
  stop() {
    if (!this.recognition || this.phase === 'stopping') return;
    this.report('stopping', '正在整理最后一句…');
    this.deadline(() => { this.cancel(); this.report('idle', '已保留当前转写，请检查后发送。'); }, 2500);
    try { this.recognition?.stop(); } catch { this.cancel(); this.report('idle', '已保留当前文字。'); }
  }
  start(Ctor: RecognitionConstructor | undefined, prefix: string) {
    if (this.recognition) return;
    if (!Ctor) { this.report('idle', '当前浏览器未提供语音识别。请在系统浏览器打开本页，或使用系统听写输入。', true); return; }
    let rec: Recognition;
    try { rec = new Ctor(); } catch { this.report('idle', '浏览器语音服务无法启动，请使用系统听写输入。', true); return; }
    this.recognition = rec;
    let transcript = '', heardSpeech = false;
    const valid = () => this.recognition === rec;
    const fail = (message: string) => { if (!valid()) return; this.cancel(); this.report('idle', message, true); };
    const waitForResult = () => this.deadline(() => fail(heardSpeech
      ? '检测到了语音，但识别服务没有返回文字。请使用系统听写，或在系统浏览器中重试。'
      : '仍未收到识别文字。请检查默认麦克风；若系统听写正常，则可能是浏览器识别服务不可用。'), 18000);
    rec.lang = 'zh-CN'; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 1;
    rec.onstart = () => { if (valid() && this.phase !== 'stopping') { this.report('listening', '识别服务已启动，等待麦克风输入…'); waitForResult(); } };
    rec.onaudiostart = () => { if (valid() && this.phase !== 'stopping') this.report('listening', '麦克风已开启，请说话；识别文字会实时出现在输入框。'); };
    rec.onspeechstart = () => { if (valid() && this.phase !== 'stopping') { heardSpeech = true; this.report('listening', '检测到语音，正在转写…'); } };
    rec.onresult = event => {
      if (!valid()) return;
      transcript = speechText(event.results);
      const text = prefix + (prefix && transcript && /[a-zA-Z0-9]$/.test(prefix) ? ' ' : '') + transcript;
      this.value(text.slice(0, 4000));
      if (text.length >= 4000) { this.stop(); return; }
      if (this.phase !== 'stopping') { this.report('listening', '正在实时转写。说完后点击“完成输入”，检查文字再发送。'); waitForResult(); }
    };
    rec.onerror = event => fail(recognitionError(event.error));
    rec.onend = () => {
      if (!valid()) return;
      this.cancel();
      this.report('idle', transcript ? '转写已保留，可以修改文字后发送。' : '本次没有识别到文字。请检查麦克风与识别服务，或使用系统听写。', !transcript);
    };
    this.report('starting', '正在请求语音输入，请允许麦克风权限…');
    this.deadline(() => fail('语音服务未能启动。请检查麦克风权限；内嵌浏览器可能不提供转写服务。'), 12000);
    try { rec.start(); } catch { fail('语音输入启动失败，请稍后重试或使用系统听写。'); }
  }
}
