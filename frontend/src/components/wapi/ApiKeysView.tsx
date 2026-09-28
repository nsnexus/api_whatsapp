import React, { useState } from 'react';
import { Key, Plus, Copy, Check, Trash2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { Instance } from '../../types';

interface ApiKeysViewProps {
  instances: Instance[];
}

interface ApiKeyItem {
  id: string;
  description: string;
  key: string;
  createdAt: string;
}

export const ApiKeysView: React.FC<ApiKeysViewProps> = ({ instances }) => {
  const [keys, setKeys] = useState<ApiKeyItem[]>([
    {
      id: 'key_1',
      description: instances[0]?.name || 'Chave Padrão Nexus API',
      key: 'evol_go_sec_crm_987654321_token',
      createdAt: '24 Setembro 2026',
    },
  ]);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showKeyId, setShowKeyId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDescription, setNewDescription] = useState('');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDescription.trim()) return;

    const newKey: ApiKeyItem = {
      id: `key_${Date.now()}`,
      description: newDescription.trim(),
      key: `nexus_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`,
      createdAt: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date()),
    };

    setKeys((prev) => [newKey, ...prev]);
    setNewDescription('');
    setShowCreateModal(false);
  };

  const handleDeleteKey = (id: string) => {
    if (keys.length <= 1) {
      alert('Você precisa manter pelo menos uma chave de API ativa para suas integrações.');
      return;
    }
    if (!confirm('Deseja excluir esta chave de API?')) return;
    setKeys((prev) => prev.filter((k) => k.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto">
      {/* Top Header */}
      <div className="h-16 px-8 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            API Keys
          </h2>
          <p className="text-xs text-slate-400">
            Gere tokens de acesso seguros para integrar a sua conta com sistemas externos e desenvolvedores terceirizados.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Criar novo token</span>
        </button>
      </div>

      <div className="p-8 max-w-6xl">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4 w-12">#</th>
                <th className="p-4">Descrição</th>
                <th className="p-4">API key</th>
                <th className="p-4">Criação</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {keys.map((k, index) => {
                const isVisible = showKeyId === k.id;
                return (
                  <tr key={k.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono text-slate-500">{index + 1}</td>
                    <td className="p-4 font-semibold text-slate-100 flex items-center gap-2">
                      <Key className="w-4 h-4 text-emerald-400" />
                      <span>{k.description}</span>
                    </td>
                    <td className="p-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">
                          {isVisible ? k.key : '••••••••••••••••••••••••••••••••'}
                        </span>
                        <button
                          onClick={() => setShowKeyId(isVisible ? null : k.id)}
                          className="text-slate-500 hover:text-slate-300"
                        >
                          {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-slate-400">{k.createdAt}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleCopy(k.key, k.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1.5 text-xs transition-colors"
                        >
                          {copiedId === k.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === k.id ? 'Copiado!' : 'Copiar'}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteKey(k.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Excluir token"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar Novo Token */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateKey}
            className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
              <Key className="w-5 h-5 text-emerald-400" />
              Criar Novo Token de Acesso
            </h3>
            <p className="text-xs text-slate-400">
              Dê uma identificação para este token (ex: Integração n8n Produção, Typebot Suporte, ERP Financeiro).
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Descrição do Token:
              </label>
              <input
                type="text"
                placeholder="Ex: n8n Produção"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                autoFocus
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md"
              >
                Gerar Token
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
