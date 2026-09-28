export type UserRole = 'superadmin' | 'admin' | 'agent';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'starter' | 'pro' | 'enterprise';
  max_instances: number;
  max_agents: number;
  status: 'active' | 'suspended';
}

export interface Profile {
  id: string;
  organization_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  is_online: boolean;
}

export interface Instance {
  id: string;
  organization_id: string;
  name: string;
  instance_name: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'qrcode';
  qr_code?: string | null;
  phone_number?: string | null;
  profile_picture_url?: string | null;
  webhook_url?: string | null;
  api_key?: string | null;
  created_at: string;
}

export interface KanbanStage {
  id: string;
  organization_id: string;
  name: string;
  color: string;
  order_index: number;
}

export interface Queue {
  id: string;
  organization_id: string;
  name: string;
  color: string;
}

export interface Tag {
  id: string;
  organization_id: string;
  name: string;
  color: string;
}

export interface Contact {
  id: string;
  organization_id: string;
  remote_jid: string;
  phone: string;
  name: string;
  push_name?: string;
  avatar_url?: string;
  kanban_stage_id?: string;
  assigned_to?: string;
  queue_id?: string;
  deal_value: number;
  tags?: Tag[];
  created_at: string;
}

export interface Chat {
  id: string;
  organization_id: string;
  instance_id?: string;
  contact_id: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: string;
  queue_id?: string;
  unread_count: number;
  last_message_text?: string;
  last_message_at: string;
  active_course_id?: string | null;
  ai_disabled?: boolean;
  ai_paused_until?: string | null;
  contact?: Contact;
  instance?: Instance;
  course?: Course;
}

export interface Message {
  id: string;
  organization_id: string;
  chat_id: string;
  instance_id?: string;
  whatsapp_message_id?: string;
  direction: 'inbound' | 'outbound';
  sender_type: 'contact' | 'agent' | 'bot' | 'system';
  sender_id?: string;
  type: 'text' | 'audio' | 'image' | 'video' | 'document' | 'internal_note';
  content?: string;
  media_url?: string;
  media_mimetype?: string;
  media_filename?: string;
  media_duration?: number;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  is_internal_note?: boolean;
  created_at: string;
}

export interface QuickReply {
  id: string;
  organization_id: string;
  shortcut: string;
  title: string;
  content: string;
  media_url?: string;
}

export interface MaterialItem {
  id: string;
  name: string;
  url: string;
  type: 'document' | 'image' | 'video' | 'audio' | 'link';
  description?: string;
  mimetype?: string;
}

export interface BonusItem {
  id: string;
  name: string;
  description?: string;
  value?: number;
}

export interface FaqObjection {
  objection: string;
  reply_guide: string;
}

export type FlowStepType = 
  | 'text' 
  | 'image' 
  | 'audio' 
  | 'video' 
  | 'wait_reply' 
  | 'generate_pix' 
  | 'deliver_materials' 
  | 'deliver_bonus';

export interface FlowStep {
  id: string;
  type: FlowStepType;
  title: string;
  content?: string;
  caption?: string;
  delay_seconds?: number;
  wait_condition?: string;
  media_name?: string;
  material_ids?: string[];
}

export interface Course {
  id: string;
  organization_id: string;
  name: string;
  slug?: string;
  description: string;
  triggers: string[];
  price: number;
  original_price?: number;
  pix_key: string;
  pix_key_type: 'cpf' | 'cnpj' | 'phone' | 'email' | 'random';
  pix_name: string;
  pix_city?: string;
  ai_persona: string;
  materials: MaterialItem[];
  bonuses: BonusItem[];
  faq_objections: FaqObjection[];
  flow_steps?: FlowStep[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AiSettings {
  id?: string;
  organization_id: string;
  openai_api_key?: string;
  openai_model: string;
  is_enabled: boolean;
  human_handover_minutes: number;
  greeting_message?: string;
  created_at?: string;
  updated_at?: string;
}
