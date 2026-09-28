import React, { useState } from 'react';
import { Search, Circle, MessageSquare, CheckCircle, Clock, Smartphone, Plus, MessageSquareDashed, RefreshCw, Bot } from 'lucide-react';
import { Chat, Queue, Instance } from '../../types';

interface ChatSidebarProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  queues: Queue[];
  instances?: Instance[];
  onNavigateTab?: (tab: any) => void;
  onImportHistory?: () => void;
  isImporting?: boolean;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chats,
  selectedChatId,
  onSelectChat,
  queues,
  instances = [],
  onNavigateTab,
  onImportHistory,
  isImporting,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);

  const connectedInstance = instances.find((i) => i.status === 'connected') || instances[0];
  const isConnected = connectedInstance?.status === 'connected';

  const filteredChats = chats.filter((chat) => {
    const contactName = chat.contact?.name || chat.contact?.phone || '';
    const matchesSearch =
      contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (chat.last_message_text || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || chat.status === statusFilter;
    const matchesQueue = !selectedQueueId || chat.queue_id === selectedQueueId;

    return matchesSearch && matchesStatus && matchesQueue;
  });

  return (
    <div className="w-80 md:w-96 bg-slate-900/90 border-r border-slate-800 flex flex-col h-full flex-shrink-0 select-none">
      {/* Topo do Sidebar */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            Conversas
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
              {chats.length} {chats.length === 1 ? 'chat' : 'chats'}
            </span>
            {onImportHistory && (
              <button
                onClick={onImportHistory}
                disabled={isImporting}
                title="Importar conversas e histórico do WhatsApp"
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${isImporting ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {isImporting && (
          <p className="text-[11px] text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Importando conversas do WhatsApp...
          </p>
        )}

        {/* Banner de Status de Conexão do WhatsApp */}
        {isConnected ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-emerald-300 truncate">
                  {connectedInstance.phone_number ? `+${connectedInstance.phone_number}` : connectedInstance.name}
                </p>
                <p className="text-[10px] text-slate-400">Instância: {connectedInstance.name} (Online)</p>
              </div>
            </div>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('instances')}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold underline flex-shrink-0 ml-2"
              >
                Gerenciar
              </button>
            )}
          </div>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
              <span className="text-[11px] text-amber-300 font-medium">WhatsApp Desconectado</span>
            </div>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('instances')}
                className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-[10px] hover:bg-emerald-400 transition-all shadow-sm"
              >
                Conectar QR
              </button>
            )}
          </div>
        )}

        {/* Campo de Pesquisa */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou mensagem..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filtros de Status */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-700 text-slate-100'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Todos ({chats.length})
          </button>
          <button
            onClick={() => setStatusFilter('open')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
              statusFilter === 'open'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3 h-3" />
            Abertos
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
              statusFilter === 'in_progress'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Circle className="w-3 h-3 fill-current" />
            Atendendo
          </button>
          <button
            onClick={() => setStatusFilter('resolved')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
              statusFilter === 'resolved'
                ? 'bg-slate-800 text-slate-300'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <CheckCircle className="w-3 h-3" />
            Resolvidos
          </button>
        </div>
      </div>

      {/* Lista de Conversas com Scroll */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
        {filteredChats.length === 0 ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400">
              <MessageSquareDashed className="w-6 h-6 text-slate-500" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-slate-300">
                {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ativa no momento'}
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                {searchTerm
                  ? 'Tente buscar com outro termo ou limpe o campo de busca.'
                  : isConnected
                  ? `Seu WhatsApp (${connectedInstance?.phone_number || connectedInstance?.name}) está pronto. Quando alguém enviar mensagem, ela aparecerá aqui em tempo real!`
                  : 'Conecte seu WhatsApp na aba Nexus API ➔ Instâncias para começar a receber mensagens.'}
              </p>
            </div>
            {onNavigateTab && (
              <div className="pt-2 flex flex-col gap-2">
                {!isConnected ? (
                  <button
                    onClick={() => onNavigateTab('instances')}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/20"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Conectar WhatsApp Agora</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigateTab('bots')}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all border border-slate-700"
                  >
                    <Bot className="w-4 h-4 text-emerald-400" />
                    <span>Configurar Cursos & Bots IA</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isSelected = chat.id === selectedChatId;
            const contact = chat.contact;
            const isChatConnected = chat.instance?.status === 'connected' || isConnected;

            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors duration-150 relative ${
                  isSelected
                    ? 'bg-slate-800/90 border-l-4 border-emerald-500'
                    : 'hover:bg-slate-800/40'
                }`}
              >
                {/* Foto / Avatar do Contato */}
                <div className="relative flex-shrink-0">
                  <img
                    src={
                      contact?.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(contact?.name || contact?.phone || 'Cliente')}&background=0D9488&color=fff`
                    }
                    alt={contact?.name || 'Cliente'}
                    className="w-11 h-11 rounded-full object-cover border border-slate-700"
                  />
                  {isChatConnected && (
                    <span
                      className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900"
                      title="WhatsApp Conectado"
                    />
                  )}
                </div>

                {/* Conteúdo do Card da Conversa */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-slate-100 truncate">
                      {contact?.name || contact?.phone || 'Contato WhatsApp'}
                    </span>
                    <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">
                      {chat.last_message_at
                        ? new Date(chat.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 truncate mb-1.5">
                    {chat.last_message_text || 'Conversa ativa no WhatsApp'}
                  </p>

                  {/* Tags e Badges */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 overflow-hidden">
                      {contact?.phone && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-400">
                          {contact.phone}
                        </span>
                      )}
                      {contact?.tags?.map((t) => (
                        <span
                          key={t.id}
                          className="text-[9px] px-1.5 py-0.5 rounded font-medium truncate"
                          style={{ backgroundColor: `${t.color}25`, color: t.color }}
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>

                    {chat.unread_count > 0 && (
                      <span className="ml-auto flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                        {chat.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
