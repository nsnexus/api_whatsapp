import React, { useEffect, useRef, useState } from 'react';
import { 
  Send, 
  CheckCheck, 
  Pause, 
  Play, 
  RotateCcw, 
  FileText, 
  Sparkles, 
  CreditCard, 
  Copy, 
  Check, 
  Gift, 
  Mic, 
  Zap, 
  Bot, 
  ShieldCheck,
  PackageCheck
} from 'lucide-react';

interface DemoMessage {
  id: string;
  from: 'customer' | 'bot';
  text: string;
  media?: {
    type: 'pdf' | 'audio' | 'pix' | 'bonus';
    name?: string;
    sub?: string;
    code?: string;
  };
}

interface Frame {
  messages: DemoMessage[];
  typing: 'customer' | 'bot' | null;
  stageName: string;
  stageColor: string;
  caption: string;
  duration: number;
}

const FRAMES: Frame[] = [
  {
    messages: [],
    typing: 'customer',
    stageName: 'Aguardando Mensagem',
    stageColor: 'text-slate-400 border-slate-700 bg-slate-800/40',
    caption: '1. O lead chega pelo anúncio ou link da bio e manda mensagem no seu WhatsApp.',
    duration: 1500,
  },
  {
    messages: [
      {
        id: '1',
        from: 'customer',
        text: 'Olá! Gostaria de saber mais sobre o curso de Fórmulas Profissionais.',
      },
    ],
    typing: 'bot',
    stageName: 'Etapa 1: Voto de Confiança',
    stageColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    caption: '2. O Bot NexusAPI (GPT-5.6) responde em <1s com a oferta e a proposta de confiança.',
    duration: 2200,
  },
  {
    messages: [
      {
        id: '1',
        from: 'customer',
        text: 'Olá! Gostaria de saber mais sobre o curso de Fórmulas Profissionais.',
      },
      {
        id: '2',
        from: 'bot',
        text: 'Olá, Carlos! 😊 O curso ensina a produzir produtos de limpeza profissionais com alta margem de lucro. De R$ 149,99 hoje por apenas R$ 9,99.\n\nMas olha: eu confio tanto no conteúdo que vou te mandar tudo agora mesmo antes de pagar! Posso te enviar o material?',
        media: {
          type: 'audio',
          name: 'Áudio gravado da apresentação',
          sub: '0:22 • Microfone verde PTT',
        },
      },
    ],
    typing: 'customer',
    stageName: 'Etapa 1: Aguardando Aceite',
    stageColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    caption: '3. A barreira de desconfiança é quebrada. O cliente aceita receber o conteúdo.',
    duration: 2000,
  },
  {
    messages: [
      {
        id: '1',
        from: 'customer',
        text: 'Olá! Gostaria de saber mais sobre o curso de Fórmulas Profissionais.',
      },
      {
        id: '2',
        from: 'bot',
        text: 'Olá, Carlos! 😊 O curso ensina a produzir produtos de limpeza profissionais com alta margem de lucro. De R$ 149,99 hoje por apenas R$ 9,99.\n\nMas olha: eu confio tanto no conteúdo que vou te mandar tudo agora mesmo antes de pagar! Posso te enviar o material?',
        media: {
          type: 'audio',
          name: 'Áudio gravado da apresentação',
          sub: '0:22 • Microfone verde PTT',
        },
      },
      {
        id: '3',
        from: 'customer',
        text: 'Sim, pode mandar por favor!',
      },
    ],
    typing: 'bot',
    stageName: 'Etapa 2: Entrega de Material + PIX',
    stageColor: 'text-teal-400 border-teal-500/30 bg-teal-500/10',
    caption: '4. O robô dispara as apostilas, o PIX Copia e Cola avulso e a isca do Super Bônus.',
    duration: 2500,
  },
  {
    messages: [
      {
        id: '1',
        from: 'customer',
        text: 'Olá! Gostaria de saber mais sobre o curso de Fórmulas Profissionais.',
      },
      {
        id: '2',
        from: 'bot',
        text: 'Olá, Carlos! 😊 O curso ensina a produzir produtos de limpeza profissionais com alta margem de lucro. De R$ 149,99 hoje por apenas R$ 9,99.\n\nMas olha: eu confio tanto no conteúdo que vou te mandar tudo agora mesmo antes de pagar! Posso te enviar o material?',
        media: {
          type: 'audio',
          name: 'Áudio gravado da apresentação',
          sub: '0:22 • Microfone verde PTT',
        },
      },
      {
        id: '3',
        from: 'customer',
        text: 'Sim, pode mandar por favor!',
      },
      {
        id: '4',
        from: 'bot',
        text: 'Maravilha! Já estou liberando o material completo acima para você 🚀\n\nConforme combinamos, aqui estão os dados do PIX (R$ 9,99). Copie a chave abaixo:',
        media: {
          type: 'pdf',
          name: 'Apostila_Formulas_Profissionais_50L.pdf',
          sub: '14.2 MB • Acesso Completo',
        },
      },
      {
        id: '5',
        from: 'bot',
        text: '00020126580014br.gov.bcb.pix0136nexus-api-pagamentos...54049.995802BR',
        media: {
          type: 'pix',
          name: 'PIX Copia e Cola Oficial',
          code: '00020126580014br.gov.bcb.pix0136nexus-api-pagamentos...54049.995802BR',
        },
      },
    ],
    typing: 'customer',
    stageName: 'Etapa 2: Aguardando Pagamento',
    stageColor: 'text-teal-400 border-teal-500/30 bg-teal-500/10',
    caption: '5. O cliente copia o PIX num toque no celular, paga e envia a confirmação.',
    duration: 2500,
  },
  {
    messages: [
      {
        id: '1',
        from: 'customer',
        text: 'Olá! Gostaria de saber mais sobre o curso de Fórmulas Profissionais.',
      },
      {
        id: '2',
        from: 'bot',
        text: 'Olá, Carlos! 😊 O curso ensina a produzir produtos de limpeza profissionais com alta margem de lucro. De R$ 149,99 hoje por apenas R$ 9,99.\n\nMas olha: eu confio tanto no conteúdo que vou te mandar tudo agora mesmo antes de pagar! Posso te enviar o material?',
        media: {
          type: 'audio',
          name: 'Áudio gravado da apresentação',
          sub: '0:22 • Microfone verde PTT',
        },
      },
      {
        id: '3',
        from: 'customer',
        text: 'Sim, pode mandar por favor!',
      },
      {
        id: '4',
        from: 'bot',
        text: 'Maravilha! Já estou liberando o material completo acima para você 🚀\n\nConforme combinamos, aqui estão os dados do PIX (R$ 9,99). Copie a chave abaixo:',
        media: {
          type: 'pdf',
          name: 'Apostila_Formulas_Profissionais_50L.pdf',
          sub: '14.2 MB • Acesso Completo',
        },
      },
      {
        id: '5',
        from: 'bot',
        text: '00020126580014br.gov.bcb.pix0136nexus-api-pagamentos...54049.995802BR',
        media: {
          type: 'pix',
          name: 'PIX Copia e Cola Oficial',
          code: '00020126580014br.gov.bcb.pix0136nexus-api-pagamentos...54049.995802BR',
        },
      },
      {
        id: '6',
        from: 'customer',
        text: 'Pronto, acabei de fazer o PIX! Segue o comprovante 💳',
      },
      {
        id: '7',
        from: 'bot',
        text: 'Sensacional, Carlos! Pagamento confirmado com sucesso! Muito obrigado pela sua integridade! 👏🎉\n\nAqui está o seu SUPER BÔNUS EXCLUSIVO:',
        media: {
          type: 'bonus',
          name: 'Guia_Secreto_Fornecedores_70off.pdf',
          sub: 'Super Bônus Liberado • R$ 47,00 Grátis',
        },
      },
    ],
    typing: null,
    stageName: 'Etapa 3: Venda Concluída + Bônus Liberado',
    stageColor: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    caption: '6. Venda concluída 100% no automático, sem precisar de nenhum atendente humano.',
    duration: 4500,
  },
];

const CHAPTERS = [
  { label: '1. Voto de Confiança', frame: 1 },
  { label: '2. Entrega + PIX', frame: 3 },
  { label: '3. Pagamento & Bônus', frame: 5 },
];

export const HeroDemo: React.FC = () => {
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.2 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || !visible) return;
    const timer = setTimeout(() => {
      setFrameIndex((i) => (i + 1) % FRAMES.length);
    }, FRAMES[frameIndex].duration);
    return () => clearTimeout(timer);
  }, [frameIndex, playing, visible]);

  const frame = FRAMES[frameIndex];

  const handleCopy = (code?: string) => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div ref={rootRef} className="w-full max-w-4xl mx-auto">
      {/* Container Principal Estilo Device Frame com Glow */}
      <div className="relative rounded-3xl p-1 bg-gradient-to-b from-emerald-500/30 via-slate-800/40 to-slate-900/60 shadow-2xl shadow-emerald-950/50 backdrop-blur-xl">
        <div className="bg-[#0b0f19] rounded-[22px] border border-slate-800/80 overflow-hidden flex flex-col md:flex-row">
          
          {/* Lado Esquerdo: Chat ao vivo do WhatsApp */}
          <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-slate-800/80">
            {/* Header do WhatsApp Mockup */}
            <div className="px-4 py-3 bg-[#111726] border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md">
                    <Bot className="w-5 h-5 text-slate-950" />
                  </div>
                  <span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#111726] absolute bottom-0 right-0 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    NexusAPI Bot • Atendente IA
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">GPT-5.6</span>
                  </h4>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span>Online agora</span> • <span>Responde em 0.8s</span>
                  </p>
                </div>
              </div>

              {/* Status do Funil */}
              <div className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${frame.stageColor} transition-all`}>
                {frame.stageName}
              </div>
            </div>

            {/* Feed de Mensagens */}
            <div className="p-4 space-y-3.5 h-[420px] overflow-y-auto bg-[#080c14]/90 flex flex-col">
              {frame.messages.map((m) => {
                const isCustomer = m.from === 'customer';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'} animate-fadeIn`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-md ${
                        isCustomer
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-tr-none'
                          : 'bg-[#151c2e] border border-slate-800 text-slate-200 rounded-tl-none space-y-2'
                      }`}
                    >
                      <p className="whitespace-pre-wrap font-normal">{m.text}</p>

                      {/* Mídia Anexa */}
                      {m.media && (
                        <div className="pt-2 border-t border-slate-700/50">
                          {m.media.type === 'audio' && (
                            <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-700/80 flex items-center gap-2 text-[11px] text-emerald-300">
                              <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center flex-shrink-0">
                                <Mic className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-white truncate">{m.media.name}</p>
                                <p className="text-[9px] text-emerald-400">{m.media.sub}</p>
                              </div>
                            </div>
                          )}

                          {m.media.type === 'pdf' && (
                            <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-700/80 flex items-center gap-2 text-[11px] text-slate-200">
                              <FileText className="w-6 h-6 text-rose-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-white truncate">{m.media.name}</p>
                                <p className="text-[9px] text-slate-400">{m.media.sub}</p>
                              </div>
                              <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                                Entregue
                              </span>
                            </div>
                          )}

                          {m.media.type === 'pix' && (
                            <div className="p-2.5 rounded-xl bg-slate-900/95 border border-emerald-500/30 space-y-1.5">
                              <div className="flex items-center justify-between text-[10px] font-bold text-emerald-400">
                                <span className="flex items-center gap-1">
                                  <CreditCard className="w-3 h-3" /> PIX COPIA E COLA:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(m.media?.code)}
                                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"
                                >
                                  {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                                </button>
                              </div>
                              <p className="font-mono text-[9px] text-slate-400 truncate bg-black/50 p-1.5 rounded">
                                {m.media.code}
                              </p>
                            </div>
                          )}

                          {m.media.type === 'bonus' && (
                            <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/40 flex items-center gap-2 text-[11px] text-purple-200">
                              <Gift className="w-6 h-6 text-purple-400 flex-shrink-0 animate-bounce" />
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-white truncate">{m.media.name}</p>
                                <p className="text-[9px] text-purple-300 font-semibold">{m.media.sub}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400 mt-0.5">
                        <span>Agora</span>
                        <CheckCheck className="w-3 h-3 text-emerald-400" />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Indicador de Digitação */}
              {frame.typing && (
                <div className={`flex ${frame.typing === 'customer' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                  <div className="bg-[#151c2e] border border-slate-800 rounded-2xl p-2.5 px-4 text-xs text-slate-400 flex items-center gap-1.5 shadow">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>{frame.typing === 'bot' ? 'NexusAPI está digitando...' : 'Cliente está digitando...'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Barra Inferior com Legenda Explicativa da Etapa */}
            <div className="p-3 bg-[#111726] border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
              <span className="font-medium text-[11px] text-slate-300 truncate">
                {frame.caption}
              </span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setPlaying(!playing)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title={playing ? 'Pausar' : 'Play'}
                >
                  {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFrameIndex(0);
                    setPlaying(true);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Reiniciar"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Lado Direito: Métricas do Motor da NexusAPI */}
          <div className="w-full md:w-80 bg-[#0f1422] p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Zap className="w-4 h-4" />
                <span>MOTOR DE VENDAS NEXUSAPI</span>
              </div>

              {/* Seletor de Capítulos do Funil */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400">Pular para etapa:</span>
                <div className="grid grid-cols-1 gap-1.5">
                  {CHAPTERS.map((ch, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFrameIndex(ch.frame);
                        setPlaying(true);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between border ${
                        frameIndex >= ch.frame && (idx === CHAPTERS.length - 1 || frameIndex < CHAPTERS[idx + 1].frame)
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                          : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span>{ch.label}</span>
                      <span className="text-[10px] opacity-70">0{idx + 1}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cards de Métricas e Recursos */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Inteligência Artificial:</span>
                    <span className="font-bold text-white">GPT-5.6 Luna</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Latência Média:</span>
                    <span className="font-bold text-emerald-400">&lt; 850ms</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Conversão Estimada:</span>
                    <span className="font-bold text-teal-300">Até 4x Maior</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Voto de Confiança Automático
                  </p>
                  <p className="text-[10px] text-slate-400 leading-snug">
                    O robô detecta a confirmação do lead, envia os PDFs do curso na hora e dispara o PIX individual.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80">
              <a
                href="#planos"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-300 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-center"
              >
                <span>Ativar no Meu WhatsApp</span>
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
