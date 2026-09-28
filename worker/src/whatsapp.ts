// Helpers para normalizar identificadores e conteúdo de mensagens do WhatsApp (Baileys / Evolution API v2)

export type CrmMessageType = 'text' | 'audio' | 'image' | 'video' | 'document' | 'location' | 'contact';

export interface ResolvedJid {
  /** JID usado como chave do contato no CRM (preferencialmente o do telefone @s.whatsapp.net) */
  remoteJid: string;
  /** JID @lid, quando o WhatsApp endereçou a conversa por LID */
  lidJid: string | null;
  phone: string;
}

/**
 * Resolve o JID de uma conversa individual. Retorna null para grupos, status, canais e broadcast.
 * O WhatsApp passou a endereçar a maioria das conversas por @lid; nesses casos o telefone real
 * vem em key.remoteJidAlt (ou key.senderPn em versões mais antigas do Baileys).
 */
export function resolveChatJid(key: any): ResolvedJid | null {
  const rawJid: string = key?.remoteJid || '';
  if (!rawJid) return null;
  if (
    rawJid.endsWith('@g.us') ||
    rawJid.endsWith('@newsletter') ||
    rawJid.endsWith('@broadcast') ||
    rawJid.includes('status@')
  ) {
    return null;
  }

  if (rawJid.endsWith('@lid')) {
    const alt: string = key?.remoteJidAlt || key?.senderPn || '';
    const phoneJid = alt.endsWith('@s.whatsapp.net') ? alt : null;
    return {
      remoteJid: phoneJid || rawJid,
      lidJid: rawJid,
      phone: (phoneJid || rawJid).split('@')[0].replace(/\D/g, ''),
    };
  }

  if (!rawJid.endsWith('@s.whatsapp.net')) return null;

  return {
    remoteJid: rawJid,
    lidJid: null,
    phone: rawJid.split('@')[0].replace(/\D/g, ''),
  };
}

export interface ExtractedContent {
  type: CrmMessageType;
  text: string;
  mimetype: string | null;
  filename: string | null;
  duration: number | null;
}

/**
 * Extrai o conteúdo exibível de uma mensagem. Retorna null para mensagens técnicas
 * (reações, protocolo, edição, chaves de grupo) que não devem virar balão no chat.
 */
export function extractMessageContent(message: any): ExtractedContent | null {
  if (!message) return null;
  const msg =
    message.ephemeralMessage?.message ||
    message.viewOnceMessage?.message ||
    message.viewOnceMessageV2?.message ||
    message.documentWithCaptionMessage?.message ||
    message;

  const base = { mimetype: null, filename: null, duration: null };

  if (msg.conversation) return { ...base, type: 'text', text: msg.conversation };
  if (msg.extendedTextMessage) return { ...base, type: 'text', text: msg.extendedTextMessage.text || '' };
  if (msg.audioMessage) {
    return {
      type: 'audio',
      text: '🎵 Mensagem de voz',
      mimetype: msg.audioMessage.mimetype || 'audio/ogg; codecs=opus',
      filename: 'audio_gravado.ogg',
      duration: msg.audioMessage.seconds || null,
    };
  }
  if (msg.imageMessage) {
    return { type: 'image', text: msg.imageMessage.caption || '📷 Foto', mimetype: msg.imageMessage.mimetype || 'image/jpeg', filename: 'imagem.jpg', duration: null };
  }
  if (msg.videoMessage) {
    return { type: 'video', text: msg.videoMessage.caption || '🎥 Vídeo', mimetype: msg.videoMessage.mimetype || 'video/mp4', filename: 'video.mp4', duration: msg.videoMessage.seconds || null };
  }
  if (msg.documentMessage) {
    return {
      type: 'document',
      text: msg.documentMessage.caption || msg.documentMessage.fileName || '📄 Documento',
      mimetype: msg.documentMessage.mimetype || 'application/octet-stream',
      filename: msg.documentMessage.fileName || 'documento',
      duration: null,
    };
  }
  if (msg.stickerMessage) return { ...base, type: 'text', text: '🏷️ Figurinha' };
  if (msg.locationMessage || msg.liveLocationMessage) {
    const loc = msg.locationMessage || msg.liveLocationMessage;
    const label = loc.name || loc.address || `${loc.degreesLatitude}, ${loc.degreesLongitude}`;
    return { ...base, type: 'location', text: `📍 ${label}` };
  }
  if (msg.contactMessage) return { ...base, type: 'contact', text: `👤 ${msg.contactMessage.displayName || 'Contato'}` };
  if (msg.contactsArrayMessage) return { ...base, type: 'contact', text: `👤 ${msg.contactsArrayMessage.contacts?.length || ''} contatos` };
  if (msg.pollCreationMessage || msg.pollCreationMessageV3) {
    const poll = msg.pollCreationMessage || msg.pollCreationMessageV3;
    return { ...base, type: 'text', text: `📊 Enquete: ${poll.name || ''}` };
  }
  if (msg.buttonsResponseMessage) return { ...base, type: 'text', text: msg.buttonsResponseMessage.selectedDisplayText || '' };
  if (msg.listResponseMessage) return { ...base, type: 'text', text: msg.listResponseMessage.title || '' };
  if (msg.templateButtonReplyMessage) return { ...base, type: 'text', text: msg.templateButtonReplyMessage.selectedDisplayText || '' };
  if (msg.buttonsMessage) return { ...base, type: 'text', text: msg.buttonsMessage.contentText || '' };
  if (msg.listMessage) return { ...base, type: 'text', text: msg.listMessage.description || msg.listMessage.title || '' };
  if (msg.templateMessage) {
    const tpl = msg.templateMessage.hydratedTemplate || msg.templateMessage.hydratedFourRowTemplate || {};
    return { ...base, type: 'text', text: tpl.hydratedContentText || '📋 Mensagem' };
  }
  if (msg.interactiveMessage) {
    const im = msg.interactiveMessage;
    const text = im.body?.text || im.header?.title || '';
    const isPayment = im.nativeFlowMessage?.buttons?.some((b: any) => String(b.name).includes('payment'));
    return { ...base, type: 'text', text: text || (isPayment ? '💳 Cobrança / Pagamento' : '📋 Mensagem interativa') };
  }

  return null;
}

/** Converte messageTimestamp (segundos, string ou objeto Long) para ISO */
export function timestampToIso(ts: any): string {
  let seconds = 0;
  if (typeof ts === 'number') seconds = ts;
  else if (typeof ts === 'string') seconds = Number(ts);
  else if (ts && typeof ts.low === 'number') seconds = ts.low >>> 0;
  if (!seconds || Number.isNaN(seconds)) return new Date().toISOString();
  return new Date(seconds * 1000).toISOString();
}
