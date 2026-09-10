import { GET, POST } from '../app/api/chat/route';

export default {
  async fetch(request, env): Promise<Response> {
    if (new URL(request.url).pathname !== '/api/chat') {
      return Response.json({ error: '接口不存在。' }, { status: 404 });
    }
    const origin = request.headers.get('Origin');
    if (origin && origin !== env.ALLOWED_ORIGIN) {
      return Response.json({ error: '请求来源不匹配。' }, { status: 403 });
    }
    const corsHeaders = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Cache-Control': 'no-store',
      Vary: 'Origin',
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
    let response: Response;
    if (request.method === 'GET') {
      response = await GET();
    } else if (request.method === 'POST') {
      if (origin !== env.ALLOWED_ORIGIN) {
        response = Response.json({ error: '请从 NeuroSense 网站发起请求。' }, { status: 403 });
      } else {
        const ip = request.headers.get('CF-Connecting-IP') || 'local';
        const { success } = await env.CHAT_RATE_LIMIT.limit({ key: `neurosense-chat:${ip}` });
        response = success
          ? await POST(request)
          : Response.json({ error: '请求较频繁，请一分钟后再试。' }, { status: 429, headers: { 'Retry-After': '60' } });
      }
    } else {
      response = Response.json({ error: '不支持的请求方法。' }, { status: 405, headers: { Allow: 'GET, POST, OPTIONS' } });
    }
    const headers = new Headers(response.headers);
    for (const [name, value] of Object.entries(corsHeaders)) headers.set(name, value);
    return new Response(response.body, { status: response.status, headers });
  },
} satisfies ExportedHandler<ChatWorkerEnv>;
