import assert from 'node:assert/strict';
import test from 'node:test';
import { SpeechInput, recognitionError } from '../services/speech.ts';

class FakeRecognition {
  static instances = [];
  constructor() { FakeRecognition.instances.push(this); }
  start() { this.started = true; }
  stop() { this.stopped = true; }
  abort() { this.aborted = true; }
  result(...sentences) { this.onresult?.({results:sentences.map(([transcript,isFinal])=>Object.assign([{transcript}],{isFinal}))}); }
}
function setup(t) {
  const values=[], states=[];
  const input=new SpeechInput(v=>values.push(v),s=>states.push(s));
  t.after(()=>input.cancel());
  return {input,values,states,rec:()=>FakeRecognition.instances.at(-1)};
}
test('continuous Chinese recognition exposes interim text and replaces revisions without duplicates',t=>{
  const {input,values,rec}=setup(t);input.start(FakeRecognition,'请解释：');
  assert.equal(rec().lang,'zh-CN');assert.equal(rec().continuous,true);assert.equal(rec().interimResults,true);
  rec().result(['邻接',false]);assert.equal(values.at(-1),'请解释：邻接');
  rec().result(['邻接矩阵。',true],['它有',false]);assert.equal(values.at(-1),'请解释：邻接矩阵。它有');
  rec().result(['邻接矩阵。',true],['它有什么作用？',true]);assert.equal(values.at(-1),'请解释：邻接矩阵。它有什么作用？');
});
test('stop waits for final result and reports completion',t=>{
  const {input,values,states,rec}=setup(t);input.start(FakeRecognition,'');rec().onstart();
  rec().result(['矩阵',false]);input.stop();assert.equal(states.at(-1).phase,'stopping');
  rec().result(['矩阵乘法',true]);rec().onend();
  assert.equal(values.at(-1),'矩阵乘法');assert.equal(states.at(-1).phase,'idle');assert.equal(rec().aborted,true);
});
test('late recognition callbacks cannot refill a submitted or cleared draft',t=>{
  const {input,values,rec}=setup(t);input.start(FakeRecognition,'');const late=rec().onresult;
  input.cancel();late({results:[Object.assign([{transcript:'迟到的文字'}],{isFinal:true})]});assert.equal(values.length,0);
  input.start(FakeRecognition,'新的：');late({results:[Object.assign([{transcript:'旧文字'}],{isFinal:true})]});
  rec().result(['问题',true]);assert.deepEqual(values,['新的：问题']);
});
test('network error remains visible after recognizer end and preserves existing text',t=>{
  const {input,values,states,rec}=setup(t);input.start(FakeRecognition,'');rec().result(['保留文字',false]);
  const end=rec().onend;rec().onerror({error:'network'});end();
  assert.match(states.at(-1).message,/连接失败/);assert.equal(states.at(-1).error,true);assert.equal(values.at(-1),'保留文字');
});
test('missing service and empty recognition never report successful transcription',t=>{
  const {input,states,rec}=setup(t);input.start(undefined,'');assert.equal(states.at(-1).error,true);
  input.start(FakeRecognition,'');rec().onend();assert.match(states.at(-1).message,/没有识别到文字/);
});
test('double start does not allocate another recognizer',t=>{
  const {input,rec}=setup(t);input.start(FakeRecognition,'');const first=rec();input.start(FakeRecognition,'');assert.equal(rec(),first);
});
test('recognition length is capped and stops at the input limit',t=>{
  const {input,values,rec}=setup(t);input.start(FakeRecognition,'');rec().result(['长'.repeat(4100),true]);
  assert.equal(values.at(-1).length,4000);assert.equal(rec().stopped,true);
});
test('startup timeout aborts hanging speech service',t=>{
  t.mock.timers.enable({apis:['setTimeout']});const {input,states,rec}=setup(t);input.start(FakeRecognition,'');
  t.mock.timers.tick(12001);assert.equal(rec().aborted,true);assert.equal(states.at(-1).phase,'idle');assert.match(states.at(-1).message,/未能启动/);
});
test('speech detected but no results produces a service-specific timeout',t=>{
  t.mock.timers.enable({apis:['setTimeout']});const {input,states,rec}=setup(t);input.start(FakeRecognition,'');
  rec().onstart();rec().onspeechstart();t.mock.timers.tick(18001);assert.match(states.at(-1).message,/检测到了语音/);assert.equal(states.at(-1).error,true);
});
test('stop timeout releases microphone even if browser never emits end',t=>{
  t.mock.timers.enable({apis:['setTimeout']});const {input,states,rec}=setup(t);input.start(FakeRecognition,'');input.stop();
  t.mock.timers.tick(2501);assert.equal(rec().aborted,true);assert.equal(states.at(-1).phase,'idle');
});
test('permission, device and network errors have different actionable guidance',()=>{
  assert.match(recognitionError('not-allowed'),/权限/);assert.match(recognitionError('audio-capture'),/输入设备/);
  assert.match(recognitionError('network'),/连接失败/);assert.notEqual(recognitionError('no-speech'),recognitionError('network'));
});
