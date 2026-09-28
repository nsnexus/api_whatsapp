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
-- ==============================================================================
-- POLÍTICAS DE ROW LEVEL SECURITY (RLS) - ISOLAMENTO MULTI-TENANT
-- Garante que nenhum cliente/atendente visualize dados de outras empresas
-- ==============================================================================

-- 1. Funções Auxiliares de Identificação do Usuário Logado
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID AS $$
    SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
    SELECT (role = 'superadmin') FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Habilitar RLS em todas as tabelas
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_replies ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS: ORGANIZATIONS
CREATE POLICY "Usuários podem ver a própria organização" ON public.organizations
    FOR SELECT USING (id = public.get_user_organization_id() OR public.is_superadmin());

CREATE POLICY "Superadmins podem gerenciar organizações" ON public.organizations
    FOR ALL USING (public.is_superadmin());

-- 4. POLÍTICAS: PROFILES
CREATE POLICY "Usuários veem membros da mesma organização" ON public.profiles
    FOR SELECT USING (organization_id = public.get_user_organization_id() OR public.is_superadmin());

CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON public.profiles
    FOR UPDATE USING (id = auth.uid() OR public.is_superadmin());

-- 5. POLÍTICAS: INSTANCES
CREATE POLICY "Isolamento de instâncias por organização" ON public.instances
    FOR ALL USING (organization_id = public.get_user_organization_id() OR public.is_superadmin())
    WITH CHECK (organization_id = public.get_user_organization_id() OR public.is_superadmin());

-- 6. POLÍTICAS: KANBAN_STAGES
CREATE POLICY "Isolamento de etapas do funil por organização" ON public.kanban_stages
    FOR ALL USING (organization_id = public.get_user_organization_id() OR public.is_superadmin())
    WITH CHECK (organization_id = public.get_user_organization_id() OR public.is_superadmin());

-- 7. POLÍTICAS: QUEUES
CREATE POLICY "Isolamento de filas por organização" ON public.queues
    FOR ALL USING (organization_id = public.get_user_organization_id() OR public.is_superadmin())
    WITH CHECK (organization_id = public.get_user_organization_id() OR public.is_superadmin());

-- 8. POLÍTICAS: TAGS
CREATE POLICY "Isolamento de tags por organização" ON public.tags
    FOR ALL USING (organization_id = public.get_user_organization_id() OR public.is_superadmin())
    WITH CHECK (organization_id = public.get_user_organization_id() OR public.is_superadmin());

-- 9. POLÍTICAS: CONTACTS
CREATE POLICY "Isolamento de contatos por organização" ON public.contacts
    FOR ALL USING (organization_id = public.get_user_organization_id() OR public.is_superadmin())
    WITH CHECK (organization_id = public.get_user_organization_id() OR public.is_superadmin());

-- 10. POLÍTICAS: CONTACT_TAGS
CREATE POLICY "Isolamento de tags de contatos por organização" ON public.contact_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.contacts c 
            WHERE c.id = contact_id AND (c.organization_id = public.get_user_organization_id() OR public.is_superadmin())
        )
    );

-- 11. POLÍTICAS: CHATS
CREATE POLICY "Isolamento de chats por organização" ON public.chats
    FOR ALL USING (organization_id = public.get_user_organization_id() OR public.is_superadmin())
    WITH CHECK (organization_id = public.get_user_organization_id() OR public.is_superadmin());

-- 12. POLÍTICAS: MESSAGES
CREATE POLICY "Isolamento de mensagens por organização" ON public.messages
    FOR ALL USING (organization_id = public.get_user_organization_id() OR public.is_superadmin())
    WITH CHECK (organization_id = public.get_user_organization_id() OR public.is_superadmin());

-- 13. POLÍTICAS: QUICK_REPLIES
CREATE POLICY "Isolamento de respostas rápidas por organização" ON public.quick_replies
    FOR ALL USING (organization_id = public.get_user_organization_id() OR public.is_superadmin())
    WITH CHECK (organization_id = public.get_user_organization_id() OR public.is_superadmin());
-- ==============================================================================
-- DADOS INICIAIS (SEED) PARA TESTE E PRIMEIRO ACESSO
-- ==============================================================================

-- 1. Criar Organização de Demonstração
INSERT INTO public.organizations (id, name, slug, plan, max_instances, max_agents)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Minha Empresa Demo',
    'empresa-demo',
    'pro',
    5,
    10
) ON CONFLICT DO NOTHING;

-- 2. Etapas Padrão do Funil (Kanban)
INSERT INTO public.kanban_stages (organization_id, name, color, order_index)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'Novo Lead', '#3B82F6', 1),
    ('a0000000-0000-0000-0000-000000000001', 'Primeiro Contato', '#8B5CF6', 2),
    ('a0000000-0000-0000-0000-000000000001', 'Proposta Enviada', '#F59E0B', 3),
    ('a0000000-0000-0000-0000-000000000001', 'Em Negociação', '#EC4899', 4),
    ('a0000000-0000-0000-0000-000000000001', 'Fechado (Ganho)', '#10B981', 5)
ON CONFLICT DO NOTHING;

-- 3. Filas / Departamentos Iniciais
INSERT INTO public.queues (organization_id, name, color)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Comercial', '#3B82F6'),
    ('a0000000-0000-0000-0000-000000000001', 'Suporte Técnico', '#10B981'),
    ('a0000000-0000-0000-0000-000000000001', 'Financeiro', '#F59E0B')
ON CONFLICT DO NOTHING;

-- 4. Tags Iniciais
INSERT INTO public.tags (organization_id, name, color)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Quente 🔥', '#EF4444'),
    ('a0000000-0000-0000-0000-000000000001', 'Cliente VIP ⭐', '#8B5CF6'),
    ('a0000000-0000-0000-0000-000000000001', 'Aguardando PIX 💰', '#10B981')
ON CONFLICT DO NOTHING;

-- 5. Respostas Rápidas Iniciais
INSERT INTO public.quick_replies (organization_id, shortcut, title, content)
VALUES
    ('a0000000-0000-0000-0000-000000000001', '/ola', 'Boas-vindas', 'Olá! Tudo bem? Me chamo como posso te ajudar hoje?'),
    ('a0000000-0000-0000-0000-000000000001', '/pix', 'Dados PIX', 'Nossa chave PIX é o CNPJ: 00.000.000/0001-00 (Banco XYZ). Assim que realizar o pagamento, por favor nos envie o comprovante por aqui!'),
    ('a0000000-0000-0000-0000-000000000001', '/horario', 'Horário de Atendimento', 'Nosso horário de atendimento é de Segunda a Sexta, das 08h às 18h.')
ON CONFLICT DO NOTHING;
