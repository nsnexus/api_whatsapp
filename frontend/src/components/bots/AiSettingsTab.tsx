import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Save, 
  Cpu, 
  ShieldCheck, 
  Clock, 
  Bot, 
  HelpCircle,
  Zap
} from 'lucide-react';
import { AiSettings } from '../../types';
import { api } from '../../lib/api';

interface AiSettingsTabProps {
  settings: AiSettings | null;
  onSaveSettings: (newSettings: Partial<AiSettings>) => Promise<void>;
}

export const AiSettingsTab: React.FC<AiSettingsTabProps> = ({ settings, onSaveSettings }) => {
  const [apiKey, setApiKey] = useState(settings?.openai_api_key || '');
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState(settings?.openai_model || 'gpt-5.6-luna');
  const [isEnabled, setIsEnabled] = useState(settings?.is_enabled ?? true);
  const [handoverMinutes, setHandoverMinutes] = useState(String(settings?.human_handover_minutes || 60));
  const [greetingMessage, setGreetingMessage] = useState(
    settings?.greeting_message ||
      'Olá! Sou o assistente virtual da nossa escola. Temos vários cursos práticos disponíveis. Em qual área você tem interesse em aprender?'
  );

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keySavedSuccess, setKeySavedSuccess] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sincroniza estado com as configurações salvas no Supabase quando carregadas
  useEffect(() => {
    if (settings) {
      if (settings.openai_api_key !== undefined) {
        setApiKey(settings.openai_api_key || '');
      }
      if (settings.openai_model) {
        setModel(settings.openai_model);
      }
      if (settings.is_enabled !== undefined) {
        setIsEnabled(settings.is_enabled);
      }
      if (settings.human_handover_minutes !== undefined) {
        setHandoverMinutes(String(settings.human_handover_minutes));
      }
      if (settings.greeting_message) {
        setGreetingMessage(settings.greeting_message);
      }
    }
  }, [settings]);

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      alert('Digite uma chave da OpenAI (começando com sk-...) para testar.');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await api.testOpenAiKey(apiKey.trim(), model);
      if (res.ok) {
        setTestResult({
          ok: true,
          message: `Conectado com sucesso! Resposta do modelo ${res.model || model}: "${res.reply}"`,
        });
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err.message || 'Erro ao conectar à API da OpenAI.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleQuickSaveKey = async () => {
    if (!apiKey.trim()) {
      alert('Digite sua chave da OpenAI antes de salvar.');
      return;
    }

    setIsSavingKey(true);
    setKeySavedSuccess(false);

    try {
      await onSaveSettings({
        openai_api_key: apiKey.trim(),
        openai_model: model,
      });
      setKeySavedSuccess(true);
      setTimeout(() => setKeySavedSuccess(false), 4000);
    } catch (err: any) {
      alert('Erro ao salvar chave da OpenAI: ' + err.message);
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await onSaveSettings({
        openai_api_key: apiKey.trim(),
        openai_model: model,
        is_enabled: isEnabled,
        human_handover_minutes: Number(handoverMinutes) || 60,
        greeting_message: greetingMessage.trim(),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert('Erro ao salvar configurações da IA: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Banner Informativo */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/20 flex items-start gap-4 shadow-lg">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold flex-shrink-0 shadow-md shadow-emerald-500/20">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            Motor de Inteligência Artificial Oficial - OpenAI ChatGPT
          </h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Seus bots de vendas utilizam a API oficial da OpenAI para conversar com os clientes em tempo real,
            demonstrar materiais, rebater objeções de preço e gerar códigos PIX dinâmicos diretamente no WhatsApp!
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card Chave da OpenAI */}
        <div className="p-6 bg-[#161c2d] border border-slate-800 rounded-3xl space-y-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Key className="w-5 h-5 text-emerald-400" />
              <h4 className="text-sm font-bold text-white">Chave de API da OpenAI (Secret Key)</h4>
            </div>
            <div className="flex items-center gap-3">
              {settings?.openai_api_key && (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Salva no Banco
                </span>
              )}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-400 hover:text-emerald-300 underline font-semibold"
              >
                Obter Chave no Painel OpenAI
              </a>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Insira sua chave (ex: sk-proj-...)
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-[#111726] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500 pr-48"
              />
              <div className="absolute right-2 top-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title={showKey ? 'Ocultar chave' : 'Mostrar chave'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={isTesting || !apiKey}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors disabled:opacity-40"
                >
                  {isTesting ? 'Testando...' : 'Testar'}
                </button>

                <button
                  type="button"
                  onClick={handleQuickSaveKey}
                  disabled={isSavingKey || !apiKey}
                  className="px-3 py-1.5 bg-emerald-500 text-slate-950 rounded-lg text-xs font-bold hover:bg-emerald-400 transition-colors disabled:opacity-40 flex items-center gap-1 shadow-md shadow-emerald-500/20"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingKey ? 'Salvando...' : 'Salvar Chave'}</span>
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Sua chave é armazenada de forma segura e utilizada pelo Cloudflare Worker para gerar as respostas.
            </p>
          </div>

          {/* Feedback de Chave Salva */}
          {keySavedSuccess && (
            <div className="p-3.5 rounded-xl text-xs flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span className="font-semibold">Chave da OpenAI salva com sucesso no banco de dados!</span>
            </div>
          )}

          {/* Feedback de Teste */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2.5 ${
                testResult.ok
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {testResult.ok ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                )}
                <span className="font-medium">{testResult.message}</span>
              </div>
              {testResult.ok && !keySavedSuccess && (
                <button
                  type="button"
                  onClick={handleQuickSaveKey}
                  disabled={isSavingKey}
                  className="px-3 py-1 bg-emerald-500 text-slate-950 rounded-md font-bold text-[11px] hover:bg-emerald-400 transition-colors flex-shrink-0"
                >
                  Salvar Chave Agora
                </button>
              )}
            </div>
          )}
        </div>

        {/* Card Modelo e Desempenho do ChatGPT */}
        <div className="p-6 bg-[#161c2d] border border-slate-800 rounded-3xl space-y-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-emerald-400" />
              <h4 className="text-sm font-bold text-white">Modelo & Desempenho do ChatGPT (OpenAI)</h4>
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 font-mono">
              {model === 'gpt-5.6-luna' ? 'GPT-5.6 Luna Ativo' : model === 'gpt-4o-mini' ? 'GPT-4o Mini Ativo' : 'GPT-4o Ativo'}
            </span>
          </div>

          {/* Dica Explicativa */}
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-slate-300 space-y-1">
            <p className="font-bold text-emerald-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Modelo Recomendado: GPT-5.6 Luna</span>
            </p>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              O <strong className="text-white">GPT-5.6 Luna</strong> é o modelo de última geração da OpenAI projetado especificamente para alto volume,
              conversas naturais instantâneas no WhatsApp e custos ultra-otimizados.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Opção 1: GPT-5.6 Luna */}
            <div
              onClick={() => setModel('gpt-5.6-luna')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                model === 'gpt-5.6-luna'
                  ? 'bg-emerald-500/15 border-emerald-500/60 shadow-lg shadow-emerald-500/15 ring-1 ring-emerald-500/40'
                  : 'bg-[#111726] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" /> GPT-5.6 Luna
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black">
                    RECOMENDADO
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium leading-snug">
                  Nova geração GPT-5.6. Velocidade máxima em milissegundos, conversa fluida e alta conversão para WhatsApp.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-emerald-500/20 flex items-center justify-between text-[10px] text-emerald-400 font-mono">
                <span>Ultra-econômico</span>
                <span>&lt;1s latência</span>
              </div>
            </div>

            {/* Opção 2: GPT-4o Mini */}
            <div
              onClick={() => setModel('gpt-4o-mini')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                model === 'gpt-4o-mini'
                  ? 'bg-emerald-500/15 border-emerald-500/60 shadow-lg shadow-emerald-500/15'
                  : 'bg-[#111726] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" /> GPT-4o Mini
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
                    Econômico
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Versão consagrada da série GPT-4o para respostas ágeis e atendimento geral de cursos.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>$0.15 / 1M</span>
                <span>~1s latência</span>
              </div>
            </div>

            {/* Opção 3: GPT-4o Flagship */}
            <div
              onClick={() => setModel('gpt-4o')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                model === 'gpt-4o'
                  ? 'bg-blue-500/15 border-blue-500/60 shadow-lg shadow-blue-500/15'
                  : 'bg-[#111726] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" /> GPT-4o Flagship
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold">
                    Avançado
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Máxima capacidade analítica para perguntas complexas ou mentorias de altíssimo ticket.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>$2.50 / 1M</span>
                <span>~3s latência</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Controles Operacionais */}
        <div className="p-6 bg-[#161c2d] border border-slate-800 rounded-3xl space-y-5 shadow-xl">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h4 className="text-sm font-bold text-white">Regras de Operação & Transição Humana</h4>
          </div>

          {/* Master Switch */}
          <div className="flex items-center justify-between p-4 bg-[#111726] rounded-2xl border border-slate-800">
            <div>
              <p className="text-xs font-bold text-white">Respostas Automáticas de IA no WhatsApp</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isEnabled ? 'A IA está ativa e responderá os leads no WhatsApp' : 'IA desativada temporariamente'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEnabled(!isEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Handover Timeout */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tempo de Pausa ao Intervir Manualmente (Human Handover)
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Se você ou um atendente enviar uma mensagem manualmente para o cliente no WhatsApp ou no Live Chat, a IA
              pausa automaticamente para não atrapalhar o papo humano.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="5"
                max="1440"
                value={handoverMinutes}
                onChange={(e) => setHandoverMinutes(e.target.value)}
                className="w-28 bg-[#111726] border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 text-center"
              />
              <span className="text-xs text-slate-300">minutos de pausa</span>
            </div>
          </div>

          {/* Recepção Geral */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Mensagem / Comportamento de Recepção Geral
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Utilizada quando um lead novo mandar mensagem sem especificar nenhum curso. A IA apresentará o catálogo
              geral de cursos.
            </p>
            <textarea
              rows={3}
              value={greetingMessage}
              onChange={(e) => setGreetingMessage(e.target.value)}
              className="w-full bg-[#111726] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>
        </div>

        {/* Botão de Salvar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" /> Configurações salvas com sucesso!
            </span>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-300 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : 'Salvar Configurações da IA'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
