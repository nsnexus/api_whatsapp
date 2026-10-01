import { Env } from './types';

/** Contatos @lid (sem telefone conhecido) precisam ser endereçados pelo JID completo */
function toEvolutionNumber(number: string): string {
  return number.endsWith('@lid') ? number : number.replace(/\D/g, '');
}

export class EvolutionGoClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(env: Env) {
    this.baseUrl = env.EVOLUTION_GO_URL.replace(/\/$/, '');
    this.apiKey = env.EVOLUTION_GO_API_KEY;
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      apikey: this.apiKey,
      ...(options.headers || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Evolution Go API Erro [${response.status}] ${endpoint}: ${errorText}`);
    }

    return (await response.json()) as T;
  }

  /**
   * Cria uma nova instância para um cliente (Tenant) na Evolution Go
   */
  async createInstance(params: {
    instanceName: string;
    webhookUrl?: string;
  }) {
    return this.request('/instance/create', {
      method: 'POST',
      body: JSON.stringify({
        instanceName: params.instanceName,
        integration: 'WHATSAPP-BAILEYS',
        token: this.apiKey,
        qrcode: true,
        // O CRM não usa grupos: não gravar mensagens de grupo economiza muito disco na VPS
        groupsIgnore: true,
      }),
    });
  }

  /**
   * Obtém o QR Code ou Pairing Code para conectar a instância ao WhatsApp
   */
  async getConnectQrCode(instanceName: string, phoneNumber?: string) {
    const query = phoneNumber ? `?number=${phoneNumber.replace(/\D/g, '')}` : '';
    return this.request(`/instance/connect/${instanceName}${query}`, {
      method: 'GET',
    });
  }

  /**
   * Consulta o estado atual da conexão da instância (open, close, connecting)
   */
  async getConnectionState(instanceName: string) {
    return this.request(`/instance/connectionState/${instanceName}`, {
      method: 'GET',
    });
  }

  /**
   * Envia mensagem de texto simples
   */
  async sendText(instanceName: string, params: { number: string; text: string }) {
    const cleanNumber = toEvolutionNumber(params.number);

    return this.request(`/message/sendText/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: cleanNumber,
        text: params.text,
        delay: 1200,
      }),
    });
  }

  /**
   * Envia Botões Interativos do WhatsApp (com suporte nativo a PIX com card verde, cta_copy, reply e url)
   */
  async sendButtons(instanceName: string, params: {
    number: string;
    title?: string;
    description?: string;
    footer?: string;
    buttons: Array<{
      type: 'reply' | 'copy' | 'url' | 'call' | 'pix';
      displayText?: string;
      copyCode?: string;
      url?: string;
      phoneNumber?: string;
      id?: string;
      currency?: string;
      name?: string;
      keyType?: string;
      key?: string;
      amount?: number;
    }>;
  }) {
    const cleanNumber = toEvolutionNumber(params.number);

    return this.request(`/message/sendButtons/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: cleanNumber,
        title: params.title || '',
        description: params.description || '',
        footer: params.footer,
        buttons: params.buttons,
        delay: 1200,
      }),
    });
  }

  /**
   * Envia Áudio do WhatsApp (com suporte a PTT - áudio gravado nativo com microfone verde)
   */
  async sendWhatsAppAudio(instanceName: string, params: {
    number: string;
    audio: string; // URL pública ou base64
  }) {
    const cleanNumber = toEvolutionNumber(params.number);

    return this.request(`/message/sendWhatsAppAudio/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: cleanNumber,
        audio: params.audio,
        delay: 1200,
      }),
    });
  }

  /**
   * Envia Mídia (imagem, vídeo ou documento/PDF)
   */
  async sendMedia(instanceName: string, params: {
    number: string;
    mediaMessage: {
      mediatype: 'image' | 'video' | 'document';
      caption?: string;
      media: string; // URL pública ou base64
      fileName?: string;
      mimetype?: string;
    };
  }) {
    const cleanNumber = toEvolutionNumber(params.number);

    return this.request(`/message/sendMedia/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: cleanNumber,
        mediatype: params.mediaMessage.mediatype,
        mimetype: params.mediaMessage.mimetype,
        caption: params.mediaMessage.caption,
        media: params.mediaMessage.media,
        fileName: params.mediaMessage.fileName,
        delay: 1200,
      }),
    });
  }

  /**
   * Configura Webhook personalizado para a instância (n8n, Typebot, ERP)
   */
  async setWebhook(instanceName: string, webhookUrl: string, enabled: boolean = true) {
    return this.request(`/webhook/set/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        enabled,
        url: webhookUrl,
        webhookByEvents: false,
        events: [
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'CONNECTION_UPDATE',
          'SEND_MESSAGE',
        ],
      }),
    });
  }

  /**
   * Reinicia a instância do WhatsApp
   */
  async restartInstance(instanceName: string) {
    return this.request(`/instance/restart/${instanceName}`, {
      method: 'PUT',
    });
  }

  /**
   * Desconecta o WhatsApp da instância
   */
  async logoutInstance(instanceName: string) {
    return this.request(`/instance/logout/${instanceName}`, {
      method: 'POST',
    });
  }

  /**
   * Deleta a instância do WhatsApp
   */
  async deleteInstance(instanceName: string) {
    return this.request(`/instance/delete/${instanceName}`, {
      method: 'DELETE',
    });
  }

  /**
   * Lista mensagens armazenadas na Evolution (mais recentes primeiro), paginadas
   */
  async findMessages(
    instanceName: string,
    page: number,
    pageSize: number,
    whereKey?: string | { remoteJid?: string; remoteJidAlt?: string }
  ) {
    const key = typeof whereKey === 'string' ? { remoteJid: whereKey } : whereKey;
    return this.request<{ messages: { total: number; pages: number; currentPage: number; records: any[] } }>(
      `/chat/findMessages/${instanceName}`,
      {
        method: 'POST',
        body: JSON.stringify({
          ...(key ? { where: { key } } : {}),
          page,
          offset: pageSize,
        }),
      }
    );
  }

  /**
   * Lista as conversas da instância com a última mensagem de cada uma
   */
  async findChats(instanceName: string) {
    return this.request<any[]>(`/chat/findChats/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  /**
   * Baixa (do WhatsApp, via Evolution) o arquivo de uma mensagem de mídia em base64
   */
  async getMediaBase64(instanceName: string, messageId: string) {
    return this.request<{ base64: string; mimetype: string; fileName?: string }>(
      `/chat/getBase64FromMediaMessage/${instanceName}`,
      {
        method: 'POST',
        body: JSON.stringify({ message: { key: { id: messageId } }, convertToMp4: false }),
      }
    );
  }

  /**
   * Busca todas as instâncias da Evolution API com detalhes (ownerJid, profilePicUrl)
   */
  async fetchInstances() {
    return this.request('/instance/fetchInstances', {
      method: 'GET',
    });
  }
}
