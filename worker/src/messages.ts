import { createClient } from '@supabase/supabase-js';
import { Env } from './types';
import { EvolutionGoClient } from './evolution';
import { resolveChatJid, extractMessageContent, timestampToIso } from './whatsapp';

/**
 * As mensagens do WhatsApp NÃO são copiadas para o Supabase: a Evolution (Postgres na VPS)
 * já guarda o histórico completo. Aqui buscamos as mensagens de uma conversa direto nela,
 * e juntamos apenas as notas internas da equipe, que só existem no CRM.
 */
export async function getChatMessages(
  env: Env,
  params: { chatId: string; page: number; limit: number; mediaBaseUrl: string }
) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: chat, error } = await supabase
    .from('chats')
    .select('id, organization_id, instance_id, contact:contacts(id, phone, remote_jid, custom_fields), instance:instances(instance_name)')
    .eq('id', params.chatId)
    .single();
  if (error || !chat) throw new Error('Conversa não encontrada');

  const contact: any = Array.isArray(chat.contact) ? chat.contact[0] : chat.contact;
  let instanceName: string | undefined = (Array.isArray(chat.instance) ? chat.instance[0] : (chat.instance as any))?.instance_name;
  if (!instanceName) {
    const { data: fallback } = await supabase
      .from('instances')
      .select('instance_name')
      .eq('organization_id', chat.organization_id)
      .limit(1)
      .maybeSingle();
    instanceName = fallback?.instance_name;
  }
  if (!instanceName || !contact) return { messages: [], hasMore: false };

  // O WhatsApp Baileys recente usa endereçamento por LID:
  // - O telefone real fica salvo em key.remoteJidAlt (ex: 559491791262@s.whatsapp.net)
  // - O JID principal é o LID (ex: 139930319724588@lid)
  const phone = contact.phone || (contact.remote_jid ? contact.remote_jid.replace(/\D/g, '') : '');
  const phoneJid = phone ? (phone.includes('@') ? phone : `${phone}@s.whatsapp.net`) : null;
  const rawRemoteJid = contact.remote_jid;
  const knownLid = contact.custom_fields?.lid || (rawRemoteJid?.endsWith('@lid') ? rawRemoteJid : null);

  const evolution = new EvolutionGoClient(env);

  // Dispara consultas em paralelo cobrindo todas as formas de armazenamento na Evolution
  const queries: Promise<any>[] = [];

  if (phoneJid) {
    queries.push(
      evolution.findMessages(instanceName, params.page, params.limit, { remoteJidAlt: phoneJid }).catch(() => null)
    );
    queries.push(
      evolution.findMessages(instanceName, params.page, params.limit, { remoteJid: phoneJid }).catch(() => null)
    );
  }
  if (rawRemoteJid && rawRemoteJid !== phoneJid) {
    queries.push(
      evolution.findMessages(instanceName, params.page, params.limit, { remoteJid: rawRemoteJid }).catch(() => null)
    );
  }
  if (knownLid && knownLid !== rawRemoteJid) {
    queries.push(
      evolution.findMessages(instanceName, params.page, params.limit, { remoteJid: knownLid }).catch(() => null)
    );
  }

  const results = await Promise.all(queries);

  // Se descobrirmos um LID nas mensagens que ainda não estava cadastrado, buscamos mensagens legadas por ele
  let discoveredLid: string | null = null;
  for (const res of results) {
    for (const r of res?.messages?.records || []) {
      if (r.key?.remoteJid?.endsWith('@lid') && r.key.remoteJid !== knownLid) {
        discoveredLid = r.key.remoteJid;
        break;
      }
    }
    if (discoveredLid) break;
  }

  if (discoveredLid) {
    const lidRes = await evolution
      .findMessages(instanceName, params.page, params.limit, { remoteJid: discoveredLid })
      .catch(() => null);
    if (lidRes) results.push(lidRes);

    // Salva o LID associado ao contato no Supabase para as próximas consultas serem ainda mais rápidas
    if (contact.id && (!contact.custom_fields || contact.custom_fields.lid !== discoveredLid)) {
      supabase
        .from('contacts')
        .update({
          custom_fields: { ...(contact.custom_fields || {}), lid: discoveredLid },
        })
        .eq('id', contact.id)
        .then(() => {}, () => {});
    }
  }

  const seen = new Set<string>();
  const messages: any[] = [];
  let hasMore = false;
  for (const result of results) {
    const page = result?.messages;
    if (!page) continue;
    if (page.pages > params.page) hasMore = true;
    for (const record of page.records || []) {
      const waId = record.key?.id;
      if (!waId || seen.has(waId) || !resolveChatJid(record.key)) continue;
      const content = extractMessageContent(record.message);
      if (!content || (!content.text && content.type === 'text')) continue;
      seen.add(waId);
      const fromMe = Boolean(record.key.fromMe);
      const hasMedia = ['audio', 'image', 'video', 'document'].includes(content.type);
      messages.push({
        id: waId,
        organization_id: chat.organization_id,
        chat_id: chat.id,
        whatsapp_message_id: waId,
        direction: fromMe ? 'outbound' : 'inbound',
        sender_type: fromMe ? 'agent' : 'contact',
        type: content.type,
        content: content.text,
        media_url: hasMedia ? `${params.mediaBaseUrl}/api/media/wa/${instanceName}/${waId}` : null,
        media_mimetype: content.mimetype,
        media_filename: content.filename,
        media_duration: content.duration,
        is_internal_note: false,
        status: fromMe ? 'sent' : 'delivered',
        created_at: timestampToIso(record.messageTimestamp),
      });
    }
  }

  // Notas internas (só existem no CRM) entram na primeira página
  if (params.page === 1) {
    const { data: notes } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chat.id)
      .eq('is_internal_note', true)
      .order('created_at', { ascending: true });
    messages.push(...(notes || []));
  }

  messages.sort((a, b) => a.created_at.localeCompare(b.created_at));
  return { messages, hasMore };
}

/**
 * Serve a mídia de uma mensagem do WhatsApp. Na primeira vez baixa pela Evolution e
 * guarda no R2; nas próximas serve direto do R2.
 */
export async function serveWhatsAppMedia(env: Env, instanceName: string, messageId: string): Promise<Response> {
  const key = `wa/${instanceName}/${messageId}`;
  const cached = await env.CRM_MEDIA_BUCKET.get(key);
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=31536000, immutable',
  });

  if (cached) {
    cached.writeHttpMetadata(headers);
    return new Response(cached.body, { headers });
  }

  const evolution = new EvolutionGoClient(env);
  let media: { base64: string; mimetype: string };
  try {
    media = await evolution.getMediaBase64(instanceName, messageId);
  } catch {
    return new Response('Mídia indisponível', { status: 404, headers });
  }
  if (!media?.base64) return new Response('Mídia indisponível', { status: 404, headers });

  const binary = atob(media.base64.includes(',') ? media.base64.split(',')[1] : media.base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const contentType = media.mimetype || 'application/octet-stream';
  await env.CRM_MEDIA_BUCKET.put(key, bytes, { httpMetadata: { contentType } });
  headers.set('Content-Type', contentType);
  return new Response(bytes, { headers });
}
