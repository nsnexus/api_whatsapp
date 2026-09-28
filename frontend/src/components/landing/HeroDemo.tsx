import React, { useEffect, useRef, useState } from 'react';
import { Send, CheckCheck, Pause, Play, RotateCcw, FileText } from 'lucide-react';

type Sender = 'customer' | 'agent';
type Stage = 'novo' | 'atendendo' | 'proposta' | 'fechado';

interface DemoMessage {
  id: string;
  from: Sender;
  text: string;
  file?: string;
}

interface Frame {
  messages: DemoMessage[];
  stage: Stage | null;
  assigned: boolean;
  unread: number;
  typing: Sender | null;
  composer: string;
  value: number;
  caption: string;
  duration: number;
  contact?: string;
}

const MSG = {
  hello: { id: 'm1', from: 'customer', text: 'Oi! Vocês fazem bolo pra 30 pessoas? É pro aniversário da minha mãe no sábado' },
  menu: {
    id: 'm2',
    from: 'agent',
    text: 'Oi Mariana! Fazemos sim 😊 Pra 30 pessoas: bolo de 3kg, R$ 280. Sabores: chocolate belga, ninho com morango ou red velvet.',
  },
  choose: { id: 'm3', from: 'customer', text: 'Chocolate belga! Pode ser pra retirar sábado de manhã?' },
  pix: { id: 'm4', from: 'agent', text: 'Fechado! Fica pronto às 9h. Te mandei o PIX aqui embaixo, é só confirmar 🎂' },
  receipt: { id: 'm5', from: 'customer', text: 'Pronto, paguei!', file: 'comprovante_pix.pdf' },
} satisfies Record<string, DemoMessage>;

const base = { assigned: false, unread: 0, typing: null, composer: '', value: 0 } as const;

const FRAMES: Frame[] = [
  { ...base, messages: [], stage: null, caption: 'A cliente manda mensagem no WhatsApp da loja, como sempre fez.', duration: 1200 },
  { ...base, messages: [], stage: null, typing: 'customer', caption: 'A cliente manda mensagem no WhatsApp da loja, como sempre fez.', duration: 1600 },
  { ...base, messages: [MSG.hello], stage: 'novo', unread: 1, caption: 'A conversa cai na caixa de entrada da equipe e vira um lead no funil.', duration: 2400 },
  { ...base, messages: [MSG.hello], stage: 'atendendo', assigned: true, caption: 'A Júlia assume. Agora todo mundo sabe que essa conversa tem dona.', duration: 2200 },
  { ...base, messages: [MSG.hello], stage: 'atendendo', assigned: true, composer: '/cardapio', caption: 'Ela digita /cardapio e a resposta pronta aparece.', duration: 1600 },
  { ...base, messages: [MSG.hello], stage: 'atendendo', assigned: true, composer: MSG.menu.text, caption: 'Ela digita /cardapio e a resposta pronta aparece.', duration: 1400 },
  { ...base, messages: [MSG.hello, MSG.menu], stage: 'atendendo', assigned: true, caption: 'A resposta sai pelo mesmo número. A cliente nem percebe a diferença.', duration: 1800 },
  { ...base, messages: [MSG.hello, MSG.menu], stage: 'atendendo', assigned: true, typing: 'customer', caption: 'A resposta sai pelo mesmo número. A cliente nem percebe a diferença.', duration: 1400 },
  { ...base, messages: [MSG.hello, MSG.menu, MSG.choose], stage: 'atendendo', assigned: true, unread: 1, caption: 'A Mariana escolhe o sabor.', duration: 1800 },
  { ...base, messages: [MSG.hello, MSG.menu, MSG.choose, MSG.pix], stage: 'proposta', assigned: true, value: 280, caption: 'Proposta enviada: o card anda no funil com o valor da venda.', duration: 2600 },
  { ...base, messages: [MSG.hello, MSG.menu, MSG.choose, MSG.pix], stage: 'proposta', assigned: true, value: 280, typing: 'customer', caption: 'Proposta enviada: o card anda no funil com o valor da venda.', duration: 1400 },
  { ...base, messages: [MSG.hello, MSG.menu, MSG.choose, MSG.pix, MSG.receipt], stage: 'fechado', assigned: true, value: 280, caption: 'Comprovante recebido. Venda fechada, tudo registrado.', duration: 4200 },
];

const CHAPTERS = [
  { label: 'Chega', frame: 0 },
  { label: 'Distribui', frame: 3 },
  { label: 'Responde', frame: 4 },
  { label: 'Fecha', frame: 9 },
];

const STAGES: { id: Stage; label: string }[] = [
  { id: 'novo', label: 'Novos' },
  { id: 'atendendo', label: 'Atendendo' },
  { id: 'proposta', label: 'Proposta' },
  { id: 'fechado', label: 'Fechado' },
];

const STATIC_CARDS: Record<Stage, { name: string; value: number }[]> = {
  novo: [{ name: '(11) 97755-2210', value: 0 }],
  atendendo: [{ name: 'Seu Antônio', value: 96 }],
  proposta: [{ name: 'Buffet Alegria', value: 1450 }],
  fechado: [{ name: 'Carla B.', value: 180 }],
};

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const Avatar: React.FC<{ name: string; tone: string; size?: string }> = ({ name, tone, size = 'w-7 h-7 text-[11px]' }) => (
  <span className={`${size} ${tone} rounded-full flex items-center justify-center font-semibold flex-shrink-0`}>
    {name
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')}
  </span>
);

const TypingDots: React.FC = () => (
  <span className="inline-flex gap-1 items-center">
    {[0, 1, 2].map((i) => (
      <span key={i} className="w-1.5 h-1.5 rounded-full bg-ink-mute animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />
    ))}
  </span>
);

export const HeroDemo: React.FC = () => {
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [custom, setCustom] = useState<Frame | null>(null);
  const [draft, setDraft] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const customTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Pausa a animação quando a demo sai da tela
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.2 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || custom || !visible) return;
    const timer = setTimeout(() => setFrameIndex((i) => (i + 1) % FRAMES.length), FRAMES[frameIndex].duration);
    return () => clearTimeout(timer);
  }, [frameIndex, playing, custom, visible]);

  useEffect(() => () => customTimers.current.forEach(clearTimeout), []);

  const frame = custom || FRAMES[frameIndex];
  const activeChapter = custom ? -1 : CHAPTERS.reduce((acc, c, i) => (frameIndex >= c.frame ? i : acc), 0);

  const jumpTo = (chapter: number) => {
    customTimers.current.forEach(clearTimeout);
    setCustom(null);
    setFrameIndex(CHAPTERS[chapter].frame);
    setPlaying(true);
  };

  const restart = () => jumpTo(0);

  // O visitante escreve como se fosse cliente e vê a mensagem chegar no CRM
  const sendAsCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    customTimers.current.forEach(clearTimeout);
    const customerMsg: DemoMessage = { id: `u${Date.now()}`, from: 'customer', text };
    const reply: DemoMessage = {
      id: `r${Date.now()}`,
      from: 'agent',
      text: 'Oi! Aqui é a Júlia 👋 Viu como sua mensagem caiu direto na caixa da equipe? Crie sua conta e teste com o seu número de verdade.',
    };
    const start: Frame = {
      ...base,
      messages: [customerMsg],
      stage: 'novo',
      unread: 1,
      contact: 'Você (teste)',
      caption: 'Sua mensagem chegou na caixa de entrada da equipe.',
      duration: 0,
    };
    setCustom(start);
    customTimers.current = [
      setTimeout(() => setCustom({ ...start, stage: 'atendendo', assigned: true, unread: 0, caption: 'A Júlia assumiu a conversa.' }), 1300),
      setTimeout(
        () => setCustom({ ...start, stage: 'atendendo', assigned: true, unread: 0, composer: reply.text, caption: 'Ela está respondendo...' }),
        2300
      ),
      setTimeout(
        () => setCustom({ ...start, stage: 'atendendo', assigned: true, unread: 0, messages: [customerMsg, reply], caption: 'Resposta enviada pelo mesmo número.' }),
        3600
      ),
    ];
  };

  const contactName = frame.contact || 'Mariana Costa';
  const lastMessage = frame.messages[frame.messages.length - 1];
  const pipelineTotal =
    Object.values(STATIC_CARDS)
      .flat()
      .reduce((sum, c) => sum + c.value, 0) + (frame.stage && frame.stage !== 'fechado' ? frame.value : 0);

  return (
    <div ref={rootRef} className="relative">
      <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-5 items-end">
        {/* Celular da cliente */}
        <div className="hidden lg:block">
          <div className="rounded-[2.2rem] border-[9px] border-ink bg-[#EFE8DE] shadow-[0_30px_60px_-30px_rgba(22,20,15,0.45)] overflow-hidden h-[470px] flex flex-col">
            <div className="bg-[#0B5D3B] text-white px-3.5 pt-5 pb-2.5 flex items-center gap-2.5">
              <Avatar name="Doce Ateliê" tone="bg-[#F6D9C8] text-[#8A3B17]" size="w-8 h-8 text-xs" />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold leading-tight truncate">Doce Ateliê</p>
                <p className="text-[10px] text-white/70">{frame.typing === 'agent' ? 'digitando...' : 'online'}</p>
              </div>
            </div>

            <div className="flex-1 px-2.5 py-3 space-y-1.5 overflow-hidden flex flex-col justify-end">
              {frame.messages.map((m) => (
                <div key={m.id} className={`flex ${m.from === 'customer' ? 'justify-end' : 'justify-start'} animate-[fadeUp_.35s_ease-out]`}>
                  <div
                    className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-[12px] leading-snug shadow-sm ${
                      m.from === 'customer' ? 'bg-[#D9FDD3] text-ink rounded-tr-none' : 'bg-white text-ink rounded-tl-none'
                    }`}
                  >
                    {m.file && (
                      <span className="flex items-center gap-1.5 mb-1 p-1.5 rounded bg-black/5 text-[11px]">
                        <FileText className="w-3.5 h-3.5 text-ember" /> {m.file}
                      </span>
                    )}
                    {m.text}
                    {m.from === 'customer' && <CheckCheck className="inline w-3 h-3 ml-1 text-sky-500" />}
                  </div>
                </div>
              ))}
              {frame.typing === 'customer' && (
                <div className="flex justify-end">
                  <span className="bg-[#D9FDD3] rounded-lg px-2.5 py-2">
                    <TypingDots />
                  </span>
                </div>
              )}
            </div>

            <form onSubmit={sendAsCustomer} className="p-2 flex items-center gap-1.5 bg-[#EFE8DE]">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Escreva como cliente..."
                maxLength={140}
                className="flex-1 min-w-0 rounded-full bg-white px-3 py-2 text-[12px] text-ink placeholder:text-ink-mute focus:outline-none focus:ring-2 focus:ring-leaf/40"
              />
              <button type="submit" className="w-8 h-8 rounded-full bg-leaf text-white flex items-center justify-center flex-shrink-0" aria-label="Enviar">
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
          <p className="text-[12px] text-ink-soft mt-3 text-center">
            ↑ Experimente: mande uma mensagem
          </p>
        </div>

        {/* Painel do CRM */}
        <div className="rounded-2xl border border-paper-line bg-white shadow-[0_40px_80px_-40px_rgba(22,20,15,0.35)] overflow-hidden text-ink">
          <div className="flex items-center justify-between px-4 py-3 border-b border-paper-line bg-paper/60">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-leaf flex-shrink-0" />
              <p className="text-[13px] font-semibold truncate">Doce Ateliê · Caixa de entrada</p>
            </div>
            <div className="flex items-center -space-x-1.5">
              <Avatar name="Júlia" tone="bg-leaf-light text-leaf-dark ring-2 ring-white" />
              <Avatar name="Rafael" tone="bg-[#E3E0F5] text-[#3D3380] ring-2 ring-white" />
              <Avatar name="Bia" tone="bg-[#F6D9C8] text-[#8A3B17] ring-2 ring-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] xl:grid-cols-[200px_1fr_190px] h-[420px]">
            {/* Lista de conversas */}
            <div className="hidden md:block border-r border-paper-line overflow-hidden">
              {frame.stage && (
                <div className="px-3 py-3 border-b border-paper-line bg-leaf-light/50 animate-[fadeUp_.35s_ease-out]">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] font-semibold truncate">{contactName}</p>
                    {frame.unread > 0 ? (
                      <span className="text-[10px] font-bold bg-ember text-white rounded-full px-1.5 min-w-[18px] text-center">{frame.unread}</span>
                    ) : (
                      frame.assigned && <Avatar name="Júlia" tone="bg-leaf-light text-leaf-dark" size="w-5 h-5 text-[9px]" />
                    )}
                  </div>
                  <p className="text-[11px] text-ink-soft truncate mt-0.5">{lastMessage?.file ? '📎 ' + lastMessage.file : lastMessage?.text}</p>
                </div>
              )}
              {[
                { name: 'Seu Antônio', text: 'Vou querer 2 dúzias de brigadeiro', who: 'Rafael', tone: 'bg-[#E3E0F5] text-[#3D3380]' },
                { name: '(11) 97755-2210', text: 'Vocês entregam em Pinheiros?', who: '', tone: '' },
                { name: 'Buffet Alegria', text: 'Segue o orçamento revisado', who: 'Bia', tone: 'bg-[#F6D9C8] text-[#8A3B17]' },
                { name: 'Carla B.', text: 'Chegou certinho, obrigada!', who: 'Júlia', tone: 'bg-leaf-light text-leaf-dark' },
              ].map((c) => (
                <div key={c.name} className="px-3 py-3 border-b border-paper-line">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] font-medium truncate">{c.name}</p>
                    {c.who ? (
                      <Avatar name={c.who} tone={c.tone} size="w-5 h-5 text-[9px]" />
                    ) : (
                      <span className="text-[9px] uppercase tracking-wide text-ember font-semibold">sem dono</span>
                    )}
                  </div>
                  <p className="text-[11px] text-ink-mute truncate mt-0.5">{c.text}</p>
                </div>
              ))}
            </div>

            {/* Conversa aberta */}
            <div className="flex flex-col min-w-0 bg-[#FBFAF7]">
              <div className="px-4 py-2.5 border-b border-paper-line flex items-center justify-between gap-2 bg-white">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold truncate">{frame.stage ? contactName : 'Nenhuma conversa aberta'}</p>
                  <p className="text-[11px] text-ink-mute">{frame.stage ? '+55 11 98231-4410' : 'Aguardando mensagens'}</p>
                </div>
                {frame.stage &&
                  (frame.assigned ? (
                    <span className="text-[11px] px-2 py-1 rounded-md bg-leaf-light text-leaf-dark font-medium whitespace-nowrap">Com Júlia</span>
                  ) : (
                    <span className="text-[11px] px-2 py-1 rounded-md border border-ink text-ink font-medium whitespace-nowrap">Assumir</span>
                  ))}
              </div>

              <div className="flex-1 px-4 py-3 space-y-2 overflow-hidden flex flex-col justify-end">
                {!frame.stage && <p className="text-[12px] text-ink-mute text-center my-auto">As conversas do WhatsApp aparecem aqui.</p>}
                {frame.messages.map((m) => (
                  <div key={m.id} className={`flex ${m.from === 'agent' ? 'justify-end' : 'justify-start'} animate-[fadeUp_.35s_ease-out]`}>
                    <div className="max-w-[80%]">
                      {m.from === 'agent' && <p className="text-[10px] text-ink-mute text-right mb-0.5">Júlia</p>}
                      <div
                        className={`rounded-xl px-3 py-2 text-[12.5px] leading-snug ${
                          m.from === 'agent' ? 'bg-leaf text-white rounded-br-sm' : 'bg-white border border-paper-line rounded-bl-sm'
                        }`}
                      >
                        {m.file && (
                          <span className="flex items-center gap-1.5 mb-1 p-1.5 rounded bg-paper text-[11px] text-ink">
                            <FileText className="w-3.5 h-3.5 text-ember" /> {m.file}
                          </span>
                        )}
                        {m.text}
                      </div>
                    </div>
                  </div>
                ))}
                {frame.typing === 'customer' && frame.stage && (
                  <div className="flex justify-start">
                    <span className="bg-white border border-paper-line rounded-xl px-3 py-2.5">
                      <TypingDots />
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-paper-line bg-white relative">
                {frame.composer === '/cardapio' && (
                  <div className="absolute bottom-full left-3 right-3 mb-2 rounded-lg border border-paper-line bg-white shadow-lg text-[12px] overflow-hidden animate-[fadeUp_.25s_ease-out]">
                    {[
                      ['/cardapio', 'Tamanhos, sabores e preços'],
                      ['/pix', 'Chave PIX e instruções'],
                      ['/entrega', 'Taxas e bairros atendidos'],
                    ].map(([cmd, desc], i) => (
                      <div key={cmd} className={`px-3 py-2 flex gap-2 ${i === 0 ? 'bg-leaf-light/60' : ''}`}>
                        <span className="font-mono font-semibold text-leaf-dark">{cmd}</span>
                        <span className="text-ink-mute truncate">{desc}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="rounded-lg border border-paper-line px-3 py-2 text-[12px] min-h-[36px] flex items-center">
                  {frame.composer ? (
                    <span className={`${frame.composer.startsWith('/') ? 'font-mono text-leaf-dark' : 'text-ink'} line-clamp-2`}>{frame.composer}</span>
                  ) : (
                    <span className="text-ink-mute">Digite / para respostas rápidas</span>
                  )}
                </div>
              </div>
            </div>

            {/* Funil */}
            <div className="hidden xl:flex flex-col border-l border-paper-line p-3 gap-2.5 overflow-hidden">
              <div className="flex items-baseline justify-between">
                <p className="text-[11px] uppercase tracking-wider text-ink-mute font-semibold">Funil</p>
                <p className="text-[11px] text-ink-soft">
                  <span className="font-semibold text-ink">{brl(pipelineTotal)}</span> em aberto
                </p>
              </div>
              {STAGES.map((s) => (
                <div key={s.id} className="rounded-lg bg-paper/70 p-2">
                  <p className="text-[10px] uppercase tracking-wider text-ink-mute font-semibold mb-1.5">{s.label}</p>
                  <div className="space-y-1.5">
                    {frame.stage === s.id && (
                      <div className="rounded-md bg-white border-l-[3px] border-ember px-2 py-1.5 shadow-sm animate-[fadeUp_.35s_ease-out]">
                        <p className="text-[11px] font-semibold truncate">{contactName}</p>
                        <p className="text-[10px] text-ink-mute">{frame.value ? brl(frame.value) : 'Sem valor ainda'}</p>
                      </div>
                    )}
                    {STATIC_CARDS[s.id].map((c) => (
                      <div key={c.name} className="rounded-md bg-white px-2 py-1.5">
                        <p className="text-[11px] font-medium truncate">{c.name}</p>
                        <p className="text-[10px] text-ink-mute">{c.value ? brl(c.value) : 'Sem valor ainda'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Controles e legenda */}
      <div className="mt-5 flex flex-col md:flex-row md:items-center gap-4 lg:pl-[270px]">
        <div className="flex items-center gap-2">
          {CHAPTERS.map((c, i) => (
            <button
              key={c.label}
              onClick={() => jumpTo(i)}
              className={`group flex flex-col items-start gap-1.5 text-left`}
              aria-label={`Ir para: ${c.label}`}
            >
              <span className="w-14 sm:w-16 h-1 rounded-full bg-paper-line overflow-hidden">
                <span
                  className={`block h-full bg-ink transition-all duration-500 ${i <= activeChapter ? 'w-full' : 'w-0'}`}
                />
              </span>
              <span className={`text-[12px] font-medium ${i === activeChapter ? 'text-ink' : 'text-ink-mute group-hover:text-ink-soft'}`}>
                {i + 1}. {c.label}
              </span>
            </button>
          ))}
          <button
            onClick={() => (custom ? restart() : setPlaying((p) => !p))}
            className="ml-1 w-8 h-8 rounded-full border border-paper-line bg-white flex items-center justify-center text-ink hover:border-ink transition-colors"
            aria-label={custom ? 'Recomeçar demonstração' : playing ? 'Pausar' : 'Continuar'}
          >
            {custom ? <RotateCcw className="w-3.5 h-3.5" /> : playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-[14px] text-ink-soft md:border-l md:border-paper-line md:pl-4 min-h-[40px] flex items-center" aria-live="polite">
          {frame.caption}
        </p>
      </div>

      {/* No celular (sem o mockup do aparelho), campo para testar */}
      <form onSubmit={sendAsCustomer} className="lg:hidden mt-4 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Teste: escreva como se fosse cliente"
          maxLength={140}
          className="flex-1 min-w-0 rounded-lg border border-paper-line bg-white px-3 py-2.5 text-[14px] text-ink placeholder:text-ink-mute focus:outline-none focus:border-ink"
        />
        <button type="submit" className="px-4 py-2.5 rounded-lg bg-ink text-paper text-[14px] font-medium flex items-center gap-1.5">
          Enviar
        </button>
      </form>
    </div>
  );
};
