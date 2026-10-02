import { Env } from './types';

// Interface do payload retornado para o checkout
export interface PixChargeResult {
  txid: string;
  pixCopiaECola: string;
  qrCodeUrl: string;
  status: string;
  provider: 'efi' | 'static';
}

function getEfiMode(env: Env): 'production' | 'sandbox' {
  return env.EFI_ENV === 'production' ? 'production' : 'sandbox';
}

function getBaseUrl(env: Env): string {
  return getEfiMode(env) === 'production'
    ? 'https://pix.api.efipay.com.br'
    : 'https://pix-h.api.efipay.com.br';
}

// txid do Pix: 26 a 35 caracteres alfanuméricos (especificação Bacen)
export function generateTxid(orderId: string): string {
  const base = String(orderId || 'NEXUSAPI').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 15);
  const suffix = (Date.now().toString(36) + Math.random().toString(36).slice(2))
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase();
  let txid = (base + suffix).slice(0, 35);
  while (txid.length < 26) txid += '0';
  return txid;
}

// Função de relay para o efi-proxy no Fly.io
async function relayFetch(
  efiUrl: string,
  options: { method?: string; headers?: Record<string, string>; body?: string },
  env: Env
): Promise<Response> {
  const proxyUrl = env.EFI_PROXY_URL || 'https://efi-proxy-fly.fly.dev';
  const proxySecret = env.EFI_PROXY_SECRET || '';

  if (!proxySecret) {
    throw new Error('EFI_PROXY_SECRET não configurado nas variáveis de ambiente do Worker.');
  }

  const path = new URL(efiUrl).pathname;

  return await fetch(`${proxyUrl}/relay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Efi-Proxy-Secret': proxySecret,
    },
    body: JSON.stringify({
      env: getEfiMode(env),
      path,
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body || null,
    }),
  });
}

// Obter token OAuth da Efí via relay mTLS
async function getAccessToken(env: Env): Promise<string> {
  const clientId = env.EFI_CLIENT_ID;
  const clientSecret = env.EFI_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('EFI_CLIENT_ID / EFI_CLIENT_SECRET não configurados.');
  }

  const basicAuth = btoa(`${clientId}:${clientSecret}`);

  const res = await relayFetch(
    `${getBaseUrl(env)}/oauth/token`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ grant_type: 'client_credentials' }),
    },
    env
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Falha ao autenticar na Efí (HTTP ${res.status}): ${errText}`);
  }

  const data: any = await res.json();
  if (!data.access_token) {
    throw new Error('Resposta da Efí sem access_token.');
  }

  return data.access_token;
}

/**
 * Cria uma cobrança Pix imediata.
 * 1. Tenta primeiro pelo Hub Central NSNexus Pay (NSMusic /api/gateway/v1/charges).
 * 2. Se não houver Gateway, tenta direto pelo relay mTLS da Efí no Fly.io.
 * 3. Se ambos falharem, aciona fallback gracioso para não travar o cliente.
 */
export async function createPixCharge(
  params: { orderId: string; amount: number; description?: string },
  env: Env
): Promise<PixChargeResult> {
  const { orderId, amount, description } = params;
  const txid = generateTxid(orderId);

  // 1. TENTATIVA VIA HUB CENTRAL NSNEXUS PAY (NSMusic)
  const gatewayUrl = (env.NSNEXUS_GATEWAY_URL || 'https://nsmusic.nsnexus.com.br').replace(/\/+$/, '');
  const gatewayKey = env.NSNEXUS_GATEWAY_API_KEY || '';

  if (gatewayKey) {
    try {
      const gwRes = await fetch(`${gatewayUrl}/api/gateway/v1/charges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gateway-Api-Key': gatewayKey,
        },
        body: JSON.stringify({
          appId: 'nexusapi',
          externalOrderId: orderId,
          amount,
          description: description || `NexusAPI - Plano (${orderId})`,
          webhookUrl: 'https://nexusapi.nsnexus.com.br/api/webhooks/payment',
        }),
      });

      if (gwRes.ok) {
        const gwData: any = await gwRes.json();
        if (gwData.pixCopiaECola) {
          const pixCopiaECola = gwData.pixCopiaECola;
          return {
            txid: gwData.txid || txid,
            pixCopiaECola,
            qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(pixCopiaECola)}&margin=8`,
            status: gwData.status || 'PENDING',
            provider: 'efi',
          };
        }
      } else {
        const errText = await gwRes.text().catch(() => '');
        console.warn(`[Gateway NSMusic] Falhou com HTTP ${gwRes.status}: ${errText}. Tentando fallback direto.`);
      }
    } catch (gwErr: any) {
      console.warn('[Gateway NSMusic] Erro ao conectar ao Hub:', gwErr.message);
    }
  }

  // 2. TENTATIVA VIA PROXY FLY.IO DIRETO
  if (env.EFI_PROXY_SECRET && env.EFI_PIX_KEY && env.EFI_CLIENT_ID) {
    try {
      const accessToken = await getAccessToken(env);

      const body = {
        calendario: { expiracao: 3600 },
        valor: { original: amount.toFixed(2) },
        chave: env.EFI_PIX_KEY,
        solicitacaoPagador: (description || `NexusAPI Plano ${orderId}`).slice(0, 140),
      };

      const res = await relayFetch(
        `${getBaseUrl(env)}/v2/cob/${txid}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
        env
      );

      if (res.ok) {
        const data: any = await res.json();
        const pixCopiaECola = data.pixCopiaECola || '';
        return {
          txid: data.txid || txid,
          pixCopiaECola,
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(pixCopiaECola)}&margin=8`,
          status: data.status || 'ATIVA',
          provider: 'efi',
        };
      }
    } catch (err: any) {
      console.warn('[EFI Direct] Falha ao criar cobrança direta:', err.message);
    }
  }

  // 3. FALLBACK ESTÁTICO DE SEGURANÇA
  const fallbackPixKey = env.EFI_PIX_KEY || '68471413000198';
  const pixCode = `00020126480014br.gov.bcb.pix0126${fallbackPixKey}5204000053039865405${amount.toFixed(2)}5802BR5914NARCISO SANTOS6009SAO PAULO62070503***630425FA`;

  return {
    txid,
    pixCopiaECola: pixCode,
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(pixCode)}&margin=8`,
    status: 'ATIVA',
    provider: 'static',
  };
}

/**
 * Consulta o status da cobrança Pix para confirmar se foi paga
 */
export async function getChargeStatus(txid: string, env: Env): Promise<{ status: string; isPaid: boolean }> {
  if (!txid) return { status: 'UNKNOWN', isPaid: false };

  // 1. Consulta pelo Hub Central NSNexus Pay
  const gatewayUrl = (env.NSNEXUS_GATEWAY_URL || 'https://nsmusic.nsnexus.com.br').replace(/\/+$/, '');
  const gatewayKey = env.NSNEXUS_GATEWAY_API_KEY || '';

  if (gatewayKey) {
    try {
      const gwRes = await fetch(`${gatewayUrl}/api/gateway/v1/charges/${encodeURIComponent(txid)}`, {
        headers: {
          'X-Gateway-Api-Key': gatewayKey,
        },
      });

      if (gwRes.ok) {
        const gwData: any = await gwRes.json();
        const status = gwData.status || 'PENDING';
        return {
          status,
          isPaid: status === 'PAID' || status === 'CONCLUIDA',
        };
      }
    } catch (e: any) {
      console.warn('[Gateway NSMusic] Erro ao consultar status:', e.message);
    }
  }

  // 2. Consulta direta pela Efí via Proxy
  if (env.EFI_PROXY_SECRET && env.EFI_CLIENT_ID) {
    try {
      const accessToken = await getAccessToken(env);
      const res = await relayFetch(
        `${getBaseUrl(env)}/v2/cob/${txid}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${accessToken}` },
        },
        env
      );

      if (res.ok) {
        const data: any = await res.json();
        const status = data.status || 'UNKNOWN';
        return {
          status,
          isPaid: status === 'CONCLUIDA' || status === 'PAID',
        };
      }
    } catch (err: any) {
      console.warn(`[EFI Direct] Falha ao consultar status de ${txid}:`, err.message);
    }
  }

  return { status: 'ATIVA', isPaid: false };
}
