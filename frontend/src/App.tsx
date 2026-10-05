import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Sidebar, NavigationTab } from './components/layout/Sidebar';
import { LandingPageView } from './components/landing/LandingPageView';
import { AuthModal } from './components/auth/AuthModal';
import { api } from './lib/api';
import { supabase } from './lib/supabase';
import { Instance } from './types';

// Lazy loading das abas internas autenticadas (reduz drasticamente o bundle inicial do site no mobile)
const InstanceList = lazy(() => import('./components/instances/InstanceList').then(m => ({ default: m.InstanceList })));
const ApiPlayground = lazy(() => import('./components/wapi/ApiPlayground').then(m => ({ default: m.ApiPlayground })));
const ApiKeysView = lazy(() => import('./components/wapi/ApiKeysView').then(m => ({ default: m.ApiKeysView })));
const InvoicesView = lazy(() => import('./components/wapi/InvoicesView').then(m => ({ default: m.InvoicesView })));
const AntiBanGuideView = lazy(() => import('./components/wapi/AntiBanGuideView').then(m => ({ default: m.AntiBanGuideView })));
const ApiDocsView = lazy(() => import('./components/wapi/ApiDocsView').then(m => ({ default: m.ApiDocsView })));
const CoursesBotsView = lazy(() => import('./components/bots/CoursesBotsView').then(m => ({ default: m.CoursesBotsView })));
const AdminDashboardView = lazy(() => import('./components/admin/AdminDashboardView').then(m => ({ default: m.AdminDashboardView })));

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

export const App: React.FC = () => {
  // Raiz do site abre a Landing; o painel da API vive em #app ou #instances
  const [currentTab, setCurrentTab] = useState<NavigationTab>(() => {
    const hash = window.location.hash;
    if (hash === '#app' || hash === '#instances' || hash === '#chat') return 'instances';
    if (hash === '#docs') return 'docs';
    if (hash === '#admin') return 'admin';
    if (hash === '#bots') return 'bots';
    if (hash === '#keys') return 'keys';
    if (hash === '#invoices') return 'invoices';
    if (hash === '#antiban') return 'antiban';
    if (hash === '#playground') return 'playground';
    return 'landing';
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');

  // Organização do Usuário Autenticado (Isolamento Multi-Tenant Estrito)
  const [currentOrgId, setCurrentOrgId] = useState<string>('');
  const currentOrgIdRef = useRef<string>('');
  const [_currentUser, setCurrentUser] = useState<any>(null);

  // Instâncias reais
  const [instances, setInstances] = useState<Instance[]>([]);

  // Atualiza a ref sempre que a organização mudar
  useEffect(() => {
    currentOrgIdRef.current = currentOrgId;
  }, [currentOrgId]);

  useEffect(() => {
    const checkAdmin = (u: any) => {
      if (!u || !u.email) {
        setIsAdmin(false);
        return;
      }
      const email = String(u.email).trim().toLowerCase();
      setIsAdmin(email === 'narcisofelizardo@gmail.com');
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

  // Proteção de rotas: apenas admin acessa bots e painel admin master
  useEffect(() => {
    if (!isAdmin && (currentTab === 'admin' || currentTab === 'bots')) {
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

  // Sincroniza e isola os dados pela Organização do Usuário Autenticado
  const syncUserOrg = async (user: any): Promise<string> => {
    if (!user) {
      setCurrentUser(null);
      setCurrentOrgId('');
      currentOrgIdRef.current = '';
      setInstances([]);
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

  useEffect(() => {
    // 1. Inicializa organização e dados do usuário
    supabase.auth.getSession().then(({ data: { session } }) => {
      syncUserOrg(session?.user).then((orgId) => {
        if (orgId) {
          loadRealInstances(orgId);
        } else {
          setInstances([]);
        }
      });
    });

    // Supabase Realtime para recebimento de mudanças de status das instâncias
    const channel = supabase
      .channel('crm_instances_realtime')
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
      } else if (hash === '#app' || hash === '#instances' || hash === '#chat') {
        setCurrentTab('instances');
      } else if (hash === '#docs') {
        setCurrentTab('docs');
      } else if (hash === '#admin') {
        setCurrentTab('admin');
      } else if (hash === '#bots') {
        setCurrentTab('bots');
      } else if (hash === '#keys') {
        setCurrentTab('keys');
      } else if (hash === '#invoices') {
        setCurrentTab('invoices');
      } else if (hash === '#antiban') {
        setCurrentTab('antiban');
      } else if (hash === '#playground') {
        setCurrentTab('playground');
      } else if (hash === '#login') {
        setAuthModalMode('login');
        setIsAuthModalOpen(true);
      } else if (hash === '#cadastro') {
        setAuthModalMode('register');
        setIsAuthModalOpen(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);

    // Volta do login com Google / OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const hasOAuthCode = urlParams.has('code');
    const hasOAuthTokenInHash = window.location.hash.includes('access_token');
    let isOAuthRedirect = hasOAuthCode || hasOAuthTokenInHash;

    if (hasOAuthCode) {
      urlParams.delete('code');
      const cleanSearch = urlParams.toString() ? `?${urlParams.toString()}` : '';
      window.history.replaceState(null, '', window.location.pathname + cleanSearch + (window.location.hash || '#app'));
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user;
      const orgId = await syncUserOrg(user);
      if (orgId) {
        loadRealInstances(orgId);
      } else {
        setInstances([]);
      }

      // Redireciona para o painel (#app) na conclusão do login via OAuth ou evento de autenticação
      if (session && (event === 'SIGNED_IN' || (isOAuthRedirect && (event as string) === 'INITIAL_SESSION'))) {
        isOAuthRedirect = false;
        window.history.replaceState(null, '', window.location.pathname + '#app');
        setCurrentTab('instances');
        setIsAuthModalOpen(false);
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

  // Criar nova instância do WhatsApp
  const handleCreateInstance = async (name: string) => {
    try {
      const res = await api.createInstance({
        organizationId: currentOrgId,
        name,
      });

      if (res.error) {
        if (res.requiresPayment) {
          alert(res.message || 'Limite de teste atingido. Assine um plano para continuar.');
          setCurrentTab('invoices');
          return;
        }
        alert('Erro ao criar instância: ' + (res.message || res.error));
        return;
      }

      if (res.instance) {
        setInstances((prev) => [res.instance, ...prev]);
      }
    } catch (err: any) {
      alert('Falha ao comunicar com o servidor: ' + err.message);
    }
  };

  // Atualizar QR Code
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
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center bg-[#0a0d14]">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
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
        </Suspense>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0e131f] text-slate-100">
      {/* Sidebar de Navegação */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={selectTab}
        instancesCount={instances.length}
        instances={instances}
      />

      {/* Conteúdo da Aba Atual */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#0e131f]">
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center bg-[#0e131f]">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
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

          {currentTab === 'admin' && isAdmin && (
            <AdminDashboardView />
          )}

          {currentTab === 'bots' && isAdmin && (
            <CoursesBotsView
              organizationId={currentOrgId}
              instances={instances}
            />
          )}
        </Suspense>
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
