import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  CreditCard, 
  Copy, 
  Check, 
  ExternalLink, 
  BookOpen,
  Smartphone,
  Zap,
  CheckCircle2,
  Workflow,
  HelpCircle,
  QrCode
} from 'lucide-react';
import { Course, Instance } from '../../types';
import { generatePixBrcode, getQrCodeImageUrl } from '../../lib/pix';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  organizationId: string;
  instances?: Instance[];
  connectedPhone?: string | null;
  onSave: (courseData: Partial<Course>) => Promise<void>;
}

export const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  onClose,
  course,
  organizationId,
  instances = [],
  connectedPhone = '559491064043',
  onSave,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  // Form State
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('97.00');
  const [originalPrice, setOriginalPrice] = useState('297.00');
  const [isActive, setIsActive] = useState(true);

  // PIX State
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState<'cpf' | 'cnpj' | 'phone' | 'email' | 'random'>('phone');
  const [pixName, setPixName] = useState('Narciso');
  const [pixCity, setPixCity] = useState('SAO PAULO');

  useEffect(() => {
    if (course) {
      setInstanceId(course.instance_id || null);
      setName(course.name || '');
      setPrice(String(course.price || 97));
      setOriginalPrice(course.original_price ? String(course.original_price) : '');
      setIsActive(course.is_active ?? true);
      setPixKey(course.pix_key || connectedPhone || '');
      setPixKeyType(course.pix_key_type || 'phone');
      setPixName(course.pix_name || 'Narciso');
      setPixCity(course.pix_city || 'SAO PAULO');
    } else {
      // Defaults para novo curso
      setInstanceId(instances?.[0]?.id || null);
      setName('');
      setPrice('97.00');
      setOriginalPrice('297.00');
      setIsActive(true);
      const defaultPhone = instances?.[0]?.phone_number || connectedPhone || '';
      setPixKey(defaultPhone);
      setPixKeyType('phone');
      setPixName('Narciso');
      setPixCity('SAO PAULO');
    }
  }, [course, isOpen, connectedPhone, instances]);

  if (!isOpen) return null;

  // Telefone da instância selecionada para geração do link
  const selectedInstance = instances.find((i) => i.id === instanceId);
  const currentPhone = selectedInstance?.phone_number || connectedPhone || '559491064043';
  const cleanPhone = currentPhone.replace(/\D/g, '');
  
  // Link oficial wa.me para tráfego/anúncios
  const whatsappLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Olá, gostaria de saber mais sobre o curso de ${name || 'Inglês'}`
  )}`;

  // Gerador de código Copia e Cola prévia
  const generatedBrcode = generatePixBrcode({
    pixKey,
    pixKeyType,
    merchantName: pixName,
    merchantCity: pixCity,
    amount: Number(price) || 0,
    description: (name || 'CURSO').slice(0, 20),
  });

  const qrCodeUrl = getQrCodeImageUrl(generatedBrcode, 160);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(whatsappLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyPix = () => {
    if (generatedBrcode) {
      navigator.clipboard.writeText(generatedBrcode);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Preencha o nome do curso.');
      return;
    }
    if (!price || Number(price) <= 0) {
      alert('Informe um valor válido para o curso.');
      return;
    }
    if (!pixKey.trim()) {
      alert('Informe uma chave PIX para cobrança.');
      return;
    }

    setIsSaving(true);
    try {
      // Preserva comentários de fluxo já existentes na persona
      const matchFlow = course?.ai_persona ? course.ai_persona.match(/<!--FLOW_STEPS:.*?-->/s) : null;
      const personaWithFlow = matchFlow ? matchFlow[0] : '';

      await onSave({
        organization_id: organizationId,
        instance_id: instanceId || null,
        name: name.trim(),
        slug: course?.slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        description: course?.description || `Curso de ${name.trim()}`,
        price: Number(price),
        original_price: originalPrice ? Number(originalPrice) : undefined,
        triggers: course?.triggers && course.triggers.length > 0 ? course.triggers : [name.trim().toLowerCase()],
        is_active: isActive,
        ai_persona: personaWithFlow,
        materials: course?.materials || [],
        bonuses: course?.bonuses || [],
        faq_objections: course?.faq_objections || [],
        pix_key: pixKey.trim(),
        pix_key_type: pixKeyType,
        pix_name: pixName.trim(),
        pix_city: pixCity.trim(),
      });
      onClose();
    } catch (err: any) {
      alert('Erro ao salvar curso: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#161c2d] border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Modal */}
        <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between bg-[#111726]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {course ? 'Editar Curso' : 'Novo Curso para Vender no WhatsApp'}
              </h2>
              <p className="text-xs text-slate-400">
                Defina o produto, o número do WhatsApp que vai responder e a chave PIX de recebimento
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário Direto sem abas desnecessárias */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* SEÇÃO 1: INFORMAÇÕES DO CURSO */}
          <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                1. Informações do Produto
              </label>

              {/* Status Ativo Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Status:</span>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                  <span>{isActive ? 'Ativo para Vendas' : 'Pausado'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Nome do Curso / Treinamento *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Curso de Inglês do Zero à Fluência"
                className="w-full bg-[#111726] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Preço de Venda Promocional (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-slate-500 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="97.00"
                    className="w-full bg-[#111726] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-bold placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Valor cobrado no cartão PIX automático.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Preço Original / Âncora (R$) <span className="text-slate-500">(Opcional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-slate-500 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="297.00"
                    className="w-full bg-[#111726] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Aparece riscado para gerar contraste de valor.</p>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: SELETOR DE WHATSAPP / INSTÂNCIA */}
          <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                2. Número de WhatsApp que Atenderá este Curso *
              </label>
              <p className="text-[11px] text-slate-400 mt-1">
                Escolha qual dos seus WhatsApps conectados vai receber as mensagens e disparar o fluxo.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* Opção: Todas as instâncias */}
              <div
                onClick={() => setInstanceId(null)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  instanceId === null
                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md shadow-emerald-500/5'
                    : 'bg-[#111726] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center flex-shrink-0 transition-colors ${
                    instanceId === null
                      ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                      : 'border-slate-600 bg-slate-800'
                  }`}
                >
                  {instanceId === null && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold text-white">Todas as Instâncias</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                    Responde caso o lead chame em qualquer um dos seus números conectados.
                  </p>
                </div>
              </div>

              {/* Opções das instâncias conectadas */}
              {instances.map((inst) => {
                const isSelected = instanceId === inst.id;
                const isConnected = inst.status === 'connected';

                return (
                  <div
                    key={inst.id}
                    onClick={() => setInstanceId(inst.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md shadow-emerald-500/5'
                        : 'bg-[#111726] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                          : 'border-slate-600 bg-slate-800'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-white truncate">{inst.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold ${
                            isConnected
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isConnected ? 'Conectado' : 'Offline'}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-emerald-400 mt-0.5">
                        +{inst.phone_number || 'Sem número'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SEÇÃO 3: COBRANÇA PIX AUTOMÁTICA */}
          <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                3. Cobrança PIX Automática (Copia e Cola + Cartão Nativo)
              </label>
              <p className="text-[11px] text-slate-400 mt-1">
                Configure os dados bancários para o robô gerar o pagamento na hora da compra.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Tipo da Chave PIX *
                </label>
                <select
                  value={pixKeyType}
                  onChange={(e) => setPixKeyType(e.target.value as any)}
                  className="w-full bg-[#111726] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="phone">Celular / Telefone (+55)</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="cpf">CPF</option>
                  <option value="email">E-mail</option>
                  <option value="random">Chave Aleatória (EVP)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Chave PIX Oficial *
                </label>
                <input
                  type="text"
                  required
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder={
                    pixKeyType === 'phone'
                      ? '559491064043'
                      : pixKeyType === 'cnpj'
                      ? '00.000.000/0001-00'
                      : 'sua-chave-pix'
                  }
                  className="w-full bg-[#111726] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nome do Titular / Beneficiário *
                </label>
                <input
                  type="text"
                  required
                  value={pixName}
                  onChange={(e) => setPixName(e.target.value)}
                  placeholder="Ex: Narciso"
                  className="w-full bg-[#111726] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <p className="text-[10px] text-slate-500 mt-1">Nome exato que aparece no comprovante do banco.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Cidade do Titular
                </label>
                <input
                  type="text"
                  value={pixCity}
                  onChange={(e) => setPixCity(e.target.value)}
                  placeholder="SAO PAULO"
                  className="w-full bg-[#111726] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors uppercase"
                />
              </div>
            </div>

            {/* Preview do Cartão PIX Nativo do WhatsApp */}
            <div className="pt-2">
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-2">
                Prévia Oficial do Cartão PIX Enviado pelo Bot:
              </label>

              <div className="p-4 bg-[#0c1322] border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                {/* Visual do Cartão Verde WhatsApp */}
                <div className="flex-1 w-full bg-[#1e293b]/70 border border-slate-700/60 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Pagamento via Pix</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                          R$ {Number(price || 0).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-medium">{pixName || 'Nome do Titular'}</p>
                      <p className="text-[10px] text-slate-400">
                        {pixKeyType === 'phone'
                          ? `Celular: ${pixKey}`
                          : pixKeyType === 'cnpj'
                          ? `CNPJ: ${pixKey}`
                          : pixKeyType === 'cpf'
                          ? `CPF: ${pixKey}`
                          : `Chave: ${pixKey}`}
                      </p>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-slate-700/60">
                    <div className="w-full py-2 rounded-xl bg-slate-800 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700">
                      <span>📋 Copiar chave Pix</span>
                    </div>
                  </div>
                </div>

                {/* QR Code Copia e Cola */}
                {qrCodeUrl && (
                  <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl flex-shrink-0 shadow-lg">
                    <img src={qrCodeUrl} alt="QR Code PIX" className="w-24 h-24 object-contain" />
                    <span className="text-[9px] font-bold text-slate-900 mt-1">QR Code Dinâmico</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SEÇÃO 4: LINK DO WHATSAPP PRONTO PARA DIVULGAÇÃO & TRÁFEGO */}
          <div className="p-5 bg-gradient-to-r from-emerald-950/30 to-teal-950/20 border border-emerald-500/30 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                4. Link do WhatsApp para Anúncios & Bio
              </label>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                Ativação Automática
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Use este link nas suas campanhas de tráfego pago (Meta Ads, TikTok, Google) ou na Bio do Instagram. Quem clica neste link já ativa o fluxo do curso automaticamente:
            </p>

            <div className="flex items-center gap-2 bg-[#0c1322] border border-slate-800 rounded-xl p-2.5">
              <span className="text-xs text-slate-300 font-mono flex-1 truncate select-all">
                {whatsappLink}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm flex-shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
              </button>
            </div>
          </div>

          {/* SEÇÃO 5: AVISO SOBRE ARQUIVOS DE ENTREGA NO FLUXO */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 flex-shrink-0 mt-0.5">
              <Workflow className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-blue-200">
                Onde defino os arquivos de entrega (apostilas, PDFs, vídeos)?
              </h4>
              <p className="text-[11px] text-blue-300/90 leading-relaxed">
                Todos os materiais para entrega e a sequência de mensagens são configurados diretamente na aba{' '}
                <b className="text-white">"Construtor de Fluxo (Flow Builder)"</b>. Lá você pode subir os arquivos diretamente no passo de entrega e definir exatamente onde a IA deve intervir!
              </p>
            </div>
          </div>
        </form>

        {/* Footer com botões de ação */}
        <div className="px-6 py-4 border-t border-slate-800/80 flex items-center justify-end gap-3 bg-[#111726]/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-300 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Salvar Curso</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
