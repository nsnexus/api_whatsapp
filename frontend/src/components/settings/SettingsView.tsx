import React, { useState } from 'react';
import { Queue, Tag, QuickReply, Profile } from '../../types';
import { 
  Settings, 
  Layers, 
  Tag as TagIcon, 
  Zap, 
  Users, 
  Plus, 
  Trash2,
  Building,
  Key
} from 'lucide-react';

interface SettingsViewProps {
  queues: Queue[];
  tags: Tag[];
  quickReplies: QuickReply[];
  onAddQueue: (name: string, color: string) => void;
  onAddTag: (name: string, color: string) => void;
  onAddQuickReply: (shortcut: string, title: string, content: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  queues,
  tags,
  quickReplies,
  onAddQueue,
  onAddTag,
  onAddQuickReply,
}) => {
  const [activeTab, setActiveTab] = useState<'queues' | 'tags' | 'quickReplies' | 'api'>('quickReplies');

  // Form states
  const [newQrShortcut, setNewQrShortcut] = useState('');
  const [newQrTitle, setNewQrTitle] = useState('');
  const [newQrContent, setNewQrContent] = useState('');

  const [newQueueName, setNewQueueName] = useState('');
  const [newTagName, setNewTagName] = useState('');

  const handleAddQuickReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQrShortcut || !newQrTitle || !newQrContent) return;
    onAddQuickReply(newQrShortcut, newQrTitle, newQrContent);
    setNewQrShortcut('');
    setNewQrTitle('');
    setNewQrContent('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto">
      {/* Topo */}
      <div className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-400" />
            Configurações da Empresa
          </h2>
          <p className="text-xs text-slate-400">
            Personalize filas, mensagens automáticas, etiquetas e integrações
          </p>
        </div>
      </div>

      <div className="p-6 max-w-5xl w-full mx-auto space-y-6">
        {/* Navegação das Abas de Configuração */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('quickReplies')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'quickReplies'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Zap className="w-4 h-4" />
            Respostas Rápidas
          </button>
          <button
            onClick={() => setActiveTab('queues')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'queues'
                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            Filas & Departamentos
          </button>
          <button
            onClick={() => setActiveTab('tags')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'tags'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <TagIcon className="w-4 h-4" />
            Etiquetas & Tags
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'api'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Key className="w-4 h-4" />
            API & Webhooks
          </button>
        </div>

        {/* ABA: Respostas Rápidas */}
        {activeTab === 'quickReplies' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista Existente */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-sm font-bold text-slate-200">Respostas Cadastradas</h3>
              {quickReplies.map((qr) => (
                <div
                  key={qr.id}
                  className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-100">{qr.title}</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-amber-500/30">
                      {qr.shortcut}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{qr.content}</p>
                </div>
              ))}
            </div>

            {/* Formulário Novo */}
            <form
              onSubmit={handleAddQuickReplySubmit}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5 h-fit shadow-lg"
            >
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Nova Resposta Rápida
              </h3>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Atalho (ex: /pix)</label>
                <input
                  type="text"
                  placeholder="/atalho"
                  value={newQrShortcut}
                  onChange={(e) => setNewQrShortcut(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Título</label>
                <input
                  type="text"
                  placeholder="Ex: Dados Bancários"
                  value={newQrTitle}
                  onChange={(e) => setNewQrTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Mensagem</label>
                <textarea
                  rows={3}
                  placeholder="Escreva a resposta pré-definida..."
                  value={newQrContent}
                  onChange={(e) => setNewQrContent(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
              >
                Salvar Resposta Rápida
              </button>
            </form>
          </div>
        )}

        {/* ABA: Filas & Departamentos */}
        {activeTab === 'queues' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {queues.map((q) => (
                <div key={q.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: q.color }} />
                    <span className="font-semibold text-xs text-slate-200">{q.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Ativo</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA: Tags */}
        {activeTab === 'tags' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {tags.map((t) => (
                <span
                  key={t.id}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                  style={{ backgroundColor: `${t.color}25`, color: t.color, borderColor: `${t.color}40`, borderWidth: '1px' }}
                >
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ABA: API & VPS Webhooks */}
        {activeTab === 'api' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Endpoints da sua Instância</h3>
            <div className="space-y-2 text-xs">
              <label className="text-slate-400">Webhook da Evolution Go (Configurar na VPS):</label>
              <div className="p-3 bg-slate-950 rounded-xl font-mono text-emerald-400 border border-slate-800 select-all">
                https://api.seucrm.com.br/webhook
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <label className="text-slate-400">URL do Motor Evolution Go (VPS):</label>
              <div className="p-3 bg-slate-950 rounded-xl font-mono text-sky-400 border border-slate-800 select-all">
                http://localhost:8080 (ou https://evolution.seucrm.com.br)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
