import test from 'node:test';
import assert from 'node:assert/strict';
const origin=process.env.TEST_ORIGIN||'http://localhost:3000';
const post=(body)=>fetch(origin+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
test('service status never reveals keys',async()=>{const r=await fetch(origin+'/api/chat');assert.equal(r.status,200);const d=await r.json();assert.equal(typeof d.configured,'boolean');assert.ok(!('key'in d));});
test('API recomputes policy from scene and state',async()=>{const r=await post({message:'我很疲劳',scene:'驾驶',scenario:'fatigued',mode:'demo',preference:'animation',policy:{safety:false}});assert.equal(r.status,200);const d=await r.json();assert.equal(d.policy.safety,true);assert.equal(d.reply.source,'safety');});
test('invalid request rejected',async()=>{assert.equal((await post({message:'hello',scene:'invalid',scenario:'normal'})).status,400)});
test('simulation contracts expose provenance and manual scene priority',async()=>{
  const r=await fetch(origin+'/api/simulation/scenario',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scene:'驾驶',detectedScene:'办公',scenario:'fatigued'})});
  assert.equal(r.status,200);const value=await r.json();assert.equal(value.mode,'demo');assert.equal(value.data.scene.activeScene,'驾驶');assert.equal(value.data.scene.conflict,true);assert.equal(value.data.policy.safety,true);
  const unavailable=await fetch(origin+'/api/eeg/state?mode=live');assert.equal(unavailable.status,503);
});
test('unconfigured real mode is an explicit failure',async()=>{const state=await(await fetch(origin+'/api/chat')).json();if(state.configured)return;assert.equal((await post({message:'你好',scene:'学习',scenario:'normal',mode:'live'})).status,503)});
test('local greeting and matrix API are topic appropriate',async()=>{for(const text of ['你好','矩阵乘法']){const r=await post({message:text,scene:'学习',scenario:'normal',mode:'demo'});assert.equal(r.status,200);const d=await r.json();assert.doesNotMatch(d.reply.text,/邻接矩阵/);}});
