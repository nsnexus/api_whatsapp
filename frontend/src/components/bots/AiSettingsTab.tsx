import React, { useState } from 'react';
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
  const [model, setModel] = useState(settings?.openai_model || 'gpt-4o-mini');
  const [isEnabled, setIsEnabled] = useState(settings?.is_enabled ?? true);
  const [handoverMinutes, setHandoverMinutes] = useState(String(settings?.human_handover_minutes || 60));
  const [greetingMessage, setGreetingMessage] = useState(
    settings?.greeting_message ||
      'Olá! Sou o assistente virtual da nossa escola. Temos vários cursos práticos disponíveis. Em qual área você tem interesse em aprender?'
  );

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

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
          message: `Conectado com sucesso! Resposta do modelo ${res.model}: "${res.reply}"`,
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
            Seus bots de vendas utilizam a API oficial do ChatGPT para conversar com os clientes em tempo real,
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
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-emerald-400 hover:text-emerald-300 underline font-semibold"
            >
              Obter Chave no Painel OpenAI
            </a>
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
                className="w-full bg-[#111726] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500 pr-24"
              />
              <div className="absolute right-2 top-2 flex items-center gap-1">
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
                  className="px-3 py-1.5 bg-emerald-500 text-slate-950 rounded-lg text-xs font-bold hover:bg-emerald-400 transition-colors disabled:opacity-40"
                >
                  {isTesting ? 'Testando...' : 'Testar'}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Sua chave é armazenada de forma segura e utilizada pelo Cloudflare Worker para gerar as respostas.
            </p>
          </div>

          {/* Feedback de Teste */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                testResult.ok
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              )}
              <span className="font-medium">{testResult.message}</span>
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
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              GPT-4o Mini Ativo
            </span>
          </div>

          {/* Dica de Economia Explicativa */}
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-slate-300 space-y-1">
            <p className="font-bold text-emerald-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Qual modelo é mais em conta para vender cursos?</span>
            </p>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              O <strong className="text-white">GPT-4o Mini</strong> é oficialmente o modelo mais econômico e rápido de toda a OpenAI.
              Ele custa apenas <strong className="text-emerald-400">$0.15 por 1 Milhão de tokens</strong> (menos de R$ 0,0005 por mensagem trocada no WhatsApp),
              sendo mais de <strong className="text-white">95% mais barato que o GPT-4o</strong> e respondendo instantaneamente em cerca de 1 segundo!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setModel('gpt-4o-mini')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                model === 'gpt-4o-mini'
                  ? 'bg-emerald-500/15 border-emerald-500/60 shadow-lg shadow-emerald-500/15'
                  : 'bg-[#111726] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" /> GPT-4o Mini
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black">
                  MAIS EM CONTA • PADRÃO
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                Custo quase zero (fração de centavo), respostas em ~1 segundo, excelente conversão para venda de cursos, apresentação de aulas e cobrança no PIX.
              </p>
              <div className="mt-3 pt-2.5 border-t border-emerald-500/20 flex items-center justify-between text-[10px] text-emerald-400 font-mono">
                <span>$0.15 / 1M tokens</span>
                <span>~1s latência</span>
              </div>
            </div>

            <div
              onClick={() => setModel('gpt-4o')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                model === 'gpt-4o'
                  ? 'bg-blue-500/15 border-blue-500/60 shadow-lg shadow-blue-500/15'
                  : 'bg-[#111726] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" /> GPT-4o Flagship
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold">
                  Avançado
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Máxima capacidade analítica para perguntas extremamente densas ou mentorias VIP de altíssimo valor (16x mais caro que o Mini).
              </p>
              <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>$2.50 / 1M tokens</span>
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
