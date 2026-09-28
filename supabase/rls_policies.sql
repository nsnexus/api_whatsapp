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
