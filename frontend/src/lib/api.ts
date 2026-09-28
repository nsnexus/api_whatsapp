const WORKER_API_URL = import.meta.env.VITE_WORKER_API_URL || 'http://localhost:8787';

export const api = {
  // Listar instâncias do WhatsApp (filtradas por organização)
  async fetchInstances(organizationId?: string) {
    const query = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : '';
    const res = await fetch(`${WORKER_API_URL}/api/instances${query}`);
    return res.json();
  },

  // Criar instância do WhatsApp
  async createInstance(params: { organizationId: string; name: string }) {
    const res = await fetch(`${WORKER_API_URL}/api/instances/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  // Obter QR Code ou Código de Pareamento
  async getConnectQrCode(instanceName: string, phoneNumber?: string) {
    const query = phoneNumber ? `?number=${encodeURIComponent(phoneNumber.replace(/\D/g, ''))}` : '';
    const res = await fetch(`${WORKER_API_URL}/api/instances/connect/${instanceName}${query}`);
    return res.json();
  },

  // Obter status da instância
  async getInstanceStatus(instanceName: string) {
    const res = await fetch(`${WORKER_API_URL}/api/instances/status/${instanceName}`);
    return res.json();
  },

  // Enviar Mensagem de Texto
  async sendTextMessage(params: {
    organizationId: string;
    instanceName: string;
    chatId: string;
    remoteJid: string;
    text: string;
    senderId?: string;
  }) {
    const res = await fetch(`${WORKER_API_URL}/api/messages/send-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  // Enviar Áudio Nativo de Voz (PTT) gravado no navegador
  async sendAudioMessage(params: {
    organizationId: string;
    instanceName: string;
    chatId: string;
    remoteJid: string;
    base64Data: string;
    mimetype?: string;
    senderId?: string;
  }) {
    const res = await fetch(`${WORKER_API_URL}/api/messages/send-audio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  // Enviar Imagem ou Documento/PDF
  async sendMediaMessage(params: {
    organizationId: string;
    instanceName: string;
    chatId: string;
    remoteJid: string;
    mediaType: 'image' | 'document' | 'video';
    base64Data: string;
    mimetype: string;
    fileName?: string;
    caption?: string;
    senderId?: string;
  }) {
    const res = await fetch(`${WORKER_API_URL}/api/messages/send-media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  // Configurar Webhook da Instância (Nexus API)
  async setWebhook(params: { instanceName: string; webhookUrl: string; enabled?: boolean }) {
    const res = await fetch(`${WORKER_API_URL}/api/instances/set-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  // Reiniciar Instância
  async restartInstance(instanceName: string) {
    const res = await fetch(`${WORKER_API_URL}/api/instances/restart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceName }),
    });
    return res.json();
  },

  // Desconectar (Logout) Instância
  async logoutInstance(instanceName: string) {
    const res = await fetch(`${WORKER_API_URL}/api/instances/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceName }),
    });
    return res.json();
  },

  // Deletar Instância
  async deleteInstance(instanceName: string) {
    const res = await fetch(`${WORKER_API_URL}/api/instances/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceName }),
    });
    return res.json();
  },

  // Mensagens de uma conversa (lidas da Evolution pelo Worker; não ficam no Supabase)
  async fetchChatMessages(chatId: string, page = 1, limit = 60) {
    const res = await fetch(`${WORKER_API_URL}/api/chats/${chatId}/messages?page=${page}&limit=${limit}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Falha ao carregar mensagens');
    return data as { messages: any[]; hasMore: boolean };
  },

  // Importar a lista de conversas do WhatsApp para o CRM
  async importChats(instanceName: string) {
    const res = await fetch(`${WORKER_API_URL}/api/instances/import-chats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Falha ao importar conversas');
    return data as { conversations: number; createdContacts: number; createdChats: number };
  },

  // Salvar nota interna da equipe
  async sendInternalNote(params: { organizationId: string; chatId: string; content: string }) {
    const res = await fetch(`${WORKER_API_URL}/api/messages/internal-note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Falha ao salvar nota');
    return data as { message: any };
  },

  // Testar envio da API (Playground)
  async testSendMessage(params: {
    instanceName: string;
    number: string;
    type: 'text' | 'audio' | 'media';
    text?: string;
    mediaUrl?: string;
  }) {
    const res = await fetch(`${WORKER_API_URL}/api/instances/test-send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  // Testar Chave OpenAI (ChatGPT)
  async testOpenAiKey(apiKey: string, model?: string) {
    const res = await fetch(`${WORKER_API_URL}/api/ai/test-openai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, model }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Falha ao testar chave OpenAI');
    return data as { ok: boolean; model: string; reply: string };
  },

  // Simular conversa com o Bot de IA (Playground de Cursos)
  async simulateAiChat(params: {
    organizationId: string;
    courseId?: string;
    incomingText: string;
    customerName?: string;
    historyMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }) {
    const res = await fetch(`${WORKER_API_URL}/api/ai/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Falha ao simular resposta da IA');
    return data as {
      replyText: string;
      actions: Array<{ type: string; payload?: any }>;
      courseId?: string;
      courseName?: string;
    };
  },

  // Ligar/Desligar IA em uma conversa específica
  async toggleChatAi(chatId: string, disabled: boolean) {
    const res = await fetch(`${WORKER_API_URL}/api/chats/${chatId}/toggle-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disabled }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Falha ao alterar estado da IA no chat');
    return data;
  },
};
