export interface Env {
  SUNO_API_KEY: string;
  SUNO_COOKIE: string;
  SUNO_DEVICE_ID?: string;
}

function extractToken(cookie: string): string | null {
  if (!cookie) return null;
  const trimmed = cookie.trim();
  if (trimmed.startsWith('eyJ')) return trimmed;
  const match = trimmed.match(/__session=([^;]+)/);
  if (match) return match[1];
  const matchAlt = trimmed.match(/__session_[^=]+=([^;]+)/);
  if (matchAlt) return matchAlt[1];
  return null;
}

function extractDeviceId(cookie: string, fallbackId: string = '3325ed78-0154-4d0d-bbee-752fd1f61b31'): string {
  if (!cookie) return fallbackId;
  const match = cookie.match(/suno_device_id=([^;]+)/);
  return match ? match[1] : fallbackId;
}

function getBrowserToken(): string {
  const payload = JSON.stringify({ timestamp: Date.now() });
  return JSON.stringify({ token: btoa(payload) });
}

function normalizeModel(mv?: string): string {
  if (!mv) return 'chirp-halibut';
  const lower = String(mv).toLowerCase().trim();
  if (lower === 'v6' || lower === 'suno-v6' || lower === 'chirp-v6' || lower === 'halibut') return 'chirp-halibut';
  if (lower === 'v6-mini' || lower === 'mini' || lower === 'goose') return 'chirp-goose';
  if (lower === 'v4' || lower === 'suno-v4' || lower === 'chirp-v4') return 'chirp-v4';
  if (lower === 'v3.5' || lower === 'v3-5' || lower === 'chirp-v3-5') return 'chirp-v3-5';
  return mv;
}

function getSunoHeaders(env: Env) {
  const token = extractToken(env.SUNO_COOKIE);
  const deviceId = extractDeviceId(env.SUNO_COOKIE, env.SUNO_DEVICE_ID);
  return {
    'authorization': `Bearer ${token}`,
    'browser-token': getBrowserToken(),
    'device-id': deviceId,
    'origin': 'https://suno.com',
    'referer': 'https://suno.com/',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0',
    'Content-Type': 'application/json'
  };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // Health check público
    if (url.pathname === '/health') {
      return Response.json({ ok: true, runtime: 'cloudflare-worker', timestamp: new Date().toISOString() }, { headers: corsHeaders() });
    }

    // Root info
    if (url.pathname === '/') {
      return Response.json({
        service: 'Suno AI Serverless API (Cloudflare Worker)',
        status: 'online',
        model_default: 'v6 (chirp-halibut)',
        auth: 'Header x-api-key required',
        endpoints: [
          'POST /api/custom_generate',
          'POST /api/generate',
          'GET /api/status',
          'GET /api/get?ids=...'
        ]
      }, { headers: corsHeaders() });
    }

    // Validação de x-api-key para todas as rotas /api/*
    if (url.pathname.startsWith('/api')) {
      const apiKey = request.headers.get('x-api-key') || url.searchParams.get('api_key');
      if (!apiKey || apiKey !== env.SUNO_API_KEY) {
        return Response.json({
          ok: false,
          error: 'Unauthorized: Header x-api-key invalido ou ausente.',
          hint: 'Envie o header x-api-key autorizado.'
        }, { status: 401, headers: corsHeaders() });
      }
    }

    // 1. Status & Créditos
    if (url.pathname === '/api/status' || url.pathname === '/api/credits' || url.pathname === '/api/get_limit') {
      try {
        const sunoRes = await fetch('https://studio-api-prod.suno.com/api/billing/info/', {
          headers: getSunoHeaders(env)
        });

        if (!sunoRes.ok) {
          return Response.json({ ok: false, error: 'Erro ao consultar Suno', status: sunoRes.status }, { status: sunoRes.status, headers: corsHeaders() });
        }

        const data: any = await sunoRes.json();
        const proPlan = data.plans?.find((p: any) => p.plan_key === 'pro') || data.plans?.[0];

        return Response.json({
          ok: true,
          credits_left: data.total_credits_left,
          plan: proPlan?.name || data.plan?.name || 'Pro Plan',
          period_end: data.period_end,
          has_been_subscriber: data.has_been_subscriber_before,
          raw: {
            total_credits_left: data.total_credits_left,
            plan_key: data.plan?.plan_key || 'pro'
          }
        }, { headers: corsHeaders() });
      } catch (err: any) {
        return Response.json({ ok: false, error: err.message }, { status: 500, headers: corsHeaders() });
      }
    }

    // 2. Custom Generate
    if (url.pathname === '/api/custom_generate' && request.method === 'POST') {
      try {
        const body: any = await request.json();
        const callBackUrl = body.callBackUrl || 
                            body.callback_url || 
                            body.callbackUrl || 
                            body.call_back_url || 
                            body.webhook || 
                            body.webhook_url || 
                            url.searchParams.get('callBackUrl') || 
                            url.searchParams.get('callback_url');
        const { prompt, tags, title, make_instrumental, mv, metadata } = body;

        if (!prompt && !make_instrumental) {
          return Response.json({ ok: false, error: 'O campo prompt é obrigatório quando não instrumental.' }, { status: 400, headers: corsHeaders() });
        }

        const payload = {
          prompt: prompt || '',
          tags: tags || 'pop, acoustic',
          title: title || 'Nova Canção',
          make_instrumental: Boolean(make_instrumental),
          mv: normalizeModel(mv)
        };

        const sunoRes = await fetch('https://studio-api-prod.suno.com/api/generate/v2/', {
          method: 'POST',
          headers: getSunoHeaders(env),
          body: JSON.stringify(payload)
        });

        const data: any = await sunoRes.json();

        if (!sunoRes.ok) {
          const dataStr = JSON.stringify(data).toLowerCase();
          const isInsufficient = sunoRes.status === 402 || dataStr.includes('credit') || dataStr.includes('insufficient');
          if (isInsufficient) {
            return Response.json({
              ok: false,
              code: 'INSUFFICIENT_CREDITS',
              error: 'Créditos da conta Suno esgotados. Fallback recomendado.',
              fallback: true,
              status: 402,
              details: data
            }, { status: 402, headers: corsHeaders() });
          }
          return Response.json({ ok: false, error: data.detail || 'Falha ao gerar', raw: data }, { status: sunoRes.status, headers: corsHeaders() });
        }

        const clips = data.clips || [];

        // Webhook em background via ctx.waitUntil (se callBackUrl foi passado)
        if (callBackUrl && clips.length > 0) {
          ctx.waitUntil((async () => {
            const clipIds = clips.map((c: any) => c.id);
            // Polling por até 60 segundos
            for (let i = 0; i < 12; i++) {
              await new Promise(r => setTimeout(r, 5000));
              try {
                const feedRes = await fetch(`https://studio-api-prod.suno.com/api/feed/?ids=${encodeURIComponent(clipIds.join(','))}`, {
                  headers: getSunoHeaders(env)
                });
                if (feedRes.ok) {
                  const feedClips: any = await feedRes.json();
                  if (Array.isArray(feedClips)) {
                    for (const fc of feedClips) {
                      if (fc.status === 'complete' || fc.status === 'error') {
                        await fetch(callBackUrl, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            code: fc.status === 'complete' ? 200 : 500,
                            status: fc.status,
                            clip_id: fc.id,
                            clip: fc,
                            data: [fc],
                            metadata: metadata || {}
                          })
                        }).catch(() => {});
                      }
                    }
                    if (feedClips.every((fc: any) => fc.status === 'complete' || fc.status === 'error')) {
                      break;
                    }
                  }
                }
              } catch (e) {}
            }
          })());
        }

        return Response.json({
          ok: true,
          status: 'submitted',
          clips: clips,
          webhook_enabled: Boolean(callBackUrl)
        }, { headers: corsHeaders() });
      } catch (err: any) {
        return Response.json({ ok: false, error: err.message }, { status: 500, headers: corsHeaders() });
      }
    }

    // 3. Simple Generate (Description)
    if (url.pathname === '/api/generate' && request.method === 'POST') {
      try {
        const body: any = await request.json();
        const callBackUrl = body.callBackUrl || 
                            body.callback_url || 
                            body.callbackUrl || 
                            body.call_back_url || 
                            body.webhook || 
                            body.webhook_url || 
                            url.searchParams.get('callBackUrl') || 
                            url.searchParams.get('callback_url');
        const { prompt, make_instrumental, mv } = body;

        const payload = {
          gpt_description_prompt: prompt,
          make_instrumental: Boolean(make_instrumental),
          mv: normalizeModel(mv)
        };

        const sunoRes = await fetch('https://studio-api-prod.suno.com/api/generate/v2/', {
          method: 'POST',
          headers: getSunoHeaders(env),
          body: JSON.stringify(payload)
        });

        const data: any = await sunoRes.json();
        if (!sunoRes.ok) {
          return Response.json({ ok: false, error: data.detail || 'Falha ao gerar', raw: data }, { status: sunoRes.status, headers: corsHeaders() });
        }

        return Response.json({ ok: true, status: 'submitted', clips: data.clips || [] }, { headers: corsHeaders() });
      } catch (err: any) {
        return Response.json({ ok: false, error: err.message }, { status: 500, headers: corsHeaders() });
      }
    }

    // 4. Get Status / Polling
    if (url.pathname === '/api/get' || url.pathname === '/api/feed') {
      try {
        const ids = url.searchParams.get('ids');
        if (!ids) {
          return Response.json({ ok: false, error: 'Parâmetro ?ids=... é obrigatório.' }, { status: 400, headers: corsHeaders() });
        }

        const sunoRes = await fetch(`https://studio-api-prod.suno.com/api/feed/?ids=${encodeURIComponent(ids)}`, {
          headers: getSunoHeaders(env)
        });

        if (!sunoRes.ok) {
          return Response.json({ ok: false, error: 'Erro ao consultar clips' }, { status: sunoRes.status, headers: corsHeaders() });
        }

        const data = await sunoRes.json();
        return Response.json(data, { headers: corsHeaders() });
      } catch (err: any) {
        return Response.json({ ok: false, error: err.message }, { status: 500, headers: corsHeaders() });
      }
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders() });
  }
};
