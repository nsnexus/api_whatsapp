import React, { useState } from 'react';
import { 
  Check, 
  Sparkles, 
  Zap, 
  Server, 
  MessageSquare, 
  Kanban, 
  ShieldCheck, 
  CreditCard,
  ExternalLink
} from 'lucide-react';
import { CheckoutModal } from './CheckoutModal';

export const PlansView: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState('1_instancia');

  const plans = [
    {
      id: 'api_1',
      name: '1 Instância',
      subtitle: 'Ideal para automações em n8n e Typebot',
      target: '1 Conexão WhatsApp',
      priceMonthly: 19.90,
      priceYearly: 15.90,
      priceDisplay: '19,90',
      badge: 'Entrada Acessível',
      highlight: false,
      features: [
        '1 Conexão de WhatsApp ativa',
        'API REST Ilimitada (sem limites de envio)',
        'Webhooks em tempo real (n8n, Typebot, Make)',
        'Envio de Áudio PTT (Microfone Verde nativo)',
        'Envio de Imagens, PDFs e Documentos',
        'Live Chat e Funil de Vendas CRM inclusos',
        'Bots de IA com ChatGPT para Venda de Cursos',
        'Suporte técnico via WhatsApp',
      ],
      notIncluded: [
        'Múltiplos números simultâneos',
      ],
    },
    {
      id: 'api_combo_5',
      name: 'Combo 5 Instâncias',
      subtitle: 'Para agências, gestores de tráfego e operações',
      target: '5 Conexões Simultâneas',
      priceMonthly: 69.90,
      priceYearly: 59.90,
      priceDisplay: '69,90',
      badge: 'MAIS ESCOLHIDO • R$ 13,98 / Instância',
      highlight: true,
      features: [
        '5 Conexões de WhatsApp simultâneas',
        'API REST de alta velocidade para todos os números',
        'Webhooks independentes por instância',
        'Envio de Áudio gravado PTT e mídias',
        'Múltiplos Bots de IA com ChatGPT para cursos',
        'Live Chat com múltiplos atendentes',
        'Fila de envio com controle anti-ban inteligente',
        'Dashboard de métricas e latência',
        'Suporte prioritário VIP no WhatsApp',
      ],
      notIncluded: [],
    },
    {
      id: 'api_10',
      name: '10 Instâncias',
      subtitle: 'Para grandes plataformas, SaaS e automação em massa',
      target: '10 Conexões Simultâneas',
      priceMonthly: 99.90,
      priceYearly: 84.90,
      priceDisplay: '99,90',
      badge: 'R$ 9,99 / Instância',
      highlight: false,
      features: [
        '10 Conexões de WhatsApp simultâneas',
        'Infraestrutura dedicada com auto-scaling',
        'API REST Ilimitada para todos os números',
        'Webhooks em tempo real de altíssima velocidade',
        'Envio de Áudio gravado PTT e mídias',
        'Live Chat multi-agente e funil Kanban',
        'Bots de IA ilimitados para cursos',
        'Integração com n8n, Typebot e Make',
        'Suporte prioritário VIP 24/7',
      ],
      notIncluded: [],
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto">
      {/* Header */}
      <div className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            Planos Comerciais &bull; Venda de API WhatsApp & CRM
          </h2>
          <p className="text-xs text-slate-400">
            Monetize tanto clientes que só querem a API para integrações quanto empresas que precisam do CRM completo
          </p>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Banner de Ciclo de Cobrança */}
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <span className="text-xs uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Monetização SaaS B2B
          </span>
          <h3 className="text-2xl font-extrabold text-slate-100">
            Escolha o modelo perfeito para seus clientes
          </h3>
          <p className="text-xs text-slate-400 max-w-lg">
            Sua VPS Contabo permite hospedar centenas de instâncias com margem de lucro acima de 90%.
          </p>

          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 mt-2">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-slate-800 text-slate-100 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Anual</span>
              <span className="text-[10px] bg-emerald-950/80 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                -20% OFF
              </span>
            </button>
          </div>
        </div>

        {/* Grid de Planos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 flex flex-col justify-between transition-all relative ${
                  plan.highlight
                    ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/30 border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/10'
                    : 'bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-xl'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-slate-950 shadow-md">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                      {plan.target}
                    </span>
                    <h4 className="text-xl font-bold text-slate-100">{plan.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">{plan.subtitle}</p>
                  </div>

                  {/* Preço */}
                  <div className="flex items-baseline gap-1 py-2 border-y border-slate-800/80">
                    <span className="text-xs text-slate-400">R$</span>
                    <span className="text-4xl font-extrabold text-slate-100">{price}</span>
                    <span className="text-xs text-slate-400">/mês</span>
                  </div>

                  {/* Recursos Incluídos */}
                  <div className="space-y-2.5 pt-2">
                    <span className="text-xs font-bold text-slate-300 block">O que está incluso:</span>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recursos não inclusos */}
                  {plan.notIncluded.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-800/60">
                      <ul className="space-y-1.5 text-xs text-slate-500">
                        {plan.notIncluded.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2 line-through">
                            <span className="text-slate-600">✕</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Botão de Assinatura */}
                <div className="pt-6 mt-6 border-t border-slate-800">
                  <button
                    onClick={() => {
                      const planKey = plan.id === 'api_combo_5' ? 'combo_5' : plan.id === 'api_10' ? '10_instancias' : '1_instancia';
                      setSelectedPlanForCheckout(planKey);
                      setIsCheckoutOpen(true);
                    }}
                    className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 ${
                      plan.highlight
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
                    }`}
                  >
                    <span>Contratar {plan.name}</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Checkout Pix */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        selectedPlan={selectedPlanForCheckout}
      />
    </div>
  );
};
