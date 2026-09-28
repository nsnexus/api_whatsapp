import React, { useEffect, useState } from 'react';
import { 
  Send, 
  CheckCheck, 
  Play, 
  Pause,
  RotateCcw, 
  FileText, 
  Mic, 
  Code2, 
  Terminal, 
  Check, 
  Copy, 
  Zap, 
  Webhook, 
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

interface EndpointDemo {
  id: string;
  name: string;
  method: string;
  path: string;
  badge: string;
  badgeColor: string;
  requestSnippet: {
    curl: string;
    js: string;
    python: string;
  };
  responseJson: string;
  latencyMs: number;
  phoneMessage: {
    type: 'text' | 'audio' | 'media';
    text?: string;
    mediaName?: string;
    mediaSub?: string;
    audioDuration?: string;
  };
}

const ENDPOINTS: EndpointDemo[] = [
  {
    id: 'text',
    name: 'Envio de Texto',
    method: 'POST',
    path: '/api/messages/send-text',
    badge: 'Mais Utilizado',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    requestSnippet: {
      curl: `curl -X POST https://api.nexusapi.com.br/api/messages/send-text \\
  -H "Authorization: Bearer nx_live_sec_987654321" \\
  -H "Content-Type: application/json" \\
  -d '{
    "number": "5511999998888",
    "text": "Olá, Marcelo! 👋 Sua fatura #8429 vence hoje. Acesse o boleto em: https://nexus.com.br/f/8429"
  }'`,
      js: `await fetch('https://api.nexusapi.com.br/api/messages/send-text', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer nx_live_sec_987654321',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    number: '5511999998888',
    text: 'Olá, Marcelo! 👋 Sua fatura #8429 vence hoje. Acesse o boleto em: https://nexus.com.br/f/8429'
  })
});`,
      python: `import requests

res = requests.post(
  "https://api.nexusapi.com.br/api/messages/send-text",
  headers={"Authorization": "Bearer nx_live_sec_987654321"},
  json={
    "number": "5511999998888",
    "text": "Olá, Marcelo! 👋 Sua fatura #8429 vence hoje. Acesse o boleto em: https://nexus.com.br/f/8429"
  }
)
print(res.json())`
    },
    responseJson: `{\n  "status": "success",\n  "messageId": "3EB09F8C_719A4B",\n  "timestamp": "2026-09-28T16:30:15Z",\n  "recipient": "5511999998888",\n  "status": "delivered"\n}`,
    latencyMs: 112,
    phoneMessage: {
      type: 'text',
      text: 'Olá, Marcelo! 👋 Sua fatura #8429 vence hoje. Acesse o boleto em: https://nexus.com.br/f/8429',
    },
  },
  {
    id: 'audio',
    name: 'Áudio PTT (Voz Gravada)',
    method: 'POST',
    path: '/api/messages/send-audio',
    badge: 'Microfone Verde PTT',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    requestSnippet: {
      curl: `curl -X POST https://api.nexusapi.com.br/api/messages/send-audio \\
  -H "Authorization: Bearer nx_live_sec_987654321" \\
  -H "Content-Type: application/json" \\
  -d '{
    "number": "5511999998888",
    "audioUrl": "https://storage.nexus.com.br/audios/confirmacao.mp3",
    "ptt": true
  }'`,
      js: `await fetch('https://api.nexusapi.com.br/api/messages/send-audio', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer nx_live_sec_987654321',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    number: '5511999998888',
    audioUrl: 'https://storage.nexus.com.br/audios/confirmacao.mp3',
    ptt: true // Envia com microfone verde como se gravado na hora
  })
});`,
      python: `import requests

res = requests.post(
  "https://api.nexusapi.com.br/api/messages/send-audio",
  headers={"Authorization": "Bearer nx_live_sec_987654321"},
  json={
    "number": "5511999998888",
    "audioUrl": "https://storage.nexus.com.br/audios/confirmacao.mp3",
    "ptt": True
  }
)
print(res.json())`
    },
    responseJson: `{\n  "status": "success",\n  "messageId": "3EB029AC_912B8C",\n  "type": "audio/ogg; codecs=opus",\n  "durationSeconds": 34,\n  "ptt": true,\n  "status": "sent"\n}`,
    latencyMs: 145,
    phoneMessage: {
      type: 'audio',
      text: 'Áudio explicativo enviado como gravação de voz na hora.',
      audioDuration: '0:34',
    },
  },
  {
    id: 'media',
    name: 'Disparo de PDFs & Mídias',
    method: 'POST',
    path: '/api/messages/send-media',
    badge: 'Arquivos & Documentos',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    requestSnippet: {
      curl: `curl -X POST https://api.nexusapi.com.br/api/messages/send-media \\
  -H "Authorization: Bearer nx_live_sec_987654321" \\
  -H "Content-Type: application/json" \\
  -d '{
    "number": "5511999998888",
    "mediaUrl": "https://storage.nexus.com.br/docs/proposta_2026.pdf",
    "fileName": "Proposta_Comercial_Nexus.pdf",
    "caption": "Segue em anexo a proposta comercial solicitada 📄"
  }'`,
      js: `await fetch('https://api.nexusapi.com.br/api/messages/send-media', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer nx_live_sec_987654321',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    number: '5511999998888',
    mediaUrl: 'https://storage.nexus.com.br/docs/proposta_2026.pdf',
    fileName: 'Proposta_Comercial_Nexus.pdf',
    caption: 'Segue em anexo a proposta comercial solicitada 📄'
  })
});`,
      python: `import requests

res = requests.post(
  "https://api.nexusapi.com.br/api/messages/send-media",
  headers={"Authorization": "Bearer nx_live_sec_987654321"},
  json={
    "number": "5511999998888",
    "mediaUrl": "https://storage.nexus.com.br/docs/proposta_2026.pdf",
    "fileName": "Proposta_Comercial_Nexus.pdf",
    "caption": "Segue em anexo a proposta comercial solicitada 📄"
  }
)
print(res.json())`
    },
    responseJson: `{\n  "status": "success",\n  "messageId": "3EB0481F_113A7E",\n  "mediaType": "document",\n  "fileName": "Proposta_Comercial_Nexus.pdf",\n  "fileSize": "1.4 MB",\n  "status": "delivered"\n}`,
    latencyMs: 168,
    phoneMessage: {
      type: 'media',
      mediaName: 'Proposta_Comercial_Nexus.pdf',
      mediaSub: '1.4 MB • Documento PDF',
      text: 'Segue em anexo a proposta comercial solicitada 📄',
    },
  },
  {
    id: 'webhook',
    name: 'Webhooks em Tempo Real',
    method: 'EVENT',
    path: 'https://seu-sistema.com/webhook',
    badge: 'Disparo < 50ms',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    requestSnippet: {
      curl: `# Payload JSON que o seu servidor ou n8n recebe automaticamente:
{
  "event": "messages.upsert",
  "instance": "instancia_vendas_01",
  "data": {
    "key": {
      "remoteJid": "5511999998888@s.whatsapp.net",
      "fromMe": false,
      "id": "3EB09F8C719A4B"
    },
    "pushName": "Marcelo Silva",
    "message": {
      "conversation": "Olá! Gostaria de fechar o plano Pro."
    },
    "messageTimestamp": 1790209420
  }
}`,
      js: `// Exemplo de receptor no Node.js / Express:
app.post('/webhook', (req, res) => {
  const { event, data } = req.body;
  if (event === 'messages.upsert') {
    const sender = data.key.remoteJid;
    const text = data.message?.conversation;
    console.log(\`Mensagem de \${sender}: \${text}\`);
  }
  res.status(200).send('OK');
});`,
      python: `# Exemplo de receptor em Python (FastAPI / Flask):
@app.post("/webhook")
async def receive_webhook(payload: dict):
    if payload.get("event") == "messages.upsert":
        data = payload.get("data", {})
        sender = data.get("key", {}).get("remoteJid")
        text = data.get("message", {}).get("conversation")
        print(f"Mensagem de {sender}: {text}")
    return {"status": "ok"}`
    },
    responseJson: `{\n  "event": "messages.upsert",\n  "status": "delivered_to_webhook",\n  "deliveredAt": "2026-09-28T16:30:15.042Z",\n  "statusCode": 200,\n  "durationMs": 38\n}`,
    latencyMs: 38,
    phoneMessage: {
      type: 'text',
      text: 'Olá! Gostaria de fechar o plano Pro. Vocês aceitam PIX ou Cartão?',
    },
  },
];

export const HeroDemo: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lang, setLang] = useState<'curl' | 'js' | 'python'>('curl');
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [triggerPulse, setTriggerPulse] = useState(false);

  const current = ENDPOINTS[activeIndex];

  // Alterna automaticamente os endpoints a cada 6 segundos se estiver em autoplay
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % ENDPOINTS.length);
      setTriggerPulse(true);
      setTimeout(() => setTriggerPulse(false), 800);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(current.requestSnippet[lang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualTest = () => {
    setIsExecuting(true);
    setTriggerPulse(true);
    setTimeout(() => {
      setIsExecuting(false);
      setTimeout(() => setTriggerPulse(false), 800);
    }, 600);
  };

  return (
    <div className="w-full max-w-6xl mx-auto rounded-3xl bg-[#0f1424]/90 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl transition-all">
      {/* Barra de Controles de Endpoints do Topo */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-[#141b2e]/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
          {ENDPOINTS.map((ep, idx) => (
            <button
              key={ep.id}
              type="button"
              onClick={() => {
                setActiveIndex(idx);
                setIsPlaying(false);
                handleManualTest();
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeIndex === idx
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 scale-[1.02]'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                activeIndex === idx ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-emerald-400'
              }`}>
                {ep.method}
              </span>
              <span>{ep.name}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors border border-slate-800 text-[11px]"
            title={isPlaying ? 'Pausar demonstração automática' : 'Retomar rotação automática'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isPlaying ? 'Pausar Tour' : 'Tour Automático'}</span>
          </button>

          <button
            type="button"
            onClick={handleManualTest}
            disabled={isExecuting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 font-bold transition-all text-[11px] shadow-sm active:scale-95"
          >
            <Zap className={`w-3.5 h-3.5 text-emerald-400 ${isExecuting ? 'animate-spin' : ''}`} />
            <span>{isExecuting ? 'Disparando...' : 'Testar Requisição'}</span>
          </button>
        </div>
      </div>

      {/* Grid Principal: Terminal de Código à Esquerda + Visualizador WhatsApp à Direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
        {/* Terminal do Desenvolvedor (7 Colunas) */}
        <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-[#0d1220]/70 font-mono text-xs">
          <div>
            {/* Header do Editor de Código */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[11px] text-slate-400 font-sans ml-2 font-medium">
                  {current.path}
                </span>
              </div>

              {/* Seletor de Linguagem */}
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 font-sans">
                {(['curl', 'js', 'python'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLang(l)}
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                      lang === l ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {l === 'curl' ? 'cURL' : l === 'js' ? 'Node' : 'Python'}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="ml-1 p-1 text-slate-400 hover:text-white transition-colors"
                  title="Copiar código"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Código da Requisição */}
            <div className="mt-4 p-4 rounded-2xl bg-black/60 border border-slate-900 overflow-x-auto text-[11px] leading-relaxed text-slate-200 select-all font-mono scrollbar-thin">
              <pre className="whitespace-pre-wrap">{current.requestSnippet[lang]}</pre>
            </div>
          </div>

          {/* Resposta do Servidor em Tempo Real */}
          <div className="mt-4 pt-3.5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] mb-2 font-sans">
              <span className="font-bold text-slate-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" /> Resposta da API:
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                  200 OK
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {current.latencyMs}ms
                </span>
              </div>
            </div>

            <div className="p-3 bg-black/40 rounded-xl border border-slate-800/60 font-mono text-[10px] text-emerald-400/90 overflow-x-auto">
              <pre>{current.responseJson}</pre>
            </div>
          </div>
        </div>

        {/* Simulador do WhatsApp do Destinatário (5 Colunas) */}
        <div className="lg:col-span-5 p-5 sm:p-6 bg-[#090d18]/90 flex flex-col items-center justify-center">
          <div className="w-full max-w-[340px] rounded-3xl bg-[#11192b] border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[460px]">
            {/* Topbar WhatsApp */}
            <div className="p-3 bg-[#192238] border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xs shadow-md">
                    NX
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#192238]" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-bold text-white">NexusAPI Bot</p>
                    <CheckCheck className="w-3 h-3 text-emerald-400" />
                  </div>
                  <p className="text-[10px] text-emerald-400 font-sans">online • conectado via API</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                OFICIAL
              </span>
            </div>

            {/* Corpo das Mensagens do WhatsApp */}
            <div className="flex-1 p-4 bg-[#0a0f1d] flex flex-col justify-end space-y-3 overflow-y-auto">
              <div className="text-center">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[9px] text-slate-400 font-sans">
                  Hoje • Conexão em tempo real
                </span>
              </div>

              {/* Balão da Mensagem Recebida */}
              <div className={`p-3.5 rounded-2xl bg-[#1b263d] border border-slate-700/60 text-slate-100 text-xs shadow-lg space-y-2 transition-all duration-300 ${
                triggerPulse ? 'scale-[1.02] border-emerald-500/60 shadow-emerald-500/10' : ''
              }`}>
                {current.phoneMessage.type === 'text' && (
                  <p className="leading-relaxed whitespace-pre-wrap select-text">
                    {current.phoneMessage.text}
                  </p>
                )}

                {current.phoneMessage.type === 'audio' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-2 bg-slate-900/80 rounded-xl border border-slate-800">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center flex-shrink-0 shadow">
                        <Play className="w-4 h-4 ml-0.5 fill-current" />
                      </div>
                      <div className="flex-1 space-y-1">
                        {/* Onda Sonora Simulada */}
                        <div className="flex items-center gap-0.5 h-4">
                          {[30, 60, 45, 80, 100, 65, 40, 90, 75, 50, 85, 95, 60, 40, 80, 50].map((h, i) => (
                            <div
                              key={i}
                              style={{ height: `${h}%` }}
                              className="w-1 bg-emerald-400 rounded-full"
                            />
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                          <span>{current.phoneMessage.audioDuration}</span>
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Mic className="w-2.5 h-2.5 text-emerald-400" /> PTT Gravado
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {current.phoneMessage.type === 'media' && (
                  <div className="space-y-2">
                    <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-white truncate">
                          {current.phoneMessage.mediaName}
                        </p>
                        <p className="text-[9px] text-slate-400 font-mono">
                          {current.phoneMessage.mediaSub}
                        </p>
                      </div>
                    </div>
                    {current.phoneMessage.text && (
                      <p className="text-[11px] text-slate-200 mt-1">
                        {current.phoneMessage.text}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400 pt-1">
                  <span>13:30</span>
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>

              {/* Badge de Latência */}
              <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-between text-[10px] text-slate-300">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Zap className="w-3 h-3" /> Entregue via Cluster Nuvem
                </span>
                <span className="font-mono text-slate-400">{current.latencyMs}ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
