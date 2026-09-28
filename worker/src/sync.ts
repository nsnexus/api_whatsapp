import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Env } from './types';
import { EvolutionGoClient } from './evolution';
import { resolveChatJid, extractMessageContent, timestampToIso } from './whatsapp';

interface ContactRow {
  id: string;
  remote_jid: string;
  custom_fields: Record<string, any> | null;
}

async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>): Promise<T[]> {
  const pageSize = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await build(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Importa a LISTA de conversas do WhatsApp (contatos + chats com prévia da última mensagem).
 * As mensagens em si continuam só na Evolution e são lidas sob demanda (ver messages.ts).
 */
export async function importChats(env: Env, instanceName: string) {
  const supabase: SupabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const evolution = new EvolutionGoClient(env);

  const { data: instance, error: instanceError } = await supabase
    .from('instances')
    .select('id, organization_id')
    .eq('instance_name', instanceName)
    .single();
  if (instanceError || !instance) throw new Error(`Instância ${instanceName} não encontrada`);
  const organizationId: string = instance.organization_id;
  const instanceId: string = instance.id;

  const evolutionChats = (await evolution.findChats(instanceName)) || [];

  // 1. Normaliza as conversas individuais
  const items = new Map<string, { remoteJid: string; lidJid: string | null; phone: string; pushName: string | null; preview: string; at: string }>();
  for (const chat of evolutionChats) {
    const last = chat.lastMessage;
    const sameChat = last?.key?.remoteJid === chat.remoteJid;
    const resolved = resolveChatJid({ remoteJid: chat.remoteJid, remoteJidAlt: sameChat ? last.key.remoteJidAlt : undefined });
    if (!resolved) continue;
    const fromMe = Boolean(last?.key?.fromMe);
    const item = {
      ...resolved,
      // Em mensagens nossas o pushName é o nome do dono da instância ("Você")
      pushName: last && !fromMe && last.pushName ? String(last.pushName).trim() || null : null,
      preview: extractMessageContent(last?.message)?.text || '',
      at: last?.messageTimestamp ? timestampToIso(last.messageTimestamp) : chat.updatedAt || new Date().toISOString(),
    };
    const existing = items.get(item.remoteJid);
    if (!existing || item.at > existing.at) items.set(item.remoteJid, item);
  }

  // 2. Contatos
  const contacts = await fetchAll<ContactRow>((from, to) =>
    supabase.from('contacts').select('id, remote_jid, custom_fields').eq('organization_id', organizationId).range(from, to)
  );
  const byJid = new Map<string, string>();
  const byLid = new Map<string, string>();
  for (const c of contacts) {
    byJid.set(c.remote_jid, c.id);
    if (c.custom_fields?.lid) byLid.set(c.custom_fields.lid, c.id);
  }
  const contactIdFor = (item: { remoteJid: string; lidJid: string | null }) =>
    byJid.get(item.remoteJid) || (item.lidJid ? byLid.get(item.lidJid) || byJid.get(item.lidJid) : undefined);

  // Contatos já existentes (pelo telefone) sem o @lid anotado: completa, pois a Evolution
  // guarda as mensagens dessas conversas pelo @lid
  const customFieldsById = new Map(contacts.map((c) => [c.id, c.custom_fields || {}]));
  const lidBackfill = [...items.values()]
    .filter((item) => item.lidJid && item.lidJid !== item.remoteJid && byJid.has(item.remoteJid) && !byLid.has(item.lidJid))
    .map((item) => ({
      organization_id: organizationId,
      remote_jid: item.remoteJid,
      phone: item.phone,
      custom_fields: { ...customFieldsById.get(byJid.get(item.remoteJid)!), lid: item.lidJid },
    }));
  for (const batch of chunk(lidBackfill, 200)) {
    const { error } = await supabase.from('contacts').upsert(batch, { onConflict: 'organization_id,remote_jid' });
    if (error) throw new Error(`Erro ao atualizar contatos: ${error.message}`);
  }

  const newContacts = [...items.values()].filter((item) => !contactIdFor(item));
  if (newContacts.length > 0) {
    const { data: firstStage } = await supabase
      .from('kanban_stages')
      .select('id')
      .eq('organization_id', organizationId)
      .order('order_index', { ascending: true })
      .limit(1)
      .maybeSingle();
    for (const batch of chunk(newContacts, 200)) {
      const { data: inserted, error } = await supabase
        .from('contacts')
        .upsert(
          batch.map((item) => ({
            organization_id: organizationId,
            remote_jid: item.remoteJid,
            phone: item.phone,
            name: item.pushName || item.phone,
            push_name: item.pushName,
            custom_fields: item.lidJid ? { lid: item.lidJid } : {},
            kanban_stage_id: firstStage?.id || null,
          })),
          { onConflict: 'organization_id,remote_jid', ignoreDuplicates: true }
        )
        .select('id, remote_jid');
      if (error) throw new Error(`Erro ao criar contatos: ${error.message}`);
      for (const c of inserted || []) byJid.set(c.remote_jid, c.id);
    }
  }

  // 3. Chats
  const chats = await fetchAll<{ id: string; contact_id: string; last_message_at: string | null }>((from, to) =>
    supabase.from('chats').select('id, contact_id, last_message_at').eq('organization_id', organizationId).range(from, to)
  );
  const chatByContact = new Map(chats.map((c) => [c.contact_id, c]));

  const toInsert: any[] = [];
  const toUpdate: { id: string; preview: string; at: string }[] = [];
  for (const item of items.values()) {
    const contactId = contactIdFor(item);
    if (!contactId) continue;
    const chat = chatByContact.get(contactId);
    if (!chat) {
      toInsert.push({
        organization_id: organizationId,
        instance_id: instanceId,
        contact_id: contactId,
        status: 'open',
        unread_count: 0,
        last_message_text: item.preview,
        last_message_at: item.at,
      });
    } else if (!chat.last_message_at || new Date(item.at) > new Date(chat.last_message_at)) {
      toUpdate.push({ id: chat.id, preview: item.preview, at: item.at });
    }
  }
  for (const batch of chunk(toInsert, 200)) {
    const { error } = await supabase
      .from('chats')
      .upsert(batch, { onConflict: 'organization_id,contact_id,instance_id', ignoreDuplicates: true });
    if (error) throw new Error(`Erro ao criar conversas: ${error.message}`);
  }
  // Limite de atualizações individuais para não estourar os subrequests do Worker
  for (const update of toUpdate.slice(0, 30)) {
    await supabase.from('chats').update({ last_message_text: update.preview, last_message_at: update.at }).eq('id', update.id);
  }

  return { conversations: items.size, createdContacts: newContacts.length, createdChats: toInsert.length };
}
