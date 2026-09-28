-- ==============================================================================
-- SCHEMA DO BANCO DE DADOS - CRM WHATSAPP MULTI-TENANT (SUPABASE / POSTGRESQL)
-- ==============================================================================

-- Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ORGANIZATIONS (Empresas / Assinantes do seu SaaS)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    logo_url TEXT,
    plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'enterprise')),
    max_instances INT NOT NULL DEFAULT 1,
    max_agents INT NOT NULL DEFAULT 3,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'canceled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. PROFILES (Usuários / Atendentes vinculados ao Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('superadmin', 'admin', 'agent')),
    avatar_url TEXT,
    is_online BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. INSTANCES (Instâncias da Evolution Go cadastradas por cada empresa)
CREATE TABLE IF NOT EXISTS public.instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    instance_name TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connecting', 'connected', 'disconnected', 'qrcode')),
    qr_code TEXT,
    phone_number TEXT,
    profile_picture_url TEXT,
    webhook_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. KANBAN STAGES (Etapas personalizáveis do funil de vendas por empresa)
CREATE TABLE IF NOT EXISTS public.kanban_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3B82F6',
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. QUEUES (Filas / Departamentos de Atendimento)
CREATE TABLE IF NOT EXISTS public.queues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#10B981',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TAGS (Etiquetas de identificação de leads/clientes)
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#EF4444',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. CONTACTS (Contatos / Clientes do WhatsApp)
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    remote_jid TEXT NOT NULL,
    phone TEXT NOT NULL,
    name TEXT,
    push_name TEXT,
    avatar_url TEXT,
    kanban_stage_id UUID REFERENCES public.kanban_stages(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    queue_id UUID REFERENCES public.queues(id) ON DELETE SET NULL,
    deal_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_tenant_remote_jid UNIQUE (organization_id, remote_jid)
);

-- 8. CONTACT_TAGS (Relação N:N de Contatos e Tags)
CREATE TABLE IF NOT EXISTS public.contact_tags (
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (contact_id, tag_id)
);

-- 9. CHATS (Sessões de conversa / Atendimento ao vivo)
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    instance_id UUID REFERENCES public.instances(id) ON DELETE SET NULL,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    queue_id UUID REFERENCES public.queues(id) ON DELETE SET NULL,
    unread_count INT NOT NULL DEFAULT 0,
    last_message_text TEXT,
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_tenant_chat UNIQUE (organization_id, contact_id, instance_id)
);

-- 10. MESSAGES (Histórico completo de mensagens de texto, mídias e notas internas)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    instance_id UUID REFERENCES public.instances(id) ON DELETE SET NULL,
    whatsapp_message_id TEXT,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    sender_type TEXT NOT NULL DEFAULT 'contact' CHECK (sender_type IN ('contact', 'agent', 'bot', 'system')),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'audio', 'image', 'video', 'document', 'location', 'contact', 'internal_note')),
    content TEXT,
    media_url TEXT,
    media_mimetype TEXT,
    media_filename TEXT,
    media_duration INT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    is_internal_note BOOLEAN NOT NULL DEFAULT false,
    raw_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. QUICK_REPLIES (Respostas Rápidas por empresa)
CREATE TABLE IF NOT EXISTS public.quick_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    shortcut TEXT NOT NULL, -- Exemplo: "/pix", "/ola"
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    media_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ÍNDICES PARA ALTA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_org_id ON public.messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_chats_org_last_msg ON public.chats(organization_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_org_id ON public.contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_kanban ON public.contacts(organization_id, kanban_stage_id);
CREATE INDEX IF NOT EXISTS idx_instances_org_id ON public.instances(organization_id);

-- TRIGGER PARA ATUALIZAR O TIMESTAMP updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_update_organizations BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_update_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_update_instances BEFORE UPDATE ON public.instances FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_update_contacts BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_update_chats BEFORE UPDATE ON public.chats FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- HABILITAR SUPABASE REALTIME NAS TABELAS CRÍTICAS DO CHAT
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.instances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
