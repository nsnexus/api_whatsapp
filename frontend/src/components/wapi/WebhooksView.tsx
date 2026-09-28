import React, { useState } from 'react';
import { Instance } from '../../types';
import { api } from '../../lib/api';
import { 
  Globe, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck,
  Zap,
  Bot
} from 'lucide-react';

interface WebhooksViewProps {
  instances: Instance[];
  onUpdateWebhook?: () => void;
}

export const WebhooksView: React.FC<WebhooksViewProps> = ({ instances, onUpdateWebhook }) => {
  const [selectedInstanceName, setSelectedInstanceName] = useState<string>(
    instances[0]?.instance_name || ''
  );
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

  const currentInstance = instances.find((i) => i.instance_name === selectedInstanceName) || instances[0];

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstanceName || !webhookUrl.trim()) return;

    setIsSaving(true);
    try {
      await api.setWebhook({
        instanceName: selectedInstanceName,
        webhookUrl: webhookUrl.trim(),
        enabled: true,
      });
      alert('Webhook configurado com sucesso na VPS!');
      if (onUpdateWebhook) onUpdateWebhook();
    } catch (e: any) {
      alert('Erro ao salvar webhook: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestWebhookPing = async () => {
    if (!webhookUrl.trim()) {
      alert('Informe a URL do webhook primeiro.');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const samplePayload = {
        event: 'messages.upsert',
        instance: selectedInstanceName,
        data: {
          key: {
            remoteJid: '5511999998888@s.whatsapp.net',
            fromMe: false,
            id: 'TEST_MSG_' + Date.now(),
          },
          pushName: 'Cliente Teste',
          message: {
            conversation: 'Olá! Estou testando a integração com o n8n/Typebot!',
          },
          messageTimestamp: Math.floor(Date.now() / 1000),
        },
      };

      const res = await fetch(webhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(samplePayload),
      });

      if (res.ok) {
        setTestResult(`✅ Sucesso! O servidor do seu Webhook respondeu HTTP ${res.status} OK.`);
      } else {
        setTestResult(`⚠️ O servidor respondeu HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (err: any) {
      setTestResult(`❌ Erro ao enviar para o Webhook: ${err.message}. Verifique CORS ou firewall.`);
    } finally {
      setIsTesting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTemplate(id);
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto">
      {/* Header */}
      <div className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            Webhooks &bull; Integração com n8n, Typebot e Make
          </h2>
          <p className="text-xs text-slate-400">
            Receba notificações de mensagens recebidas, status de entrega e conexão em tempo real no seu fluxo de automação
          </p>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl">
        {/* Formulário de Configuração do Webhook */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Configurar URL de Destino do Webhook
          </h3>

          <form onSubmit={handleSaveWebhook} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Selecione a Instância:
              </label>
              <select
                value={selectedInstanceName}
                onChange={(e) => {
                  setSelectedInstanceName(e.target.value);
                  const inst = instances.find((i) => i.instance_name === e.target.value);
                  if (inst?.webhook_url) setWebhookUrl(inst.webhook_url);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              >
                {instances.map((i) => (
                  <option key={i.id} value={i.instance_name}>
                    {i.name} ({i.instance_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                URL do seu Webhook (n8n, Typebot, Make, ERP):
              </label>
              <input
                type="url"
                placeholder="https://seu-n8n.com/webhook/whatsapp-recebido"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                required
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                O Evolution API v2 enviará um <code>POST</code> com JSON para este endereço sempre que um evento ocorrer.
              </span>
            </div>

            {/* Eventos Notificados */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-200 block">Eventos Ativos por Padrão:</span>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>MESSAGES_UPSERT</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>MESSAGES_UPDATE</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>CONNECTION_UPDATE</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>SEND_MESSAGE</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                {isSaving ? 'Salvando na VPS...' : 'Salvar Configuração'}
              </button>

              <button
                type="button"
                onClick={handleTestWebhookPing}
                disabled={isTesting || !webhookUrl.trim()}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Testar Ping</span>
              </button>
            </div>

            {testResult && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                {testResult}
              </div>
            )}
          </form>
        </div>

        {/* Guias Rápidos de Integração */}
        <div className="space-y-4">
          {/* Card n8n */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-xs">
                  n8n
                </div>
                <div>
                  <h4 className="font-bold text-slate-100 text-xs">Como receber no n8n</h4>
                  <p className="text-[11px] text-slate-400">Workflow automatizado sem código</p>
                </div>
              </div>

              <button
                onClick={() =>
                  copyToClipboard(
                    `{
  "name": "Webhook WhatsApp Evolution",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "whatsapp-recebido",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [240, 300]
    }
  ]
}`,
                    'n8n'
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold flex items-center gap-1 border border-slate-700"
              >
                {copiedTemplate === 'n8n' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copiar Node n8n</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              No seu n8n, adicione um nó do tipo <strong>Webhook</strong> com método <code>POST</code>, copie a URL gerada e cole no campo de Webhook acima.
            </p>
          </div>

          {/* Card Typebot */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-100 text-xs">Integração com Typebot</h4>
                  <p className="text-[11px] text-slate-400">Chatbot conversacional interativo</p>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Para responder clientes automaticamente com o Typebot, use o n8n ou seu backend como ponte: receba o webhook desta API, chame a API do Typebot e dispare a resposta de volta usando o endpoint <code>/message/sendText</code>.
            </p>
          </div>

          {/* Card Exemplo do Payload Recebido */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h4 className="font-bold text-slate-100 text-xs flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              Exemplo de JSON que seu Webhook receberá:
            </h4>
            <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[10px] text-slate-300 font-mono overflow-x-auto max-h-48">
{`{
  "event": "messages.upsert",
  "instance": "${selectedInstanceName || 'comercial_1'}",
  "data": {
    "key": {
      "remoteJid": "5511999998888@s.whatsapp.net",
      "fromMe": false,
      "id": "BAE5F482910"
    },
    "pushName": "Nome do Cliente",
    "message": {
      "conversation": "Qual o valor do produto?"
    }
  }
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
