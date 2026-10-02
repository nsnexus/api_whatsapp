import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Terminal, Check } from 'lucide-react';

interface NexusHeroProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenDocs: () => void;
}

const SNIPPETS: Record<string, string> = {
  curl: `<span class="text-slate-500"># Envie uma mensagem em 1 requisição</span>
<span class="text-cyan-400 font-semibold">curl</span> -X POST https://api.nexusapi.com.br/v2/message \\
  -H <span class="text-emerald-400">"Authorization: Bearer nx_live_sec_987654321"</span> \\
  -d <span class="text-emerald-300">'{
    "to": "5594999991234",
    "type": "text",
    "body": "Olá! Seu pedido saiu para entrega 🚀"
  }'</span>`,

  node: `<span class="text-cyan-400 font-semibold">const</span> res = <span class="text-cyan-400 font-semibold">await</span> fetch(<span class="text-emerald-400">"https://api.nexusapi.com.br/v2/message"</span>, {
  method: <span class="text-emerald-400">"POST"</span>,
  headers: { Authorization: <span class="text-emerald-400">"Bearer nx_live_sec_987654321"</span> },
  body: JSON.stringify({
    to: <span class="text-emerald-300">"5594999991234"</span>,
    type: <span class="text-emerald-300">"audio_ptt"</span>,
    url: <span class="text-emerald-300">"https://storage.nexus.com/voz.ogg"</span>
  })
});`,

  python: `<span class="text-cyan-400 font-semibold">import</span> requests

requests.post(
  <span class="text-emerald-400">"https://api.nexusapi.com.br/v2/message"</span>,
  headers={<span class="text-emerald-400">"Authorization"</span>: <span class="text-emerald-400">"Bearer nx_live_sec_987654321"</span>},
  json={
    <span class="text-emerald-300">"to"</span>: <span class="text-emerald-300">"5594999991234"</span>,
    <span class="text-emerald-300">"type"</span>: <span class="text-emerald-300">"document"</span>,
    <span class="text-emerald-300">"url"</span>: <span class="text-emerald-300">"https://nexus.com/fatura.pdf"</span>
  }
)`
};

export const NexusHero: React.FC<NexusHeroProps> = ({ onOpenAuth, onOpenDocs }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLPreElement>(null);
  const respRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Estado para efeito de digitação da palavra no título
  const [typedWord, setTypedWord] = useState('');
  const [activeTab, setActiveTab] = useState<'curl' | 'node' | 'python'>('curl');

  // 1. Digita a palavra fixa uma única vez e para com o cursor piscando
  useEffect(() => {
    const target = 'estável';
    let charIndex = 0;
    let interval: ReturnType<typeof setInterval>;

    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        charIndex++;
        setTypedWord(target.slice(0, charIndex));
        if (charIndex >= target.length) {
          clearInterval(interval);
        }
      }, 120);
    }, 200);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);


  // 2. Animação de digitação do código nas abas (cURL, Node, Python)
  useEffect(() => {
    if (!codeRef.current || !respRef.current) return;
    const html = SNIPPETS[activeTab];
    let i = 0;
    respRef.current.style.opacity = '0';
    respRef.current.style.transform = 'translateY(8px)';

    const timer = setInterval(() => {
      if (html[i] === '<') {
        i = html.indexOf('>', i) + 1;
      } else {
        i++;
      }
      if (codeRef.current) {
        codeRef.current.innerHTML = html.slice(0, i);
      }
      if (i >= html.length) {
        clearInterval(timer);
        if (respRef.current) {
          respRef.current.style.opacity = '1';
          respRef.current.style.transform = 'translateY(0)';
        }
      }
    }, 12);

    return () => clearInterval(timer);
  }, [activeTab]);

  // 3. Rede de partículas no Canvas com atração suave e pulso de clique
  useEffect(() => {
    const cv = canvasRef.current;
    const hero = heroRef.current;
    if (!cv || !hero) return;

    const ctx = cv.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let W = hero.clientWidth;
    let H = hero.clientHeight;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
    }

    interface Pulse {
      x: number;
      y: number;
      r: number;
      a: number;
    }

    let nodes: Node[] = [];
    let pulses: Pulse[] = [];
    const mouse = { x: -9999, y: -9999, active: false };

    const resize = () => {
      if (!hero || !cv) return;
      W = hero.clientWidth;
      H = hero.clientHeight;
      cv.width = W * DPR;
      cv.height = H * DPR;
      cv.style.width = `${W}px`;
      cv.style.height = `${H}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      const qtd = Math.min(100, Math.floor((W * H) / 13000));
      nodes = Array.from({ length: qtd }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.6,
      }));
    };

    resize();
    window.addEventListener('resize', resize);

    const handlePointerMove = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.active = true;
      hero.style.setProperty('--mx', `${mouse.x}px`);
      hero.style.setProperty('--my', `${mouse.y}px`);
    };

    const handlePointerLeave = () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };

    const handleClick = (e: MouseEvent) => {
      const r = hero.getBoundingClientRect();
      pulses.push({
        x: e.clientX - r.left,
        y: e.clientY - r.top,
        r: 0,
        a: 0.9,
      });
    };

    hero.addEventListener('pointermove', handlePointerMove);
    hero.addEventListener('pointerleave', handlePointerLeave);
    hero.addEventListener('click', handleClick);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Movimentação dos nós
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;

        // Atração magnética suave ao cursor
        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y;
        const d = Math.hypot(dx, dy);
        if (d < 180) {
          n.x += dx * 0.006;
          n.y += dy * 0.006;
        }

        // Empurrão de onda do pulso
        for (const p of pulses) {
          const pd = Math.hypot(n.x - p.x, n.y - p.y);
          if (Math.abs(pd - p.r) < 14) {
            n.x += ((n.x - p.x) / pd) * 2.5;
            n.y += ((n.y - p.y) / pd) * 2.5;
          }
        }
      }

      // Linhas de conexão entre os nós
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 110) {
            ctx.strokeStyle = `rgba(34, 211, 238, ${(1 - dist / 110) * 0.14})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }

        // Conexão com o cursor do mouse
        const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (dm < 170) {
          ctx.strokeStyle = `rgba(16, 229, 160, ${(1 - dm / 170) * 0.55})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }

        ctx.fillStyle = dm < 170 ? '#10e5a0' : 'rgba(138, 160, 171, 0.45)';
        ctx.beginPath();
        ctx.arc(a.x, a.y, dm < 170 ? a.r + 1.2 : a.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Pulsos expansivos do clique
      pulses = pulses.filter((p) => p.a > 0.01);
      for (const p of pulses) {
        p.r += 5;
        p.a -= 0.018;
        ctx.strokeStyle = `rgba(16, 229, 160, ${p.a})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.stroke();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      hero.removeEventListener('pointermove', handlePointerMove);
      hero.removeEventListener('pointerleave', handlePointerLeave);
      hero.removeEventListener('click', handleClick);
      cancelAnimationFrame(animId);
    };
  }, []);

  // 4. Tilt 3D no Card e Parallax nos Chips Flutuantes
  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!stageRef.current || !cardRef.current) return;
    const r = stageRef.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;

    cardRef.current.style.transform = `rotateY(${px * 14}deg) rotateX(${-py * 14}deg)`;
    cardRef.current.style.setProperty('--cx', `${(px + 0.5) * 100}%`);
    cardRef.current.style.setProperty('--cy', `${(py + 0.5) * 100}%`);

    chipsRef.current.forEach((chip) => {
      if (!chip) return;
      const depth = Number(chip.getAttribute('data-depth')) || 25;
      chip.style.transform = `translate(${-px * depth}px, ${-py * depth}px)`;
    });
  };

  const handleStagePointerLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'rotateY(0deg) rotateX(0deg)';
    }
    chipsRef.current.forEach((chip) => {
      if (chip) chip.style.transform = 'translate(0px, 0px)';
    });
  };

  return (
    <section
      ref={heroRef}
      id="hero"
      aria-labelledby="hero-title"
      className="relative min-h-[92vh] flex items-center overflow-hidden isolation-isolate pt-8 pb-16 md:py-20 select-none"
      style={{
        '--mx': '50%',
        '--my': '50%',
      } as React.CSSProperties}
    >
      {/* 1. Canvas interativo de partículas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-[-3]"
      />

      {/* 2. Spotlight que segue o cursor */}
      <div
        className="absolute inset-0 pointer-events-none z-[-2] transition-opacity duration-300"
        style={{
          background:
            'radial-gradient(650px circle at var(--mx) var(--my), rgba(16, 229, 160, 0.12), rgba(34, 211, 238, 0.05) 35%, transparent 65%)',
        }}
      />

      {/* 3. Grade técnica revelada dinamicamente pelo mouse */}
      <div
        className="absolute inset-0 pointer-events-none z-[-1] opacity-70"
        style={{
          backgroundImage:
            'linear-gradient(#16252e 1px, transparent 1px), linear-gradient(90deg, #16252e 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          WebkitMaskImage:
            'radial-gradient(420px circle at var(--mx) var(--my), #000 0%, transparent 70%)',
          maskImage:
            'radial-gradient(420px circle at var(--mx) var(--my), #000 0%, transparent 70%)',
        }}
      />

      <div className="w-[min(1240px,92%)] mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-14 items-center">
        {/* COLUNA ESQUERDA: TEXTO, HEADLINE & CTAS */}
        <div className="text-left space-y-6">
          {/* Badge de status */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#10e5a0] bg-[rgba(16,229,160,0.08)] border border-[rgba(16,229,160,0.25)] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#10e5a0] shadow-[0_0_12px_#10e5a0] animate-pulse" />
            <span>API REST v2.0 • Clusters dedicados online</span>
          </div>

          {/* Headline Principal */}
          <h1
            id="hero-title"
            className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08]"
          >
            A API de WhatsApp{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10e5a0] via-[#22d3ee] to-[#10e5a0] bg-[length:200%_auto] animate-shine">
              mais{' '}
              <span className="text-[#10e5a0]">{typedWord}</span>
              <span className="inline-block w-[3px] h-[0.85em] bg-[#10e5a0] ml-1.5 align-middle animate-cursor-blink shadow-[0_0_8px_#10e5a0]" />
            </span>
            <br />
            para suas automações.
          </h1>

          {/* Subheadline Explicativa */}
          <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
            Conecte qualquer sistema, CRM, <b className="text-white font-semibold">n8n</b> ou{' '}
            <b className="text-white font-semibold">Typebot</b> ao WhatsApp em minutos. Envie
            textos, áudios PTT gravados na hora, mídias e receba webhooks em tempo real.
          </p>

          {/* Botões de Ação (CTAs) */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => onOpenAuth('register')}
              className="relative inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl font-black text-sm text-[#03140e] bg-gradient-to-r from-[#10e5a0] to-[#22d3ee] hover:shadow-[0_16px_50px_-8px_rgba(16,229,160,0.8)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-[0_10px_35px_-10px_rgba(16,229,160,0.6)] cursor-pointer"
            >
              <span>Testar grátis por 3 dias</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenDocs}
              className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm text-slate-200 bg-white/[0.04] border border-[#1f2f38] hover:border-[#10e5a0] hover:text-white transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Terminal className="w-4 h-4 text-[#10e5a0]" />
              <span>Ver documentação</span>
            </button>
          </div>

          {/* Badges de Confiança */}
          <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#10e5a0] stroke-[3]" />
              QR Code em 10s
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#10e5a0] stroke-[3]" />
              Webhooks &lt; 150ms
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#10e5a0] stroke-[3]" />
              Compatível com n8n & Make
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#10e5a0] stroke-[3]" />
              Mensagens ilimitadas
            </span>
          </div>
        </div>

        {/* COLUNA DIREITA: CARD 3D INTERATIVO & CHIPS FLUTUANTES */}
        <div
          ref={stageRef}
          onPointerMove={handleStagePointerMove}
          onPointerLeave={handleStagePointerLeave}
          className="relative perspective-[1200px] w-full max-w-lg mx-auto lg:max-w-none pt-4 lg:pt-0"
        >
          {/* Card com Tilt 3D */}
          <div
            ref={cardRef}
            className="relative bg-gradient-to-b from-[#0d171d] to-[#081015] border border-[#1a2a33] rounded-3xl shadow-[0_40px_100px_-30px_rgba(0,0,0,0.95),0_0_0_1px_rgba(16,229,160,0.06)] transform-style-3d transition-transform duration-150 ease-out will-change-transform overflow-hidden"
            style={{
              '--cx': '50%',
              '--cy': '50%',
            } as React.CSSProperties}
          >
            {/* Brilho dinâmico interno do card */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                background:
                  'radial-gradient(400px circle at var(--cx) var(--cy), rgba(16, 229, 160, 0.12), transparent 60%)',
              }}
            />

            {/* Barra superior estilo MacOS */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#15232b] bg-[#0a1218]/80">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />

              <div className="ml-3 font-mono text-[11px] text-slate-400 truncate">
                api.nexusapi.com.br/v2/message
              </div>

              {/* Seletor de Linguagens */}
              <div className="ml-auto flex items-center gap-1 bg-[#060c10] p-1 rounded-lg border border-[#15232b]">
                {(['curl', 'node', 'python'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveTab(lang)}
                    className={`font-mono text-[10px] font-bold uppercase px-2.5 py-1 rounded transition-all cursor-pointer ${
                      activeTab === lang
                        ? 'bg-[#10e5a0] text-[#03140e] shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lang === 'curl' ? 'cURL' : lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Terminal com Código Animado */}
            <div className="p-5 font-mono text-xs leading-relaxed text-slate-300 min-h-[220px]">
              <pre
                ref={codeRef}
                className="whitespace-pre-wrap font-mono text-xs text-slate-200"
              />
            </div>

            {/* Resposta em Tempo Real Simulado */}
            <div
              ref={respRef}
              className="mx-5 mb-5 p-3 rounded-xl bg-[rgba(16,229,160,0.06)] border border-dashed border-[rgba(16,229,160,0.3)] font-mono text-xs text-[#10e5a0] flex items-center justify-between transition-all duration-400 shadow-inner"
            >
              <span className="flex items-center gap-1.5 font-semibold">
                ✓ 200 OK — message.sent
              </span>
              <span className="text-[11px] opacity-80 font-mono">142ms</span>
            </div>
          </div>

          {/* Chip Flutuante 1: Webhook */}
          <div
            ref={(el) => (chipsRef.current[0] = el)}
            data-depth="30"
            className="absolute -top-6 -right-2 sm:-right-4 z-10 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold bg-[#0a141a]/90 backdrop-blur-md border border-[#1f3039] shadow-[0_20px_40px_-15px_#000] transition-transform duration-200 ease-out will-change-transform pointer-events-none"
          >
            <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-[rgba(16,229,160,0.12)] text-[#10e5a0] font-bold">
              ⚡
            </div>
            <div>
              <div className="text-white text-[12px]">Webhook recebido</div>
              <small className="block text-[10px] text-slate-400 font-medium">
                latência de 0.14s
              </small>
            </div>
          </div>

          {/* Chip Flutuante 2: Mensagem Entregue */}
          <div
            ref={(el) => (chipsRef.current[1] = el)}
            data-depth="45"
            className="absolute bottom-16 -left-3 sm:-left-8 z-10 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold bg-[#0a141a]/90 backdrop-blur-md border border-[#1f3039] shadow-[0_20px_40px_-15px_#000] transition-transform duration-200 ease-out will-change-transform pointer-events-none"
          >
            <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-[rgba(16,229,160,0.12)] text-[#10e5a0] font-bold">
              ✓✓
            </div>
            <div>
              <div className="text-white text-[12px]">Mensagem entregue</div>
              <small className="block text-[10px] text-slate-400 font-medium">
                +55 94 9••••-1234
              </small>
            </div>
          </div>

          {/* Chip Flutuante 3: n8n Conectado */}
          <div
            ref={(el) => (chipsRef.current[2] = el)}
            data-depth="20"
            className="absolute -bottom-5 right-6 sm:right-10 z-10 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold bg-[#0a141a]/90 backdrop-blur-md border border-[#1f3039] shadow-[0_20px_40px_-15px_#000] transition-transform duration-200 ease-out will-change-transform pointer-events-none"
          >
            <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-[rgba(16,229,160,0.12)] text-[#10e5a0] font-bold">
              ∞
            </div>
            <div>
              <div className="text-white text-[12px]">n8n conectado</div>
              <small className="block text-[10px] text-slate-400 font-medium">
                workflow ativo 24/7
              </small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
