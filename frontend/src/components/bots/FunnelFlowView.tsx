import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Copy, 
  Check, 
  Play,
  Zap,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  Clock,
  MessageSquare,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sliders,
  RotateCcw,
  ExternalLink,
  Layers,
  Info,
  Package,
  UploadCloud,
  Loader2,
  Camera,
  Link as LinkIcon
} from 'lucide-react';
import { Course, FlowStep, FlowStepType } from '../../types';
import { supabase } from '../../lib/supabase';

interface FunnelFlowViewProps {
  courses: Course[];
  onOpenSimulator: () => void;
  onSaveCourse?: (courseData: Partial<Course>) => Promise<void> | void;
}

// Modelos pré-configurados de funis
const TEMPLATES: Record<string, { name: string; description: string; steps: FlowStep[] }> = {
  voto_confianca: {
    name: 'Funil Voto de Confiança (Padrão de Alta Conversão)',
    description: 'Envia foto demonstrativa, apresenta os benefícios, entrega os materiais adiantados e cobra no PIX com isca de bônus.',
    steps: [
      {
        id: 'step_1',
        type: 'image',
        title: 'Foto / Banner do Produto',
        caption: 'Olha que incrível os resultados que você vai aprender a produzir logo na primeira semana! 🚀',
        content: '',
      },
      {
        id: 'step_2',
        type: 'text',
        title: 'Apresentação & Voto de Confiança',
        content: 'Olá! Sou consultor oficial do curso. Eu confio tanto na honestidade das pessoas e na qualidade do nosso material que vou fazer diferente: posso te mandar todo o material agora mesmo para você conferir antes de pagar? Se gostar, faz o PIX depois. Posso te mandar?',
      },
      {
        id: 'step_3',
        type: 'wait_reply',
        title: 'Aguardar Resposta do Cliente',
        wait_condition: 'Confirmação (Sim / Pode mandar / Quero)',
      },
      {
        id: 'step_4',
        type: 'deliver_materials',
        title: 'Disparo Automático das Apostilas / Arquivos',
        content: 'Maravilha! Sabia que podia confiar em você! Já estou te enviando todos os materiais completos acima para você conferir 📚✨',
      },
      {
        id: 'step_5',
        type: 'generate_pix',
        title: 'Cobrança PIX Automática (Copia e Cola)',
        content: 'Aqui estão os dados para pagamento do valor promocional. E assim que fizer o PIX e mandar o comprovante aqui, libero seu SUPER BÔNUS EXCLUSIVO! 🎁',
      },
      {
        id: 'step_6',
        type: 'wait_reply',
        title: 'Aguardar Comprovante do PIX',
        wait_condition: 'Pagamento (Paguei / Já fiz o PIX / Comprovante)',
      },
      {
        id: 'step_7',
        type: 'deliver_bonus',
        title: 'Liberação do Super Bônus',
        content: 'Sensacional! Pagamento confirmado com sucesso! Muito obrigado pela sua integridade e parceria. Seu acesso vitalício está liberado e segue seu Super Bônus exclusivo acima! 👏🎉',
      },
    ],
  },
  direto_pix: {
    name: 'Funil Rápido (Demonstração ➔ PIX Direto)',
    description: 'Apresenta o curso com áudio PTT explicativo e conduz imediatamente para o pagamento via PIX.',
    steps: [
      {
        id: 'step_1',
        type: 'audio',
        title: 'Áudio Gravado na Hora (PTT Microfone Verde)',
        content: '',
      },
      {
        id: 'step_2',
        type: 'text',
        title: 'Oferta Promocional com Desconto',
        content: 'Nossa turma com desconto especial de lançamento está se encerrando hoje! O valor normal é bem mais alto, mas para você sai por apenas o valor promocional com acesso vitalício.',
      },
      {
        id: 'step_3',
        type: 'generate_pix',
        title: 'Cobrança PIX Automática (Copia e Cola)',
        content: 'Segue abaixo a chave oficial e o código Copia e Cola para você garantir sua vaga agora:',
      },
      {
        id: 'step_4',
        type: 'wait_reply',
        title: 'Aguardar Envio do Comprovante',
        wait_condition: 'Comprovante do cliente',
      },
      {
        id: 'step_5',
        type: 'deliver_materials',
        title: 'Disparo dos Acessos e Apostilas',
        content: 'Parabéns pela decisão! Seus materiais estão liberados imediatamente acima! 🚀',
      },
    ],
  },
  video_demo: {
    name: 'Funil com Vídeo Demonstrativo',
    description: 'Envia primeiro um vídeo dos bastidores ou resultados para encantar o lead antes da oferta.',
    steps: [
      {
        id: 'step_1',
        type: 'video',
        title: 'Vídeo Demonstrativo do Curso',
        caption: 'Dá uma olhada nesse vídeo rápido mostrando tudo o que você vai dominar na prática 👇🎥',
        content: '',
      },
      {
        id: 'step_2',
        type: 'text',
        title: 'Mensagem com Chamada para Ação',
        content: 'Gostou do vídeo? O método é 100% passo a passo e você não precisa de nenhuma experiência anterior. Quer que eu te envie a apostila de demonstração para você ver?',
      },
      {
        id: 'step_3',
        type: 'wait_reply',
        title: 'Aguardar Resposta do Lead',
        wait_condition: 'Resposta do cliente',
      },
      {
        id: 'step_4',
        type: 'deliver_materials',
        title: 'Entrega dos Materiais',
        content: 'Aqui está! Confira o material acima e me diz o que achou!',
      },
      {
        id: 'step_5',
        type: 'generate_pix',
        title: 'Chave e Código PIX',
        content: 'Para confirmar sua inscrição e garantir todos os bônus, faça o PIX de valor promocional:',
      },
    ],
  },
};

interface StepMediaUploaderProps {
  step: FlowStep;
  mediaType: 'image' | 'video' | 'audio';
  onUpdate: (data: Partial<FlowStep>) => void;
  organizationId?: string;
}

const StepMediaUploader: React.FC<StepMediaUploaderProps> = ({
  step,
  mediaType,
  onUpdate,
  organizationId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showManualUrl, setShowManualUrl] = useState(false);

  const config = useMemo(() => {
    switch (mediaType) {
      case 'image':
        return {
          accept: 'image/*',
          btnTitle: 'Tirar Foto ou Escolher da Galeria',
          emptyTitle: 'Subir Foto do Celular ou Computador',
          emptyDesc: 'Toque para abrir a câmera ou escolher foto da galeria (JPG, PNG, WebP)',
          icon: ImageIcon,
          colorClass: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
          badgeText: 'Foto Anexada',
          placeholder: 'https://exemplo.com/foto-do-produto.jpg',
          label: 'URL da Imagem / Foto:',
        };
      case 'video':
        return {
          accept: 'video/mp4,video/quicktime,video/webm,video/*',
          btnTitle: 'Gravar ou Escolher Vídeo do Celular',
          emptyTitle: 'Subir Vídeo do Celular ou Computador',
          emptyDesc: 'Toque para escolher vídeo da galeria ou gravar (MP4, MOV, máx 50MB)',
          icon: Video,
          colorClass: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
          badgeText: 'Vídeo Carregado',
          placeholder: 'https://exemplo.com/demonstracao.mp4',
          label: 'URL do Vídeo (.mp4):',
        };
      case 'audio':
        return {
          accept: 'audio/mpeg,audio/ogg,audio/wav,audio/mp4,audio/m4a,audio/*',
          btnTitle: 'Gravar ou Escolher Áudio do Celular',
          emptyTitle: 'Subir Áudio de Voz do Celular',
          emptyDesc: 'Toque para escolher gravação de voz ou arquivo de áudio (MP3, OGG, M4A)',
          icon: Mic,
          colorClass: 'text-teal-400 border-teal-500/30 bg-teal-500/10',
          badgeText: 'Áudio PTT de Voz',
          placeholder: 'https://exemplo.com/audio-explicativo.ogg',
          label: 'URL do Arquivo de Áudio (.ogg / .mp3):',
        };
    }
  }, [mediaType]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = mediaType === 'video' ? 50 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError(`Arquivo muito grande! O limite é ${mediaType === 'video' ? '50MB' : '20MB'}.`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(`Enviando ${file.name}...`);
    setUploadError(null);

    try {
      const cleanFileName = file.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '_');

      const orgFolder = organizationId || 'geral';
      const filePath = `${orgFolder}/flow_${Date.now()}_${cleanFileName}`;

      const { error } = await supabase.storage
        .from('course-materials')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Erro no Supabase Storage:', error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('course-materials')
        .getPublicUrl(filePath);

      onUpdate({ content: publicUrl });
    } catch (err: any) {
      console.error('Erro de upload:', err);
      setUploadError(err.message || 'Erro ao subir arquivo. Tente novamente.');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const IconComp = config.icon;

  return (
    <div className="space-y-3">
      {/* Input nativo invisível com suporte a câmera/galeria no celular */}
      <input
        ref={fileInputRef}
        type="file"
        accept={config.accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Se ainda não tem arquivo nem URL */}
      {!step.content ? (
        <div className="space-y-2">
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed transition-all p-5 flex flex-col items-center justify-center text-center gap-3 group ${
              isUploading 
                ? 'border-emerald-500/50 bg-emerald-950/20' 
                : 'border-slate-800 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-900/40'
            }`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2 py-2">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                <span className="text-xs text-emerald-300 font-medium">{uploadProgress}</span>
                <span className="text-[10px] text-slate-400">Gravando no storage com link seguro...</span>
              </div>
            ) : (
              <>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg ${config.colorClass}`}>
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-200 flex items-center justify-center gap-2">
                    <span>{config.btnTitle}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 max-w-sm">
                    {config.emptyDesc}
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-1 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-900/30 flex items-center gap-2 transition-all active:scale-95"
                >
                  <IconComp className="w-4 h-4" />
                  <span>Escolher do Celular / PC</span>
                </button>
              </>
            )}
          </div>

          {uploadError && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Opção alternativa de colar link manual */}
          <div className="pt-1">
            {!showManualUrl ? (
              <button
                type="button"
                onClick={() => setShowManualUrl(true)}
                className="text-[11px] text-slate-500 hover:text-slate-400 flex items-center gap-1.5 transition-colors"
              >
                <LinkIcon className="w-3 h-3" />
                <span>Ou prefere colar uma URL / link da internet?</span>
              </button>
            ) : (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {config.label}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowManualUrl(false)}
                    className="text-[10px] text-slate-500 hover:text-slate-300"
                  >
                    Ocultar
                  </button>
                </div>
                <input
                  type="text"
                  value={step.content || ''}
                  onChange={(e) => onUpdate({ content: e.target.value })}
                  className="w-full bg-[#111726] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500 transition-all font-mono"
                  placeholder={config.placeholder}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Quando JÁ possui mídia vinculada */
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            {mediaType === 'image' && (
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="relative group/img flex-shrink-0">
                  <img
                    src={step.content}
                    alt="Preview"
                    className="w-32 h-32 sm:w-28 sm:h-28 object-cover rounded-xl border border-slate-700 shadow-lg bg-slate-900"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                    }}
                  />
                  <a
                    href={step.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 rounded-xl flex items-center justify-center text-white transition-opacity"
                    title="Ver em tamanho original"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
                <div className="flex-1 w-full space-y-2 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Foto Carregada
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono break-all line-clamp-1">
                    {step.content}
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 flex-wrap">
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                      <span>Trocar Foto</span>
                    </button>
                    <a
                      href={step.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Ver Grande
                    </a>
                    <button
                      type="button"
                      onClick={() => onUpdate({ content: '' })}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remover
                    </button>
                  </div>
                </div>
              </div>
            )}

            {mediaType === 'video' && (
              <div className="space-y-3">
                <video
                  src={step.content}
                  controls
                  className="w-full max-h-56 rounded-xl bg-black border border-slate-800"
                />
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Vídeo Carregado
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
                      <span>Trocar Vídeo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdate({ content: '' })}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remover
                    </button>
                  </div>
                </div>
              </div>
            )}

            {mediaType === 'audio' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    <Mic className="w-3.5 h-3.5" /> Áudio PTT Pronto (Voz Gravada)
                  </span>
                  <span className="text-[10px] text-slate-500">Reproduzir para testar 👇</span>
                </div>
                <audio
                  src={step.content}
                  controls
                  className="w-full h-10 rounded-lg outline-none"
                />
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                  <p className="text-[10px] text-teal-400/90">
                    💡 O WhatsApp entregará esse áudio como mensagem de voz gravada na hora (microfone verde).
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mic className="w-3.5 h-3.5" />}
                      <span>Trocar Áudio</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdate({ content: '' })}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remover
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Opção de ver/editar o link direto */}
          <div>
            {!showManualUrl ? (
              <button
                type="button"
                onClick={() => setShowManualUrl(true)}
                className="text-[10px] text-slate-500 hover:text-slate-400 flex items-center gap-1"
              >
                <LinkIcon className="w-3 h-3" />
                <span>Ver / editar link direto do arquivo</span>
              </button>
            ) : (
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-slate-400 font-mono">
                    URL pública no Storage:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowManualUrl(false)}
                    className="text-[10px] text-slate-500 hover:text-slate-300"
                  >
                    Fechar
                  </button>
                </div>
                <input
                  type="text"
                  value={step.content || ''}
                  onChange={(e) => onUpdate({ content: e.target.value })}
                  className="w-full bg-[#111726] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const FunnelFlowView: React.FC<FunnelFlowViewProps> = ({ 
  courses, 
  onOpenSimulator,
  onSaveCourse 
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);

  // Curso selecionado atualmente
  const currentCourse = useMemo(() => {
    return courses.find((c) => c.id === selectedCourseId) || courses[0];
  }, [courses, selectedCourseId]);

  // Carrega ou inicializa os passos do curso selecionado
  useEffect(() => {
    if (!currentCourse) {
      setSteps([]);
      return;
    }

    // 1. Tenta pegar de flow_steps
    if (currentCourse.flow_steps && currentCourse.flow_steps.length > 0) {
      setSteps(currentCourse.flow_steps);
      setIsDirty(false);
      return;
    }

    // 2. Tenta extrair de ai_persona (comentário <!--FLOW_STEPS:...-->)
    if (currentCourse.ai_persona) {
      const match = currentCourse.ai_persona.match(/<!--FLOW_STEPS:(.*?)-->/s);
      if (match) {
        try {
          const parsed = JSON.parse(match[1]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSteps(parsed);
            setIsDirty(false);
            return;
          }
        } catch (e) {
          console.error('Erro ao ler flow_steps salvos:', e);
        }
      }
    }

    // 3. Fallback: Usa o template de Voto de Confiança adaptado ao curso
    const defaultSteps: FlowStep[] = TEMPLATES.voto_confianca.steps.map((s, idx) => ({
      ...s,
      id: `step_${Date.now()}_${idx}`,
      caption: s.type === 'image' 
        ? `Olha que incrível o conteúdo do curso *${currentCourse.name}*! 🚀`
        : s.caption,
      content: s.type === 'text' && idx === 1
        ? `Olá! Sou consultor oficial do curso *${currentCourse.name}*. Eu confio tanto na honestidade das pessoas e na qualidade do nosso conteúdo que vou fazer algo especial: posso te mandar os materiais agora mesmo para você conferir antes de pagar? O valor é apenas R$ ${Number(currentCourse.price).toFixed(2)}. Posso te mandar?`
        : s.content,
    }));

    setSteps(defaultSteps);
    setIsDirty(false);
  }, [currentCourse?.id]);

  // Mover passo para cima
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setSteps((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
    setIsDirty(true);
  };

  // Mover passo para baixo
  const handleMoveDown = (index: number) => {
    if (index === steps.length - 1) return;
    setSteps((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
    setIsDirty(true);
  };

  // Excluir passo
  const handleDeleteStep = (id: string) => {
    if (steps.length <= 1) {
      alert('O fluxo precisa ter pelo menos 1 ação.');
      return;
    }
    setSteps((prev) => prev.filter((s) => s.id !== id));
    if (editingStepId === id) setEditingStepId(null);
    setIsDirty(true);
  };

  // Atualizar campo de um passo
  const handleUpdateStep = (id: string, updates: Partial<FlowStep>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    setIsDirty(true);
  };

  // Adicionar novo bloco/passo
  const handleAddStep = (type: FlowStepType) => {
    let title = 'Nova Ação';
    let content = '';
    let caption = '';
    let waitCondition = '';

    switch (type) {
      case 'image':
        title = 'Enviar Foto / Banner';
        caption = 'Confira os detalhes na imagem acima! 📸';
        break;
      case 'text':
        title = 'Enviar Mensagem de Texto';
        content = 'Olá! Gostaria de tirar alguma dúvida sobre o curso?';
        break;
      case 'audio':
        title = 'Enviar Áudio PTT (Microfone Verde)';
        break;
      case 'video':
        title = 'Enviar Vídeo Demonstrativo';
        caption = 'Veja a demonstração no vídeo acima! 🎥';
        break;
      case 'wait_reply':
        title = 'Aguardar Resposta do Cliente';
        waitCondition = 'Confirmação do cliente (Sim / Pode mandar)';
        break;
      case 'generate_pix':
        title = 'Gerar Cobrança PIX Automática';
        content = `Segue abaixo o código Copia e Cola no valor de R$ ${Number(currentCourse?.price || 9.99).toFixed(2)}:`;
        break;
      case 'deliver_materials':
        title = 'Entregar Apostilas / Materiais';
        content = 'Aqui estão seus materiais completos! Bons estudos! 📚✨';
        break;
      case 'deliver_bonus':
        title = 'Liberar Super Bônus';
        content = 'Parabéns pela compra! Segue seu Super Bônus exclusivo acima! 🎁';
        break;
    }

    const newStep: FlowStep = {
      id: `step_${Date.now()}`,
      type,
      title,
      content,
      caption,
      wait_condition: waitCondition,
    };

    setSteps((prev) => {
      if (insertIndex !== null && insertIndex >= 0) {
        const next = [...prev];
        next.splice(insertIndex + 1, 0, newStep);
        return next;
      }
      return [...prev, newStep];
    });

    setEditingStepId(newStep.id);
    setAddModalOpen(false);
    setInsertIndex(null);
    setIsDirty(true);
  };

  // Aplicar modelo rápido
  const handleApplyTemplate = (key: string) => {
    const tpl = TEMPLATES[key];
    if (!tpl || !currentCourse) return;
    if (isDirty && !confirm(`Deseja substituir o fluxo atual pelo modelo "${tpl.name}"?`)) return;

    const adaptedSteps = tpl.steps.map((s, idx) => ({
      ...s,
      id: `step_${Date.now()}_${idx}`,
      caption: s.type === 'image' 
        ? `Olha que incrível o conteúdo do curso *${currentCourse.name}*! 🚀`
        : s.caption,
      content: s.type === 'text' && idx === 1
        ? `Olá! Sou consultor do curso *${currentCourse.name}*. Posso te mandar o material agora para você dar uma olhada antes de pagar? O valor é apenas R$ ${Number(currentCourse.price).toFixed(2)}. Posso mandar?`
        : s.content,
    }));

    setSteps(adaptedSteps);
    setIsDirty(true);
  };

  // Salvar fluxo no Supabase
  const handleSaveFlow = async () => {
    if (!currentCourse || !onSaveCourse) return;

    setIsSaving(true);
    try {
      // Limpa comentário anterior de ai_persona e embute o novo JSON de flow_steps
      const cleanPersona = (currentCourse.ai_persona || '')
        .replace(/<!--FLOW_STEPS:.*?-->/gs, '')
        .trim();

      const personaWithFlow = `${cleanPersona}\n\n<!--FLOW_STEPS:${JSON.stringify(steps)}-->`;

      if (onSaveCourse) {
        await onSaveCourse({
          id: currentCourse.id,
          ai_persona: personaWithFlow,
        });
      }

      // Atualiza localmente o curso selecionado para refletir a persona salva
      currentCourse.ai_persona = personaWithFlow;

      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      alert('Erro ao salvar fluxo: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsSaving(false);
    }
  };

  // Helper visual de cor e ícone por tipo de bloco
  const getStepTypeInfo = (type: FlowStepType) => {
    switch (type) {
      case 'image':
        return {
          icon: ImageIcon,
          label: 'Enviar Foto / Imagem',
          color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
          desc: 'Dispara foto do produto ou banner com legenda',
        };
      case 'text':
        return {
          icon: MessageSquare,
          label: 'Enviar Mensagem de Texto',
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          desc: 'Mensagem de apresentação, voto de confiança ou resposta',
        };
      case 'audio':
        return {
          icon: Mic,
          label: 'Enviar Áudio PTT (Voz Gravada)',
          color: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
          badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
          desc: 'Áudio nativo com microfone verde (como falado na hora)',
        };
      case 'video':
        return {
          icon: Video,
          label: 'Enviar Vídeo',
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          desc: 'Vídeo demonstrativo com legenda e reprodução direta',
        };
      case 'wait_reply':
        return {
          icon: Clock,
          label: 'Aguardar Resposta do Cliente',
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          desc: 'Pausa o robô e aguarda a mensagem ou decisão do lead',
        };
      case 'generate_pix':
        return {
          icon: CreditCard,
          label: 'Cobrança PIX Automática',
          color: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30',
          badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
          desc: 'Gera chave, dados bancários e mensagem exclusiva Copia e Cola',
        };
      case 'deliver_materials':
        return {
          icon: Package,
          label: 'Entregar Apostilas / Materiais',
          color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          desc: 'Dispara automaticamente os arquivos cadastrados no curso',
        };
      case 'deliver_bonus':
        return {
          icon: Gift,
          label: 'Liberar Super Bônus',
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          desc: 'Entrega os arquivos de bônus prometidos após confirmação',
        };
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16 font-sans">
      {/* 1. Header do Construtor de Fluxos */}
      <div className="p-6 bg-[#161c2d] border border-slate-800 rounded-3xl shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20 flex-shrink-0">
            <Workflow className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base font-extrabold text-white">
                Construtor Visual de Fluxo (Flow Builder)
              </h3>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {steps.length} {steps.length === 1 ? 'Ação' : 'Ações'}
              </span>
              {isDirty && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                  Alterações não salvas
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Monte a sequência de mensagens, mídias e cobranças de cada curso de forma totalmente personalizada.
            </p>
          </div>
        </div>

        {/* Controles de Topo: Seleção de Curso + Salvar + Testar */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end flex-wrap">
          {courses.length > 0 && (
            <div className="flex items-center gap-2 bg-[#111726] border border-slate-800 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-semibold text-slate-400">Curso:</span>
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  if (isDirty && !confirm('Você tem alterações não salvas. Deseja trocar de curso assim mesmo?')) return;
                  setSelectedCourseId(e.target.value);
                }}
                className="bg-transparent text-xs font-bold text-emerald-400 focus:outline-none cursor-pointer max-w-[200px] truncate"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#161c2d] text-white">
                    {c.name} (R$ {Number(c.price).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Botão Salvar Fluxo */}
          <button
            type="button"
            onClick={handleSaveFlow}
            disabled={isSaving}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95 ${
              saveSuccess
                ? 'bg-emerald-500 text-slate-950 font-black'
                : isDirty
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 shadow-emerald-500/25 ring-2 ring-emerald-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            {isSaving ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Fluxo Salvo!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Fluxo</span>
              </>
            )}
          </button>

          {/* Testar no Simulador */}
          <button
            type="button"
            onClick={onOpenSimulator}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
            title="Abrir o playground para simular conversa com o bot"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
            <span className="hidden sm:inline">Testar no Simulador</span>
          </button>
        </div>
      </div>

      {/* 2. Barra Rápida de Templates Pré-Prontos */}
      <div className="p-4 bg-[#111726]/80 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-semibold">
          <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Modelos Rápidos de Funil:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <button
            type="button"
            onClick={() => handleApplyTemplate('voto_confianca')}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-slate-300 text-[11px] font-medium transition-all"
          >
            🛡️ Voto de Confiança (Alta Conversão)
          </button>
          <button
            type="button"
            onClick={() => handleApplyTemplate('direto_pix')}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/40 text-slate-300 text-[11px] font-medium transition-all"
          >
            ⚡ Áudio PTT + PIX Direto
          </button>
          <button
            type="button"
            onClick={() => handleApplyTemplate('video_demo')}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 text-slate-300 text-[11px] font-medium transition-all"
          >
            🎥 Vídeo Demonstrativo
          </button>
        </div>
      </div>

      {/* 3. CANVAS / SEQUÊNCIA DE BLOCOS CONECTADOS */}
      <div className="space-y-4 max-w-4xl mx-auto pt-2">
        {steps.map((step, idx) => {
          const typeInfo = getStepTypeInfo(step.type);
          const Icon = typeInfo.icon;
          const isExpanded = editingStepId === step.id;
          const isWait = step.type === 'wait_reply';

          return (
            <React.Fragment key={step.id}>
              {/* Card do Bloco */}
              <div 
                className={`rounded-3xl border transition-all duration-200 relative shadow-xl overflow-hidden ${
                  isExpanded
                    ? 'bg-[#151c2e] border-emerald-500/60 ring-2 ring-emerald-500/20'
                    : isWait
                    ? 'bg-[#161c2d] border-amber-500/30 hover:border-amber-500/50'
                    : 'bg-[#141a29] border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header da Caixinha */}
                <div className="p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-slate-800/60">
                  <div className="flex items-center gap-3">
                    {/* Badge de Ordem */}
                    <div className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono font-black text-slate-400 flex items-center justify-center flex-shrink-0">
                      #{idx + 1}
                    </div>

                    {/* Ícone com Cor */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${typeInfo.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Título e Tipo */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{step.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${typeInfo.badgeColor}`}>
                          {typeInfo.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
                        {typeInfo.desc}
                      </p>
                    </div>
                  </div>

                  {/* Ações da Caixinha: Mover Cima/Baixo, Editar, Excluir */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveUp(idx)}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                      title="Mover para cima"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === steps.length - 1}
                      onClick={() => handleMoveDown(idx)}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                      title="Mover para baixo"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingStepId(isExpanded ? null : step.id)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                        isExpanded
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      <span>{isExpanded ? 'Concluir' : 'Editar'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteStep(step.id)}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Remover ação"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Conteúdo / Pré-visualização do Bloco */}
                <div className="p-4 sm:p-5 bg-[#0e1422]/60">
                  {/* Pré-visualização quando recolhido */}
                  {!isExpanded && (
                    <div>
                      {step.type === 'text' && (
                        <div className="p-3 rounded-xl bg-[#131b2e] border border-slate-800/80 text-xs text-slate-200 leading-relaxed font-sans">
                          {step.content || <span className="text-slate-500 italic">Nenhum texto definido ainda...</span>}
                        </div>
                      )}

                      {step.type === 'image' && (
                        <div className="space-y-2 text-xs">
                          {step.content ? (
                            <div className="flex items-center gap-3 p-2 bg-[#131b2e] rounded-xl border border-slate-800">
                              <img src={step.content} alt="Preview" className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                              <div className="truncate">
                                <p className="font-semibold text-slate-200 truncate">{step.caption || 'Sem legenda'}</p>
                                <p className="text-[10px] text-slate-500 truncate">{step.content}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-slate-400 italic">
                              {step.caption ? `Legenda: "${step.caption}"` : 'Foto sem legenda definida.'}
                            </p>
                          )}
                        </div>
                      )}

                      {step.type === 'audio' && (
                        <div className="p-3 bg-[#131b2e] rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 text-teal-300">
                            <Mic className="w-4 h-4 text-teal-400" />
                            <span className="font-bold">Áudio PTT Gravado na Hora</span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                            Microfone Verde
                          </span>
                        </div>
                      )}

                      {step.type === 'video' && (
                        <div className="p-3 bg-[#131b2e] rounded-xl border border-slate-800 text-xs text-slate-300">
                          <div className="flex items-center gap-2 text-purple-300">
                            <Video className="w-4 h-4 text-purple-400" />
                            <span className="font-bold">Vídeo do Produto</span>
                          </div>
                          {step.caption && <p className="text-[11px] text-slate-400 mt-1">{step.caption}</p>}
                        </div>
                      )}

                      {step.type === 'wait_reply' && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center gap-2.5">
                          <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          <div>
                            <span className="font-bold">O robô pausa o envio e aguarda a mensagem do cliente.</span>
                            <p className="text-[11px] text-amber-300/80 mt-0.5">
                              Condição esperada: <b>{step.wait_condition || 'Qualquer confirmação'}</b>
                            </p>
                          </div>
                        </div>
                      )}

                      {step.type === 'generate_pix' && (
                        <div className="p-3 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 text-xs text-fuchsia-200 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <CreditCard className="w-4 h-4 text-fuchsia-400 flex-shrink-0" />
                            <div>
                              <span className="font-bold">Disparo dos dados PIX + Código Copia e Cola</span>
                              <p className="text-[11px] text-fuchsia-300/80 mt-0.5">
                                Valor: <b>R$ {Number(currentCourse?.price || 9.99).toFixed(2)}</b> (Chave: {currentCourse?.pix_key || 'Chave PIX'})
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 font-bold">
                            Automático
                          </span>
                        </div>
                      )}

                      {step.type === 'deliver_materials' && (
                        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-blue-400" />
                              <span className="font-bold">Entrega Automática dos Materiais</span>
                            </div>
                            <span className="text-[10px] text-blue-300">
                              {currentCourse?.materials?.length || 0} arquivos configurados
                            </span>
                          </div>
                          {step.content && <p className="text-[11px] text-blue-200/80 italic">{step.content}</p>}
                        </div>
                      )}

                      {step.type === 'deliver_bonus' && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 space-y-1">
                          <div className="flex items-center gap-2">
                            <Gift className="w-4 h-4 text-rose-400" />
                            <span className="font-bold">Liberação do Super Bônus</span>
                          </div>
                          {step.content && <p className="text-[11px] text-rose-200/80 italic">{step.content}</p>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Formulário de Edição Inline quando expandido */}
                  {isExpanded && (
                    <div className="space-y-4 animate-fadeIn">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                          Título Interno da Ação:
                        </label>
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => handleUpdateStep(step.id, { title: e.target.value })}
                          className="w-full bg-[#111726] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500 transition-all"
                          placeholder="Ex: Apresentação inicial do produto"
                        />
                      </div>

                      {/* Campos específicos por tipo */}
                      {step.type === 'text' && (
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                            Texto da Mensagem enviada pelo Bot:
                          </label>
                          <textarea
                            rows={4}
                            value={step.content || ''}
                            onChange={(e) => handleUpdateStep(step.id, { content: e.target.value })}
                            className="w-full bg-[#111726] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-emerald-500 leading-relaxed transition-all"
                            placeholder="Digite a mensagem exata que o bot deve mandar..."
                          />
                        </div>
                      )}

                      {step.type === 'image' && (
                        <div className="space-y-3">
                          <StepMediaUploader
                            step={step}
                            mediaType="image"
                            onUpdate={(data) => handleUpdateStep(step.id, data)}
                            organizationId={currentCourse?.organization_id}
                          />
                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                              Legenda que acompanha a Foto (Opcional):
                            </label>
                            <textarea
                              rows={2}
                              value={step.caption || ''}
                              onChange={(e) => handleUpdateStep(step.id, { caption: e.target.value })}
                              className="w-full bg-[#111726] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-emerald-500 transition-all"
                              placeholder="Legenda anexada junto da foto..."
                            />
                          </div>
                        </div>
                      )}

                      {step.type === 'video' && (
                        <div className="space-y-3">
                          <StepMediaUploader
                            step={step}
                            mediaType="video"
                            onUpdate={(data) => handleUpdateStep(step.id, data)}
                            organizationId={currentCourse?.organization_id}
                          />
                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                              Legenda do Vídeo:
                            </label>
                            <input
                              type="text"
                              value={step.caption || ''}
                              onChange={(e) => handleUpdateStep(step.id, { caption: e.target.value })}
                              className="w-full bg-[#111726] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500 transition-all"
                              placeholder="Legenda do vídeo..."
                            />
                          </div>
                        </div>
                      )}

                      {step.type === 'audio' && (
                        <div>
                          <StepMediaUploader
                            step={step}
                            mediaType="audio"
                            onUpdate={(data) => handleUpdateStep(step.id, data)}
                            organizationId={currentCourse?.organization_id}
                          />
                        </div>
                      )}

                      {step.type === 'wait_reply' && (
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                            Resposta esperada do cliente para continuar o fluxo:
                          </label>
                          <input
                            type="text"
                            value={step.wait_condition || ''}
                            onChange={(e) => handleUpdateStep(step.id, { wait_condition: e.target.value })}
                            className="w-full bg-[#111726] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500 transition-all"
                            placeholder="Ex: Confirmação (Sim / Pode mandar / Quero)"
                          />
                          <p className="text-[10px] text-amber-300 mt-1.5">
                            Quando o cliente responder, o robô avança imediatamente para o próximo bloco da sequência.
                          </p>
                        </div>
                      )}

                      {(step.type === 'generate_pix' || step.type === 'deliver_materials' || step.type === 'deliver_bonus') && (
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                            Texto da Mensagem de Acompanhamento:
                          </label>
                          <textarea
                            rows={3}
                            value={step.content || ''}
                            onChange={(e) => handleUpdateStep(step.id, { content: e.target.value })}
                            className="w-full bg-[#111726] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-emerald-500 transition-all"
                            placeholder="Mensagem explicativa que vai junto..."
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Conector Visual entre Blocos com Botão de Inserir no Meio */}
              {idx < steps.length - 1 && (
                <div className="flex flex-col items-center justify-center my-1 relative group/conn py-1">
                  <div className="w-0.5 h-6 bg-gradient-to-b from-slate-700 to-slate-800 group-hover/conn:from-emerald-500 group-hover/conn:to-teal-400 transition-colors" />
                  
                  <button
                    type="button"
                    onClick={() => {
                      setInsertIndex(idx);
                      setAddModalOpen(true);
                    }}
                    className="opacity-0 group-hover/conn:opacity-100 transition-all px-3 py-1 rounded-full bg-slate-900 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold flex items-center gap-1 shadow-lg hover:scale-105 active:scale-95"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Inserir Ação Aqui</span>
                  </button>

                  <div className="w-0.5 h-6 bg-gradient-to-b from-slate-800 to-slate-700 group-hover/conn:from-teal-400 group-hover/conn:to-emerald-500 transition-colors" />
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* 4. Botão Principal: Adicionar Nova Ação ao Final */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setInsertIndex(null);
              setAddModalOpen(true);
            }}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs hover:from-emerald-400 hover:to-teal-300 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Adicionar Nova Ação ao Fluxo</span>
          </button>

          {isDirty && (
            <button
              type="button"
              onClick={handleSaveFlow}
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>Salvar Alterações</span>
            </button>
          )}
        </div>
      </div>

      {/* 5. MODAL SELETOR DE NOVO BLOCO */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#121827] border border-slate-800 w-full max-w-xl rounded-3xl p-6 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-emerald-400" />
                  <span>Escolha o Tipo de Ação</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {insertIndex !== null ? `Inserindo entre os blocos #${insertIndex + 1} e #${insertIndex + 2}` : 'Adicionando ao final do fluxo'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Grid com os 8 Tipos de Caixinhas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { type: 'image' as FlowStepType, title: 'Foto / Banner', desc: 'Dispara imagem com ou sem legenda', icon: ImageIcon, color: 'text-cyan-400 border-cyan-500/30 hover:border-cyan-500 bg-cyan-500/5' },
                { type: 'text' as FlowStepType, title: 'Mensagem de Texto', desc: 'Apresentação, perguntas ou roteiro', icon: MessageSquare, color: 'text-emerald-400 border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/5' },
                { type: 'audio' as FlowStepType, title: 'Áudio PTT (Voz)', desc: 'Áudio gravado na hora com microfone verde', icon: Mic, color: 'text-teal-400 border-teal-500/30 hover:border-teal-500 bg-teal-500/5' },
                { type: 'video' as FlowStepType, title: 'Vídeo Demonstrativo', desc: 'Vídeo MP4 com reprodução direta', icon: Video, color: 'text-purple-400 border-purple-500/30 hover:border-purple-500 bg-purple-500/5' },
                { type: 'wait_reply' as FlowStepType, title: 'Aguardar Resposta', desc: 'Pausa e aguarda resposta do lead', icon: Clock, color: 'text-amber-400 border-amber-500/30 hover:border-amber-500 bg-amber-500/5' },
                { type: 'generate_pix' as FlowStepType, title: 'Cobrança PIX', desc: 'Chave e Copia e Cola automático', icon: CreditCard, color: 'text-fuchsia-400 border-fuchsia-500/30 hover:border-fuchsia-500 bg-fuchsia-500/5' },
                { type: 'deliver_materials' as FlowStepType, title: 'Entregar Apostilas', desc: 'Disparo dos arquivos do curso', icon: Package, color: 'text-blue-400 border-blue-500/30 hover:border-blue-500 bg-blue-500/5' },
                { type: 'deliver_bonus' as FlowStepType, title: 'Liberar Super Bônus', desc: 'Libera bônus após confirmação', icon: Gift, color: 'text-rose-400 border-rose-500/30 hover:border-rose-500 bg-rose-500/5' },
              ].map((item) => {
                const ItemIcon = item.icon;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => handleAddStep(item.type)}
                    className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all hover:scale-[1.02] active:scale-95 ${item.color}`}
                  >
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex-shrink-0">
                      <ItemIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-white">{item.title}</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 6. Card Informativo de Funcionamento */}
      <div className="p-6 bg-[#161c2d] border border-slate-800 rounded-3xl space-y-3.5 max-w-4xl mx-auto">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          Como o robô executa este fluxo com a IA:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-2xl bg-[#111726] border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-400">1. Roteiro Automático</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              O bot executa rigorosamente as caixinhas na ordem que você organizou (Foto ➔ Texto ➔ Áudio ➔ PIX).
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#111726] border border-slate-800 space-y-1">
            <span className="font-bold text-amber-400">2. Pausa Inteligente</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Nos blocos de <b>Aguardar Resposta</b>, o robô não atropela o cliente: ele para e espera a confirmação antes de avançar.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#111726] border border-slate-800 space-y-1">
            <span className="font-bold text-teal-400">3. IA Guarda-Corpo</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Se o cliente fizer perguntas fora do roteiro (dúvidas de garantia, formas de pagamento), a IA responde e traz o lead de volta para o próximo passo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
