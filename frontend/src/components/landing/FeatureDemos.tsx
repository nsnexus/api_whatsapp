import React, { useState } from 'react';
import { ArrowRight, Lock } from 'lucide-react';

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

/* ---------------------------------------------------------------------------------------------
 * Caixa de entrada compartilhada: quem está atendendo o quê
 * ------------------------------------------------------------------------------------------- */
export const TeamInboxDemo: React.FC = () => {
  const [filter, setFilter] = useState<'todas' | 'vendas' | 'suporte'>('todas');
  const rows = [
    { name: 'Mariana Costa', text: 'Chocolate belga! Pode ser pra sábado?', queue: 'vendas', who: 'Júlia', wait: 'agora' },
    { name: 'Seu Antônio', text: 'Vou querer 2 dúzias de brigadeiro', queue: 'vendas', who: 'Rafael', wait: '3 min' },
    { name: '(11) 97755-2210', text: 'Vocês entregam em Pinheiros?', queue: 'vendas', who: '', wait: '6 min' },
    { name: 'Paula Reis', text: 'O pedido chegou com a caixa amassada', queue: 'suporte', who: 'Bia', wait: '12 min' },
    { name: 'Carla B.', text: 'Chegou certinho, obrigada!', queue: 'suporte', who: 'Júlia', wait: '1 h' },
  ].filter((r) => filter === 'todas' || r.queue === filter);

  return (
    <div className="rounded-2xl border border-paper-line bg-white overflow-hidden shadow-[0_30px_60px_-40px_rgba(22,20,15,0.35)]">
      <div className="flex items-center gap-1 p-2 border-b border-paper-line bg-paper/60">
        {(['todas', 'vendas', 'suporte'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-[13px] capitalize transition-colors ${
              filter === f ? 'bg-ink text-paper' : 'text-ink-soft hover:bg-paper-2'
            }`}
          >
            {f === 'todas' ? 'Todas as filas' : f}
          </button>
        ))}
      </div>
      <ul>
        {rows.map((r) => (
          <li key={r.name} className="flex items-center gap-3 px-4 py-3 border-b border-paper-line last:border-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-semibold text-ink truncate">{r.name}</p>
                <span className="text-[10px] uppercase tracking-wider text-ink-mute">{r.queue}</span>
              </div>
              <p className="text-[13px] text-ink-soft truncate">{r.text}</p>
            </div>
            <div className="text-right flex-shrink-0">
              {r.who ? (
                <p className="text-[12px] text-ink font-medium">{r.who}</p>
              ) : (
                <p className="text-[12px] text-ember font-semibold">Sem dono</p>
              )}
              <p className="text-[11px] text-ink-mute">{r.wait}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="px-4 py-3 bg-[#FFF6DB] border-t border-[#F0DFA8] flex items-start gap-2">
        <Lock className="w-3.5 h-3.5 text-[#8A6A12] mt-0.5 flex-shrink-0" />
        <p className="text-[12px] text-[#6B5210]">
          <span className="font-semibold">Nota interna da Bia:</span> cliente já reclamou antes, oferecer reenvio sem custo. (O cliente não vê isso.)
        </p>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------------------------------------
 * Funil Kanban: arraste (desktop) ou toque para avançar (celular)
 * ------------------------------------------------------------------------------------------- */
type Col = 'novo' | 'atendendo' | 'proposta' | 'fechado';
const COLS: { id: Col; label: string }[] = [
  { id: 'novo', label: 'Novos' },
  { id: 'atendendo', label: 'Atendendo' },
  { id: 'proposta', label: 'Proposta' },
  { id: 'fechado', label: 'Fechado' },
];

export const KanbanDemo: React.FC = () => {
  const [cards, setCards] = useState([
    { id: 1, name: 'Mariana Costa', value: 280, col: 'proposta' as Col },
    { id: 2, name: 'Seu Antônio', value: 96, col: 'atendendo' as Col },
    { id: 3, name: 'Buffet Alegria', value: 1450, col: 'proposta' as Col },
    { id: 4, name: '(11) 97755-2210', value: 150, col: 'novo' as Col },
    { id: 5, name: 'Carla B.', value: 180, col: 'fechado' as Col },
  ]);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<Col | null>(null);

  const move = (id: number, col: Col) => setCards((cs) => cs.map((c) => (c.id === id ? { ...c, col } : c)));
  const advance = (id: number) => {
    const card = cards.find((c) => c.id === id);
    if (!card) return;
    const idx = COLS.findIndex((c) => c.id === card.col);
    move(id, COLS[Math.min(idx + 1, COLS.length - 1)].id);
  };

  const open = cards.filter((c) => c.col !== 'fechado').reduce((s, c) => s + c.value, 0);
  const won = cards.filter((c) => c.col === 'fechado').reduce((s, c) => s + c.value, 0);

  return (
    <div className="rounded-2xl border border-paper-line bg-white p-4 shadow-[0_30px_60px_-40px_rgba(22,20,15,0.35)]">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <p className="text-[13px] text-ink-soft">
          Em negociação <span className="font-display text-xl font-bold text-ink ml-1">{brl(open)}</span>
        </p>
        <p className="text-[13px] text-ink-soft">
          Fechado no mês <span className="font-display text-xl font-bold text-leaf ml-1">{brl(won)}</span>
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {COLS.map((col) => {
          const colCards = cards.filter((c) => c.col === col.id);
          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                setOverCol(col.id);
              }}
              onDragLeave={() => setOverCol(null)}
              onDrop={() => {
                if (dragId !== null) move(dragId, col.id);
                setDragId(null);
                setOverCol(null);
              }}
              className={`rounded-lg p-2 min-h-[150px] transition-colors ${overCol === col.id ? 'bg-leaf-light' : 'bg-paper/70'}`}
            >
              <p className="text-[11px] uppercase tracking-wider text-ink-mute font-semibold mb-2 flex justify-between">
                {col.label} <span>{colCards.length}</span>
              </p>
              <div className="space-y-1.5">
                {colCards.map((c) => (
                  <button
                    key={c.id}
                    draggable
                    onDragStart={() => setDragId(c.id)}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => advance(c.id)}
                    title="Arraste ou clique para avançar"
                    className={`w-full text-left rounded-md bg-white border px-2 py-1.5 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md ${
                      col.id === 'fechado' ? 'border-leaf/40' : 'border-paper-line'
                    } ${dragId === c.id ? 'opacity-40' : ''}`}
                  >
                    <p className="text-[12px] font-semibold text-ink truncate">{c.name}</p>
                    <p className="text-[11px] text-ink-mute">{brl(c.value)}</p>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[12px] text-ink-mute mt-3">Arraste os cards entre as colunas (ou toque para avançar).</p>
    </div>
  );
};

/* ---------------------------------------------------------------------------------------------
 * Respostas rápidas: digite "/" no campo
 * ------------------------------------------------------------------------------------------- */
const QUICK_REPLIES = [
  { cmd: '/pix', text: 'Nossa chave PIX é o CNPJ 12.345.678/0001-90 (Doce Ateliê). Assim que pagar, me manda o comprovante por aqui 🙂' },
  { cmd: '/cardapio', text: 'Pra 30 pessoas: bolo de 3kg, R$ 280. Sabores: chocolate belga, ninho com morango ou red velvet.' },
  { cmd: '/entrega', text: 'Entregamos em toda a Zona Oeste. Taxa de R$ 12 até 5 km e R$ 20 acima disso.' },
  { cmd: '/horario', text: 'Funcionamos de terça a sábado, das 9h às 19h. Domingo só retirada até 12h.' },
];

export const QuickReplyDemo: React.FC = () => {
  const [value, setValue] = useState('/');
  const [sent, setSent] = useState<string[]>([]);
  const showMenu = value.startsWith('/') && !value.includes(' ');
  const matches = QUICK_REPLIES.filter((q) => q.cmd.startsWith(value.toLowerCase()));

  const pick = (text: string) => setValue(text);
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || showMenu) return;
    setSent((s) => [...s.slice(-2), value.trim()]);
    setValue('/');
  };

  return (
    <div className="rounded-2xl border border-paper-line bg-white overflow-hidden shadow-[0_30px_60px_-40px_rgba(22,20,15,0.35)]">
      <div className="p-4 bg-[#FBFAF7] min-h-[150px] flex flex-col justify-end gap-2">
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-xl rounded-bl-sm bg-white border border-paper-line px-3 py-2 text-[13px] text-ink">
            Oi! Qual a chave pix? E vocês entregam?
          </div>
        </div>
        {sent.map((s, i) => (
          <div key={i} className="flex justify-end animate-[fadeUp_.3s_ease-out]">
            <div className="max-w-[80%] rounded-xl rounded-br-sm bg-leaf text-white px-3 py-2 text-[13px]">{s}</div>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="relative border-t border-paper-line p-3">
        {showMenu && matches.length > 0 && (
          <div className="absolute bottom-full left-3 right-3 mb-2 rounded-lg border border-paper-line bg-white shadow-lg overflow-hidden">
            {matches.map((q) => (
              <button
                type="button"
                key={q.cmd}
                onClick={() => pick(q.text)}
                className="w-full text-left px-3 py-2 flex gap-3 hover:bg-leaf-light/60 text-[13px]"
              >
                <span className="font-mono font-semibold text-leaf-dark w-20 flex-shrink-0">{q.cmd}</span>
                <span className="text-ink-soft truncate">{q.text}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={`flex-1 min-w-0 rounded-lg border border-paper-line px-3 py-2 text-[14px] focus:outline-none focus:border-ink ${
              showMenu ? 'font-mono text-leaf-dark' : 'text-ink'
            }`}
            aria-label="Campo de mensagem com respostas rápidas"
          />
          <button type="submit" className="px-3 rounded-lg bg-ink text-paper disabled:opacity-40" disabled={showMenu || !value.trim()} aria-label="Enviar">
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

/* ---------------------------------------------------------------------------------------------
 * Conexão por QR Code (ilustração do passo 1)
 * ------------------------------------------------------------------------------------------- */
export const QrIllustration: React.FC = () => {
  // Padrão determinístico só para ilustrar um QR Code
  const cells = Array.from({ length: 121 }, (_, i) => {
    const x = i % 11;
    const y = Math.floor(i / 11);
    const finder = (x < 3 && y < 3) || (x > 7 && y < 3) || (x < 3 && y > 7);
    return finder || (x * 7 + y * 13 + x * y) % 3 === 0;
  });
  return (
    <div className="grid grid-cols-11 gap-[2px] w-24 h-24 p-1.5 bg-white rounded-md border border-paper-line">
      {cells.map((on, i) => (
        <span key={i} className={on ? 'bg-ink rounded-[1px]' : ''} />
      ))}
    </div>
  );
};
