import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import { 
  Smartphone, 
  Key, 
  CreditCard, 
  ShieldAlert, 
  ShieldCheck,
  ExternalLink, 
  LogOut,
  Sparkles,
  Terminal,
  Globe,
  Bot,
  Zap,
  BookOpen
} from 'lucide-react';

import { Instance } from '../../types';

export type NavigationTab = 
  | 'landing'
  | 'instances' 
  | 'keys' 
  | 'invoices' 
  | 'antiban' 
  | 'docs' 
  | 'playground' 
  | 'webhooks'
  | 'bots'
  | 'admin';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  instancesCount: number;
  unreadCount?: number;
  instances?: Instance[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  instancesCount,
  unreadCount = 0,
  instances = [],
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = (u: User | null) => {
      if (!u || !u.email) {
        setIsAdmin(false);
        return;
      }
      const email = u.email.trim().toLowerCase();
      setIsAdmin(email === 'narcisofelizardo@gmail.com');
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      checkAdmin(u);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      checkAdmin(u);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    if (confirm('Deseja realmente sair da conta?')) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Erro ao sair da conta:', err);
      }
      window.location.hash = '#landing';
      window.location.reload();
    }
  };

  const displayName = user
    ? (user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário')
    : 'Visitante';

  const displayEmail = user?.email || 'Não autenticado';
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  const getInitials = (str: string) => {
    if (!str) return 'U';
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(displayName);

  return (
    <aside className="w-64 bg-[#0e131f] border-r border-slate-800/80 flex flex-col justify-between h-screen select-none transition-all flex-shrink-0">
      {/* Top: Logo Nexus API */}
      <div className="overflow-y-auto">
        <div className="h-20 flex items-center px-5 border-b border-slate-800/80 gap-3">
          <img
            src="/logo.png"
            alt="NexusAPI"
            className="w-10 h-10 object-contain rounded-xl shadow-lg shadow-emerald-500/20 flex-shrink-0"
          />
          <div>
            <h1 className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
              Nexus API
            </h1>
            <p className="text-[10px] text-emerald-400/90 font-medium">
              WhatsApp Platform & Devs
            </p>
          </div>
        </div>

        {/* Status Rápido do WhatsApp */}
        <div className="p-3 pb-2">
          {instances.some((i) => i.status === 'connected') ? (
            <button
              type="button"
              onClick={() => onSelectTab('instances')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold hover:bg-emerald-500/20 transition-all text-left group"
              title="Clique para gerenciar conexões do WhatsApp"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <span className="truncate">
                  {instances.find((i) => i.status === 'connected')?.phone_number
                    ? `+${instances.find((i) => i.status === 'connected')?.phone_number}`
                    : 'WhatsApp Online'}
                </span>
              </div>
              <span className="text-[9px] text-emerald-500 group-hover:text-emerald-300 font-mono">
                {instances.find((i) => i.status === 'connected')?.name || 'Ativo'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSelectTab('instances')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-medium hover:bg-amber-500/20 transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                <span>WhatsApp Desconectado</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 underline">Conectar</span>
            </button>
          )}
        </div>

        {/* 1. SEÇÃO PRINCIPAL: PLATAFORMA NEXUS API */}
        <div className="p-3 pt-1 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Plataforma REST API</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
              REST v2
            </span>
          </div>

          {/* Instâncias */}
          <button
            onClick={() => onSelectTab('instances')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              currentTab === 'instances'
                ? 'bg-emerald-500/10 text-emerald-400 font-semibold border-l-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Smartphone className="w-4 h-4 flex-shrink-0" />
            <span>Instâncias WhatsApp</span>
            {instancesCount > 0 && (
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500 text-slate-950">
                {instancesCount}
              </span>
            )}
          </button>

          {/* API Keys */}
          <button
            onClick={() => onSelectTab('keys')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              currentTab === 'keys'
                ? 'bg-emerald-500/10 text-emerald-400 font-semibold border-l-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Key className="w-4 h-4 flex-shrink-0" />
            <span>API Keys</span>
          </button>

          {/* Faturas / Assinaturas / Checkout */}
          <button
            onClick={() => onSelectTab('invoices')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              currentTab === 'invoices'
                ? 'bg-emerald-500/10 text-emerald-400 font-semibold border-l-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <CreditCard className="w-4 h-4 flex-shrink-0" />
            <span>Faturas & Assinaturas</span>
          </button>

          {/* Anti-Banimento */}
          <button
            onClick={() => onSelectTab('antiban')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              currentTab === 'antiban'
                ? 'bg-amber-500/10 text-amber-400 font-semibold border-l-2 border-amber-500'
                : 'text-slate-400 hover:text-amber-300 hover:bg-slate-900/60'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Guia Anti-Banimento</span>
          </button>

          {/* Documentação */}
          <button
            onClick={() => onSelectTab('docs')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              currentTab === 'docs'
                ? 'bg-emerald-500/10 text-emerald-400 font-semibold border-l-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
            <span>Documentação da API</span>
          </button>

          {/* Playground Testes */}
          <button
            onClick={() => onSelectTab('playground')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              currentTab === 'playground'
                ? 'bg-emerald-500/10 text-emerald-400 font-semibold border-l-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Terminal className="w-4 h-4 flex-shrink-0" />
            <span>API Playground</span>
          </button>
        </div>

        {/* 2. SEÇÃO EXCLUSIVA DO ADMINISTRADOR (BOTS DE CURSOS, LIVE CHAT & ADMIN SAAS) */}
        {isAdmin && (
          <div className="p-3 pt-3 space-y-1 border-t border-slate-800/80 mt-2">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Admin & Venda de Cursos</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold">
                Master
              </span>
            </div>

            {/* Bots & Cursos com IA */}
            <button
              onClick={() => onSelectTab('bots')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                currentTab === 'bots'
                  ? 'bg-purple-500/15 text-purple-300 font-semibold border-l-2 border-purple-400 shadow-md shadow-purple-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-purple-950/30'
              }`}
            >
              <Bot className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>Bots & Cursos IA</span>
              <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                GPT-5.6 Luna
              </span>
            </button>

            {/* Painel Admin Master */}
            <button
              onClick={() => onSelectTab('admin')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                currentTab === 'admin'
                  ? 'bg-purple-600 text-white font-bold shadow-lg shadow-purple-600/30 border border-purple-400/50'
                  : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span>Painel Admin Master</span>
              <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 uppercase font-mono font-bold">
                SaaS
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Profile (Narciso Santos) */}
      <div className="p-4 border-t border-slate-800/80 space-y-3">
        {/* Botão Suporte via WhatsApp */}
        <a
          href="https://wa.me/5594991064043?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20no%20painel%20da%20NexusAPI."
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/20 transition-all group"
        >
          <span className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#25D366]" />
            <span>Suporte WhatsApp</span>
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-[#25D366] group-hover:translate-x-0.5 transition-transform" />
        </a>

        {/* Botão Ver Landing Page */}
        <button
          type="button"
          onClick={() => onSelectTab('landing')}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all group"
        >
          <span className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Página Inicial (Landing)</span>
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {user ? (
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-rose-400 transition-colors px-2 py-1 rounded hover:bg-rose-500/10"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da conta</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              window.location.hash = '#login';
            }}
            className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors px-2 py-1 rounded hover:bg-emerald-500/10"
          >
            <LogOut className="w-4 h-4 rotate-180" />
            <span>Fazer Login</span>
          </button>
        )}

        <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-[#161c2d] border border-slate-800/80">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover border border-purple-500/40 flex-shrink-0 shadow-md"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center font-bold text-xs text-white flex-shrink-0 shadow-md">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate" title={displayName}>
              {displayName}
            </p>
            <p className="text-[10px] text-slate-400 truncate" title={displayEmail}>
              {displayEmail}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

