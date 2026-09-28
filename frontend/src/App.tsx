import React, { useState, useEffect, useRef } from 'react';
import { Sidebar, NavigationTab } from './components/layout/Sidebar';
import { ChatLayout } from './components/chat/ChatLayout';
import { InstanceList } from './components/instances/InstanceList';
import { ApiPlayground } from './components/wapi/ApiPlayground';
import { ApiKeysView } from './components/wapi/ApiKeysView';
import { InvoicesView } from './components/wapi/InvoicesView';
import { AntiBanGuideView } from './components/wapi/AntiBanGuideView';
import { ApiDocsView } from './components/wapi/ApiDocsView';
import { LandingPageView } from './components/landing/LandingPageView';
import { AuthModal } from './components/auth/AuthModal';
import { CoursesBotsView } from './components/bots/CoursesBotsView';
import { AdminDashboardView } from './components/admin/AdminDashboardView';
import { api } from './lib/api';
import { supabase } from './lib/supabase';
import { Chat, Message, Contact, Instance, QuickReply, Tag, Queue, KanbanStage } from './types';
import { RefreshCw, Search } from 'lucide-react';

// Rastreamento de acessos ao site em tempo real para o Painel Admin
function trackSiteVisit(page: string) {
  try {
    let visitorId = localStorage.getItem('crm_visitor_id');
    if (!visitorId) {
      visitorId = 'vis_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem('crm_visitor_id', visitorId);
    }
    supabase.from('site_visits').insert({
      visitor_id: visitorId,
      page: page || window.location.hash || '/',
      referrer: document.referrer || 'direct',
      user_agent: navigator.userAgent.substring(0, 150),
    }).then(() => {});
  } catch (err) {
    // Silencioso para não interferir na experiência do usuário
  }
}

// O Supabase devolve no máximo 1000 linhas por consulta: busca em páginas
async function fetchAllRows<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>): Promise<T[]> {
  const pageSize = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await build(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}


export const App: React.FC = () => {
  // Raiz do site abre a Landing; o painel da API vive em #app
  const [currentTab, setCurrentTab] = useState<NavigationTab>(() => {
    const hash = window.location.hash;
    if (hash === '#app') return 'instances';
    if (hash === '#docs') return 'docs';
    if (hash === '#admin') return 'admin';
    if (hash === '#bots') return 'bots';
    if (hash === '#chat') return 'chat';
    return 'landing';
  });

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async (u: any) => {
      if (!u) {
        setIsAdmin(false);
        return;
      }
      if (u.email === 'narcisofelizardo@gmail.com') {
        setIsAdmin(true);
        return;
      }
      try {
        const { data } = await supabase.from('profiles').select('role').eq('id', u.id).maybeSingle();
        setIsAdmin(data?.role === 'superadmin' || data?.role === 'admin');
      } catch {
        setIsAdmin(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAdmin(session?.user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      checkAdmin(session?.user);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Proteção de rotas: apenas admin acessa bots, chat e painel admin master
  useEffect(() => {
    if (!isAdmin && (currentTab === 'admin' || currentTab === 'bots' || currentTab === 'chat')) {
      setCurrentTab('instances');
    }
  }, [isAdmin, currentTab]);

  const enterApp = () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setAuthModalMode('login');
        setIsAuthModalOpen(true);
      } else {
        window.history.replaceState(null, '', '#app');
        setCurrentTab('instances');
      }
    });
  };

  const selectTab = (tab: NavigationTab) => {
    if (tab === 'landing') {
      window.history.replaceState(null, '', window.location.pathname);
      window.scrollTo(0, 0);
    }
    setCurrentTab(tab);
  };
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');
  const [isImporting, setIsImporting] = useState(false);
  const openChatIdRef = useRef<string | null>(null);
  const [contactSearch, setContactSearch] = useState('');

  // Organização do Usuário Autenticado (Isolamento Multi-Tenant Estrito)
  const [currentOrgId, setCurrentOrgId] = useState<string>('');
  const currentOrgIdRef = useRef<string>('');
  const [_currentUser, setCurrentUser] = useState<any>(null);

  // Atualiza a ref sempre que a organização mudar para evitar stale closures em timers/realtime
  useEffect(() => {
    currentOrgIdRef.current = currentOrgId;
  }, [currentOrgId]);

  // Dados reais (zero dados fakes)
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [kanbanStages, setKanbanStages] = useState<KanbanStage[]>([
    { id: 'stage_1', organization_id: '', name: 'Novos Leads', color: '#3B82F6', order_index: 0 },
    { id: 'stage_2', organization_id: '', name: 'Em Atendimento', color: '#F59E0B', order_index: 1 },
    { id: 'stage_3', organization_id: '', name: 'Proposta Enviada', color: '#8B5CF6', order_index: 2 },
    { id: 'stage_4', organization_id: '', name: 'Fechado / Ganho', color: '#10B981', order_index: 3 },
  ]);

  // Sincroniza e isola os dados pela Organização do Usuário Autenticado
  const syncUserOrg = async (user: any): Promise<string> => {
    if (!user) {
      setCurrentUser(null);
      setCurrentOrgId('');
      currentOrgIdRef.current = '';
      setInstances([]);
      setChats([]);
      setContacts([]);
      return '';
    }

    setCurrentUser(user);

    try {
      // 1. Invoca a RPC segura no Supabase (cria ou busca organização do usuário com isolamento garantido)
      const { data: rpcData, error: rpcErr } = await supabase.rpc('get_or_create_user_organization');
      if (!rpcErr && rpcData && rpcData.organization_id) {
        const orgId = rpcData.organization_id as string;
        setCurrentOrgId(orgId);
        currentOrgIdRef.current = orgId;
        return orgId;
      }

      // 2. Fallback caso a RPC não esteja disponível: busca direto no profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.organization_id) {
        const orgId = profile.organization_id as string;
        setCurrentOrgId(orgId);
        currentOrgIdRef.current = orgId;
        return orgId;
      }
    } catch (err) {
      console.error('Erro ao sincronizar organização do usuário:', err);
    }
    return '';
  };

  // Carregar instâncias reais do Supabase ou Worker da organização atual
  const loadRealInstances = async (orgId = currentOrgIdRef.current) => {
    if (!orgId) {
      setInstances([]);
      return;
    }
    try {
      const res = await api.fetchInstances(orgId).catch(() => null);
      if (res?.instances && Array.isArray(res.instances)) {
        setInstances(res.instances);
        return;
      }

      const { data, error } = await supabase
        .from('instances')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setInstances(data);
      } else {
        setInstances([]);
      }
    } catch (e) {
      console.error('Erro ao carregar instâncias:', e);
      setInstances([]);
    }
  };

  // Carregar contatos reais do Supabase da organização atual
  const loadRealContacts = async (orgId = currentOrgIdRef.current) => {
    if (!orgId) {
      setContacts([]);
      return;
    }
    try {
      const data = await fetchAllRows<Contact>((from, to) =>
        supabase.from('contacts').select('*').eq('organization_id', orgId).order('name', { ascending: true }).range(from, to)
      );
      setContacts(data);
    } catch (e) {
      console.error('Erro ao carregar contatos:', e);
      setContacts([]);
    }
  };

  // Carregar conversas reais do CRM do Supabase da organização atual
  const loadRealChats = async (orgId = currentOrgIdRef.current) => {
    if (!orgId) {
      setChats([]);
      return;
    }
    try {
      const data = await fetchAllRows<Chat>((from, to) =>
        supabase
          .from('chats')
          .select('*, contact:contacts(*), instance:instances(*)')
          .eq('organization_id', orgId)
          .order('last_message_at', { ascending: false })
          .range(from, to)
      );
      setChats(data);
    } catch (err) {
      console.error('Erro ao carregar conversas do CRM:', err);
      setChats([]);
    }
  };

  // Carregar as mensagens de UMA conversa, direto da Evolution (via Worker), ao abrir o chat
  const loadMessagesForChat = async (chatId: string) => {
    openChatIdRef.current = chatId;
    try {
      const { messages: loaded } = await api.fetchChatMessages(chatId);
      setMessages((prev) => {
        // Mantém envios otimistas recentes que a Evolution ainda não devolveu
        const recentCutoff = Date.now() - 20_000;
        const loadedTexts = new Set(loaded.filter((m) => m.direction === 'outbound').map((m) => m.content));
        const pending = (prev[chatId] || []).filter(
          (m) => m.id.startsWith('msg-') && new Date(m.created_at).getTime() > recentCutoff && !loadedTexts.has(m.content)
        );
        return { ...prev, [chatId]: [...(loaded as Message[]), ...pending] };
      });
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    }
  };

  // Importar a lista de conversas do WhatsApp (Evolution) para o CRM
  const handleImportHistory = async () => {
    const instance = instances.find((i) => i.status === 'connected') || instances[0];
    if (!instance) {
      alert('Conecte um WhatsApp antes de importar as conversas.');
      return;
    }
    setIsImporting(true);
    try {
      await api.importChats(instance.instance_name);
      if (currentOrgIdRef.current) {
        await Promise.all([loadRealContacts(currentOrgIdRef.current), loadRealChats(currentOrgIdRef.current)]);
      }
    } catch (e: any) {
      alert('Erro ao importar conversas: ' + e.message);
    } finally {
      setIsImporting(false);
    }
  };

  useEffect(() => {
    // 1. Inicializa organização e dados do usuário
    supabase.auth.getSession().then(({ data: { session } }) => {
      syncUserOrg(session?.user).then((orgId) => {
        if (orgId) {
          loadRealInstances(orgId);
          loadRealContacts(orgId);
          loadRealChats(orgId);
        } else {
          setInstances([]);
          setContacts([]);
          setChats([]);
        }
      });
    });

    let chatsReloadTimer: ReturnType<typeof setTimeout> | null = null;
    let openChatReloadTimer: ReturnType<typeof setTimeout> | null = null;

    // Supabase Realtime para recebimento de novas mensagens instantaneamente
    const channel = supabase
      .channel('crm_live_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg && newMsg.chat_id) {
            setMessages((prev) =>
              (prev[newMsg.chat_id] || []).some((m) => m.id === newMsg.id)
                ? prev
                : { ...prev, [newMsg.chat_id]: [...(prev[newMsg.chat_id] || []), newMsg] }
            );
            setChats((prev) =>
              prev.map((c) =>
                c.id === newMsg.chat_id
                  ? {
                      ...c,
                      last_message_text:
                        newMsg.content || (newMsg.type === 'audio' ? '🎵 Mensagem de voz' : '📎 Mídia'),
                      last_message_at: newMsg.created_at,
                    }
                  : c
              )
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chats' },
        (payload) => {
          // Debounce: importações geram muitos eventos em sequência
          if (chatsReloadTimer) clearTimeout(chatsReloadTimer);
          chatsReloadTimer = setTimeout(() => {
            if (currentOrgIdRef.current) {
              loadRealChats(currentOrgIdRef.current);
            }
          }, 1500);
          // Chegou mensagem na conversa aberta: busca as mensagens novas na Evolution
          const changedId = (payload.new as any)?.id;
          if (changedId && changedId === openChatIdRef.current) {
            if (openChatReloadTimer) clearTimeout(openChatReloadTimer);
            openChatReloadTimer = setTimeout(() => loadMessagesForChat(changedId), 800);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'instances' },
        () => {
          if (currentOrgIdRef.current) {
            loadRealInstances(currentOrgIdRef.current);
          }
        }
      )
      .subscribe();

    if (window.location.hash === '#login') {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
    } else if (window.location.hash === '#cadastro') {
      setAuthModalMode('register');
      setIsAuthModalOpen(true);
    }

    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#landing' || !hash || hash === '#') {
        setCurrentTab('landing');
      } else if (hash === '#app') {
        setCurrentTab('chat');
      } else if (hash === '#docs') {
        setCurrentTab('docs');
      } else if (hash === '#admin') {
        setCurrentTab('admin');
      } else if (hash === '#login') {
        setAuthModalMode('login');
        setIsAuthModalOpen(true);
      } else if (hash === '#cadastro') {
        setAuthModalMode('register');
        setIsAuthModalOpen(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);

    // Volta do login com Google ou troca de sessão
    const cameFromOAuth = new URLSearchParams(window.location.search).has('code');
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user;
      const orgId = await syncUserOrg(user);
      if (orgId) {
        loadRealInstances(orgId);
        loadRealContacts(orgId);
        loadRealChats(orgId);
      } else {
        setInstances([]);
        setContacts([]);
        setChats([]);
      }

      if (cameFromOAuth && session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        window.history.replaceState(null, '', window.location.pathname + '#app');
        setCurrentTab('chat');
      }
    });
    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener('hashchange', handleHashChange);
      supabase.removeChannel(channel);
    };
  }, []);

  // Rastreamento de acessos ao site em tempo real para o Painel Admin
  useEffect(() => {
    trackSiteVisit(window.location.hash || (currentTab === 'landing' ? '/' : '#' + currentTab));
  }, [currentTab]);

  // 1. Enviar mensagem de texto ou nota interna
  const handleSendMessage = async (chatId: string, text: string, isInternalNote: boolean) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      organization_id: currentOrgId,
      chat_id: chatId,
      direction: 'outbound',
      sender_type: 'agent',
      type: isInternalNote ? 'internal_note' : 'text',
      content: text,
      is_internal_note: isInternalNote,
      status: 'sent',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), newMessage],
    }));

    if (isInternalNote) {
      try {
        const { message: saved } = await api.sendInternalNote({ organizationId: currentOrgId, chatId, content: text });
        setMessages((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] || [])
            .filter((m) => m.id !== saved.id)
            .map((m) => (m.id === newMessage.id ? saved : m)),
        }));
      } catch (err) {
        console.error('Falha ao salvar nota interna:', err);
      }
    } else {
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? { ...c, last_message_text: text, last_message_at: new Date().toISOString() }
            : c
        )
      );

      // Disparar envio real via Evolution API / Worker
      const targetChat = chats.find((c) => c.id === chatId);
      const activeInstance =
        instances.find((i) => i.id === targetChat?.instance_id) ||
        instances.find((i) => i.status === 'connected') ||
        instances[0];
      const remoteJid = targetChat?.contact?.remote_jid || targetChat?.contact?.phone;

      if (activeInstance && remoteJid) {
        try {
          await api.sendTextMessage({
            organizationId: currentOrgId,
            instanceName: activeInstance.instance_name,
            chatId,
            remoteJid,
            text,
          });
        } catch (err) {
          console.error('Falha ao enviar mensagem WhatsApp:', err);
        }
      }
    }
  };

  // 2. Enviar áudio nativo de voz (PTT)
  const handleSendAudio = async (chatId: string, base64Audio: string, durationSeconds: number) => {
    const newAudioMessage: Message = {
      id: `msg-audio-${Date.now()}`,
      organization_id: currentOrgIdRef.current,
      chat_id: chatId,
      direction: 'outbound',
      sender_type: 'agent',
      type: 'audio',
      content: '🎵 Mensagem de voz',
      media_url: base64Audio,
      media_duration: durationSeconds || 5,
      media_mimetype: 'audio/ogg',
      status: 'sent',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), newAudioMessage],
    }));

    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? { ...c, last_message_text: '🎵 Mensagem de voz', last_message_at: new Date().toISOString() }
          : c
      )
    );

    const targetChat = chats.find((c) => c.id === chatId);
    const activeInstance =
      instances.find((i) => i.id === targetChat?.instance_id) ||
      instances.find((i) => i.status === 'connected') ||
      instances[0];
    const remoteJid = targetChat?.contact?.remote_jid || targetChat?.contact?.phone;

    if (activeInstance && remoteJid) {
      try {
        await api.sendAudioMessage({
          organizationId: currentOrgIdRef.current,
          instanceName: activeInstance.instance_name,
          chatId,
          remoteJid,
          base64Data: base64Audio.includes('base64,') ? base64Audio.split('base64,')[1] : base64Audio,
          mimetype: 'audio/ogg; codecs=opus',
        });
      } catch (err) {
        console.error('Falha ao enviar áudio WhatsApp:', err);
      }
    }
  };

  // 3. Enviar imagem ou documento
  const handleSendMedia = async (chatId: string, file: File, caption: string) => {
    const isImage = file.type.startsWith('image/');
    const previewUrl = URL.createObjectURL(file);

    const newMediaMessage: Message = {
      id: `msg-media-${Date.now()}`,
      organization_id: currentOrgIdRef.current,
      chat_id: chatId,
      direction: 'outbound',
      sender_type: 'agent',
      type: isImage ? 'image' : 'document',
      content: caption || (isImage ? '📷 Foto' : file.name),
      media_url: previewUrl,
      media_filename: file.name,
      media_mimetype: file.type,
      status: 'sent',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), newMediaMessage],
    }));

    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              last_message_text: caption || (isImage ? '📷 Foto' : `📄 ${file.name}`),
              last_message_at: new Date().toISOString(),
            }
          : c
      )
    );

    const targetChat = chats.find((c) => c.id === chatId);
    const activeInstance =
      instances.find((i) => i.id === targetChat?.instance_id) ||
      instances.find((i) => i.status === 'connected') ||
      instances[0];
    const remoteJid = targetChat?.contact?.remote_jid || targetChat?.contact?.phone;

    if (activeInstance && remoteJid) {
      try {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Data = (reader.result as string).split(',')[1];
          await api.sendMediaMessage({
            organizationId: currentOrgIdRef.current,
            instanceName: activeInstance.instance_name,
            chatId,
            remoteJid,
            mediaType: isImage ? 'image' : 'document',
            base64Data,
            mimetype: file.type,
            fileName: file.name,
            caption,
          });
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error('Falha ao enviar mídia WhatsApp:', err);
      }
    }
  };

  // Ligar/Desligar Bot IA em uma conversa
  const handleToggleChatAi = async (chatId: string, disabled: boolean) => {
    try {
      await api.toggleChatAi(chatId, disabled);
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, ai_disabled: disabled, ai_paused_until: null } : c))
      );
    } catch (err: any) {
      alert('Erro ao alterar status da IA: ' + err.message);
    }
  };

  // 4. Mover estágio Kanban
  const handleMoveContactStage = (contactId: string, targetStageId: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, kanban_stage_id: targetStageId } : c))
    );
  };

  // 5. Abrir chat direto de um lead
  const handleOpenChatWithContact = (contactId: string) => {
    let targetChat = chats.find((c) => c.contact_id === contactId);
    if (!targetChat) {
      const contact = contacts.find((c) => c.id === contactId);
      if (contact) {
        targetChat = {
          id: `chat-${Date.now()}`,
          organization_id: currentOrgIdRef.current,
          contact_id: contact.id,
          status: 'open',
          unread_count: 0,
          last_message_text: 'Nova conversa iniciada',
          last_message_at: new Date().toISOString(),
          contact,
          instance: instances[0],
        };
        setChats((prev) => [targetChat!, ...prev]);
      }
    }
    setCurrentTab('chat');
  };

  // 6. Criar nova instância do WhatsApp
  const handleCreateInstance = async (name: string) => {
    try {
      const res = await api.createInstance({
        organizationId: currentOrgId,
        name,
      });

      if (res.error) {
        alert('Erro ao criar instância: ' + res.error);
        return;
      }

      if (res.instance) {
        setInstances((prev) => [res.instance, ...prev]);
      }
    } catch (err: any) {
      alert('Falha ao comunicar com o servidor: ' + err.message);
    }
  };

  // 7. Atualizar QR Code
  const handleRefreshQr = async (instanceName: string) => {
    try {
      const res = await api.getConnectQrCode(instanceName);
      if (res.qrcode) {
        setInstances((prev) =>
          prev.map((i) =>
            i.instance_name === instanceName
              ? { ...i, qr_code: res.qrcode, status: 'qrcode' }
              : i
          )
        );
      }
    } catch (err) {
      console.error('Erro ao atualizar QR Code:', err);
    }
  };

  // 8. Resolver conversa
  const handleResolveChat = (chatId: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, status: 'resolved', unread_count: 0 } : c))
    );
  };

  // 9. Adicionar Resposta Rápida
  const handleAddQuickReply = (shortcut: string, title: string, content: string) => {
    const newQr: QuickReply = {
      id: `qr-${Date.now()}`,
      organization_id: currentOrgIdRef.current,
      shortcut: shortcut.startsWith('/') ? shortcut : `/${shortcut}`,
      title,
      content,
    };
    setQuickReplies((prev) => [...prev, newQr]);
  };

  // Rota 1: Landing Page Pública
  if (currentTab === 'landing') {
    return (
      <>
        <LandingPageView
          onOpenAuth={(mode) => {
            setAuthModalMode(mode);
            setIsAuthModalOpen(true);
          }}
          onEnterApp={enterApp}
          onOpenDocs={() => {
            window.history.pushState(null, '', '#docs');
            setCurrentTab('docs');
          }}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          defaultMode={authModalMode}
          onSuccess={enterApp}
        />
      </>
    );
  }

  // Rota 2: Documentação Completa da API
  if (currentTab === 'docs') {
    return (
      <div className="flex h-screen w-screen overflow-hidden bg-[#0a0d14] text-slate-100">
        <ApiDocsView 
          instances={instances} 
          onNavigateTab={(tab) => {
            if (tab === 'landing') {
              window.history.pushState(null, '', window.location.pathname);
              selectTab('landing');
            } else {
              window.history.pushState(null, '', '#app');
              setCurrentTab(tab);
            }
          }}
        />
      </div>
    );
  }

  const filteredContacts = contacts.filter((c) =>
    (c.name || '').toLowerCase().includes(contactSearch.toLowerCase()) ||
    (c.phone || '').includes(contactSearch)
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0e131f] text-slate-100">
      {/* Sidebar de Navegação */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={selectTab}
        instancesCount={instances.length}
        unreadCount={chats.reduce((acc, c) => acc + (c.unread_count || 0), 0)}
        instances={instances}
      />

      {/* Conteúdo da Aba Atual */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#0e131f]">
        {currentTab === 'instances' && (
          <InstanceList
            instances={instances}
            onCreateInstance={handleCreateInstance}
            onRefreshQr={handleRefreshQr}
            onNavigateTab={setCurrentTab}
            onReloadInstances={loadRealInstances}
          />
        )}

        {currentTab === 'keys' && (
          <ApiKeysView instances={instances} />
        )}

        {currentTab === 'invoices' && (
          <InvoicesView instances={instances} />
        )}

        {currentTab === 'antiban' && (
          <AntiBanGuideView />
        )}

        {currentTab === 'playground' && (
          <ApiPlayground instances={instances} />
        )}

        {currentTab === 'admin' && (
          <AdminDashboardView />
        )}

        {currentTab === 'chat' && (
          <ChatLayout
            chats={chats}
            messages={messages}
            quickReplies={quickReplies}
            queues={queues}
            instances={instances}
            onNavigateTab={setCurrentTab}
            onSendMessage={handleSendMessage}
            onSendAudio={handleSendAudio}
            onSendMedia={handleSendMedia}
            onResolveChat={handleResolveChat}
            onOpenChat={loadMessagesForChat}
            onImportHistory={handleImportHistory}
            isImporting={isImporting}
            onToggleAi={handleToggleChatAi}
          />
        )}

        {currentTab === 'bots' && (
          <CoursesBotsView
            organizationId={currentOrgId}
            instances={instances}
          />
        )}
      </main>

      {/* Modal de Autenticação / Cadastro com Google disponível de qualquer lugar */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authModalMode}
        onSuccess={() => {
          setCurrentTab('instances');
        }}
      />
    </div>
  );
};

export default App;
