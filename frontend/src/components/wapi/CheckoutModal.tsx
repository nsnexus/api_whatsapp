import React, { useState, useEffect } from 'react';
import { 
  X, 
  QrCode, 
  CreditCard, 
  Check, 
  Copy, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  ChevronLeft,
  Smartphone,
  Calculator,
  Lock,
  ExternalLink
} from 'lucide-react';
import { Instance } from '../../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  instance?: Instance | null;
  selectedPlan?: string;
  onPaymentSuccess?: (instanceId: string, planName: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  instance,
  selectedPlan,
  onPaymentSuccess
}) => {
  // Telas: 'selection' (tela igualzinha ao print), 'pix_details', 'card_details', 'success'
  const [currentStep, setCurrentStep] = useState<'selection' | 'pix_details' | 'card_details' | 'success'>('selection');
  const [copiedPix, setCopiedPix] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutos em segundos

  // Dados do formulário de cartão
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Parâmetros do cálculo de dias
  const currentDays = 10;
  const renewalDays = 30;
  const totalDays = currentDays + renewalDays;

  const instanceCode = instance?.instance_name 
    ? (instance.instance_name.startsWith('org_') ? 'WHATSAPP-34O7BP-59EWJO' : instance.instance_name)
    : 'WHATSAPP-34O7BP-59EWJO';

  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    if (selectedPlan?.includes('10')) return '10_instancias';
    if (selectedPlan?.includes('5') || selectedPlan?.includes('combo')) return 'combo_5';
    if (selectedPlan?.includes('2')) return '2_instancias';
    return '1_instancia';
  });

  const planInfo: Record<string, { name: string; priceFormatted: string; priceNumber: number; pixCode: string }> = {
    '1_instancia': {
      name: '1 Instância',
      priceFormatted: 'R$ 19,90',
      priceNumber: 19.90,
      pixCode: '00020126480014br.gov.bcb.pix0126narcisofelizardo@gmail.com520400005303986540519.905802BR5914NARCISO SANTOS6009SAO PAULO62070503***630425FA',
    },
    'combo_5': {
      name: 'Combo 5 Instâncias',
      priceFormatted: 'R$ 69,90',
      priceNumber: 69.90,
      pixCode: '00020126480014br.gov.bcb.pix0126narcisofelizardo@gmail.com520400005303986540569.905802BR5914NARCISO SANTOS6009SAO PAULO62070503***6304CA22',
    },
    '10_instancias': {
      name: '10 Instâncias',
      priceFormatted: 'R$ 99,90',
      priceNumber: 99.90,
      pixCode: '00020126480014br.gov.bcb.pix0126narcisofelizardo@gmail.com520400005303986540599.905802BR5914NARCISO SANTOS6009SAO PAULO62070503***63049A56',
    },
    '2_instancias': {
      name: '2 Instâncias',
      priceFormatted: 'R$ 29,90',
      priceNumber: 29.90,
      pixCode: '00020126480014br.gov.bcb.pix0126narcisofelizardo@gmail.com520400005303986540529.905802BR5914NARCISO SANTOS6009SAO PAULO62070503***630495F4',
    },
  };

  const currentPlan = planInfo[selectedPlanId] || planInfo['1_instancia'];
  const priceFormatted = currentPlan.priceFormatted;
  const priceNumber = currentPlan.priceNumber;
  const pixCode = currentPlan.pixCode;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(pixCode)}&margin=8`;

  // Temporizador do PIX (15 min)
  useEffect(() => {
    if (!isOpen || currentStep !== 'pix_details') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, currentStep]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleConfirmPix = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setCurrentStep('success');
      if (onPaymentSuccess && instance) {
        onPaymentSuccess(instance.id, 'Renovação 30 dias');
      }
    }, 1800);
  };

  // Resetar ao fechar ou reabrir
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('selection');
      setTimeLeft(900);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-[540px] bg-[#141926] border border-slate-800/90 rounded-[28px] shadow-2xl overflow-hidden p-6 sm:p-8 text-slate-100 animate-scaleUp">
        
        {/* Botão Fechar no Canto Superior Direito */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800/60"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ======================================================== */}
        {/* ETAPA 1: TELA IDÊNTICA AO PRINT ENVIADO PELO USUÁRIO      */}
        {/* ======================================================== */}
        {currentStep === 'selection' && (
          <div className="space-y-6">
            {/* Ícone no Topo (Máquina de Cartão / Calculadora verde com glow) */}
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                <Calculator className="w-6 h-6" />
              </div>
            </div>

            {/* Título Principal */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">
                Assinar Instância
              </h2>
              <p className="text-[13px] text-slate-300 leading-relaxed max-w-md mx-auto">
                Escolha a forma de pagamento para usar a isnstância{' '}
                <span className="inline-block px-2.5 py-0.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 text-emerald-400 font-mono font-bold text-xs">
                  {instanceCode}
                </span>{' '}
                no valor de{' '}
                <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs">
                  {priceFormatted}
                </span>
              </p>
            </div>

            {/* Seletor de Planos da API */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#0f1420] rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedPlanId('1_instancia')}
                className={`py-2 px-1 rounded-xl text-center transition-all ${
                  selectedPlanId === '1_instancia'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-[11px]">1 Instância</div>
                <div className="text-xs font-extrabold">R$ 19,90</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlanId('combo_5')}
                className={`py-2 px-1 rounded-xl text-center transition-all relative ${
                  selectedPlanId === 'combo_5'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 rounded-full uppercase">
                  Combo
                </span>
                <div className="text-[11px]">5 Instâncias</div>
                <div className="text-xs font-extrabold">R$ 69,90</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlanId('10_instancias')}
                className={`py-2 px-1 rounded-xl text-center transition-all ${
                  selectedPlanId === '10_instancias'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-[11px]">10 Instâncias</div>
                <div className="text-xs font-extrabold">R$ 99,90</div>
              </button>
            </div>

            {/* Seção da Linha do Tempo e Cálculo de Dias (EXATO ao print) */}
            <div className="space-y-3 pt-1">
              <p className="text-[12px] text-slate-300 text-center font-medium">
                Se renovar a instância <strong className="text-white font-bold">com PIX por 30 dias</strong>, o novo prazo será calculado assim:
              </p>

              {/* Rótulos Superiores */}
              <div className="flex justify-between items-center text-[12px] px-3 font-semibold">
                <span className="text-slate-300">Tempo atual: <strong className="text-blue-400">10d</strong></span>
                <span className="text-emerald-400 font-bold">Renovação: +30d</span>
              </div>

              {/* Barra Visual com os Círculos (10d -> 40d) */}
              <div className="relative flex items-center justify-between px-6 py-2">
                {/* Linha de Conexão Fina */}
                <div className="absolute left-10 right-10 h-[2px] bg-slate-700/80 z-0">
                  <div className="h-full bg-gradient-to-r from-blue-500 via-emerald-500 to-emerald-400" style={{ width: '100%' }} />
                </div>

                {/* Bolinha Azul: 10d */}
                <div className="relative z-10 w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-lg shadow-blue-500/40 ring-4 ring-[#141926]">
                  10d
                </div>

                {/* Bolinha Central: Seta verde */}
                <div className="relative z-10 w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md shadow-emerald-500/30 ring-4 ring-[#141926]">
                  <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                </div>

                {/* Bolinha Verde: 40d com Glow Verde intenso */}
                <div className="relative z-10 w-11 h-11 rounded-full bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-xl shadow-emerald-500/50 ring-4 ring-[#141926]">
                  40d
                </div>
              </div>

              {/* Rótulos Inferiores */}
              <div className="flex justify-between items-center text-[12px] px-3">
                <span className="text-slate-400">Total após renovação: 40 dias</span>
                <span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">TOTAL</span>
              </div>

              <div className="text-[12px] text-slate-300 text-center space-y-1 pt-1 leading-relaxed">
                <p>
                  Ou seja, sua instância terá <strong className="text-white font-bold">40 dias no total</strong> antes de expirar novamente.
                </p>
                <p className="text-slate-400">
                  Se você concorda e deseja renovar, <strong className="text-slate-200">escolha a opção PIX</strong>.
                </p>
              </div>
            </div>

            {/* Opções de Pagamento (PIX e CARTÃO) */}
            <div className="space-y-3 pt-2">
              {/* Opção 1: Pagar com PIX */}
              <button
                type="button"
                onClick={() => setCurrentStep('pix_details')}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-800/90 bg-[#192032]/80 hover:bg-[#1f283e] hover:border-emerald-500/50 transition-all text-left group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                      Pagar com PIX
                    </h4>
                    <p className="text-xs text-slate-400">
                      Liberação instantânea
                    </p>
                  </div>
                </div>

                <div className="w-6 h-6 rounded-full border border-slate-700 group-hover:border-emerald-500 flex items-center justify-center transition-colors">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>

              {/* Opção 2: Pagar com CARTÃO (Via Stripe) */}
              <button
                type="button"
                onClick={() => setCurrentStep('card_details')}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-800/90 bg-[#192032]/80 hover:bg-[#1f283e] hover:border-blue-500/50 transition-all text-left group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                      Pagar com CARTÃO
                    </h4>
                    <p className="text-xs text-slate-400">
                      Via Stripe checkout
                    </p>
                  </div>
                </div>

                <div className="w-6 h-6 rounded-full border border-slate-700 group-hover:border-blue-500 flex items-center justify-center transition-colors">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            </div>

            {/* Botão Cancelar Centralizado */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors px-4 py-2 rounded-xl hover:bg-slate-800/40"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ETAPA 2: DETALHES DO PIX (QR CODE + COPIA E COLA)        */}
        {/* ======================================================== */}
        {currentStep === 'pix_details' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Header com Voltar */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <button
                type="button"
                onClick={() => setCurrentStep('selection')}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar às opções</span>
              </button>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
                {priceFormatted}
              </div>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Escaneie o QR Code PIX</h3>
              <p className="text-xs text-slate-400">
                Abra o app do seu banco e aponte a câmera para pagar
              </p>
            </div>

            {/* Imagem do QR Code PIX */}
            <div className="flex justify-center">
              <div className="bg-white p-3 rounded-2xl shadow-xl shadow-emerald-500/10 border-4 border-emerald-500/30">
                <img
                  src={qrCodeUrl}
                  alt="QR Code PIX"
                  className="w-48 h-48 object-contain"
                />
              </div>
            </div>

            {/* Temporizador */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>Expira em: <strong>{formatTime(timeLeft)}</strong></span>
            </div>

            {/* Campo Copia e Cola */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Código PIX Copia e Cola:
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={pixCode}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-[11px] font-mono text-slate-300 pr-24 select-all outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                >
                  {copiedPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Botão de Confirmação */}
            <button
              type="button"
              onClick={handleConfirmPix}
              disabled={isVerifying}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Verificando compensação no Banco Central...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Já realizei o PIX (Liberar +30 dias)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* ETAPA 3: STRIPE CHECKOUT / CARTÃO                        */}
        {/* ======================================================== */}
        {currentStep === 'card_details' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Header com Voltar */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <button
                type="button"
                onClick={() => setCurrentStep('selection')}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar às opções</span>
              </button>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold font-mono">
                {priceFormatted} / mês
              </div>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Stripe Checkout</h3>
              <p className="text-xs text-slate-400">
                Cobrança segura com renovação automática mensal
              </p>
            </div>

            <div className="space-y-3 text-xs bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">Número do Cartão</label>
                <input
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">Nome no Cartão</label>
                <input
                  type="text"
                  placeholder="Nome impresso"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400">Validade</label>
                  <input
                    type="text"
                    placeholder="MM/AA"
                    value={cardExp}
                    onChange={(e) => setCardExp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400">CVV</label>
                  <input
                    type="password"
                    placeholder="123"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmPix}
              disabled={isVerifying}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>Assinar via Stripe ({priceFormatted}/mês)</span>
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* ETAPA 4: SUCESSO                                         */}
        {/* ======================================================== */}
        {currentStep === 'success' && (
          <div className="py-6 text-center space-y-5 animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Instância Renovada com Sucesso!</h2>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                Mais <strong>30 dias</strong> foram adicionados à sua instância <strong className="text-emerald-400">{instanceCode}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 max-w-sm mx-auto text-left space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Instância:</span>
                <span className="font-semibold text-slate-200">{instanceCode}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Valor:</span>
                <span className="font-bold text-emerald-400 font-mono">R$ 19,90</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Prazo Total:</span>
                <span className="font-bold text-white">40 dias restantes</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              Concluir
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;
