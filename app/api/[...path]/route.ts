import { scenes, scenarios, understand, fuse, decide, type Scene, type Scenario } from '@/lib/neuro';

// Stateless simulation contracts. Replace individual adapters when real services exist.
const endpoints = new Set(['vision/scene', 'vision/state', 'eeg/state', 'eeg/embedding', 'eeg/graph', 'fusion/state', 'policy/decision', 'session/state', 'simulation/scenario']);
const channels = ['Fp1','Fp2','F3','F4','C3','C4','T3','T4','Pz','O1','O2'];
async function handle(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\//, '').replace(/\/$/, '');
  if (!endpoints.has(path)) return Response.json({error:'接口不存在或尚未接入。'}, {status:404});
  let input: Record<string, unknown> = Object.fromEntries(url.searchParams);
  if (request.method === 'POST') {
    if (request.headers.get('origin') && request.headers.get('origin') !== url.origin) return Response.json({error:'请求来源不匹配。'}, {status:403});
    const raw = await request.text();
    if (raw.length > 10000) return Response.json({error:'请求过大。'}, {status:413});
    try { input = JSON.parse(raw); } catch { return Response.json({error:'请求必须为有效 JSON。'}, {status:400}); }
  }
  if (!input || typeof input !== 'object') return Response.json({error:'请求格式错误。'}, {status:400});
  const scene = (input.scene ?? '学习') as Scene;
  const scenario = (input.scenario ?? 'normal') as Scenario;
  if (!scenes.includes(scene) || !scenarios.includes(scenario)) return Response.json({error:'场景或模拟状态无效。'}, {status:400});
  if (input.mode === 'live') return Response.json({error:'真实设备与感知模型尚未接入。'}, {status:503});
  const windowIndex = Number.isFinite(Number(input.window)) ? Math.max(0, Math.floor(Number(input.window))) % 100000 : 0;
  const snapshot = fuse(scene, scenario, understand(typeof input.message === 'string' ? input.message.slice(0,4000) : ''), windowIndex);
  const policy = decide(scene, snapshot.human);
  const detectedScene = scenes.includes(input.detectedScene as Scene) ? input.detectedScene as Scene : '学习';
  const sceneState = {detectedScene, manualScene: scene, activeScene: scene, conflict: detectedScene !== scene, priority:'manual', confidence:.93};
  const edges = channels.flatMap((source, i) => channels.slice(i+1).map((target,j) => ({source,target,weight:Number(((Math.sin(i*2.1+j+windowIndex*.7+snapshot.eeg.negative*3)+1)/2).toFixed(3))}))).filter(edge => edge.weight > .55);
  const values: Record<string,unknown> = {
    'vision/scene':sceneState, 'vision/state':{...snapshot.vision,scene:sceneState},
    'eeg/state':snapshot.eeg, 'eeg/embedding':{dimensions:48,values:snapshot.eeg.embedding},
    'eeg/graph':{window:windowIndex,channels,edges}, 'fusion/state':snapshot.human,
    'policy/decision':policy, 'session/state':{scene:sceneState,snapshot,policy,persistence:'none'},
    'simulation/scenario':{scene:sceneState,snapshot,policy},
  };
  return Response.json({mode:'demo',provenance:'模拟数据，非真实生理测量',timestamp:new Date().toISOString(),data:values[path]}, {headers:{'Cache-Control':'no-store'}});
}
export const GET = handle;
export const POST = handle;
