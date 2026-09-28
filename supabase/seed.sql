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
