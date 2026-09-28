import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Mic, 
  Zap, 
  Lock, 
  CheckCircle, 
  Phone, 
  MoreVertical, 
  Smile,
  DollarSign,
  Tag as TagIcon,
  Bot
} from 'lucide-react';
import { Chat, Message, QuickReply } from '../../types';
import { MessageBubble } from './MessageBubble';
import { AudioRecorder } from './AudioRecorder';
import { QuickRepliesModal } from './QuickRepliesModal';
import { MediaAttachmentModal } from './MediaAttachmentModal';

interface ChatWindowProps {
  chat: Chat;
  messages: Message[];
  isLoadingMessages?: boolean;
  quickReplies: QuickReply[];
  onSendMessage: (text: string, isInternalNote: boolean) => void;
  onSendAudio: (base64Audio: string, durationSeconds: number) => void;
  onSendMedia: (file: File, caption: string) => void;
  onResolveChat: (chatId: string) => void;
  onToggleAi?: (chatId: string, disabled: boolean) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  chat,
  messages,
  isLoadingMessages = false,
  quickReplies,
  onSendMessage,
  onSendAudio,
  onSendMedia,
  onResolveChat,
  onToggleAi,
}) => {
  const [inputText, setInputText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText.trim(), isInternalNote);
    setInputText('');
    setIsInternalNote(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const contact = chat.contact;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden">
      {/* 1. TOPO DA CONVERSA */}
      <div className="h-16 px-4 md:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <img
              src={
                contact?.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(contact?.name || 'Cliente')}&background=0D9488&color=fff`
              }
              alt={contact?.name}
              className="w-10 h-10 rounded-full object-cover border border-slate-700"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-slate-100 truncate">
                {contact?.name || contact?.phone}
              </h3>
              {contact?.deal_value ? (
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  R$ {contact.deal_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              ) : null}
            </div>

            <p className="text-xs text-slate-400 flex items-center gap-2 truncate">
              <span>{contact?.phone}</span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">WhatsApp Online</span>
            </p>
          </div>
        </div>

        {/* Ações do Topo */}
        <div className="flex items-center gap-2">
          {/* Status e Controle do Bot de IA */}
          {onToggleAi && (
            <button
              onClick={() => onToggleAi(chat.id, !chat.ai_disabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                chat.ai_disabled
                  ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 border-slate-700'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}
              title={
                chat.ai_disabled
                  ? 'IA desativada neste chat. Clique para ativar respostas automáticas'
                  : 'IA respondendo automaticamente. Clique para pausar para atendimento humano'
              }
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {chat.ai_disabled ? 'Ativar IA' : 'IA Ativa'}
              </span>
              {!chat.ai_disabled && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          )}

          <button
            onClick={() => onResolveChat(chat.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors border border-slate-700"
            title="Finalizar e resolver conversa"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Resolver</span>
          </button>
        </div>
      </div>

      {/* 2. ÁREA DE MENSAGENS (COM SCROLL) */}
      <div 
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]"
      >
        {/* Aviso de Criptografia / WhatsApp */}
        <div className="flex justify-center my-2">
          <span className="text-[11px] text-slate-500 bg-slate-900/80 border border-slate-800/80 px-3 py-1 rounded-full text-center">
            🔒 Mensagens integradas via Evolution Go com segurança ponta-a-ponta
          </span>
        </div>

        {isLoadingMessages ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-emerald-400 animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Carregando mensagens do WhatsApp...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-xs space-y-1">
            <p className="text-slate-400 font-medium">Nenhuma mensagem recente nesta conversa.</p>
            <p className="text-[11px] text-slate-500">Envie uma mensagem abaixo para iniciar o atendimento.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. BARRA DE ENTRADA / DIGITAÇÃO */}
      <div className="p-3 md:p-4 bg-slate-900 border-t border-slate-800 flex-shrink-0">
        {isRecordingAudio ? (
          <AudioRecorder
            onSendAudio={(base64, duration) => {
              setIsRecordingAudio(false);
              onSendAudio(base64, duration);
            }}
            onCancel={() => setIsRecordingAudio(false)}
          />
        ) : (
          <div className="space-y-2">
            {/* Indicador de Nota Interna Ativa */}
            {isInternalNote && (
              <div className="flex items-center justify-between text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg">
                <span className="flex items-center gap-1.5 font-medium">
                  <Lock className="w-3.5 h-3.5" />
                  Modo Nota Interna ativado (o cliente NÃO receberá esta mensagem no WhatsApp)
                </span>
                <button
                  onClick={() => setIsInternalNote(false)}
                  className="text-amber-400 hover:underline font-bold"
                >
                  Cancelar
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              {/* Botão Respostas Rápidas */}
              <button
                type="button"
                onClick={() => setShowQuickReplies(true)}
                className="p-2.5 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                title="Respostas Rápidas (atalhos)"
              >
                <Zap className="w-5 h-5" />
              </button>

              {/* Botão de Anexo */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx,.xlsx"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Enviar imagem ou arquivo"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Botão Alternar Nota Interna */}
              <button
                type="button"
                onClick={() => setIsInternalNote(!isInternalNote)}
                className={`p-2.5 rounded-xl transition-colors ${
                  isInternalNote
                    ? 'text-amber-400 bg-amber-500/20'
                    : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
                }`}
                title="Adicionar Nota Interna"
              >
                <Lock className="w-5 h-5" />
              </button>

              {/* Campo de Digitação */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={
                    isInternalNote
                      ? 'Escreva uma anotação privada para a equipe...'
                      : 'Digite uma mensagem... (ou digite / para respostas rápidas)'
                  }
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    if (e.target.value === '/') setShowQuickReplies(true);
                  }}
                  onKeyDown={handleKeyDown}
                  className={`w-full rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none ${
                    isInternalNote
                      ? 'bg-amber-950/20 border border-amber-500/40 text-amber-100 placeholder-amber-400/50 focus:border-amber-400'
                      : 'bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-brand-500'
                  }`}
                />
              </div>

              {/* Botão de Gravação de Áudio ou Enviar Texto */}
              {inputText.trim() ? (
                <button
                  type="button"
                  onClick={() => handleSendText()}
                  className={`p-2.5 rounded-xl text-slate-950 font-bold transition-all shadow-md active:scale-95 ${
                    isInternalNote
                      ? 'bg-amber-400 hover:bg-amber-300'
                      : 'bg-emerald-500 hover:bg-emerald-400'
                  }`}
                  title="Enviar mensagem"
                >
                  <Send className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsRecordingAudio(true)}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 transition-colors"
                  title="Gravar áudio de voz"
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Respostas Rápidas */}
      {showQuickReplies && (
        <QuickRepliesModal
          quickReplies={quickReplies}
          onSelect={(content) => {
            setInputText((prev) => (prev.startsWith('/') ? content : `${prev} ${content}`.trim()));
            setShowQuickReplies(false);
          }}
          onClose={() => setShowQuickReplies(false)}
        />
      )}

      {/* Modal de Envio de Anexo */}
      {selectedFile && (
        <MediaAttachmentModal
          file={selectedFile}
          onSend={(file, caption) => {
            onSendMedia(file, caption);
            setSelectedFile(null);
          }}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
};
