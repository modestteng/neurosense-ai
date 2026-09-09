import type { Scene, Scenario } from '@/lib/neuro';

export async function requestApi<T>(path: string, payload?: unknown): Promise<T> {
  const response = await fetch(`/api/${path}`, payload === undefined ? undefined : {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload),
  });
  const result = await response.json() as T & {error?: string};
  if (!response.ok) throw new Error(result?.error || '服务请求失败。');
  return result as T;
}
export const requestVisionState = () => requestApi('vision/state');
export const requestPolicy = (scene: Scene, scenario: Scenario, message='') => requestApi('policy/decision', {scene,scenario,message});
export const sendAdaptiveChat = (payload: unknown) => requestApi('chat', payload);
