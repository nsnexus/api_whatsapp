import { createClient } from '@supabase/supabase-js';
import { Env, EvolutionWebhookPayload } from './types';
import { resolveChatJid, extractMessageContent, timestampToIso } from './whatsapp';
import { EvolutionGoClient } from './evolution';
import { generateCourseAiReply } from './ai';

async function sendEvolutionMedia(
  evolution: EvolutionGoClient,
  instanceName: string,
  cleanPhone: string,
  mat: { name?: string; url: string; type?: string; caption?: string }
) {
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
      : `material.${ext}`;

    await evolution.sendMedia(instanceName, {
      number: cleanPhone,
      mediaMessage: {
        mediatype: mediaType,
        media: mat.url,
        fileName: cleanFileName,
        caption: mat.name ? `📚 *${mat.name}*` : undefined,
      },
    });
  }
}

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

      // 4.3 Salvar mensagem recebida no banco para histórico do chat e contexto da IA
      await supabase.from('messages').insert({
        organization_id: organizationId,
        chat_id: chat.id,
        instance_id: instanceId,
        direction: 'inbound',
        sender_type: 'contact',
        type: extracted.type || 'text',
        content: extracted.text,
        status: 'received',
      });

      // 4.4 Buscar histórico recente de mensagens desta conversa para o robô ter memória de contexto
      const { data: dbHistory } = await supabase
        .from('messages')
        .select('direction, content')
        .eq('chat_id', chat.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const historyMessages = (dbHistory || [])
        .reverse()
        .slice(0, -1) // remove a última inserida (que já é incomingText)
        .filter((m) => m.content && m.content.trim())
        .map((m) => ({
          role: m.direction === 'inbound' ? ('user' as const) : ('assistant' as const),
          content: m.content || '',
        }));

      // Disparar o Atendente de Vendas IA (OpenAI ChatGPT) para texto, imagens e comprovantes (PDF)
      const isTextMessage = extracted.type === 'text';
      const isMediaMessage = extracted.type === 'image' || extracted.type === 'document';

      if (extracted.text && (isTextMessage || isMediaMessage)) {
        try {
          const evolution = new EvolutionGoClient(env);
          let mediaBase64: string | undefined;
          let mediaMimeType: string | undefined = extracted.mimetype || undefined;

          // Se for imagem ou documento (comprovante), baixa o base64 da Evolution para a IA auditar
          if (isMediaMessage && key?.id) {
            try {
              const mediaRes = await evolution.getMediaBase64(instanceName, key.id);
              if (mediaRes?.base64) {
                mediaBase64 = mediaRes.base64;
                if (mediaRes.mimetype) {
                  mediaMimeType = mediaRes.mimetype;
                }
              }
            } catch (mErr) {
              console.error('Erro ao baixar mídia da Evolution para IA:', mErr);
            }
          }

          const aiResult = await generateCourseAiReply({
            supabase,
            organizationId,
            instanceId,
            chatId: chat.id,
            incomingText: extracted.text,
            customerName: contact.name || contact.push_name || undefined,
            customerPhone: cleanPhone,
            historyMessages,
            mediaBase64,
            mediaMimeType,
            mediaType: extracted.type as any,
          });

          if (aiResult && !aiResult.ignored) {
            // A. Se o robô disparou passos programados do Construtor de Fluxo (Flow Builder)
            if (aiResult.dispatchItems && aiResult.dispatchItems.length > 0) {
              let lastSentText = '';

              for (const item of aiResult.dispatchItems) {
                if (item.type === 'text' && item.text) {
                  await evolution.sendText(instanceName, {
                    number: cleanPhone,
                    text: item.text,
                  });
                  await supabase.from('messages').insert({
                    organization_id: organizationId,
                    chat_id: chat.id,
                    instance_id: instanceId,
                    direction: 'outbound',
                    sender_type: 'bot',
                    type: 'text',
                    content: item.text,
                    status: 'sent',
                  });
                  lastSentText = item.text;
                  await new Promise((r) => setTimeout(r, 800));
                } else if ((item.type === 'image' || item.type === 'video' || item.type === 'audio') && item.url) {
                  await sendEvolutionMedia(evolution, instanceName, cleanPhone, {
                    url: item.url,
                    caption: item.caption,
                    type: item.type,
                    name: item.fileName,
                  });
                  await supabase.from('messages').insert({
                    organization_id: organizationId,
                    chat_id: chat.id,
                    instance_id: instanceId,
                    direction: 'outbound',
                    sender_type: 'bot',
                    type: item.type,
                    content: item.caption || item.fileName || '',
                    media_url: item.url,
                    status: 'sent',
                  });
                  if (item.caption) lastSentText = item.caption;
                  await new Promise((r) => setTimeout(r, 1000));
                } else if (item.type === 'deliver_materials') {
                  if (item.text) {
                    await evolution.sendText(instanceName, {
                      number: cleanPhone,
                      text: item.text,
                    });
                    await supabase.from('messages').insert({
                      organization_id: organizationId,
                      chat_id: chat.id,
                      instance_id: instanceId,
                      direction: 'outbound',
                      sender_type: 'bot',
                      type: 'text',
                      content: item.text,
                      status: 'sent',
                    });
                    lastSentText = item.text;
                    await new Promise((r) => setTimeout(r, 800));
                  }
                  if (Array.isArray(item.materialsPayload)) {
                    for (const mat of item.materialsPayload) {
                      if (mat.url) {
                        try {
                          await sendEvolutionMedia(evolution, instanceName, cleanPhone, mat);
                          await supabase.from('messages').insert({
                            organization_id: organizationId,
                            chat_id: chat.id,
                            instance_id: instanceId,
                            direction: 'outbound',
                            sender_type: 'bot',
                            type: 'document',
                            content: mat.name || 'Material do Curso',
                            media_url: mat.url,
                            status: 'sent',
                          });
                          await new Promise((r) => setTimeout(r, 1000));
                        } catch (mErr) {
                          console.error('Erro ao enviar material do curso:', mErr);
                        }
                      }
                    }
                  }
                } else if (item.type === 'generate_pix') {
                  if (item.text) {
                    await evolution.sendText(instanceName, {
                      number: cleanPhone,
                      text: item.text,
                    });
                    await supabase.from('messages').insert({
                      organization_id: organizationId,
                      chat_id: chat.id,
                      instance_id: instanceId,
                      direction: 'outbound',
                      sender_type: 'bot',
                      type: 'text',
                      content: item.text,
                      status: 'sent',
                    });
                    lastSentText = item.text;
                    await new Promise((r) => setTimeout(r, 800));
                  }
                  if (item.pixPayload) {
                    const pix = item.pixPayload;
                    let cleanKey = (pix.pixKey || '').trim();
                    const keyType = pix.pixKeyType || 'phone';
                    if (keyType === 'phone' || keyType === 'cpf' || keyType === 'cnpj') {
                      cleanKey = cleanKey.replace(/\D/g, '');
                    }
                    const merchantName = pix.merchantName || 'NARCISO';

                    try {
                      // Dispara o botão nativo oficial do WhatsApp (ícone verde PIX, beneficiário e botão "Copiar chave Pix")
                      await evolution.sendButtons(instanceName, {
                        number: cleanPhone,
                        title: '',
                        description: '',
                        buttons: [
                          {
                            type: 'pix',
                            currency: 'BRL',
                            name: merchantName,
                            keyType: keyType,
                            key: cleanKey,
                          },
                        ],
                      });

                      await supabase.from('messages').insert({
                        organization_id: organizationId,
                        chat_id: chat.id,
                        instance_id: instanceId,
                        direction: 'outbound',
                        sender_type: 'bot',
                        type: 'text',
                        content: `[Chave PIX (${keyType.toUpperCase()}): ${cleanKey} - ${merchantName}]`,
                        status: 'sent',
                      });
                      lastSentText = `[Chave PIX: ${cleanKey}]`;
                      await new Promise((r) => setTimeout(r, 800));
                    } catch (btnErr) {
                      console.warn('Fallback: Erro ao enviar botão nativo de PIX, enviando texto:', btnErr);
                      const fallbackText = `💳 *CHAVE PIX (${keyType.toUpperCase()}):*\n\`${cleanKey}\`\n\n👤 *Beneficiário:* ${merchantName}`;
                      await evolution.sendText(instanceName, {
                        number: cleanPhone,
                        text: fallbackText,
                      });
                      await supabase.from('messages').insert({
                        organization_id: organizationId,
                        chat_id: chat.id,
                        instance_id: instanceId,
                        direction: 'outbound',
                        sender_type: 'bot',
                        type: 'text',
                        content: fallbackText,
                        status: 'sent',
                      });
                      lastSentText = fallbackText;
                      await new Promise((r) => setTimeout(r, 800));
                    }
                  }
                } else if (item.type === 'deliver_bonus') {
                  if (item.text) {
                    await evolution.sendText(instanceName, {
                      number: cleanPhone,
                      text: item.text,
                    });
                    await supabase.from('messages').insert({
                      organization_id: organizationId,
                      chat_id: chat.id,
                      instance_id: instanceId,
                      direction: 'outbound',
                      sender_type: 'bot',
                      type: 'text',
                      content: item.text,
                      status: 'sent',
                    });
                    lastSentText = item.text;
                    await new Promise((r) => setTimeout(r, 800));
                  }
                  if (item.bonusPayload?.bonuses && Array.isArray(item.bonusPayload.bonuses) && item.bonusPayload.bonuses.length > 0) {
                    const bonusText =
                      `🎁 *SEUS SUPER BÔNUS EXCLUSIVOS:*\n\n` +
                      item.bonusPayload.bonuses
                        .map(
                          (b: any) =>
                            `✨ *${b.name}* ${b.value ? `(Valor de R$ ${Number(b.value).toFixed(2)} Grátis)` : ''}\n${b.description || ''}`
                        )
                        .join('\n\n');

                    await evolution.sendText(instanceName, {
                      number: cleanPhone,
                      text: bonusText,
                    });
                    await supabase.from('messages').insert({
                      organization_id: organizationId,
                      chat_id: chat.id,
                      instance_id: instanceId,
                      direction: 'outbound',
                      sender_type: 'bot',
                      type: 'text',
                      content: bonusText,
                      status: 'sent',
                    });
                    lastSentText = bonusText;
                  }
                }
              }

              if (lastSentText) {
                await supabase
                  .from('chats')
                  .update({
                    last_message_text: lastSentText,
                    last_message_at: new Date().toISOString(),
                  })
                  .eq('id', chat.id);
              }
            } else if (
              aiResult.replyText && 
              aiResult.replyText.trim() && 
              !aiResult.replyText.includes('[IGNORAR]')
            ) {
              // B. Mensagem padrão via IA (resposta a dúvidas/objeções ou funil sem fluxo)
              // 1. Enviar mensagem de texto no WhatsApp do cliente
              await evolution.sendText(instanceName, {
                number: cleanPhone,
                text: aiResult.replyText,
              });

              // 2. Se a IA acionou a entrega de todos os materiais do curso [ENTREGAR_CURSO]
              const deliverMaterialsAction = aiResult.actions.find(
                (a) => a.type === 'deliver_course_materials'
              );
              if (deliverMaterialsAction && Array.isArray(deliverMaterialsAction.payload)) {
                for (const mat of deliverMaterialsAction.payload) {
                  if (mat.url) {
                    try {
                      await sendEvolutionMedia(evolution, instanceName, cleanPhone, mat);
                    } catch (mErr) {
                      console.error('Erro ao enviar material do curso:', mErr);
                    }
                  }
                }
              }

              // 3. Se a IA acionou envio de material individual [ENVIAR_MATERIAL: ...]
              for (const action of aiResult.actions) {
                if (action.type === 'send_media' && action.payload?.url) {
                  try {
                    await sendEvolutionMedia(evolution, instanceName, cleanPhone, action.payload);
                  } catch (mErr) {
                    console.error('Erro ao enviar mídia avulsa:', mErr);
                  }
                }
              }

              // 4. Se a IA gerou PIX [GERAR_PIX]
              const pixAction = aiResult.actions.find((a) => a.type === 'pix_generated');
              if (pixAction && pixAction.payload) {
                const pix = pixAction.payload;
                let cleanKey = (pix.pixKey || '').trim();
                const keyType = pix.pixKeyType || 'phone';
                if (keyType === 'phone' || keyType === 'cpf' || keyType === 'cnpj') {
                  cleanKey = cleanKey.replace(/\D/g, '');
                }
                const merchantName = pix.merchantName || 'NARCISO';

                try {
                  // Dispara o botão nativo oficial do WhatsApp (ícone verde PIX, beneficiário e botão "Copiar chave Pix")
                  await evolution.sendButtons(instanceName, {
                    number: cleanPhone,
                    title: '',
                    description: '',
                    buttons: [
                      {
                        type: 'pix',
                        currency: 'BRL',
                        name: merchantName,
                        keyType: keyType,
                        key: cleanKey,
                      },
                    ],
                  });

                  await supabase.from('messages').insert({
                    organization_id: organizationId,
                    chat_id: chat.id,
                    instance_id: instanceId,
                    direction: 'outbound',
                    sender_type: 'bot',
                    type: 'text',
                    content: `[Chave PIX (${keyType.toUpperCase()}): ${cleanKey} - ${merchantName}]`,
                    status: 'sent',
                  });
                } catch (btnErr) {
                  console.warn('Fallback: Erro ao enviar botão nativo de PIX:', btnErr);
                  const fallbackText = `💳 *CHAVE PIX (${keyType.toUpperCase()}):*\n\`${cleanKey}\`\n\n👤 *Beneficiário:* ${merchantName}`;
                  await evolution.sendText(instanceName, {
                    number: cleanPhone,
                    text: fallbackText,
                  });
                  await supabase.from('messages').insert({
                    organization_id: organizationId,
                    chat_id: chat.id,
                    instance_id: instanceId,
                    direction: 'outbound',
                    sender_type: 'bot',
                    type: 'text',
                    content: fallbackText,
                    status: 'sent',
                  });
                }
              }

              // 5. Se a IA liberou os Super Bônus [LIBERAR_BONUS]
              const bonusAction = aiResult.actions.find((a) => a.type === 'deliver_bonus');
              if (bonusAction && bonusAction.payload) {
                const { bonuses } = bonusAction.payload;
                if (Array.isArray(bonuses) && bonuses.length > 0) {
                  const bonusText =
                    `🎁 *SEUS SUPER BÔNUS EXCLUSIVOS:*\n\n` +
                    bonuses
                      .map(
                        (b: any) =>
                          `✨ *${b.name}* ${b.value ? `(Valor de R$ ${Number(b.value).toFixed(2)} Grátis)` : ''}\n${b.description || ''}`
                      )
                      .join('\n\n');

                  await evolution.sendText(instanceName, {
                    number: cleanPhone,
                    text: bonusText,
                  });
                }
              }

              // 6. Atualizar a prévia do chat no CRM e gravar a mensagem de saída
              await supabase
                .from('chats')
                .update({
                  last_message_text: aiResult.replyText,
                  last_message_at: new Date().toISOString(),
                })
                .eq('id', chat.id);

              await supabase.from('messages').insert({
                organization_id: organizationId,
                chat_id: chat.id,
                instance_id: instanceId,
                direction: 'outbound',
                sender_type: 'bot',
                type: 'text',
                content: aiResult.replyText,
                status: 'sent',
              });
            }
          } else if (aiResult?.ignored) {
            console.log(`[AI Bot] Mensagem de ${cleanPhone} desconsiderada: não referente a cursos.`);
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
