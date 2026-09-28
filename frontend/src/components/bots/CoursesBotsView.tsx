import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  Plus, 
  Search, 
  BookOpen, 
  Flame, 
  FileText, 
  Gift, 
  CreditCard, 
  Copy, 
  Check, 
  Edit3, 
  Trash2, 
  Sliders, 
  Play, 
  Smartphone,
  ExternalLink,
  Zap,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { Course, AiSettings, Instance } from '../../types';
import { supabase } from '../../lib/supabase';
import { CourseModal } from './CourseModal';
import { AiSettingsTab } from './AiSettingsTab';
import { AiPlayground } from './AiPlayground';

interface CoursesBotsViewProps {
  organizationId: string;
  instances?: Instance[];
}

export const CoursesBotsView: React.FC<CoursesBotsViewProps> = ({
  organizationId,
  instances = [],
}) => {
  const [activeTab, setActiveTab] = useState<'cursos' | 'config' | 'playground'>('cursos');
  const [courses, setCourses] = useState<Course[]>([]);
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [copiedCourseId, setCopiedCourseId] = useState<string | null>(null);

  // Instância do WhatsApp conectada
  const connectedInstance = instances.find((i) => i.status === 'connected') || instances[0];
  const connectedPhone = connectedInstance?.phone_number || '559491064043';

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Carregar Cursos
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;
      setCourses(coursesData || []);

      // 2. Carregar Configurações da IA
      const { data: settingsData, error: settingsError } = await supabase
        .from('ai_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;
      setAiSettings(settingsData || null);
    } catch (err) {
      console.error('Erro ao carregar dados dos cursos e IA:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const handleOpenCreate = () => {
    setEditingCourse(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  const handleSaveCourse = async (courseData: Partial<Course>) => {
    if (editingCourse) {
      // Update
      const { error } = await supabase
        .from('courses')
        .update({
          ...courseData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingCourse.id);

      if (error) throw error;
    } else {
      // Insert
      const { error } = await supabase.from('courses').insert({
        ...courseData,
        organization_id: organizationId,
      });

      if (error) throw error;
    }

    await loadData();
  };

  const handleToggleCourseActive = async (courseId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_active: !currentStatus })
        .eq('id', courseId);

      if (error) throw error;
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, is_active: !currentStatus } : c))
      );
    } catch (err: any) {
      alert('Erro ao alterar status: ' + err.message);
    }
  };

  const handleDeleteCourse = async (courseId: string, courseName: string) => {
    if (!confirm(`Deseja realmente excluir o curso "${courseName}"?`)) return;

    try {
      const { error } = await supabase.from('courses').delete().eq('id', courseId);
      if (error) throw error;
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (err: any) {
      alert('Erro ao excluir curso: ' + err.message);
    }
  };

  const handleSaveAiSettings = async (newSettings: Partial<AiSettings>) => {
    if (aiSettings?.id) {
      const { error } = await supabase
        .from('ai_settings')
        .update({
          ...newSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', aiSettings.id);

      if (error) throw error;
    } else {
      const { error } = await supabase.from('ai_settings').insert({
        ...newSettings,
        organization_id: organizationId,
      });

      if (error) throw error;
    }

    await loadData();
  };

  const handleCopyCourseLink = (course: Course) => {
    const triggerWord = course.triggers?.[0] || course.name;
    const cleanNumber = (connectedPhone || '559491064043').replace(/\D/g, '');
    const link = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
      `Olá, gostaria de saber mais sobre o curso de ${course.name}`
    )}`;

    navigator.clipboard.writeText(link);
    setCopiedCourseId(course.id);
    setTimeout(() => setCopiedCourseId(null), 2000);
  };

  const filteredCourses = courses.filter((c) =>
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.triggers || []).some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeCoursesCount = courses.filter((c) => c.is_active).length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0e131f] text-slate-100">
      {/* Top Header */}
      <div className="p-8 pb-4 border-b border-slate-800/80 bg-[#111726]/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  Bots de Vendas & Cursos com IA
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ChatGPT Powered
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Venda múltiplos cursos no mesmo número de WhatsApp com atendentes inteligentes que enviam materiais e
                  cobram no PIX
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* WhatsApp Status Badge */}
            <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400">WhatsApp:</span>
              <span className="font-mono font-bold text-white">+{connectedPhone}</span>
            </div>

            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-300 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Curso</span>
            </button>
          </div>
        </div>

        {/* Sub-Abas de Navegação */}
        <div className="flex items-center gap-2 mt-6 border-t border-slate-800/80 pt-3">
          <button
            onClick={() => setActiveTab('cursos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'cursos'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Meus Cursos & Funis ({courses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'config'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Configurações da IA (OpenAI)</span>
          </button>

          <button
            onClick={() => setActiveTab('playground')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'playground'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Simulador & Teste (Playground)</span>
          </button>
        </div>
      </div>

      {/* Conteúdo da Aba */}
      <div className="flex-1 overflow-y-auto p-8">
        {activeTab === 'cursos' && (
          <div className="space-y-6">
            {/* Top Bar de Pesquisa & Métricas */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar curso por nome ou gatilho..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#161c2d] border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>
                    <b className="text-white">{activeCoursesCount}</b> ativos de{' '}
                    <b className="text-white">{courses.length}</b> cursos
                  </span>
                </div>

                <button
                  onClick={loadData}
                  disabled={loading}
                  className="p-2.5 rounded-xl bg-[#161c2d] border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Atualizar lista"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Grid de Cards de Cursos */}
            {filteredCourses.length === 0 ? (
              <div className="p-12 text-center bg-[#161c2d]/60 border border-dashed border-slate-800 rounded-3xl space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Nenhum curso encontrado</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    {searchTerm
                      ? 'Nenhum curso corresponde à sua busca.'
                      : 'Você ainda não cadastrou nenhum curso. Crie seu primeiro curso com persona, materiais e chave PIX para começar a vender!'}
                  </p>
                </div>
                {!searchTerm && (
                  <button
                    onClick={handleOpenCreate}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all inline-flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Criar Primeiro Curso</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((c) => (
                  <div
                    key={c.id}
                    className="bg-[#161c2d] border border-slate-800 rounded-3xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl group hover:shadow-2xl"
                  >
                    <div>
                      {/* Top Header Card */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                            {c.name}
                          </h3>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-base font-extrabold text-emerald-400">
                              R$ {Number(c.price).toFixed(2)}
                            </span>
                            {c.original_price && (
                              <span className="text-xs text-slate-500 line-through">
                                R$ {Number(c.original_price).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Switch Ativo */}
                        <button
                          type="button"
                          onClick={() => handleToggleCourseActive(c.id, c.is_active)}
                          title={c.is_active ? 'Clique para pausar curso' : 'Clique para ativar curso'}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
                            c.is_active ? 'bg-emerald-500' : 'bg-slate-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              c.is_active ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Descrição */}
                      <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                        {c.description || 'Sem descrição cadastrada.'}
                      </p>

                      {/* Chips de Gatilhos */}
                      <div className="mb-4">
                        <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                          Gatilhos de Ativação:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(c.triggers || []).slice(0, 3).map((trig) => (
                            <span
                              key={trig}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-emerald-300 font-mono"
                            >
                              #{trig}
                            </span>
                          ))}
                          {(c.triggers || []).length > 3 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
                              +{(c.triggers || []).length - 3}
                            </span>
                          )}
                          {(c.triggers || []).length === 0 && (
                            <span className="text-[10px] text-slate-500 italic">Nenhum gatilho</span>
                          )}
                        </div>
                      </div>

                      {/* Métricas do Funil: Materiais & Bônus */}
                      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 mb-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-300">
                          <FileText className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                          <span>{(c.materials || []).length} Amostras</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-300">
                          <Gift className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          <span>{(c.bonuses || []).length} Bônus</span>
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação do Card */}
                    <div className="space-y-2 pt-3 border-t border-slate-800/80">
                      {/* Botão Copiar Link do WhatsApp */}
                      <button
                        type="button"
                        onClick={() => handleCopyCourseLink(c)}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        {copiedCourseId === c.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCourseId === c.id ? 'Link WhatsApp Copiado!' : 'Copiar Link WhatsApp'}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('playground');
                          }}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                          title="Testar conversa deste curso no simulador"
                        >
                          <Play className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Testar IA</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Editar curso"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCourse(c.id, c.name)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Excluir curso"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'config' && (
          <AiSettingsTab settings={aiSettings} onSaveSettings={handleSaveAiSettings} />
        )}

        {activeTab === 'playground' && (
          <AiPlayground courses={courses} organizationId={organizationId} />
        )}
      </div>

      {/* Modal de Criação / Edição de Curso */}
      <CourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        course={editingCourse}
        organizationId={organizationId}
        connectedPhone={connectedPhone}
        onSave={handleSaveCourse}
      />
    </div>
  );
};
