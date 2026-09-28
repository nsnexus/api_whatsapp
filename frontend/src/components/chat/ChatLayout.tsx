import React, { useState, useEffect } from 'react';
import { Chat, Message, QuickReply, Queue, Instance } from '../../types';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import { MessageSquareDashed, Smartphone, Users, CheckCircle2, Bot } from 'lucide-react';

interface ChatLayoutProps {
  chats: Chat[];
  messages: Record<string, Message[]>;
  quickReplies: QuickReply[];
  queues: Queue[];
  instances?: Instance[];
  onNavigateTab?: (tab: any) => void;
  onSendMessage: (chatId: string, text: string, isInternalNote: boolean) => void;
  onSendAudio: (chatId: string, base64Audio: string, durationSeconds: number) => void;
  onSendMedia: (chatId: string, file: File, caption: string) => void;
  onResolveChat: (chatId: string) => void;
  onOpenChat?: (chatId: string) => void;
  onImportHistory?: () => void;
  isImporting?: boolean;
  onToggleAi?: (chatId: string, disabled: boolean) => void;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({
  chats,
  messages,
  quickReplies,
  queues,
  instances = [],
  onNavigateTab,
  onSendMessage,
  onSendAudio,
  onSendMedia,
  onResolveChat,
  onOpenChat,
  onImportHistory,
  isImporting,
  onToggleAi,
}) => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(chats[0]?.id || null);

  // Auto-selecionar a primeira conversa quando a lista carregar
  useEffect(() => {
    if (!selectedChatId && chats.length > 0) {
      setSelectedChatId(chats[0].id);
    }
  }, [chats, selectedChatId]);

  // Carrega o histórico da conversa sob demanda ao abrir
  useEffect(() => {
    if (selectedChatId) onOpenChat?.(selectedChatId);
  }, [selectedChatId]);

  const selectedChat = chats.find((c) => c.id === selectedChatId) || null;
  const isMessagesLoading = selectedChatId ? messages[selectedChatId] === undefined : false;
  const currentMessages = selectedChatId ? messages[selectedChatId] || [] : [];

  const connectedInstance = instances.find((i) => i.status === 'connected') || instances[0];
  const isConnected = connectedInstance?.status === 'connected';

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      <ChatSidebar
        chats={chats}
        selectedChatId={selectedChatId}
        onSelectChat={setSelectedChatId}
        queues={queues}
        instances={instances}
        onNavigateTab={onNavigateTab}
        onImportHistory={onImportHistory}
        isImporting={isImporting}
      />

      {selectedChat ? (
        <ChatWindow
          chat={selectedChat}
          messages={currentMessages}
          isLoadingMessages={isMessagesLoading}
          quickReplies={quickReplies}
          onSendMessage={(text, isInternalNote) => onSendMessage(selectedChat.id, text, isInternalNote)}
          onSendAudio={(base64, duration) => onSendAudio(selectedChat.id, base64, duration)}
          onSendMedia={(file, caption) => onSendMedia(selectedChat.id, file, caption)}
          onResolveChat={onResolveChat}
          onToggleAi={onToggleAi}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950 text-slate-500">
          <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-5 text-emerald-400 shadow-xl shadow-emerald-500/5">
            <MessageSquareDashed className="w-10 h-10" />
          </div>

          <h3 className="text-lg font-bold text-slate-200 mb-1.5">
            {isConnected ? 'WhatsApp Conectado & Operante' : 'Nenhuma conversa selecionada'}
          </h3>

          <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-6">
            {isConnected ? (
              <>
                Seu número <span className="text-emerald-400 font-mono font-semibold">+{connectedInstance.phone_number || 'WhatsApp'}</span> está conectado à instância <span className="text-slate-200 font-semibold">{connectedInstance.name}</span>. Selecione uma conversa na barra lateral ou inicie um atendimento a partir dos seus contatos.
              </>
            ) : (
              'Para visualizar as conversas e responder aos clientes em tempo real, conecte sua conta do WhatsApp escaneando o QR Code na aba Nexus API.'
            )}
          </p>

          <div className="flex items-center gap-3">
            {onNavigateTab && (
              <>
                <button
                  onClick={() => onNavigateTab('instances')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>{isConnected ? 'Gerenciar Conexão WhatsApp' : 'Conectar WhatsApp (QR Code)'}</span>
                </button>

                <button
                  onClick={() => onNavigateTab('bots')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-semibold text-xs hover:bg-slate-700 transition-all border border-slate-700"
                >
                  <Bot className="w-4 h-4 text-emerald-400" />
                  <span>Configurar Bots & Cursos IA</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
