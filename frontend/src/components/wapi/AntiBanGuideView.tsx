import React from 'react';
import { ShieldAlert, Flame, CheckCircle, AlertTriangle, Clock, MessageSquare, Mic, Sparkles } from 'lucide-react';

export const AntiBanGuideView: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto">
      {/* Top Header */}
      <div className="h-16 px-8 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
            Guia Anti-Banimento WhatsApp &bull; Boas Práticas
          </h2>
          <p className="text-xs text-slate-400">
            Aprenda como aquecer chips e estruturar mensagens para evitar bloqueios no WhatsApp
          </p>
        </div>
      </div>

      <div className="p-8 max-w-5xl space-y-6">
        {/* Alerta Inicial Importante */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-300">
              O WhatsApp não bane por usar API, ele bane por comportamento de SPAM
            </h4>
            <p className="text-xs text-amber-200/80 leading-relaxed">
              O maior gatilho para banimento é a <strong>taxa de denúncias ("Denunciar como Spam")</strong>. Quando contatos desconhecidos clicam em "Denunciar", a inteligência artificial do WhatsApp analisa a conta e aplica o ban. Siga o protocolo abaixo para proteger seu número.
            </p>
          </div>
        </div>

        {/* Cronograma de Aquecimento (Warming Up) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <h3 className="text-base font-bold text-slate-100">
              Cronograma de Aquecimento de Chip (Maturação)
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Chips novos (comprados recentemente) possuem pontuação de reputação zero. Nunca inicie disparos em massa no primeiro dia.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Dias 1 a 3</span>
              <h5 className="text-sm font-bold text-slate-200">Construção de Perfil</h5>
              <ul className="text-[11px] text-slate-400 space-y-1">
                <li>• Coloque foto de perfil e status.</li>
                <li>• Entre em 2 ou 3 grupos de conhecidos.</li>
                <li>• Converse com 5 a 10 amigos com mensagens de ida e volta.</li>
              </ul>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Dias 4 a 7</span>
              <h5 className="text-sm font-bold text-slate-200">Primeiros Envios</h5>
              <ul className="text-[11px] text-slate-400 space-y-1">
                <li>• Envie até 25 mensagens por dia.</li>
                <li>• Mantenha intervalo de 15 a 30s.</li>
                <li>• Priorize pessoas que já te conhecem.</li>
              </ul>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Dias 8 a 14</span>
              <h5 className="text-sm font-bold text-slate-200">Escala Moderada</h5>
              <ul className="text-[11px] text-slate-400 space-y-1">
                <li>• Suba para 50 a 100 mensagens/dia.</li>
                <li>• Use Spintax e textos variados.</li>
                <li>• Responda todos que mandarem retorno.</li>
              </ul>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Dia 15 em diante</span>
              <h5 className="text-sm font-bold text-slate-200">Chip Maduro</h5>
              <ul className="text-[11px] text-slate-400 space-y-1">
                <li>• Capacidade para 200+ mensagens/dia.</li>
                <li>• Delay seguro de 1200ms a 3000ms.</li>
                <li>• Alta taxa de engajamento ativo.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 5 Regras de Ouro Técnicas */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            5 Técnicas Práticas Anti-Banimento
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1.5">
              <h5 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Mic className="w-4 h-4 text-emerald-400" />
                1. Envie Áudios Gravados PTT (Microfone Verde)
              </h5>
              <p className="text-xs text-slate-400">
                Pessoas quase nunca denunciam mensagens de voz gravadas na hora. Nossa API possui suporte nativo ao <code>sendWhatsAppAudio</code> com microfone verde.
              </p>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1.5">
              <h5 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                2. Use Spintax (Variação de Textos)
              </h5>
              <p className="text-xs text-slate-400">
                Nunca envie exatamente a mesma frase para 100 pessoas seguidas. Alterne saudações: <code>{`{Olá|Oi|Tudo bem}`}</code>, <code>{`{tudo certo|como vai}`}</code>.
              </p>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1.5">
              <h5 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                3. Intervalo Inteligente (Delays)
              </h5>
              <p className="text-xs text-slate-400">
                Configure um intervalo randômico de 2 a 8 segundos entre cada mensagem no seu n8n ou robô para simular digitação humana.
              </p>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1.5">
              <h5 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                4. Ofereça Opção de Sair (Opt-out)
              </h5>
              <p className="text-xs text-slate-400">
                Adicione no final: <em>"Caso não queira mais receber comunicados, responda 1."</em> Isso faz o usuário responder em vez de clicar no botão "Denunciar Spam"!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
