import React, { useState } from 'react';
import { Instance } from '../../types';
import { api } from '../../lib/api';
import { 
  Terminal, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Mic, 
  Image as ImageIcon, 
  FileText, 
  Smartphone,
  Copy,
  Check
} from 'lucide-react';

interface ApiPlaygroundProps {
  instances: Instance[];
}

export const ApiPlayground: React.FC<ApiPlaygroundProps> = ({ instances }) => {
  const [selectedInstanceName, setSelectedInstanceName] = useState<string>(
    instances[0]?.instance_name || ''
  );
  const [destinationNumber, setDestinationNumber] = useState('');
  const [messageType, setMessageType] = useState<'text' | 'audio' | 'media'>('text');
  const [textContent, setTextContent] = useState('Olá! Este é um teste da Nexus API WhatsApp 🚀');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [apiResponse, setApiResponse] = useState<any | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [copiedResponse, setCopiedResponse] = useState(false);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstanceName || !destinationNumber.trim()) {
      alert('Selecione uma instância e informe o número de telefone de destino com DDD.');
      return;
    }

    setIsSending(true);
    setApiResponse(null);
    setResponseStatus(null);

    const startTime = performance.now();
    try {
      const res = await api.testSendMessage({
        instanceName: selectedInstanceName,
        number: destinationNumber.trim(),
        type: messageType,
        text: textContent,
        mediaUrl: mediaUrl || undefined,
      });

      const duration = Math.round(performance.now() - startTime);
      setResponseStatus(200);
      setApiResponse({
        status: 200,
        statusText: 'OK',
        executionTime: `${duration}ms`,
        data: res,
      });
    } catch (err: any) {
      setResponseStatus(500);
      setApiResponse({
        status: 500,
        statusText: 'Internal Error',
        error: err.message || 'Falha ao comunicar com a Evolution API',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyJson = () => {
    if (!apiResponse) return;
    navigator.clipboard.writeText(JSON.stringify(apiResponse, null, 2));
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto">
      {/* Header */}
      <div className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            API Playground &bull; Testador de Envio em Tempo Real
          </h2>
          <p className="text-xs text-slate-400">
            Valide disparos de texto, áudio gravado (PTT) e mídia sem precisar abrir o Postman ou n8n
          </p>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl">
        {/* Formulário de Teste */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-brand-400" />
            Configuração do Envio
          </h3>

          <form onSubmit={handleSendTest} className="space-y-4">
            {/* Seleção da Instância */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Instância do WhatsApp (Remetente):
              </label>
              <select
                value={selectedInstanceName}
                onChange={(e) => setSelectedInstanceName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              >
                {instances.map((i) => (
                  <option key={i.id} value={i.instance_name}>
                    {i.name} ({i.instance_name}) - {i.status === 'connected' ? '🟢 Conectado' : '🟡 Desconectado'}
                  </option>
                ))}
              </select>
            </div>

            {/* Número de Destino */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Número de Destino (com DDD e DDI):
              </label>
              <input
                type="text"
                placeholder="Ex: 5511999998888"
                value={destinationNumber}
                onChange={(e) => setDestinationNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                required
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Formato internacional sem espaços ou hífens (55 + DDD + número).
              </span>
            </div>

            {/* Tipo de Mensagem */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tipo de Mensagem:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMessageType('text')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    messageType === 'text'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Texto</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMessageType('audio')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    messageType === 'audio'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Áudio PTT (Voz)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMessageType('media')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    messageType === 'media'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Imagem</span>
                </button>
              </div>
            </div>

            {/* Campo de Conteúdo */}
            {messageType === 'text' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mensagem de Texto:
                </label>
                <textarea
                  rows={4}
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  placeholder="Digite o texto da mensagem..."
                  required
                />
              </div>
            )}

            {messageType === 'audio' && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  URL do Áudio MP3 / OGG (Gravado como microfone verde):
                </label>
                <input
                  type="url"
                  placeholder="https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 block">
                  Deixe em branco para usar o áudio de demonstração nativo PTT.
                </span>
              </div>
            )}

            {messageType === 'media' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    URL da Imagem (JPG, PNG):
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Legenda da Imagem:
                  </label>
                  <input
                    type="text"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    placeholder="Legenda da foto..."
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSending || !selectedInstanceName}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all active:scale-98"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enviando pela VPS Contabo...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Disparar Teste via API REST</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Resposta HTTP / Console */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Resposta da API (HTTP Response)
              </h3>

              {responseStatus && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                    responseStatus === 200
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/10 text-red-400 border border-red-500/30'
                  }`}
                >
                  {responseStatus === 200 ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {responseStatus} OK
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400">
              Payload retornado pela Evolution API v2.3.7 em <code>evolution.nsnexus.com.br</code>
            </p>

            {/* Caixa de Código JSON */}
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-[11px] text-slate-300 min-h-[300px] max-h-[420px] overflow-y-auto relative">
              {apiResponse ? (
                <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 py-20">
                  <Terminal className="w-8 h-8 opacity-40" />
                  <p>Aguardando envio do teste...</p>
                  <p className="text-[10px] text-slate-600">
                    O retorno JSON com o ID da mensagem no WhatsApp aparecerá aqui.
                  </p>
                </div>
              )}

              {apiResponse && (
                <button
                  onClick={handleCopyJson}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-slate-700"
                  title="Copiar JSON"
                >
                  {copiedResponse ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedResponse ? 'Copiado!' : 'Copiar'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Latência de Entrega no Baileys:</span>
            <span className="text-emerald-400 font-semibold font-mono">~180ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};
