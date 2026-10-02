export interface Env {
  CRM_MEDIA_BUCKET: R2Bucket;
  EVOLUTION_GO_URL: string;
  EVOLUTION_GO_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  R2_PUBLIC_URL: string;
  EFI_PROXY_URL?: string;
  EFI_PROXY_SECRET?: string;
  EFI_CLIENT_ID?: string;
  EFI_CLIENT_SECRET?: string;
  EFI_PIX_KEY?: string;
  EFI_ENV?: string;
  NSNEXUS_GATEWAY_URL?: string;
  NSNEXUS_GATEWAY_API_KEY?: string;
}

export interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: any;
  destination?: string;
  date_time?: string;
  sender?: string;
  server_url?: string;
  apikey?: string;
}

export interface SendTextMessageRequest {
  organizationId: string;
  instanceName: string;
  chatId: string;
  remoteJid: string;
  text: string;
  senderId?: string;
}

export interface SendMediaMessageRequest {
  organizationId: string;
  instanceName: string;
  chatId: string;
  remoteJid: string;
  mediaType: 'image' | 'audio' | 'video' | 'document';
  base64Data?: string;
  mediaUrl?: string;
  mimetype: string;
  caption?: string;
  fileName?: string;
  isPtt?: boolean; // Se true, envia como áudio nativo gravado no WhatsApp (voz com microfone verde)
  senderId?: string;
}
