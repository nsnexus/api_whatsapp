import React, { useState } from 'react';
import { 
  Workflow, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  Mic, 
  Video, 
  Image as ImageIcon, 
  CreditCard, 
  Gift, 
  ShieldCheck, 
  Copy, 
  Check, 
  Play,
  HelpCircle,
  Zap
} from 'lucide-react';
import { Course } from '../../types';

interface FunnelFlowViewProps {
  courses: Course[];
  onOpenSimulator: () => void;
}

export const FunnelFlowView: React.FC<FunnelFlowViewProps> = ({ courses, onOpenSimulator }) => {
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');
  const [copiedPix, setCopiedPix] = useState(false);

  const currentCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];
  const priceFormatted = currentCourse ? Number(currentCourse.price).toFixed(2) : '9.99';
  const originalPriceFormatted = currentCourse?.original_price ? Number(currentCourse.original_price).toFixed(2) : '149.99';

  const handleCopySamplePix = () => {
    navigator.clipboard.writeText('00020126580014br.gov.bcb.pix0136...52040000530398654049.995802BR5920...');
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header do Fluxograma */}
      <div className="p-6 bg-[#161c2d] border border-slate-800 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20 flex-shrink-0">
            <Workflow className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Fluxograma Estratégico do Bot (Funil de Alta Conversão)
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                3 Etapas
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Estrutura baseada em <b>Voto de Confiança</b>: o cliente recebe o conteúdo adiantado, paga com facilidade no PIX e desbloqueia o Super Bônus.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {courses.length > 0 && (
            <div className="flex items-center gap-2 bg-[#111726] border border-slate-800 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-semibold text-slate-400">Ver para o curso:</span>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="bg-transparent text-xs font-bold text-emerald-400 focus:outline-none cursor-pointer"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#161c2d] text-white">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={onOpenSimulator}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-300 transition-all shadow-md shadow-emerald-500/10 flex items-center gap-1.5 flex-shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Testar no Simulador</span>
          </button>
        </div>
      </div>

      {/* Grid das 3 Etapas Conectadas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
        {/* ETAPA 1 */}
        <div className="p-6 bg-[#161c2d] border border-emerald-500/30 rounded-3xl space-y-5 shadow-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black tracking-wider uppercase">
                Etapa 1
              </span>
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Mic className="w-3.5 h-3.5 text-teal-400" title="Suporta Áudio PTT" />
                <Video className="w-3.5 h-3.5 text-blue-400" title="Suporta Vídeo" />
                <ImageIcon className="w-3.5 h-3.5 text-purple-400" title="Suporta Imagem" />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Apresentação & Voto de Confiança
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Apresenta a transformação do curso, quebra a desconfiança inicial e propõe entregar o conteúdo antes do pagamento.
              </p>
            </div>

            {/* Balão WhatsApp Simulando Mensagem */}
            <div className="p-4 rounded-2xl bg-[#0f1422] border border-slate-800 text-xs text-slate-200 space-y-2.5 shadow-inner">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                <Sparkles className="w-3 h-3" />
                <span>Mensagem enviada pelo Bot:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                &ldquo;Olá! O curso <b>{currentCourse?.name || 'Fórmulas Profissionais'}</b> ensina você a produzir tudo do zero com qualidade profissional.
                O valor normal é R$ {originalPriceFormatted}, mas hoje está saindo por apenas <b>R$ {priceFormatted}</b>.
              </p>
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 font-medium">
                🤝 <b>Voto de Confiança:</b> &ldquo;Eu confio tanto no valor desse material que vou te mandar tudo agora mesmo para você conferir antes de pagar! Se gostar, faz o PIX depois. <b>Posso te mandar?</b>&rdquo;
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Gatilho de avanço:</span>
            <span className="font-bold text-emerald-400">Cliente diz &ldquo;Sim / Pode mandar&rdquo; →</span>
          </div>
        </div>

        {/* ETAPA 2 */}
        <div className="p-6 bg-[#161c2d] border border-teal-500/30 rounded-3xl space-y-5 shadow-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-black tracking-wider uppercase">
                Etapa 2
              </span>
              <span className="text-[10px] font-semibold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">
                Envio Imediato
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-400" />
                Entrega dos Arquivos + PIX + Isca do Bônus
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Dispara os arquivos do curso na hora, envia os dados do PIX com código Copia e Cola avulso e anuncia o Super Bônus.
              </p>
            </div>

            {/* Balão WhatsApp Simulando Mensagem */}
            <div className="p-4 rounded-2xl bg-[#0f1422] border border-slate-800 text-xs text-slate-200 space-y-2.5 shadow-inner">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-400">
                <PackageCheck className="w-3.5 h-3.5" />
                <span>Arquivos Enviados + PIX Oficial:</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-[11px] text-slate-300">
                <FileText className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span className="truncate">📎 Apostila_Formulas_Profissionais.pdf</span>
              </div>

              {/* Bloco Copia e Cola */}
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                  <span>PIX COPIA E COLA (MENSAGEM SEPARADA):</span>
                  <button
                    type="button"
                    onClick={handleCopySamplePix}
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    {copiedPix ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <div className="font-mono text-[9px] text-emerald-400 bg-black/40 p-1.5 rounded truncate select-all">
                  00020126580014br.gov.bcb.pix...5404{priceFormatted}5802BR...
                </div>
              </div>

              <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-[11px] text-purple-300 font-medium">
                🎁 <b>Isca do Super Bônus:</b> &ldquo;Assim que fizer o PIX de R$ {priceFormatted} e me mandar o comprovante aqui, libero seu <b>SUPER BÔNUS EXCLUSIVO</b>!&rdquo;
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Gatilho de avanço:</span>
            <span className="font-bold text-teal-400">Cliente diz &ldquo;Paguei / Comprovante&rdquo; →</span>
          </div>
        </div>

        {/* ETAPA 3 */}
        <div className="p-6 bg-[#161c2d] border border-purple-500/30 rounded-3xl space-y-5 shadow-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-black tracking-wider uppercase">
                Etapa 3
              </span>
              <span className="text-[10px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                Fechamento
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-purple-400" />
                Confirmação & Liberação do Super Bônus
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Agradece pela honestidade do cliente, confirma o acesso vitalício e entrega o material de bônus prometido.
              </p>
            </div>

            {/* Balão WhatsApp Simulando Mensagem */}
            <div className="p-4 rounded-2xl bg-[#0f1422] border border-slate-800 text-xs text-slate-200 space-y-2.5 shadow-inner">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mensagem Final de Vitória:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                &ldquo;Sensacional! Pagamento confirmado com sucesso! Muito obrigado pela sua integridade e confiança! 👏🎉&rdquo;
              </p>

              <div className="p-2.5 bg-purple-500/15 border border-purple-500/30 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-300">
                  <Gift className="w-3.5 h-3.5 text-purple-400" />
                  <span>Super Bônus Liberado:</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="truncate">📎 Guia_Secreto_Fornecedores_70off.pdf</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 italic">
                &ldquo;Qualquer dúvida que surgir na prática, pode me chamar por aqui. Bons estudos e ótimas vendas! 🚀&rdquo;
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Status final:</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Venda Concluída
            </span>
          </div>
        </div>
      </div>

      {/* Dicas de Conversão */}
      <div className="p-6 bg-[#161c2d] border border-slate-800 rounded-3xl space-y-3.5">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          Por que este funil converte até 4x mais no WhatsApp?
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-2xl bg-[#111726] border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-400">1. Zero Risco Percebido</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              O maior obstáculo no WhatsApp é o medo de golpe. Ao mandar o material primeiro, você inverte o risco e ganha o respeito do lead.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#111726] border border-slate-800 space-y-1">
            <span className="font-bold text-teal-400">2. PIX em Bloco Avulso</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              O código Copia e Cola é enviado em uma mensagem separada e limpa. No celular, um único toque copia o código e abre o banco.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#111726] border border-slate-800 space-y-1">
            <span className="font-bold text-purple-400">3. Isca Irrecusável do Bônus</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              O cliente já tem o material, mas o desejo de ganhar o Super Bônus exclusivo faz com que ele finalize o PIX de R$ 9,99 na hora.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
