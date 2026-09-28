import { createClient } from '@supabase/supabase-js';
import { Env, EvolutionWebhookPayload } from './types';
import { resolveChatJid, extractMessageContent, timestampToIso } from './whatsapp';
import { EvolutionGoClient } from './evolution';
import { generateCourseAiReply } from './ai';

export async function handleEvolutionWebhook(payload: EvolutionWebhookPayload, env: Env): Promise<Response> {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { event, instance: instanceName, data } = payload;
  const normalizedEvent = (event || '').toUpperCase();

  // 1. Identificar a instância e a Organização (Tenant) dona dela
  const { data: instanceRecord, error: instanceError } = await supabase
    .from('instances')
    .select('id, organization_id, status')
    .eq('instance_name', instanceName)
    .single();

  if (instanceError || !instanceRecord) {
    console.warn(`Instância ${instanceName} não encontrada no banco.`);
    return new Response(JSON.stringify({ status: 'ignored', reason: 'instance_not_found' }), { status: 200 });
  }

  const organizationId = instanceRecord.organization_id;
  const instanceId = instanceRecord.id;

  // 2. Evento: Atualização de Status da Conexão
  if (normalizedEvent.includes('CONNECTION') || normalizedEvent.includes('STATUS')) {
    const state = data?.state || data?.status || '';
    let mappedStatus = 'disconnected';
    if (state === 'open' || state === 'connected') mappedStatus = 'connected';
    else if (state === 'connecting') mappedStatus = 'connecting';

    await supabase
      .from('instances')
      .update({
        status: mappedStatus,
        phone_number: data?.ownerJid ? data.ownerJid.replace(/\D/g, '') : undefined,
        profile_picture_url: data?.profilePicUrl || undefined,
        qr_code: mappedStatus === 'connected' ? null : undefined,
      })
      .eq('id', instanceId);

    return new Response(JSON.stringify({ status: 'ok', event: 'connection_updated' }), { status: 200 });
  }

  // 3. Evento: Novo QR Code gerado
  if (normalizedEvent.includes('QRCODE')) {
    const qrcode = data?.qrcode?.base64 || data?.base64 || data?.qrcode;
    if (qrcode) {
      await supabase
        .from('instances')
        .update({
          status: 'qrcode',
          qr_code: qrcode,
        })
        .eq('id', instanceId);
    }
    return new Response(JSON.stringify({ status: 'ok', event: 'qrcode_updated' }), { status: 200 });
  }

  // 4. Evento: Mensagem Recebida ou Enviada (MESSAGES_UPSERT)
  if (normalizedEvent.includes('MESSAGES_UPSERT') || normalizedEvent.includes('MESSAGES.UPSERT') || normalizedEvent === 'SEND_MESSAGE') {
    const key = data?.key || {};
    const fromMe = Boolean(key.fromMe);

    // Ignora status/stories, grupos (@g.us), canais e broadcast. Conversas @lid são resolvidas para o telefone.
    const resolved = resolveChatJid({ ...key, remoteJid: key.remoteJid || data?.remoteJid });
    if (!resolved) {
      return new Response(JSON.stringify({ status: 'ignored', reason: 'group_or_broadcast' }), { status: 200 });
    }
    const { remoteJid, lidJid } = resolved;
    const cleanPhone = resolved.phone;

    // Reações, edições e mensagens de protocolo não viram balão no chat
    const extracted = extractMessageContent(data?.message);
    if (!extracted || (!extracted.text && extracted.type === 'text')) {
      return new Response(JSON.stringify({ status: 'ignored', reason: 'no_displayable_content' }), { status: 200 });
    }

    // Em mensagens enviadas por nós (fromMe) o pushName é o nome do DONO da instância,
    // não do contato. Só confiamos no pushName quando a mensagem vem do contato.
    const contactPushName: string | null = !fromMe && data?.pushName ? String(data.pushName).trim() || null : null;

    // 4.1 Upsert do Contato (procura pelo JID do telefone ou pelo @lid)
    const candidateJids = lidJid && lidJid !== remoteJid ? [remoteJid, lidJid] : [remoteJid];
    const { data: foundContacts } = await supabase
      .from('contacts')
      .select('id, kanban_stage_id, name, push_name, remote_jid')
      .eq('organization_id', organizationId)
      .in('remote_jid', candidateJids);
    let contact = foundContacts?.find((c) => c.remote_jid === remoteJid) || foundContacts?.[0] || null;
    if (!contact && lidJid) {
      const { data: byLid } = await supabase
        .from('contacts')
        .select('id, kanban_stage_id, name, push_name, remote_jid')
        .eq('organization_id', organizationId)
        .eq('custom_fields->>lid', lidJid)
        .limit(1)
        .maybeSingle();
      contact = byLid;
    }

    // Contato salvo pelo @lid e agora sabemos o telefone real: migra para o JID do telefone
    if (contact && contact.remote_jid !== remoteJid && remoteJid.endsWith('@s.whatsapp.net')) {
      await supabase.from('contacts').update({ remote_jid: remoteJid, phone: cleanPhone }).eq('id', contact.id);
    }

    // Atualiza nome de contatos existentes quando o contato manda mensagem com pushName,
    // desde que o nome atual tenha sido preenchido automaticamente (não editado pelo usuário)
    if (contact && contactPushName && contact.push_name !== contactPushName) {
      const nameWasAuto = !contact.name || contact.name === contact.push_name || contact.name === cleanPhone || contact.name === 'Contato';
      await supabase
        .from('contacts')
        .update({
          push_name: contactPushName,
          ...(nameWasAuto ? { name: contactPushName } : {}),
        })
        .eq('id', contact.id);
    }

    if (!contact) {
      // Buscar primeira etapa padrão do Kanban para atribuir ao novo lead
      const { data: firstStage } = await supabase
        .from('kanban_stages')
        .select('id')
        .eq('organization_id', organizationId)
        .order('order_index', { ascending: true })
        .limit(1)
        .maybeSingle();

      const { data: newContact, error: createContactError } = await supabase
        .from('contacts')
        .insert({
          organization_id: organizationId,
          remote_jid: remoteJid,
          phone: cleanPhone,
          name: contactPushName || cleanPhone,
          push_name: contactPushName,
          custom_fields: lidJid ? { lid: lidJid } : {},
          kanban_stage_id: firstStage?.id || null,
        })
        .select('id, kanban_stage_id, name, push_name, remote_jid')
        .single();

      if (createContactError || !newContact) {
        console.error('Erro ao criar contato:', createContactError);
        return new Response(JSON.stringify({ error: createContactError?.message || 'Falha ao criar contato' }), { status: 500 });
      }
      contact = newContact;
    }

    if (!contact) {
      return new Response(JSON.stringify({ error: 'Contato não encontrado' }), { status: 500 });
    }

    // 4.2 Upsert do Chat / Conversa
    let { data: chat } = await supabase
      .from('chats')
      .select('id, unread_count')
      .eq('organization_id', organizationId)
      .eq('contact_id', contact.id)
      .maybeSingle();

    if (!chat) {
      const { data: newChat, error: createChatError } = await supabase
        .from('chats')
        .insert({
          organization_id: organizationId,
          instance_id: instanceId,
          contact_id: contact.id,
          status: 'open',
          unread_count: 0,
        })
        .select('id, unread_count')
        .single();

      if (createChatError) {
        console.error('Erro ao criar chat:', createChatError);
        return new Response(JSON.stringify({ error: createChatError.message }), { status: 500 });
      }
      chat = newChat;
    }

    // 4.3 A mensagem em si fica só na Evolution (lida sob demanda pelo CRM).
    // Aqui atualizamos apenas a prévia da conversa e o contador de não lidas.
    const messageAt = data?.messageTimestamp ? timestampToIso(data.messageTimestamp) : new Date().toISOString();

    if (fromMe) {
      // Quando um atendente humano responde manualmente no WhatsApp ou CRM,
      // pausamos o bot de IA para este chat pelo tempo configurado de Human Handover.
      const { data: aiSet } = await supabase
        .from('ai_settings')
        .select('human_handover_minutes')
        .eq('organization_id', organizationId)
        .maybeSingle();

      const handoverMinutes = aiSet?.human_handover_minutes || 60;
      const pauseUntil = new Date(Date.now() + handoverMinutes * 60 * 1000).toISOString();

      await supabase
        .from('chats')
        .update({
          last_message_text: extracted.text,
          last_message_at: messageAt,
          unread_count: chat.unread_count,
          ai_paused_until: pauseUntil,
        })
        .eq('id', chat.id);
    } else {
      // Mensagem recebida do cliente
      await supabase
        .from('chats')
        .update({
          last_message_text: extracted.text,
          last_message_at: messageAt,
          unread_count: (chat.unread_count || 0) + 1,
        })
        .eq('id', chat.id);

      // Disparar o Atendente de Vendas IA (OpenAI ChatGPT)
      if (extracted.text && extracted.type === 'text') {
        try {
          const aiResult = await generateCourseAiReply({
            supabase,
            organizationId,
            chatId: chat.id,
            incomingText: extracted.text,
            customerName: contact.name || contact.push_name || undefined,
            customerPhone: cleanPhone,
          });

          if (aiResult && aiResult.replyText) {
            const evolution = new EvolutionGoClient(env);

            // 1. Enviar mensagem de texto no WhatsApp do cliente
            await evolution.sendText(instanceName, {
              number: cleanPhone,
              text: aiResult.replyText,
            });

            // 2. Se a IA acionou o envio de material/amostra [ENVIAR_MATERIAL: ...]
            for (const action of aiResult.actions) {
              if (action.type === 'send_media' && action.payload?.url) {
                const mat = action.payload;
                const urlLower = String(mat.url).toLowerCase();
                const isAudio =
                  mat.type === 'audio' ||
                  urlLower.endsWith('.mp3') ||
                  urlLower.endsWith('.m4a') ||
                  urlLower.endsWith('.ogg') ||
                  urlLower.endsWith('.wav');
                const isVideo =
                  mat.type === 'video' ||
                  urlLower.endsWith('.mp4') ||
                  urlLower.endsWith('.mov') ||
                  urlLower.endsWith('.webm');
                const isImage =
                  mat.type === 'image' ||
                  urlLower.endsWith('.png') ||
                  urlLower.endsWith('.jpg') ||
                  urlLower.endsWith('.jpeg') ||
                  urlLower.endsWith('.webp');

                if (isAudio) {
                  await evolution.sendWhatsAppAudio(instanceName, {
                    number: cleanPhone,
                    audio: mat.url,
                  });
                } else {
                  const mediaType: 'image' | 'video' | 'document' = isImage
                    ? 'image'
                    : isVideo
                    ? 'video'
                    : 'document';
                  const ext = isImage ? 'png' : isVideo ? 'mp4' : 'pdf';
                  const cleanFileName = mat.name
                    ? `${mat.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`
                    : `amostra.${ext}`;

                  await evolution.sendMedia(instanceName, {
                    number: cleanPhone,
                    mediaMessage: {
                      mediatype: mediaType,
                      media: mat.url,
                      fileName: cleanFileName,
                      caption: `📚 *${mat.name}*`,
                    },
                  });
                }
              }
            }

            // 3. Atualizar a prévia do chat no CRM com a resposta da IA
            await supabase
              .from('chats')
              .update({
                last_message_text: aiResult.replyText,
                last_message_at: new Date().toISOString(),
              })
              .eq('id', chat.id);
          }
        } catch (aiErr) {
          console.error('Erro ao processar resposta do Bot de Cursos IA:', aiErr);
        }
      }
    }

    return new Response(JSON.stringify({ status: 'ok', message: 'processed' }), { status: 200 });
  }

  return new Response(JSON.stringify({ status: 'ok', event: 'unhandled' }), { status: 200 });
}
