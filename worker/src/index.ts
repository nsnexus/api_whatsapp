import { createClient } from '@supabase/supabase-js';
import { Env, SendTextMessageRequest, SendMediaMessageRequest } from './types';
import { EvolutionGoClient } from './evolution';
import { handleEvolutionWebhook } from './webhook';
import { importChats } from './sync';
import { getChatMessages, serveWhatsAppMedia } from './messages';
import { uploadMediaToR2, base64ToUint8Array } from './storage';
import { generateCourseAiReply } from './ai';

// Helper de Cabeçalhos CORS
function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-organization-id',
  };
}

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    // 1. Tratamento de Preflight CORS
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    try {
      // 1.5 Rota de status / health check
      if ((url.pathname === '/' || url.pathname === '/health') && method === 'GET') {
        return jsonResponse({
          status: 'online',
          service: 'CRM WhatsApp Evolution API Gateway',
          subdomain: 'nexusapi.nsnexus.com.br',
          timestamp: new Date().toISOString(),
        });
      }

      // 2. Rota: Webhook recebido da Evolution Go (VPS)
      if (url.pathname === '/webhook' && method === 'POST') {
        const payload = await request.json();
        return await handleEvolutionWebhook(payload as any, env);
      }

      // 2.5 Rota: Mídia de mensagem do WhatsApp (baixada sob demanda da Evolution e cacheada no R2)
      const waMediaMatch = url.pathname.match(/^\/api\/media\/wa\/([^/]+)\/([^/]+)$/);
      if (waMediaMatch && method === 'GET') {
        return await serveWhatsAppMedia(env, decodeURIComponent(waMediaMatch[1]), decodeURIComponent(waMediaMatch[2]));
      }

      // 3. Rota: Servir mídia direto do bucket R2 (caso não tenha domínio customizado no R2)
      if (url.pathname.startsWith('/api/media/')) {
        const key = url.pathname.replace('/api/media/', '');
        const object = await env.CRM_MEDIA_BUCKET.get(key);

        if (!object) {
          return new Response('Arquivo não encontrado', { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('Access-Control-Allow-Origin', '*');

        return new Response(object.body, { headers });
      }

      const evolution = new EvolutionGoClient(env);
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      });

      // 3.3 Rota: Mensagens de uma conversa (lidas direto da Evolution, sem cópia no Supabase)
      const chatMessagesMatch = url.pathname.match(/^\/api\/chats\/([^/]+)\/messages$/);
      if (chatMessagesMatch && method === 'GET') {
        const result = await getChatMessages(env, {
          chatId: chatMessagesMatch[1],
          page: Math.max(1, Number(url.searchParams.get('page')) || 1),
          limit: Math.min(200, Math.max(10, Number(url.searchParams.get('limit')) || 60)),
          mediaBaseUrl: url.origin,
        });
        return jsonResponse(result);
      }

      // 3.4 Rota: Importar a lista de conversas do WhatsApp (contatos + chats) para o CRM
      if (url.pathname === '/api/instances/import-chats' && method === 'POST') {
        const body = (await request.json()) as { instanceName: string };
        if (!body.instanceName) return jsonResponse({ error: 'instanceName é obrigatório' }, 400);
        return jsonResponse(await importChats(env, body.instanceName));
      }

      // 3.45 Rota: Nota interna da equipe (única "mensagem" guardada no Supabase)
      if (url.pathname === '/api/messages/internal-note' && method === 'POST') {
        const body = (await request.json()) as { organizationId: string; chatId: string; content: string; senderId?: string };
        const { data: note, error } = await supabase
          .from('messages')
          .insert({
            organization_id: body.organizationId,
            chat_id: body.chatId,
            direction: 'outbound',
            sender_type: 'agent',
            sender_id: body.senderId || null,
            type: 'internal_note',
            content: body.content,
            is_internal_note: true,
            status: 'sent',
          })
          .select()
          .single();
        if (error) return jsonResponse({ error: error.message }, 500);
        return jsonResponse({ message: note });
      }

      // 3.5 Rota: Listar Instâncias por Organização (Multi-Tenant)
      if (url.pathname === '/api/instances' && method === 'GET') {
        const organizationId = url.searchParams.get('organizationId');
        if (!organizationId) {
          return jsonResponse({ instances: [] });
        }

        const { data: instances, error } = await supabase
          .from('instances')
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false });

        if (error) return jsonResponse({ error: error.message }, 500);
        return jsonResponse({ instances: instances || [] });
      }

      // 4. Rota: Criar Nova Instância do WhatsApp
      if (url.pathname === '/api/instances/create' && method === 'POST') {
        const body = (await request.json()) as { organizationId: string; name: string };
        const safeInstanceName = `org_${body.organizationId.substring(0, 8)}_${Date.now()}`;

        // 4.1 Registra na Evolution Go
        const webhookUrl = `${url.origin}/webhook`;
        await evolution.createInstance({
          instanceName: safeInstanceName,
          webhookUrl,
        });

        // 4.2 Salva no Supabase
        const { data: instance, error } = await supabase
          .from('instances')
          .insert({
            organization_id: body.organizationId,
            name: body.name,
            instance_name: safeInstanceName,
            status: 'connecting',
            webhook_url: webhookUrl,
          })
          .select()
          .single();

        if (error) {
          return jsonResponse({ error: error.message }, 500);
        }

        return jsonResponse({ instance });
      }

      // 5. Rota: Obter QR Code ou Pairing Code da Instância
      if (url.pathname.startsWith('/api/instances/connect/') && method === 'GET') {
        const instanceName = url.pathname.replace('/api/instances/connect/', '');
        const phoneNumber = url.searchParams.get('number');
        const qrResponse = await evolution.getConnectQrCode(instanceName, phoneNumber || undefined);

        const qrcode =
          typeof qrResponse?.qrcode === 'string'
            ? qrResponse.qrcode
            : qrResponse?.base64 || qrResponse?.qrcode?.base64 || qrResponse?.code;

        const pairingCode = qrResponse?.pairingCode;

        if (qrcode) {
          await supabase
            .from('instances')
            .update({ qr_code: qrcode, status: 'qrcode' })
            .eq('instance_name', instanceName);
        }

        return jsonResponse({ qrcode, pairingCode, raw: qrResponse });
      }

      // 5.1 Rota: Consultar Estado da Conexão (open, close, connecting)
      if (url.pathname.startsWith('/api/instances/status/') && method === 'GET') {
        const instanceName = url.pathname.replace('/api/instances/status/', '');
        const stateResponse = await evolution.getConnectionState(instanceName);
        const state = stateResponse?.instance?.state || stateResponse?.state || 'close';

        if (state === 'open') {
          let phoneNumber: string | null = null;
          let profilePicUrl: string | null = null;
          try {
            const list = await evolution.fetchInstances();
            const found = Array.isArray(list) ? list.find((i: any) => i.name === instanceName) : null;
            if (found?.ownerJid) {
              phoneNumber = found.ownerJid.replace('@s.whatsapp.net', '');
            }
            if (found?.profilePicUrl) {
              profilePicUrl = found.profilePicUrl;
            }
          } catch (e) {}

          const updateData: any = { status: 'connected' };
          if (phoneNumber) updateData.phone_number = phoneNumber;
          if (profilePicUrl) updateData.profile_picture_url = profilePicUrl;

          await supabase
            .from('instances')
            .update(updateData)
            .eq('instance_name', instanceName);
        }

        return jsonResponse({ state, raw: stateResponse });
      }

      // 5.2 Rota: Configurar Webhook da Instância (Nexus API para n8n, Typebot, Make)
      if (url.pathname === '/api/instances/set-webhook' && method === 'POST') {
        const body = (await request.json()) as { instanceName: string; webhookUrl: string; enabled?: boolean };
        const enabled = body.enabled ?? true;
        
        // Configura na Evolution API na VPS
        const result = await evolution.setWebhook(body.instanceName, body.webhookUrl, enabled);

        // Atualiza no Supabase
        await supabase
          .from('instances')
          .update({ webhook_url: body.webhookUrl })
          .eq('instance_name', body.instanceName);

        return jsonResponse({ success: true, result });
      }

      // 5.3 Rota: Reiniciar Instância
      if (url.pathname === '/api/instances/restart' && method === 'POST') {
        const body = (await request.json()) as { instanceName: string };
        const result = await evolution.restartInstance(body.instanceName);
        return jsonResponse({ success: true, result });
      }

      // 5.4 Rota: Desconectar (Logout) Instância
      if (url.pathname === '/api/instances/logout' && method === 'POST') {
        const body = (await request.json()) as { instanceName: string };
        const result = await evolution.logoutInstance(body.instanceName);
        await supabase
          .from('instances')
          .update({ status: 'disconnected', qr_code: null })
          .eq('instance_name', body.instanceName);
        return jsonResponse({ success: true, result });
      }

      // 5.5 Rota: Deletar Instância
      if (url.pathname === '/api/instances/delete' && method === 'POST') {
        const body = (await request.json()) as { instanceName: string };
        try {
          await evolution.deleteInstance(body.instanceName);
        } catch (e) {
          console.warn('Erro ao deletar na VPS (pode já estar deletada):', e);
        }

        const { error: dbError } = await supabase
          .from('instances')
          .delete()
          .eq('instance_name', body.instanceName);

        if (dbError) {
          console.error('Erro ao deletar no Supabase:', dbError);
          return jsonResponse({ error: dbError.message }, 500);
        }

        return jsonResponse({ success: true });
      }

      // 5.6 Rota: Testar Envio da API (Playground W-API)
      if (url.pathname === '/api/instances/test-send' && method === 'POST') {
        const body = (await request.json()) as {
          instanceName: string;
          number: string;
          type: 'text' | 'audio' | 'media';
          text?: string;
          mediaUrl?: string;
        };

        let result;
        if (body.type === 'text') {
          result = await evolution.sendText(body.instanceName, {
            number: body.number,
            text: body.text || 'Teste de API enviado via W-API / EvoCRM 🚀',
          });
        } else if (body.type === 'audio') {
          result = await evolution.sendWhatsAppAudio(body.instanceName, {
            number: body.number,
            audio: body.mediaUrl || 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
          });
        } else {
          result = await evolution.sendMedia(body.instanceName, {
            number: body.number,
            mediaMessage: {
              mediatype: 'image',
              caption: body.text || 'Imagem enviada via API Playground',
              media: body.mediaUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500',
            },
          });
        }

        return jsonResponse({ success: true, result });
      }

      // 6. Rota: Envio de Mensagem de Texto
      if (url.pathname === '/api/messages/send-text' && method === 'POST') {
        const body = (await request.json()) as SendTextMessageRequest;

        // 6.1 Envia através da Evolution Go na VPS
        const sendResult = await evolution.sendText(body.instanceName, {
          number: body.remoteJid,
          text: body.text,
        });

        // A mensagem fica salva na Evolution; o Supabase guarda só a prévia do chat
        const message = {
          id: sendResult?.key?.id || `sent-${Date.now()}`,
          organization_id: body.organizationId,
          chat_id: body.chatId,
          whatsapp_message_id: sendResult?.key?.id || null,
          direction: 'outbound',
          sender_type: 'agent',
          type: 'text',
          content: body.text,
          media_url: null,
          is_internal_note: false,
          status: 'sent',
          created_at: new Date().toISOString(),
        };

        // Atualiza o chat
        await supabase
          .from('chats')
          .update({
            last_message_text: body.text,
            last_message_at: new Date().toISOString(),
          })
          .eq('id', body.chatId);

        return jsonResponse({ message, sendResult });
      }

      // 7. Rota: Envio de Áudio Nativo de Voz (PTT)
      if (url.pathname === '/api/messages/send-audio' && method === 'POST') {
        const body = (await request.json()) as SendMediaMessageRequest;
        let audioUrl = body.mediaUrl;

        // Se veio base64 do gravador do navegador, faz upload no R2
        if (body.base64Data && !audioUrl) {
          const buffer = base64ToUint8Array(body.base64Data);
          audioUrl = await uploadMediaToR2(env, {
            organizationId: body.organizationId,
            buffer,
            filename: `audio_${Date.now()}.ogg`,
            contentType: body.mimetype || 'audio/ogg; codecs=opus',
          });
        }

        if (!audioUrl) {
          return jsonResponse({ error: 'Nenhum áudio fornecido' }, 400);
        }

        // Envia para a Evolution Go com PTT nativo
        const fullAudioUrl = audioUrl.startsWith('http') ? audioUrl : `${url.origin}${audioUrl}`;
        const sendResult = await evolution.sendWhatsAppAudio(body.instanceName, {
          number: body.remoteJid,
          audio: fullAudioUrl,
        });

        // A mensagem fica salva na Evolution; o Supabase guarda só a prévia do chat
        const message = {
          id: sendResult?.key?.id || `sent-${Date.now()}`,
          organization_id: body.organizationId,
          chat_id: body.chatId,
          whatsapp_message_id: sendResult?.key?.id || null,
          direction: 'outbound',
          sender_type: 'agent',
          type: 'audio',
          content: '🎵 Mensagem de voz',
          media_url: audioUrl,
          is_internal_note: false,
          status: 'sent',
          created_at: new Date().toISOString(),
        };

        await supabase
          .from('chats')
          .update({
            last_message_text: '🎵 Mensagem de voz',
            last_message_at: new Date().toISOString(),
          })
          .eq('id', body.chatId);

        return jsonResponse({ message, sendResult });
      }

      // 8. Rota: Envio de Mídia (Imagem ou Documento)
      if (url.pathname === '/api/messages/send-media' && method === 'POST') {
        const body = (await request.json()) as SendMediaMessageRequest;
        let mediaUrl = body.mediaUrl;

        if (body.base64Data && !mediaUrl) {
          const buffer = base64ToUint8Array(body.base64Data);
          mediaUrl = await uploadMediaToR2(env, {
            organizationId: body.organizationId,
            buffer,
            filename: body.fileName || `media_${Date.now()}`,
            contentType: body.mimetype,
          });
        }

        if (!mediaUrl) {
          return jsonResponse({ error: 'Nenhuma mídia fornecida' }, 400);
        }

        const fullMediaUrl = mediaUrl.startsWith('http') ? mediaUrl : `${url.origin}${mediaUrl}`;

        const sendResult = await evolution.sendMedia(body.instanceName, {
          number: body.remoteJid,
          mediaMessage: {
            mediatype: body.mediaType === 'image' ? 'image' : 'document',
            caption: body.caption,
            media: fullMediaUrl,
            fileName: body.fileName,
            mimetype: body.mimetype,
          },
        });

        // A mensagem fica salva na Evolution; o Supabase guarda só a prévia do chat
        const message = {
          id: sendResult?.key?.id || `sent-${Date.now()}`,
          organization_id: body.organizationId,
          chat_id: body.chatId,
          whatsapp_message_id: sendResult?.key?.id || null,
          direction: 'outbound',
          sender_type: 'agent',
          type: body.mediaType,
          content: body.caption || (body.mediaType === 'image' ? '📷 Foto' : '📄 Documento'),
          media_url: mediaUrl,
          is_internal_note: false,
          status: 'sent',
          created_at: new Date().toISOString(),
        };

        await supabase
          .from('chats')
          .update({
            last_message_text: body.caption || (body.mediaType === 'image' ? '📷 Foto' : '📄 Documento'),
            last_message_at: new Date().toISOString(),
          })
          .eq('id', body.chatId);

        return jsonResponse({ message, sendResult });
      }

      // 14. Rota: Testar chave da OpenAI (ChatGPT)
      if (url.pathname === '/api/ai/test-openai' && method === 'POST') {
        const body = (await request.json()) as { apiKey: string; model?: string };
        if (!body.apiKey) {
          return jsonResponse({ error: 'Chave da API OpenAI é obrigatória' }, 400);
        }

        try {
          const testResp = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${body.apiKey}`,
            },
            body: JSON.stringify({
              model: body.model || 'gpt-5.6-luna',
              messages: [{ role: 'user', content: 'Teste de conexão rápido. Responda apenas: OK' }],
              max_completion_tokens: 100,
            }),
          });

          if (!testResp.ok) {
            const errText = await testResp.text();
            return jsonResponse({ ok: false, error: `Erro na OpenAI: ${errText}` }, 400);
          }

          const testJson = (await testResp.json()) as any;
          return jsonResponse({
            ok: true,
            model: testJson.model,
            reply: testJson.choices?.[0]?.message?.content || 'OK',
          });
        } catch (apiErr: any) {
          return jsonResponse({ ok: false, error: apiErr.message || 'Falha ao conectar na OpenAI' }, 500);
        }
      }

      // 15. Rota: Simulador / Playground de IA para Cursos (sem disparar WhatsApp)
      if (url.pathname === '/api/ai/simulate' && method === 'POST') {
        const body = (await request.json()) as {
          organizationId: string;
          courseId?: string;
          incomingText: string;
          customerName?: string;
          historyMessages?: any[];
        };

        if (!body.incomingText) {
          return jsonResponse({ error: 'Mensagem de entrada é obrigatória' }, 400);
        }

        const simResult = await generateCourseAiReply({
          supabase,
          organizationId: body.organizationId,
          chatId: 'simulated-chat',
          incomingText: body.incomingText,
          customerName: body.customerName || 'Aluno Teste',
          historyMessages: body.historyMessages || [],
          forceCourseId: body.courseId,
        });

        if (!simResult) {
          return jsonResponse(
            {
              error:
                'A IA não gerou resposta. Verifique se você salvou sua Chave OpenAI (sk-...) na aba "Configurações da IA" e se o curso está ativo.',
            },
            400
          );
        }

        if (simResult.ignored) {
          return jsonResponse({
            replyText: '🚫 [Mensagem desconsiderada pelo Robô - O assunto não é referente a cursos]',
            actions: [],
            ignored: true,
            courseName: simResult.courseName,
          });
        }

        if (simResult.dispatchItems && simResult.dispatchItems.length > 0) {
          const displayLines: string[] = [];
          for (const item of simResult.dispatchItems) {
            if (item.type === 'text') {
              displayLines.push(item.text || '');
            } else if (item.type === 'image') {
              displayLines.push(`📸 *[Foto/Banner Enviado]*\n${item.caption ? `_${item.caption}_\n` : ''}${item.url}`);
            } else if (item.type === 'audio') {
              displayLines.push(`🎤 *[Áudio PTT Gravado]*\n${item.url}`);
            } else if (item.type === 'video') {
              displayLines.push(`🎥 *[Vídeo Enviado]*\n${item.caption ? `_${item.caption}_\n` : ''}${item.url}`);
            } else if (item.type === 'deliver_materials') {
              displayLines.push(item.text || '📚 *[Apostilas e Arquivos do Curso Enviados]*');
            } else if (item.type === 'generate_pix') {
              const pix = item.pixPayload;
              displayLines.push(
                `${item.text ? `${item.text}\n\n` : ''}💳 *DADOS PIX:* R$ ${Number(pix?.amount || 0).toFixed(2)} | Chave: \`${pix?.pixKey}\`\n👇 *Código Copia e Cola:*\n\`${pix?.brCode || 'PIX_CODE'}\``
              );
            } else if (item.type === 'deliver_bonus') {
              displayLines.push(item.text || '🎁 *[Super Bônus Liberado]*');
            }
          }

          return jsonResponse({
            ...simResult,
            replyText: displayLines.filter(Boolean).join('\n\n━━━━━━━━━━━━━━━━━━━━\n\n'),
          });
        }

        return jsonResponse(simResult);
      }

      // 16. Rota: Ligar / Desligar IA para um chat individual
      const toggleAiMatch = url.pathname.match(/^\/api\/chats\/([^/]+)\/toggle-ai$/);
      if (toggleAiMatch && method === 'POST') {
        const chatId = toggleAiMatch[1];
        const body = (await request.json()) as { disabled?: boolean };

        const { data: updatedChat, error: toggleErr } = await supabase
          .from('chats')
          .update({
            ai_disabled: Boolean(body.disabled),
            ai_paused_until: null,
          })
          .eq('id', chatId)
          .select()
          .single();

        if (toggleErr) return jsonResponse({ error: toggleErr.message }, 500);
        return jsonResponse({ chat: updatedChat });
      }

      // Rota não encontrada
      return jsonResponse({ error: 'Rota não encontrada', path: url.pathname }, 404);
    } catch (err: any) {
      console.error('Erro de execução no Worker:', err);
      return jsonResponse({ error: err.message || 'Erro interno no servidor' }, 500);
    }
  },
};
