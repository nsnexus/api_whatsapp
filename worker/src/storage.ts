import { Env } from './types';

/**
 * Salva um buffer ou base64 de mídia no Cloudflare R2
 */
export async function uploadMediaToR2(
  env: Env,
  params: {
    organizationId: string;
    buffer: Uint8Array;
    filename: string;
    contentType: string;
  }
): Promise<string> {
  const { organizationId, buffer, filename, contentType } = params;
  const timestamp = Date.now();
  const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${organizationId}/${timestamp}_${safeFilename}`;

  await env.CRM_MEDIA_BUCKET.put(key, buffer, {
    httpMetadata: {
      contentType,
    },
    customMetadata: {
      organizationId,
      uploadedAt: new Date().toISOString(),
    },
  });

  // Se o usuário já tiver domínio público configurado no R2:
  if (env.R2_PUBLIC_URL && !env.R2_PUBLIC_URL.includes('media.seucrm.com.br')) {
    return `${env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
  }

  // Fallback: URL servida diretamente pelo endpoint do próprio Cloudflare Worker (/api/media/:key)
  return `/api/media/${key}`;
}

/**
 * Converte string base64 para Uint8Array no ambiente do Cloudflare Worker
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  // Remove prefixos data:image/png;base64, caso existam
  const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
  const binaryString = atob(cleanBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
