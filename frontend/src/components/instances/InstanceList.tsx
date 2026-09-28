import React, { useState, useEffect } from 'react';
import { Instance } from '../../types';
import { api } from '../../lib/api';
import { CheckoutModal } from '../wapi/CheckoutModal';
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  LogOut, 
  Smartphone, 
  Search, 
  QrCode, 
  SlidersHorizontal,
  Key,
  Copy,
  Check,
  Code2,
  Globe,
  Radio,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface InstanceListProps {
  instances: Instance[];
  onCreateInstance: (name: string) => Promise<void>;
  onRefreshQr: (instanceName: string) => Promise<void>;
  onNavigateTab?: (tab: any) => void;
  onReloadInstances?: () => Promise<void>;
}

export const InstanceList: React.FC<InstanceListProps> = ({
  instances,
  onCreateInstance,
  onRefreshQr,
  onNavigateTab,
  onReloadInstances,
}) => {
  const [instancesState, setInstancesState] = useState<Instance[]>(instances);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedInstanceForCheckout, setSelectedInstanceForCheckout] = useState<Instance | null>(null);

  // Sincroniza estado com props
  useEffect(() => {
    setInstancesState(instances);
  }, [instances]);

  // Modal QR Code / Pairing Code
  const [selectedInstanceForQr, setSelectedInstanceForQr] = useState<Instance | null>(null);
  const [currentQr, setCurrentQr] = useState<string | null>(null);
  const [pairingNumber, setPairingNumber] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [qrCountdown, setQrCountdown] = useState(25);
  const [connectionMethod, setConnectionMethod] = useState<'qr' | 'pairing'>('qr');

  // Modal API Docs
  const [selectedInstanceForDocs, setSelectedInstanceForDocs] = useState<Instance | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modal Webhook
  const [selectedInstanceForWebhook, setSelectedInstanceForWebhook] = useState<Instance | null>(null);
  const [webhookInput, setWebhookInput] = useState('');
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);

  // Copiar para clipboard com feedback
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Abrir modal de conexão e buscar QR Code real imediatamente
  const handleOpenConnect = async (instance: Instance) => {
    setSelectedInstanceForQr(instance);
    setPairingCode(null);
    setCurrentQr(null);
    setLoadingQr(true);
    setQrCountdown(25);

    try {
      const res = await api.getConnectQrCode(instance.instance_name);
      if (res.qrcode) {
        setCurrentQr(res.qrcode);
      }
      if (res.pairingCode) {
        setPairingCode(res.pairingCode);
      }
    } catch (e) {
      console.error('Erro ao buscar QR Code:', e);
    } finally {
      setLoadingQr(false);
    }
  };

  // Gerar Pairing Code com número de telefone
  const handleGeneratePairingCode = async () => {
    if (!selectedInstanceForQr || !pairingNumber.trim()) return;
    setLoadingQr(true);
    try {
      const res = await api.getConnectQrCode(selectedInstanceForQr.instance_name, pairingNumber);
      if (res.pairingCode) {
        setPairingCode(res.pairingCode);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingQr(false);
    }
  };

  // Atualizar QR Code manualmente
  const handleManualRefresh = async () => {
    if (!selectedInstanceForQr) return;
    setLoadingQr(true);
    setQrCountdown(25);
    try {
      const res = await api.getConnectQrCode(selectedInstanceForQr.instance_name);
      if (res.qrcode) {
        setCurrentQr(res.qrcode);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingQr(false);
    }
  };

  // Auto-refresh countdown
  useEffect(() => {
    if (!selectedInstanceForQr || connectionMethod !== 'qr') return;
    const timer = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          handleManualRefresh();
          return 25;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedInstanceForQr, connectionMethod]);

  // Polling de status
  useEffect(() => {
    if (!selectedInstanceForQr) return;
    const checkStatus = setInterval(async () => {
      try {
        const res = await api.getInstanceStatus(selectedInstanceForQr.instance_name);
        if (res.state === 'open') {
          setSelectedInstanceForQr(null);
          onRefreshQr(selectedInstanceForQr.instance_name);
          if (onReloadInstances) onReloadInstances();
        }
      } catch (e) {}
    }, 4000);
    return () => clearInterval(checkStatus);
  }, [selectedInstanceForQr]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstanceName.trim() || isCreating) return;
    setIsCreating(true);
    try {
      await onCreateInstance(newInstanceName.trim());
      setNewInstanceName('');
      setShowCreateModal(false);
    } catch (err: any) {
      alert('Erro ao criar: ' + (err.message || err));
    } finally {
      setIsCreating(false);
      setShowCreateModal(false);
      if (onReloadInstances) await onReloadInstances();
    }
  };

  const handleRestart = async (instanceName: string) => {
    if (!confirm(`Deseja reiniciar a conexão da instância "${instanceName}"?`)) return;
    try {
      await api.restartInstance(instanceName);
      alert('Instância reiniciada.');
      if (onReloadInstances) onReloadInstances();
    } catch (e: any) {
      alert('Erro ao reiniciar: ' + e.message);
    }
  };

  const handleLogout = async (instanceName: string) => {
    if (!confirm(`Deseja desconectar o WhatsApp da instância "${instanceName}"?`)) return;
    try {
      await api.logoutInstance(instanceName);
      alert('Instância desconectada.');
      if (onReloadInstances) onReloadInstances();
    } catch (e: any) {
      alert('Erro ao desconectar: ' + e.message);
    }
  };

  const handleDelete = async (instanceName: string) => {
    if (!confirm(`ATENÇÃO: Deseja realmente excluir permanentemente a instância "${instanceName}"?`)) return;
    try {
      // 1. Otimista: remove da tela imediatamente
      setInstancesState((prev) => prev.filter((i) => i.instance_name !== instanceName));

      // 2. Chama API para deletar na VPS e no Supabase
      const res = await api.deleteInstance(instanceName);
      if (res?.error) {
        alert('Aviso: ' + res.error);
      }

      // 3. Atualiza banco
      if (onReloadInstances) await onReloadInstances();
    } catch (e: any) {
      alert('Erro ao excluir: ' + e.message);
    }
  };

  const handleSaveWebhookModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstanceForWebhook || !webhookInput.trim()) return;
    setIsSavingWebhook(true);
    try {
      await api.setWebhook({
        instanceName: selectedInstanceForWebhook.instance_name,
        webhookUrl: webhookInput.trim(),
        enabled: true,
      });
      alert('Webhook configurado na VPS com sucesso!');
      setSelectedInstanceForWebhook(null);
      if (onReloadInstances) onReloadInstances();
    } catch (e: any) {
      alert('Erro ao configurar webhook: ' + e.message);
    } finally {
      setIsSavingWebhook(false);
    }
  };

  const filteredInstances = instancesState.filter((i) =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.instance_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0e131f] text-slate-100 overflow-y-auto">
      {/* Top Header (Igual ao Screenshot 1) */}
      <div className="h-20 px-8 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5 text-white">
            Instâncias
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {instancesState.length}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Gerencie suas instâncias</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#10b981] hover:bg-[#059669] text-slate-950 font-bold text-xs shadow-lg transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Criar instância</span>
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="px-8 pb-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xl">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar instância..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#161c2d] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#161c2d] border border-slate-800 hover:text-white">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>Todos</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#161c2d] border border-slate-800 hover:text-white">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Ordenar</span>
          </button>
        </div>
      </div>

      {/* Grid de Instâncias ou Estado Vazio */}
      <div className="px-8 py-4">
        {filteredInstances.length === 0 ? (
          <div className="bg-[#161c2d] border border-slate-800/80 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
              <Smartphone className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Nenhuma instância criada</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Você ainda não tem instâncias cadastradas. Clique no botão abaixo para criar sua primeira conexão e ler o QR Code!
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2.5 rounded-full bg-[#10b981] hover:bg-[#059669] text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
            >
              + Criar Primeira Instância
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredInstances.map((instance) => {
              const isConnected = instance.status === 'connected';
              const createdDate = instance.created_at
                ? new Intl.DateTimeFormat('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(instance.created_at))
                : 'Recente';

              return (
                <div
                  key={instance.id || instance.instance_name}
                  className="bg-[#161c2d] border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 transition-all"
                >
                  <div className="space-y-4">
                    {/* Header do Card (Título, Data e Lixeira) */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-white text-base tracking-tight">{instance.name}</h3>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mt-0.5">
                          CRIADA EM {createdDate}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDelete(instance.instance_name)}
                        className="text-slate-500 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="Excluir instância"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Box de Expiração / Plano Ativo */}
                    <div className="bg-[#10b981]/5 border border-[#10b981]/30 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">Expira em 30 dias</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#10b981] flex items-center gap-1.5 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
                          PLANO ATIVO
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedInstanceForCheckout(instance);
                          setIsCheckoutOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-[#10b981] hover:bg-[#059669] text-slate-950 font-bold text-xs shadow transition-all active:scale-95"
                      >
                        Renovar
                      </button>
                    </div>

                    {/* ID da Instância */}
                    <div className="space-y-1">
                      <div className="text-[11px] text-slate-400 font-medium">ID da instância</div>
                      <div className="text-xs font-mono font-bold text-slate-200 uppercase bg-[#0e131f] px-2.5 py-1 rounded-lg border border-slate-800 flex items-center justify-between">
                        <span className="truncate">{instance.instance_name}</span>
                        <button
                          onClick={() => handleCopy(instance.instance_name, `id-${instance.instance_name}`)}
                          className="text-slate-500 hover:text-emerald-400"
                          title="Copiar ID"
                        >
                          {copiedKey === `id-${instance.instance_name}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Linha do Número Conectado & Botão Gerenciar */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 overflow-hidden flex-shrink-0">
                          {instance.profile_picture_url ? (
                            <img src={instance.profile_picture_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span>WA</span>
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-mono font-semibold text-slate-200">
                            {instance.phone_number || (isConnected ? 'Conectado' : 'Não conectado')}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {isConnected ? 'Sessão Baileys v2 ativa' : 'Aguardando pareamento'}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenConnect(instance)}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors"
                      >
                        {isConnected ? 'Gerenciar' : 'Conectar'}
                      </button>
                    </div>
                  </div>

                  {/* Rodapé do Card com Ações (RESETAR e SAIR - igual ao Screenshot) */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <button
                      onClick={() => handleRestart(instance.instance_name)}
                      className="text-amber-400 hover:text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>RESETAR</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedInstanceForWebhook(instance);
                        setWebhookInput(instance.webhook_url || '');
                      }}
                      className="text-slate-400 hover:text-emerald-400 font-semibold text-xs flex items-center gap-1 transition-colors"
                      title="Configurar Webhook"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Webhook</span>
                    </button>

                    {isConnected && (
                      <button
                        onClick={() => handleLogout(instance.instance_name)}
                        className="text-red-400 hover:text-red-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>SAIR</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Conectar WhatsApp (QR Code Real + Pairing Code) */}
      {selectedInstanceForQr && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#161c2d] border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-center relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                Conectar: {selectedInstanceForQr.name}
              </h3>
              <button
                onClick={() => setSelectedInstanceForQr(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Alternador de Método */}
            <div className="flex bg-[#0e131f] p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setConnectionMethod('qr')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  connectionMethod === 'qr'
                    ? 'bg-slate-800 text-slate-100 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Escanear QR Code
              </button>
              <button
                onClick={() => setConnectionMethod('pairing')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  connectionMethod === 'pairing'
                    ? 'bg-slate-800 text-slate-100 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Código por Número
              </button>
            </div>

            {/* QR Code */}
            {connectionMethod === 'qr' && (
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-2xl inline-block shadow-inner relative min-w-[240px] min-h-[240px] flex items-center justify-center mx-auto">
                  {loadingQr ? (
                    <div className="flex flex-col items-center justify-center gap-3 p-8 text-slate-800">
                      <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                      <span className="text-xs font-semibold">Gerando QR Code oficial...</span>
                    </div>
                  ) : currentQr ? (
                    <img
                      src={currentQr.startsWith('data:') ? currentQr : `data:image/png;base64,${currentQr}`}
                      alt="QR Code Oficial WhatsApp"
                      className="w-56 h-56 mx-auto object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 p-8 text-slate-800">
                      <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                      <span className="text-xs font-semibold">Conectando à Evolution API...</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Atualizando em <strong>{qrCountdown}s</strong></span>
                  <button
                    onClick={handleManualRefresh}
                    disabled={loadingQr}
                    className="p-1 hover:text-slate-200 text-slate-400"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingQr ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            )}

            {/* Pairing Code */}
            {connectionMethod === 'pairing' && (
              <div className="space-y-4">
                <div className="text-left space-y-2">
                  <label className="text-xs font-semibold text-slate-200">
                    Número com DDD (ex: 559491081351):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="55..."
                      value={pairingNumber}
                      onChange={(e) => setPairingNumber(e.target.value)}
                      className="flex-1 bg-[#0e131f] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 font-mono"
                    />
                    <button
                      onClick={handleGeneratePairingCode}
                      disabled={loadingQr || !pairingNumber.trim()}
                      className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs disabled:opacity-50"
                    >
                      {loadingQr ? 'Gerando...' : 'Obter Código'}
                    </button>
                  </div>
                </div>

                {pairingCode && (
                  <div className="p-4 bg-[#0e131f] rounded-2xl border border-emerald-500/30 space-y-2 text-center">
                    <span className="text-xs text-slate-400 font-medium">Seu Código de Pareamento:</span>
                    <div className="text-3xl font-mono font-bold tracking-widest text-emerald-400 select-all">
                      {pairingCode}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      No WhatsApp, toque em <em>Conectar com número de telefone</em> e digite este código.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Webhook */}
      {selectedInstanceForWebhook && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveWebhookModal}
            className="bg-[#161c2d] border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-400" />
                Webhook: {selectedInstanceForWebhook.name}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedInstanceForWebhook(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Cole a URL do seu webhook no n8n, Typebot ou Make para receber as mensagens desta instância em tempo real.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                URL do Webhook:
              </label>
              <input
                type="url"
                placeholder="https://meun8n.com/webhook/whatsapp"
                value={webhookInput}
                onChange={(e) => setWebhookInput(e.target.value)}
                className="w-full bg-[#0e131f] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedInstanceForWebhook(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSavingWebhook}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md"
              >
                {isSavingWebhook ? 'Salvando...' : 'Salvar Webhook'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Criar Nova Instância */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="bg-[#161c2d] border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <h3 className="font-bold text-slate-100 text-base">Criar Nova Instância</h3>
            <p className="text-xs text-slate-400">
              Dê um nome para identificar este número (ex: nsmusic, Comercial, Atendimento).
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Nome da Instância
              </label>
              <input
                type="text"
                placeholder="Ex: nsmusic"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                className="w-full bg-[#0e131f] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                autoFocus
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-5 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-slate-950 font-bold text-xs shadow-md disabled:opacity-50"
              >
                {isCreating ? 'Criando na VPS...' : 'Criar Instância'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Renovação / Pagamento com PIX */}
      {selectedInstanceForCheckout && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => {
            setIsCheckoutOpen(false);
            setSelectedInstanceForCheckout(null);
          }}
          instance={selectedInstanceForCheckout}
          selectedPlan="1_instancia"
        />
      )}
    </div>
  );
};
