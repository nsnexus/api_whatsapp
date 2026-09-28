import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Users,
  Smartphone,
  Radio,
  Eye,
  TrendingUp,
  RefreshCw,
  Search,
  ShieldCheck,
  Building,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Edit3,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  Filter,
  Download,
  AlertCircle
} from 'lucide-react';

interface MetricsSummary {
  total_clients: number;
  total_organizations: number;
  total_instances: number;
  connected_instances: number;
  disconnected_instances: number;
  total_visits: number;
  unique_visitors: number;
  visits_today: number;
  unique_today: number;
  estimated_mrr: number;
}

interface ClientRow {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: string;
  created_at: string;
  organization_id: string;
  org_name: string;
  org_slug: string;
  org_plan: string;
  max_instances: number;
  org_status: string;
  instances_count: number;
  connected_instances_count: number;
}

interface SystemInstanceRow {
  id: string;
  name: string;
  instance_name: string;
  status: string;
  phone_number?: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
  org_name?: string;
  owner_name?: string;
  owner_email?: string;
}

interface DailyVisit {
  day: string;
  views: number;
  visitors: number;
}

interface TopPage {
  page: string;
  count: number;
  unique_count: number;
}

export const AdminDashboardView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<MetricsSummary>({
    total_clients: 0,
    total_organizations: 0,
    total_instances: 0,
    connected_instances: 0,
    disconnected_instances: 0,
    total_visits: 0,
    unique_visitors: 0,
    visits_today: 0,
    unique_today: 0,
    estimated_mrr: 0,
  });

  const [clients, setClients] = useState<ClientRow[]>([]);
  const [instances, setInstances] = useState<SystemInstanceRow[]>([]);
  const [dailyVisits, setDailyVisits] = useState<DailyVisit[]>([]);
  const [topPages, setTopPages] = useState<TopPage[]>([]);

  // Sub-abas do painel
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'instances' | 'traffic'>('overview');

  // Filtros de busca
  const [clientSearch, setClientSearch] = useState('');
  const [instanceSearch, setInstanceSearch] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('all');

  // Modal para editar plano de um cliente
  const [editingClient, setEditingClient] = useState<ClientRow | null>(null);
  const [editPlan, setEditPlan] = useState<string>('pro');
  const [editMaxInstances, setEditMaxInstances] = useState<number>(1);
  const [savingPlan, setSavingPlan] = useState(false);

  const loadAdminData = async () => {
    try {
      setError(null);
      const { data, error: rpcErr } = await supabase.rpc('get_admin_dashboard_metrics');

      if (rpcErr) {
        throw new Error(rpcErr.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.metrics) setMetrics(data.metrics);
      if (Array.isArray(data?.clients)) setClients(data.clients);
      if (Array.isArray(data?.instances)) setInstances(data.instances);
      if (Array.isArray(data?.daily_visits)) setDailyVisits(data.daily_visits);
      if (Array.isArray(data?.top_pages)) setTopPages(data.top_pages);
    } catch (err: any) {
      console.error('Erro ao carregar dados do admin:', err);
      setError(err.message || 'Falha ao carregar métricas administrativas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAdminData();
  };

  const handleSavePlan = async () => {
    if (!editingClient) return;
    setSavingPlan(true);
    try {
      const { data, error } = await supabase.rpc('admin_update_client_plan', {
        target_org_id: editingClient.organization_id,
        new_plan: editPlan,
        new_max_instances: Number(editMaxInstances),
        new_status: 'active',
      });

      if (error || data?.error) {
        alert('Erro ao atualizar plano: ' + (error?.message || data?.error));
        return;
      }

      // Atualiza localmente
      setClients((prev) =>
        prev.map((c) =>
          c.organization_id === editingClient.organization_id
            ? { ...c, org_plan: editPlan, max_instances: Number(editMaxInstances) }
            : c
        )
      );
      setEditingClient(null);
      loadAdminData();
    } catch (err: any) {
      alert('Erro inesperado: ' + err.message);
    } finally {
      setSavingPlan(false);
    }
  };

  const exportClientsCsv = () => {
    const headers = ['Nome', 'Email', 'Organização', 'Plano', 'Limite Instâncias', 'Instâncias Criadas', 'Criado Em'];
    const rows = clients.map((c) => [
      `"${c.full_name || ''}"`,
      `"${c.email || ''}"`,
      `"${c.org_name || ''}"`,
      `"${c.org_plan || ''}"`,
      c.max_instances,
      c.instances_count,
      `"${new Date(c.created_at).toLocaleDateString('pt-BR')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `clientes_crm_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtragem de clientes
  const filteredClients = clients.filter((c) => {
    const matchSearch =
      (c.full_name || '').toLowerCase().includes(clientSearch.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(clientSearch.toLowerCase()) ||
      (c.org_name || '').toLowerCase().includes(clientSearch.toLowerCase());

    const matchPlan =
      selectedPlanFilter === 'all' ||
      (selectedPlanFilter === '1' && c.max_instances === 1) ||
      (selectedPlanFilter === '2' && c.max_instances === 2) ||
      (selectedPlanFilter === '5' && c.max_instances >= 5);

    return matchSearch && matchPlan;
  });

  // Filtragem de instâncias
  const filteredInstances = instances.filter((i) => {
    return (
      (i.name || '').toLowerCase().includes(instanceSearch.toLowerCase()) ||
      (i.phone_number || '').includes(instanceSearch) ||
      (i.owner_email || '').toLowerCase().includes(instanceSearch.toLowerCase()) ||
      (i.org_name || '').toLowerCase().includes(instanceSearch.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0d14] text-slate-300 p-8">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-4" />
        <p className="text-sm font-medium">Carregando métricas e dados administrativos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0d14] text-slate-300 p-8">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 max-w-md text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">Acesso Negado ou Erro</h2>
          <p className="text-xs text-red-300 mb-4">{error}</p>
          <button
            onClick={loadAdminData}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0d14] text-slate-100 overflow-y-auto">
      {/* 1. Header do Painel Master Admin */}
      <div className="border-b border-slate-800/80 bg-[#0e131f]/90 backdrop-blur-md px-8 py-5 sticky top-0 z-30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                Painel Administrativo Master
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  Superadmin
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Métricas em tempo real de clientes, instâncias WhatsApp ativas, tráfego e receita do SaaS.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={exportClientsCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 text-xs font-semibold transition-all shadow-sm"
            title="Exportar tabela de clientes em CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Atualizando...' : 'Atualizar'}</span>
          </button>
        </div>
      </div>

      {/* 2. Conteúdo Principal */}
      <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* CARDS DE KPIS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total de Clientes Cadastrados */}
          <div className="bg-[#121829] border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/40 transition-all shadow-lg">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-purple-500/20 transition-all pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clientes Cadastrados</span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-white tracking-tight mb-1">
              {metrics.total_clients}
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span>{metrics.total_organizations} workspaces ativos</span>
            </p>
          </div>

          {/* Card 2: Instâncias WhatsApp */}
          <div className="bg-[#121829] border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-all shadow-lg">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Instâncias WhatsApp</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Smartphone className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-white tracking-tight mb-1 flex items-baseline gap-2">
              <span>{metrics.connected_instances}</span>
              <span className="text-xs font-semibold text-slate-500">de {metrics.total_instances} criadas</span>
            </div>
            <p className="text-xs text-emerald-400 flex items-center gap-1.5">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>{metrics.connected_instances} números conectados online</span>
            </p>
          </div>

          {/* Card 3: Acessos ao Site */}
          <div className="bg-[#121829] border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-cyan-500/40 transition-all shadow-lg">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-cyan-500/20 transition-all pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Acessos ao Site</span>
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-white tracking-tight mb-1">
              {metrics.total_visits}
            </div>
            <p className="text-xs text-cyan-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>{metrics.unique_visitors} visitantes únicos ({metrics.visits_today} hoje)</span>
            </p>
          </div>

          {/* Card 4: Faturamento Estimado (MRR) */}
          <div className="bg-[#121829] border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/40 transition-all shadow-lg">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-amber-500/20 transition-all pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Receita Recorrente (MRR)</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-amber-400 tracking-tight mb-1">
              R$ {Number(metrics.estimated_mrr || 0).toFixed(2).replace('.', ',')}
              <span className="text-xs font-normal text-slate-400">/mês</span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>Pacotes: R$ 19,90 • R$ 29,90 • R$ 49,90</span>
            </p>
          </div>
        </div>

        {/* NAVEGAÇÃO DE SUB-ABAS */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Visão Geral & Gráficos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'clients'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Gerenciar Clientes ({clients.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('instances')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'instances'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Todas as Instâncias ({instances.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('traffic')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'traffic'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Acessos & Páginas ({metrics.total_visits})</span>
          </button>
        </div>

        {/* CONTEÚDO DA ABA 1: VISÃO GERAL */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Gráfico de Tráfego Recente e Páginas Mais Acessadas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Gráfico de Barras de Visitas */}
              <div className="lg:col-span-2 bg-[#121829] border border-slate-800/80 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-white text-sm">Histórico de Acessos Recentes</h3>
                    <p className="text-xs text-slate-400">Total de visualizações e visitantes únicos por dia</p>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Últimos 14 dias
                  </span>
                </div>

                {dailyVisits.length > 0 ? (
                  <div className="space-y-3">
                    {dailyVisits.map((item, idx) => {
                      const maxViews = Math.max(...dailyVisits.map((d) => d.views), 1);
                      const pct = Math.min(100, Math.round((item.views / maxViews) * 100));
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-400">{item.day}</span>
                            <span className="text-slate-200 font-bold">
                              {item.views} visualizações • <span className="text-cyan-400">{item.visitors} únicos</span>
                            </span>
                          </div>
                          <div className="w-full h-3 rounded-full bg-slate-800/80 overflow-hidden flex">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    Nenhum tráfego registrado no período.
                  </div>
                )}
              </div>

              {/* Páginas Mais Visitadas */}
              <div className="bg-[#121829] border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white text-sm">Páginas Mais Acessadas</h3>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Ranking</span>
                  </div>

                  <div className="space-y-3">
                    {topPages.slice(0, 6).map((tp, idx) => {
                      const totalCount = metrics.total_visits || 1;
                      const pct = Math.round((tp.count / totalCount) * 100);
                      return (
                        <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                          <div className="flex justify-between items-center text-xs mb-1">
                            <span className="font-mono font-bold text-emerald-400 truncate">{tp.page || '/'}</span>
                            <span className="text-slate-300 font-semibold">{tp.count} views</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Taxa de Conversão:</span>
                    <span className="font-bold text-purple-400">
                      {metrics.unique_visitors > 0
                        ? `${((metrics.total_clients / metrics.unique_visitors) * 100).toFixed(1)}%`
                        : '0%'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Resumo de Clientes Recentes */}
            <div className="bg-[#121829] border border-slate-800/80 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white text-sm">Clientes Mais Recentes</h3>
                  <p className="text-xs text-slate-400">Últimos usuários cadastrados na plataforma</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('clients')}
                  className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
                >
                  <span>Ver todos ({clients.length})</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold">
                      <th className="pb-3 px-3">Cliente</th>
                      <th className="pb-3 px-3">Workspace / Empresa</th>
                      <th className="pb-3 px-3">Plano</th>
                      <th className="pb-3 px-3">Instâncias WhatsApp</th>
                      <th className="pb-3 px-3">Cadastro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {clients.slice(0, 5).map((client) => (
                      <tr key={client.id} className="hover:bg-slate-800/30 transition-all">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            {client.avatar_url ? (
                              <img
                                src={client.avatar_url}
                                alt={client.full_name}
                                className="w-7 h-7 rounded-full border border-slate-700"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center font-bold text-purple-300">
                                {client.full_name?.charAt(0) || client.email?.charAt(0) || 'U'}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-white flex items-center gap-1">
                                {client.full_name || 'Sem nome'}
                                {client.role === 'superadmin' && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">{client.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-300 font-medium">
                          {client.org_name || 'Empresa Padrão'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                            {client.max_instances === 1
                              ? '1 Instância (R$ 19,90)'
                              : client.max_instances === 2
                              ? '2 Instâncias (R$ 29,90)'
                              : client.max_instances >= 5
                              ? 'Combo 5 (R$ 49,90)'
                              : `${client.max_instances} Instâncias`}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                client.connected_instances_count > 0 ? 'bg-emerald-400' : 'bg-slate-600'
                              }`}
                            />
                            <span className="font-semibold text-slate-200">
                              {client.connected_instances_count} / {client.instances_count} ativas
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          {new Date(client.created_at).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA 2: GERENCIAR CLIENTES */}
        {activeTab === 'clients' && (
          <div className="space-y-4">
            {/* Barra de Filtros */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#121829] border border-slate-800/80 p-4 rounded-2xl">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar cliente por nome, email ou empresa..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-400">Filtrar por plano:</span>
                <select
                  value={selectedPlanFilter}
                  onChange={(e) => setSelectedPlanFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="all">Todos os Planos</option>
                  <option value="1">1 Instância (R$ 19,90)</option>
                  <option value="2">2 Instâncias (R$ 29,90)</option>
                  <option value="5">Combo 5 Instâncias (R$ 49,90)</option>
                </select>
              </div>
            </div>

            {/* Tabela de Clientes */}
            <div className="bg-[#121829] border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">Cliente</th>
                      <th className="py-3.5 px-4">Workspace / Empresa</th>
                      <th className="py-3.5 px-4">Plano Contratado</th>
                      <th className="py-3.5 px-4">Limite de Instâncias</th>
                      <th className="py-3.5 px-4">Instâncias Criadas</th>
                      <th className="py-3.5 px-4">Cadastro</th>
                      <th className="py-3.5 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredClients.map((client) => (
                      <tr key={client.id} className="hover:bg-slate-800/40 transition-all">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {client.avatar_url ? (
                              <img
                                src={client.avatar_url}
                                alt={client.full_name}
                                className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                                {client.full_name?.charAt(0) || client.email?.charAt(0) || 'U'}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                {client.full_name || 'Sem nome cadastrado'}
                                {client.role === 'superadmin' && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono font-bold">
                                    MASTER
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">{client.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-500" />
                            <span>{client.org_name || 'Workspace'}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{client.org_slug}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            {client.max_instances === 1
                              ? '1 Instância • R$ 19,90'
                              : client.max_instances === 2
                              ? '2 Instâncias • R$ 29,90'
                              : client.max_instances >= 5
                              ? 'Combo 5 • R$ 49,90'
                              : `${client.max_instances} Instâncias`}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-200">
                          {client.max_instances} instâncias máx.
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                client.connected_instances_count > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                              }`}
                            />
                            <span className="font-bold text-white">{client.instances_count}</span>
                            <span className="text-slate-400">({client.connected_instances_count} online)</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(client.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingClient(client);
                              setEditPlan(client.org_plan || 'pro');
                              setEditMaxInstances(client.max_instances || 1);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white font-bold transition-all text-xs"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Mudar Plano</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA 3: TODAS AS INSTÂNCIAS WHATSAPP */}
        {activeTab === 'instances' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-[#121829] border border-slate-800/80 p-4 rounded-2xl">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar instância por nome, telefone ou dono..."
                  value={instanceSearch}
                  onChange={(e) => setInstanceSearch(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              <div className="text-xs text-slate-400 font-semibold">
                Total de Instâncias no Sistema:{' '}
                <span className="text-emerald-400 font-bold">{instances.length}</span>
              </div>
            </div>

            <div className="bg-[#121829] border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">Instância</th>
                      <th className="py-3.5 px-4">Status WhatsApp</th>
                      <th className="py-3.5 px-4">Número Conectado</th>
                      <th className="py-3.5 px-4">Cliente / Dono</th>
                      <th className="py-3.5 px-4">Workspace</th>
                      <th className="py-3.5 px-4">Criada Em</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredInstances.map((inst) => (
                      <tr key={inst.id} className="hover:bg-slate-800/40 transition-all">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-emerald-400" />
                            <span>{inst.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{inst.instance_name}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          {inst.status === 'connected' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Conectado
                            </span>
                          ) : inst.status === 'qrcode' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              Aguardando QR Code
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                              Desconectado
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                          {inst.phone_number ? `+${inst.phone_number}` : '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200">{inst.owner_name || 'Usuário'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{inst.owner_email || '—'}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-medium">
                          {inst.org_name || 'Empresa'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(inst.created_at).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA 4: ACESSOS E TRÁFEGO */}
        {activeTab === 'traffic' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#121829] border border-slate-800/80 rounded-2xl p-5">
                <span className="text-xs text-slate-400 uppercase font-bold">Total de Visualizações</span>
                <div className="text-3xl font-black text-cyan-400 mt-1">{metrics.total_visits}</div>
                <p className="text-xs text-slate-500 mt-1">Cliques e páginas abertas no site</p>
              </div>

              <div className="bg-[#121829] border border-slate-800/80 rounded-2xl p-5">
                <span className="text-xs text-slate-400 uppercase font-bold">Visitantes Únicos</span>
                <div className="text-3xl font-black text-white mt-1">{metrics.unique_visitors}</div>
                <p className="text-xs text-slate-500 mt-1">Pessoas ou dispositivos distintos</p>
              </div>

              <div className="bg-[#121829] border border-slate-800/80 rounded-2xl p-5">
                <span className="text-xs text-slate-400 uppercase font-bold">Acessos Hoje</span>
                <div className="text-3xl font-black text-emerald-400 mt-1">{metrics.visits_today}</div>
                <p className="text-xs text-slate-500 mt-1">{metrics.unique_today} visitantes únicos hoje</p>
              </div>
            </div>

            <div className="bg-[#121829] border border-slate-800/80 rounded-2xl p-6">
              <h3 className="font-bold text-white text-sm mb-4">Detalhamento das Páginas Mais Populares</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="py-3 px-4">Página / Rota</th>
                      <th className="py-3 px-4">Total de Visualizações</th>
                      <th className="py-3 px-4">Visitantes Únicos</th>
                      <th className="py-3 px-4">% do Tráfego Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {topPages.map((tp, idx) => {
                      const total = metrics.total_visits || 1;
                      const pct = ((tp.count / total) * 100).toFixed(1);
                      return (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                            {tp.page === '/' ? '/ (Landing Page)' : tp.page}
                          </td>
                          <td className="py-3 px-4 font-bold text-white">{tp.count}</td>
                          <td className="py-3 px-4 text-cyan-400 font-semibold">{tp.unique_count}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="font-mono text-slate-400">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL PARA ALTERAR PLANO DO CLIENTE */}
      {editingClient && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121829] border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-white">Alterar Plano do Cliente</h3>
                <p className="text-xs text-slate-400">
                  {editingClient.full_name} ({editingClient.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingClient(null)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300">Escolha o Pacote / Limite de Instâncias:</label>
              
              <div
                onClick={() => {
                  setEditPlan('starter');
                  setEditMaxInstances(1);
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  editMaxInstances === 1
                    ? 'bg-purple-600/15 border-purple-500 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center font-bold text-xs">
                  <span>1 Instância WhatsApp</span>
                  <span className="text-emerald-400">R$ 19,90/mês</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Permite conectar 1 número WhatsApp</p>
              </div>

              <div
                onClick={() => {
                  setEditPlan('pro');
                  setEditMaxInstances(2);
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  editMaxInstances === 2
                    ? 'bg-purple-600/15 border-purple-500 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center font-bold text-xs">
                  <span>2 Instâncias WhatsApp</span>
                  <span className="text-emerald-400">R$ 29,90/mês</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Permite conectar até 2 números WhatsApp</p>
              </div>

              <div
                onClick={() => {
                  setEditPlan('combo');
                  setEditMaxInstances(5);
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  editMaxInstances === 5
                    ? 'bg-purple-600/15 border-purple-500 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center font-bold text-xs">
                  <span>Combo 5 Instâncias WhatsApp</span>
                  <span className="text-emerald-400">R$ 49,90/mês</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Pacote completo para até 5 conexões simultâneas</p>
              </div>

              <div
                onClick={() => {
                  setEditPlan('vip');
                  setEditMaxInstances(10);
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  editMaxInstances > 5
                    ? 'bg-purple-600/15 border-purple-500 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center font-bold text-xs">
                  <span>Plano VIP Ilimitado / Custom</span>
                  <span className="text-purple-400">Personalizado</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Permite conectar até 10 instâncias</p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEditingClient(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSavePlan}
                disabled={savingPlan}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 disabled:opacity-50"
              >
                {savingPlan ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
