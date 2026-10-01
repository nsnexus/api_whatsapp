import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  FileText, 
  Gift, 
  HelpCircle, 
  CreditCard, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  ExternalLink, 
  QrCode, 
  Flame, 
  BookOpen,
  GraduationCap,
  MessageSquare,
  UploadCloud,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Video as VideoIcon,
  Music as AudioIcon,
  Link as LinkIcon,
  Smartphone
} from 'lucide-react';
import { Course, MaterialItem, BonusItem, FaqObjection, Instance } from '../../types';
import { generatePixBrcode, getQrCodeImageUrl } from '../../lib/pix';
import { supabase } from '../../lib/supabase';

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
  const [activeTab, setActiveTab] = useState<'geral' | 'gatilhos' | 'persona' | 'materiais' | 'bonus' | 'pix'>('geral');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  // Form State
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('97.00');
  const [originalPrice, setOriginalPrice] = useState('297.00');
  const [triggers, setTriggers] = useState<string[]>([]);
  const [newTrigger, setNewTrigger] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Persona State
  const [aiPersona, setAiPersona] = useState('');

  // Materials State & Upload
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [newMatName, setNewMatName] = useState('');
  const [newMatUrl, setNewMatUrl] = useState('');
  const [newMatType, setNewMatType] = useState<'document' | 'image' | 'video' | 'audio' | 'link'>('document');
  const [newMatDesc, setNewMatDesc] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{ name: string; size: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bonuses State
  const [bonuses, setBonuses] = useState<BonusItem[]>([]);
  const [newBonusName, setNewBonusName] = useState('');
  const [newBonusDesc, setNewBonusDesc] = useState('');
  const [newBonusVal, setNewBonusVal] = useState('');

  // FAQ Objections State
  const [faqObjections, setFaqObjections] = useState<FaqObjection[]>([]);
  const [newObjection, setNewObjection] = useState('');
  const [newReplyGuide, setNewReplyGuide] = useState('');

  // PIX State
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState<'cpf' | 'cnpj' | 'phone' | 'email' | 'random'>('phone');
  const [pixName, setPixName] = useState('Narciso');
  const [pixCity, setPixCity] = useState('SAO PAULO');

  useEffect(() => {
    if (course) {
      setInstanceId(course.instance_id || null);
      setName(course.name || '');
      setSlug(course.slug || '');
      setDescription(course.description || '');
      setPrice(String(course.price || 97));
      setOriginalPrice(course.original_price ? String(course.original_price) : '');
      setTriggers(course.triggers || []);
      setIsActive(course.is_active ?? true);
      setAiPersona(course.ai_persona ? course.ai_persona.replace(/<!--FLOW_STEPS:.*?-->/gs, '').trim() : '');
      setMaterials(course.materials || []);
      setBonuses(course.bonuses || []);
      setFaqObjections(course.faq_objections || []);
      setPixKey(course.pix_key || connectedPhone || '');
      setPixKeyType(course.pix_key_type || 'phone');
      setPixName(course.pix_name || 'Narciso');
      setPixCity(course.pix_city || 'SAO PAULO');
    } else {
      // Defaults para novo curso
      setInstanceId(instances?.[0]?.id || null);
      setName('');
      setSlug('');
      setDescription('');
      setPrice('97.00');
      setOriginalPrice('297.00');
      setTriggers([]);
      setIsActive(true);
      setAiPersona(
        'Você é uma consultora de vendas amigável e especialista. Seu objetivo é entender o momento do cliente, mostrar como nosso curso vai ajudá-lo a alcançar resultados práticos, tirar todas as dúvidas, apresentar os bônus inclusos e fechar a inscrição imediata via PIX.'
      );
      setMaterials([]);
      setBonuses([]);
      setFaqObjections([
        {
          objection: 'Achei um pouco caro',
          reply_guide: 'Mostre que custa menos que um cafezinho por dia, tem garantia de 7 dias e todos os bônus inclusos de graça.',
        },
        {
          objection: 'Não tenho tempo para fazer',
          reply_guide: 'Enfatize que as aulas são direto ao ponto de 15 minutos e você pode assistir no celular quando quiser.',
        },
      ]);
      const defaultPhone = instances?.[0]?.phone_number || connectedPhone || '';
      setPixKey(defaultPhone);
      setPixKeyType('phone');
      setPixName('Narciso');
      setPixCity('SAO PAULO');
    }
    setActiveTab('geral');
  }, [course, isOpen, connectedPhone, instances]);

  if (!isOpen) return null;

  // Gerador de link do WhatsApp para o curso baseado na instância selecionada
  const selectedInstance = instances.find((i) => i.id === instanceId);
  const currentPhone = selectedInstance?.phone_number || connectedPhone || '559491064043';
  const cleanPhone = currentPhone.replace(/\D/g, '');
  const sampleTrigger = triggers[0] || name || 'curso';
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

  const qrCodeUrl = getQrCodeImageUrl(generatedBrcode, 180);

  const handleAddTrigger = () => {
    const val = newTrigger.trim().toLowerCase();
    if (val && !triggers.includes(val)) {
      setTriggers([...triggers, val]);
      setNewTrigger('');
    }
  };

  const handleRemoveTrigger = (t: string) => {
    setTriggers(triggers.filter((item) => item !== t));
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setUploadError('O arquivo excede o limite máximo permitido de 50MB.');
      return;
    }

    setIsUploadingFile(true);
    setUploadError(null);
    setUploadSuccess(null);
    setUploadProgress(`Enviando ${file.name}...`);

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const cleanFileName = file.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '_');

      const orgFolder = organizationId || 'geral';
      const filePath = `${orgFolder}/${Date.now()}_${cleanFileName}`;

      const { error } = await supabase.storage
        .from('course-materials')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Erro de upload no Supabase Storage:', error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('course-materials')
        .getPublicUrl(filePath);

      // Inferência automática de categoria do arquivo
      let inferredType: 'document' | 'image' | 'video' | 'audio' | 'link' = 'document';
      if (file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(fileExt)) {
        inferredType = 'image';
      } else if (file.type.startsWith('video/') || ['mp4', 'mov', 'webm', 'mkv', 'avi'].includes(fileExt)) {
        inferredType = 'video';
      } else if (file.type.startsWith('audio/') || ['mp3', 'm4a', 'wav', 'ogg', 'aac'].includes(fileExt)) {
        inferredType = 'audio';
      } else {
        inferredType = 'document';
      }

      // Nome limpo para exibição
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      const cleanTitle = baseName.charAt(0).toUpperCase() + baseName.slice(1);

      setNewMatName(cleanTitle);
      setNewMatUrl(publicUrl);
      setNewMatType(inferredType);
      setUploadedFileInfo({
        name: file.name,
        size: formatBytes(file.size),
      });

      if (!newMatDesc) {
        setNewMatDesc(`Amostra do curso (${cleanTitle}) para enviar ao lead quando pedir demonstrativo.`);
      }

      setUploadSuccess(`Upload de "${file.name}" realizado com sucesso!`);
    } catch (err: any) {
      console.error('Falha ao subir arquivo:', err);
      setUploadError(err.message || 'Erro ao enviar o arquivo para a nuvem. Tente novamente.');
    } finally {
      setIsUploadingFile(false);
      setUploadProgress('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleAddMaterial = () => {
    if (!newMatName.trim() || !newMatUrl.trim()) return;
    const newItem: MaterialItem = {
      id: `mat_${Date.now()}`,
      name: newMatName.trim(),
      url: newMatUrl.trim(),
      type: newMatType,
      description: newMatDesc.trim(),
    };
    setMaterials([...materials, newItem]);
    setNewMatName('');
    setNewMatUrl('');
    setNewMatDesc('');
    setUploadSuccess(null);
    setUploadError(null);
    setUploadedFileInfo(null);
  };

  const handleRemoveMaterial = (id: string) => {
    setMaterials(materials.filter((m) => m.id !== id));
  };

  const handleAddBonus = () => {
    if (!newBonusName.trim()) return;
    const newItem: BonusItem = {
      id: `bon_${Date.now()}`,
      name: newBonusName.trim(),
      description: newBonusDesc.trim(),
      value: Number(newBonusVal) || undefined,
    };
    setBonuses([...bonuses, newItem]);
    setNewBonusName('');
    setNewBonusDesc('');
    setNewBonusVal('');
  };

  const handleRemoveBonus = (id: string) => {
    setBonuses(bonuses.filter((b) => b.id !== id));
  };

  const handleAddObjection = () => {
    if (!newObjection.trim() || !newReplyGuide.trim()) return;
    setFaqObjections([...faqObjections, { objection: newObjection.trim(), reply_guide: newReplyGuide.trim() }]);
    setNewObjection('');
    setNewReplyGuide('');
  };

  const handleRemoveObjection = (idx: number) => {
    setFaqObjections(faqObjections.filter((_, i) => i !== idx));
  };

  const applyPersonaTemplate = (template: 'consultiva' | 'alta_conversao' | 'professora') => {
    if (template === 'consultiva') {
      setAiPersona(
        `Você é uma consultora educacional acolhedora e focada em ajudar o aluno a tomar a melhor decisão para seu futuro.\n\n` +
          `SEU ESTILO:\n` +
          `- Faça perguntas abertas para entender a história do aluno e suas dificuldades atuais.\n` +
          `- Explique didaticamente como nosso método resolve a dor dele.\n` +
          `- Envie o material de amostra para ele ver a qualidade por dentro.\n` +
          `- Apresente os bônus inclusos e conduza suavemente para o pagamento via PIX.`
      );
    } else if (template === 'alta_conversao') {
      setAiPersona(
        `Você é uma especialista em vendas diretas focada em conversão rápida e quebra de objeções.\n\n` +
          `SEU ESTILO:\n` +
          `- Use gatilhos de urgência, escassez de vagas e bônus limitados para quem se inscrever hoje.\n` +
          `- Seja enérgica, confiante e passe total segurança sobre o método.\n` +
          `- Ancore o valor alto (preço original) e mostre a grande oportunidade do valor promocional.\n` +
          `- Quando o cliente perguntar como paga ou concordar, envie o PIX imediatamente com entusiasmo!`
      );
    } else {
      setAiPersona(
        `Você é a mentora e professora responsável pelo curso.\n\n` +
          `SEU ESTILO:\n` +
          `- Fale com autoridade, carinho e propriedade técnica de quem domina o assunto.\n` +
          `- Explique o passo a passo dos módulos e o que o aluno vai aprender em cada etapa.\n` +
          `- Compartilhe dicas rápidas e mostre que ele terá suporte direto nas aulas.\n` +
          `- Convide o aluno para ser seu novo pupilo com a taxa única promocional via PIX.`
      );
    }
  };

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
      await onSave({
        organization_id: organizationId,
        instance_id: instanceId || null,
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        description: description.trim(),
        price: Number(price),
        original_price: originalPrice ? Number(originalPrice) : undefined,
        triggers,
        is_active: isActive,
        ai_persona: (() => {
          const matchFlow = course?.ai_persona ? course.ai_persona.match(/<!--FLOW_STEPS:.*?-->/s) : null;
          return matchFlow ? `${aiPersona.trim()}\n\n${matchFlow[0]}` : aiPersona.trim();
        })(),
        materials,
        bonuses,
        faq_objections: faqObjections,
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
      <div className="bg-[#161c2d] border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Modal */}
        <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between bg-[#111726]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {course ? 'Editar Curso & Funil de Vendas' : 'Novo Curso para Vender com IA'}
              </h2>
              <p className="text-xs text-slate-400">
                Configure a persona, valor, materiais, bônus e chave PIX para este produto
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

        {/* Abas de Navegação */}
        <div className="flex px-6 border-b border-slate-800/80 bg-[#111726]/30 overflow-x-auto gap-2 py-2">
          <button
            type="button"
            onClick={() => setActiveTab('geral')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'geral'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>1. Geral & Preço</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gatilhos')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'gatilhos'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>2. Gatilhos & Links WhatsApp</span>
            {triggers.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300">
                {triggers.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('persona')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'persona'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3. Persona & IA de Vendas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('materiais')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'materiais'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>4. Materiais & Amostras ({materials.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bonus')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'bonus'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>5. Bônus Exclusivos ({bonuses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pix')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'pix'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>6. Chave PIX & Cobrança</span>
          </button>
        </div>

        {/* Formulário com scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ABA 1: GERAL & PREÇO */}
          {activeTab === 'geral' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Seletor de Instância do WhatsApp */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-white flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      Número de WhatsApp que Atenderá este Curso *
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Defina qual das suas instâncias conectadas vai receber as mensagens e fechar as vendas com IA.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {/* Opção: Todas as instâncias */}
                  <div
                    onClick={() => setInstanceId(null)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      instanceId === null
                        ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md shadow-emerald-500/5'
                        : 'bg-[#111726] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                        instanceId === null ? 'border-emerald-400 bg-emerald-500' : 'border-slate-600'
                      }`}
                    >
                      {instanceId === null && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        Todas as Instâncias
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Responde em qualquer número conectado desta organização
                      </p>
                    </div>
                  </div>

                  {/* Instâncias cadastradas */}
                  {instances.map((inst) => {
                    const isSelected = instanceId === inst.id;
                    const isConnected = inst.status === 'connected';
                    return (
                      <div
                        key={inst.id}
                        onClick={() => {
                          setInstanceId(inst.id);
                          if (pixKeyType === 'phone' && (!pixKey || pixKey === connectedPhone)) {
                            if (inst.phone_number) setPixKey(inst.phone_number);
                          }
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md shadow-emerald-500/5'
                            : 'bg-[#111726] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'border-emerald-400 bg-emerald-500' : 'border-slate-600'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-bold text-white truncate">
                              {inst.name || 'WhatsApp'}
                            </p>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold flex items-center gap-1 ${
                                isConnected
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                                }`}
                              />
                              {isConnected ? 'Conectado' : inst.status}
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

              <div className="flex items-center justify-between p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <div>
                  <p className="text-xs font-bold text-white">Status deste Curso</p>
                  <p className="text-[11px] text-slate-400">
                    {isActive ? 'O bot responderá e venderá este curso no WhatsApp' : 'Curso pausado (a IA não irá oferecê-lo)'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isActive ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nome do Curso / Produto Digital *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Curso de Inglês Fluente do Zero, Confeitaria Lucrativa, etc."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#111726] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Preço Promocional de Venda (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="97.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-[#111726] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-emerald-400 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">Valor real que a IA irá cobrar via PIX</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Preço Original / Ancoragem (R$) (Opcional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="297.00"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      className="w-full bg-[#111726] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">Usado pela IA para gerar senso de oportunidade e desconto</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Descrição e Transformação do Curso
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Método prático passo a passo onde o aluno aprende do absoluto zero até o nível avançado em 6 meses, com 15 minutos de estudo por dia."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#111726] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* ABA 2: GATILHOS & LINKS WHATSAPP */}
          {activeTab === 'gatilhos' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <Flame className="w-4 h-4" /> Link do WhatsApp Pronto para Anúncios & Bio
                      </h3>
                      {selectedInstance ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-emerald-500/40 text-emerald-300 font-mono font-bold">
                          📱 {selectedInstance.name} (+{cleanPhone})
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 font-mono">
                          🌐 Padrão (+{cleanPhone})
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Divulgue este link no Instagram, TikTok, Google ou Facebook Ads. Quando a pessoa clicar, a mensagem
                      já virá preenchida e a IA identificará automaticamente que é este curso!
                    </p>
                    <div className="mt-2.5 p-2 bg-slate-900/80 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-300 select-all break-all">
                      {whatsappLink}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="mt-1 px-3.5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all flex items-center gap-1.5 flex-shrink-0 shadow-lg shadow-emerald-500/20"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Palavras-chave de Ativação (Gatilhos)
                </label>
                <p className="text-[11px] text-slate-400 mb-2">
                  Se qualquer uma dessas palavras for digitada pelo cliente no WhatsApp, a IA ativará o atendimento
                  deste curso imediatamente.
                </p>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Ex: ingles, curso ingles, fluente, falar ingles..."
                    value={newTrigger}
                    onChange={(e) => setNewTrigger(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTrigger();
                      }
                    }}
                    className="flex-1 bg-[#111726] border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddTrigger}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {triggers.map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1 bg-slate-800/80 border border-slate-700 text-slate-200 rounded-full text-xs flex items-center gap-2"
                    >
                      <span className="font-mono text-emerald-400">#{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTrigger(t)}
                        className="text-slate-400 hover:text-rose-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {triggers.length === 0 && (
                    <span className="text-xs text-slate-500 italic">
                      Nenhum gatilho adicionado ainda. Digite uma palavra acima e clique em Adicionar.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ABA 3: PERSONA & IA DE VENDAS */}
          {activeTab === 'persona' && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300">Modelos Prontos de Persona:</label>
                  <span className="text-[11px] text-slate-500">Clique para preencher o prompt automaticamente</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => applyPersonaTemplate('consultiva')}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 text-left transition-all group"
                  >
                    <p className="text-xs font-bold text-white group-hover:text-emerald-400 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" /> Consultora Amigável
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Acolhe, ouve a dor do aluno e apresenta a solução com empatia.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPersonaTemplate('alta_conversao')}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 text-left transition-all group"
                  >
                    <p className="text-xs font-bold text-white group-hover:text-emerald-400 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-400" /> Alta Conversão
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Foco em escassez, ancoragem de preço e urgência para pagar no PIX.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPersonaTemplate('professora')}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 text-left transition-all group"
                  >
                    <p className="text-xs font-bold text-white group-hover:text-emerald-400 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-400" /> Professora Mentora
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Autoridade técnica, explica os módulos com detalhes e carinho.
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Instruções da Persona / Prompt da IA para este Curso *
                </label>
                <textarea
                  rows={8}
                  required
                  placeholder="Defina o nome da atendente, tom de voz, regras de atendimento e como ela deve se portar..."
                  value={aiPersona}
                  onChange={(e) => setAiPersona(e.target.value)}
                  className="w-full bg-[#111726] border border-slate-800 rounded-xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono leading-relaxed"
                />
              </div>

              {/* Objeções */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Como Rebater Objeções Comuns (Scripts)
                </label>
                <p className="text-[11px] text-slate-400 mb-3">
                  A IA usará esses argumentos quando o cliente demonstrar dúvidas específicas.
                </p>

                <div className="space-y-2 mb-3">
                  {faqObjections.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl flex items-start justify-between gap-3"
                    >
                      <div className="text-xs space-y-1">
                        <p className="font-bold text-rose-300">❌ Se o cliente disser: "{item.objection}"</p>
                        <p className="text-slate-300">✅ A IA responde com: "{item.reply_guide}"</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveObjection(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#111726] p-3 rounded-2xl border border-slate-800">
                  <input
                    type="text"
                    placeholder="Objeção (ex: Não tenho dinheiro agora)"
                    value={newObjection}
                    onChange={(e) => setNewObjection(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Orientação para a IA responder..."
                      value={newReplyGuide}
                      onChange={(e) => setNewReplyGuide(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddObjection}
                      className="px-3 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold hover:bg-emerald-500/30 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Salvar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA 4: MATERIAIS & AMOSTRAS */}
          {activeTab === 'materiais' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs text-blue-300 flex items-start gap-2.5">
                <span className="text-base leading-none">💡</span>
                <div>
                  <p className="font-bold text-white mb-0.5">Envio Automático de Materiais no WhatsApp</p>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Faça o upload dos arquivos que você deseja disponibilizar (ex: <b>PDF de Amostra, E-book, Cronograma, Áudio explicativo, Vídeo ou Imagem</b>). 
                    Quando o lead no WhatsApp pedir uma amostra ou demonstração, a IA disparará automaticamente o arquivo selecionado direto no chat dele!
                  </p>
                </div>
              </div>

              {/* CARD DE UPLOAD DIRETO / DROPZONE */}
              <div className="bg-[#111726] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-emerald-400" />
                    Subir Novo Material (Upload Direto do Computador)
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowManualUrl(!showManualUrl)}
                    className="text-[11px] text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1 underline underline-offset-2"
                  >
                    <LinkIcon className="w-3 h-3" />
                    {showManualUrl ? 'Ocultar link manual' : 'Inserir link externo'}
                  </button>
                </div>

                {/* Input de arquivo invisível */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.webp,.gif,.mp3,.m4a,.wav,.ogg,.mp4,.mov,.webm,.zip"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                {/* Área Drag & Drop */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !isUploadingFile && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-500/10 scale-[0.99]'
                      : 'border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/60 bg-slate-950/40'
                  }`}
                >
                  {isUploadingFile ? (
                    <div className="flex flex-col items-center justify-center py-4 space-y-3">
                      <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                      <p className="text-xs font-bold text-white">{uploadProgress || 'Enviando arquivo...'}</p>
                      <p className="text-[11px] text-slate-400">Armazenando com segurança no servidor...</p>
                    </div>
                  ) : uploadedFileInfo && uploadSuccess ? (
                    <div className="flex flex-col items-center justify-center py-2 space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-white">{uploadedFileInfo.name}</p>
                      <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                        {uploadedFileInfo.size} • Upload Concluído
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Clique aqui se desejar trocar por outro arquivo
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-2.5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">
                          Clique aqui para selecionar do computador <span className="text-slate-400 font-normal">ou arraste e solte</span>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Aceita PDF, DOCX, Imagens (PNG/JPG), Áudios (MP3/M4A) e Vídeos (MP4) até 50MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mensagens de Erro ou Sucesso */}
                {uploadError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Formulário de Identificação do Material */}
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Nome / Título do Arquivo *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Amostra Módulo 1 em PDF"
                        value={newMatName}
                        onChange={(e) => setNewMatName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Tipo de Mídia *
                      </label>
                      <select
                        value={newMatType}
                        onChange={(e) => setNewMatType(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="document">📄 Documento / PDF</option>
                        <option value="image">🖼️ Imagem (PNG/JPG)</option>
                        <option value="video">🎥 Vídeo (MP4)</option>
                        <option value="audio">🎵 Áudio / Voz (MP3)</option>
                        <option value="link">🔗 Link Externo</option>
                      </select>
                    </div>
                  </div>

                  {showManualUrl && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        URL Pública do Arquivo
                      </label>
                      <input
                        type="url"
                        placeholder="https://... (preenchido automaticamente via upload ou cole um link)"
                        value={newMatUrl}
                        onChange={(e) => setNewMatUrl(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Instrução para a IA: Quando ela deve enviar este arquivo ao cliente?
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Ex: Enviar quando o cliente pedir uma demonstração, amostra ou resumo..."
                        value={newMatDesc}
                        onChange={(e) => setNewMatDesc(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddMaterial}
                        disabled={!newMatName.trim() || !newMatUrl.trim() || isUploadingFile}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                          !newMatName.trim() || !newMatUrl.trim() || isUploadingFile
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                            : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 active:scale-95'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Adicionar ao Curso</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* LISTA DE MATERIAIS ADICIONADOS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-200">
                    Materiais Cadastrados no Curso ({materials.length})
                  </p>
                  {materials.length > 0 && (
                    <span className="text-[11px] text-emerald-400">
                      Disponíveis para envio imediato pela IA
                    </span>
                  )}
                </div>

                <div className="space-y-2.5">
                  {materials.map((mat) => {
                    const isDoc = mat.type === 'document';
                    const isImg = mat.type === 'image';
                    const isVid = mat.type === 'video';
                    const isAud = mat.type === 'audio';

                    return (
                      <div
                        key={mat.id}
                        className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${
                              isDoc
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : isImg
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : isVid
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : isAud
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            }`}
                          >
                            {isDoc && <FileText className="w-4 h-4" />}
                            {isImg && <ImageIcon className="w-4 h-4" />}
                            {isVid && <VideoIcon className="w-4 h-4" />}
                            {isAud && <AudioIcon className="w-4 h-4" />}
                            {mat.type === 'link' && <LinkIcon className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-white truncate">{mat.name}</p>
                              <span className="text-[9px] px-2 py-0.5 rounded uppercase font-mono font-semibold bg-slate-800 text-slate-300">
                                {mat.type}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {mat.description || 'Disponível para envio automático pela IA'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <a
                            href={mat.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors border border-slate-700/60"
                            title="Abrir arquivo para teste"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Ver Arquivo</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveMaterial(mat.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Excluir material"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {materials.length === 0 && (
                    <div className="text-center py-8 px-4 bg-slate-900/30 border border-slate-800/80 rounded-2xl text-slate-500 text-xs">
                      <UploadCloud className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                      Nenhum material cadastrado para este curso ainda. Faça upload de uma amostra ou arquivo acima!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ABA 5: BÔNUS EXCLUSIVOS */}
          {activeTab === 'bonus' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-300">
                🎁 <b>Gatilho de Alto Valor Percebido:</b> Os bônus são apresentados pela IA antes de falar o preço,
                mostrando que o aluno está levando muito mais do que pagou.
              </div>

              <div className="space-y-2.5">
                {bonuses.map((bon) => (
                  <div
                    key={bon.id}
                    className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-2xl flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold flex-shrink-0">
                        <Gift className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-white">{bon.name}</p>
                          {bon.value && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold font-mono">
                              Vale R$ {bon.value.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">{bon.description}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveBonus(bon.id)}
                      className="text-slate-500 hover:text-rose-400 p-2 rounded-lg hover:bg-slate-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {bonuses.length === 0 && (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    Nenhum bônus cadastrado ainda. Adicione bônus abaixo para turbinar as vendas!
                  </div>
                )}
              </div>

              {/* Formulário Novo Bônus */}
              <div className="p-4 bg-[#111726] border border-slate-800 rounded-2xl space-y-3">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-400" /> Cadastrar Novo Bônus
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Nome do Bônus (ex: Comunidade VIP de Alunos)"
                      value={newBonusName}
                      onChange={(e) => setNewBonusName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Valor estimado (R$) ex: 97"
                      value={newBonusVal}
                      onChange={(e) => setNewBonusVal(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Descrição do que o bônus oferece..."
                    value={newBonusDesc}
                    onChange={(e) => setNewBonusDesc(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddBonus}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors"
                  >
                    Adicionar Bônus
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ABA 6: CHAVE PIX & COBRANÇA */}
          {activeTab === 'pix' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tipo de Chave PIX *</label>
                    <select
                      value={pixKeyType}
                      onChange={(e) => setPixKeyType(e.target.value as any)}
                      className="w-full bg-[#111726] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white"
                    >
                      <option value="phone">Telefone / Celular</option>
                      <option value="cpf">CPF</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="email">E-mail</option>
                      <option value="random">Chave Aleatória (EVP)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Chave PIX Oficial *</label>
                    <input
                      type="text"
                      required
                      placeholder="Digite sua chave PIX..."
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      className="w-full bg-[#111726] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Nome do Titular / Beneficiário
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Narciso"
                        value={pixName}
                        onChange={(e) => setPixName(e.target.value)}
                        className="w-full bg-[#111726] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Cidade</label>
                      <input
                        type="text"
                        placeholder="Ex: SAO PAULO"
                        value={pixCity}
                        onChange={(e) => setPixCity(e.target.value)}
                        className="w-full bg-[#111726] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Prévia Visual do PIX que o cliente recebe no WhatsApp */}
                <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
                      <QrCode className="w-4 h-4" /> Prévia da Mensagem de Cobrança no WhatsApp
                    </p>
                    <div className="bg-[#111726] p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
                      <p className="text-slate-400">💳 *DADOS PARA PAGAMENTO VIA PIX:*</p>
                      <p>📚 *Curso:* {name || 'Curso Exemplo'}</p>
                      <p>💰 *Valor:* R$ {Number(price || 0).toFixed(2)}</p>
                      <p>👤 *Beneficiário:* {pixName || 'Nome'}</p>
                      <p>🔑 *Chave PIX:* {pixKey || 'Chave...'}</p>
                    </div>

                    {generatedBrcode && (
                      <div className="mt-3">
                        <p className="text-[10px] text-slate-400 font-semibold mb-1">Código Copia e Cola Oficial:</p>
                        <div className="p-2 bg-slate-950 rounded-lg text-[9px] font-mono text-slate-400 break-all select-all border border-slate-800">
                          {generatedBrcode}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={handleCopyPix}
                      disabled={!generatedBrcode}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                      {copiedPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPix ? 'Copiado!' : 'Testar Copia e Cola'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer do Modal */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-300 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : course ? 'Salvar Alterações' : 'Criar Curso de IA'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
