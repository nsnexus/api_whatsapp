import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  RotateCcw, 
  Sparkles, 
  FileText, 
  CreditCard, 
  Check, 
  Copy, 
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { Course } from '../../types';
import { api } from '../../lib/api';

interface AiPlaygroundProps {
  courses: Course[];
  organizationId: string;
}

interface PlaygroundMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: Array<{ type: string; payload?: any }>;
  time: string;
}

export const AiPlayground: React.FC<AiPlaygroundProps> = ({ courses, organizationId }) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<PlaygroundMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Olá! Sou o seu assistente de vendas inteligente. Selecione um curso acima e envie uma mensagem simulando ser um cliente no WhatsApp para ver como respondo em tempo real!',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const currentCourse = courses.find((c) => c.id === selectedCourseId);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userMsg: PlaygroundMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      // Formata histórico recente para o simulador
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.simulateAiChat({
        organizationId,
        courseId: selectedCourseId || undefined,
        incomingText: text.trim(),
        customerName: 'Aluno Interessado',
        historyMessages: history,
      });

      const aiMsg: PlaygroundMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: res.replyText,
        actions: res.actions,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Erro no Simulador: ${err.message || 'Verifique se configurou sua chave OpenAI nas configurações da IA.'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `reset-${Date.now()}`,
        role: 'assistant',
        content: currentCourse
          ? `Conversa reiniciada! Agora estou no papel de consultor de vendas do curso: *${currentCourse.name}*. O que o cliente gostaria de saber?`
          : 'Conversa reiniciada em modo Recepção Geral!',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const quickPills = [
    'Olá! Como funciona o curso?',
    'Tem alguma amostra grátis para eu ver?',
    'Achei meio caro... Tem desconto?',
    'O que vou receber de bônus?',
    'Gostei muito! Quero comprar, como pago no PIX?',
  ];

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-180px)] flex flex-col bg-[#161c2d] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-fadeIn">
      {/* Header do Simulador */}
      <div className="px-6 py-4 border-b border-slate-800/90 bg-[#111726]/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Simulador de Vendas com IA (Playground)
            </h3>
            <p className="text-xs text-slate-400">
              Teste o fluxo de conversa, entrega de materiais e cobrança PIX antes de ativar no WhatsApp real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300">Curso em Teste:</span>
            <select
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                setMessages([
                  {
                    id: `switch-${Date.now()}`,
                    role: 'assistant',
                    content: `Curso alternado para: *${courses.find((c) => c.id === e.target.value)?.name || 'Geral'}*. Pode mandar uma mensagem para testar!`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ]);
              }}
              className="bg-[#111726] border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Recepção Geral (Sem curso fixo)</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (R$ {Number(c.price).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleResetChat}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Reiniciar Simulação"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Feed de Conversa estilo WhatsApp */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#0e131f]/60">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
              <div
                className={`max-w-[80%] rounded-2xl p-4 shadow-lg text-xs leading-relaxed ${
                  isUser
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-tr-none'
                    : 'bg-[#1b2337] border border-slate-800/80 text-slate-100 rounded-tl-none'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-bold text-emerald-400">
                    <Sparkles className="w-3 h-3" />
                    <span>Bot IA de Vendas</span>
                    {currentCourse && <span className="text-slate-500 font-normal">({currentCourse.name})</span>}
                  </div>
                )}

                <div className="whitespace-pre-wrap select-text font-normal">{msg.content}</div>

                {/* Badges de Ações Executadas */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-700/60 space-y-1.5">
                    {msg.actions.map((act, i) => (
                      <div
                        key={i}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center gap-2"
                      >
                        {act.type === 'send_media' && (
                          <>
                            <FileText className="w-3.5 h-3.5 text-blue-400" />
                            <span>
                              <b>Material Enviado:</b> {act.payload?.name || 'Amostra Grátis'}
                            </span>
                          </>
                        )}
                        {act.type === 'pix_generated' && (
                          <>
                            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                            <span>
                              <b>PIX Gerado:</b> Código Copia e Cola anexado à mensagem
                            </span>
                          </>
                        )}
                        {act.type === 'human_handover' && (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            <span>
                              <b>Transição Humana:</b> IA pausada para atendente humano assumir
                            </span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div
                  className={`text-[9px] mt-1.5 text-right ${isUser ? 'text-emerald-200/80' : 'text-slate-500'}`}
                >
                  {msg.time}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start animate-fadeIn">
            <div className="bg-[#1b2337] border border-slate-800 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-2 text-xs text-slate-400 shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>A IA está digitando...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pílulas de Teste Rápido */}
      <div className="px-6 py-2.5 border-t border-slate-800/80 bg-[#111726]/40 flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] font-bold uppercase text-slate-500 whitespace-nowrap">Testes Rápidos:</span>
        {quickPills.map((pill, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(pill)}
            disabled={loading}
            className="text-[11px] px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60 whitespace-nowrap disabled:opacity-50"
          >
            {pill}
          </button>
        ))}
      </div>

      {/* Input de Mensagem */}
      <div className="p-4 border-t border-slate-800 bg-[#111726]/80 flex gap-2">
        <input
          type="text"
          placeholder="Digite como se fosse um cliente interessado no WhatsApp..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={loading}
          className="flex-1 bg-[#161c2d] border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={loading || !inputText.trim()}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-300 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-1.5"
        >
          <Send className="w-4 h-4" />
          <span>Enviar</span>
        </button>
      </div>
    </div>
  );
};
