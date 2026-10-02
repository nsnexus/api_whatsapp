import React, { useState, useMemo } from 'react';
import { Instance } from '../../types';
import { 
  Code2, 
  Copy, 
  Check, 
  ExternalLink, 
  FileText, 
  Mic, 
  Image as ImageIcon, 
  Radio, 
  Key,
  Globe,
  Search,
  BookOpen,
  Terminal,
  Zap,
  ChevronRight,
  ChevronDown,
  Smartphone,
  MessageSquare,
  Send,
  User,
  Users,
  Webhook as WebhookIcon,
  List,
  Download,
  Sun,
  Moon,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  Bot,
  Layers,
  CheckCircle2,
  Trash2,
  RefreshCw,
  MapPin,
  Smile,
  PhoneCall
} from 'lucide-react';

interface ApiDocsViewProps {
  instances: Instance[];
  onNavigateTab?: (tab: any) => void;
}

interface EndpointDoc {
  id: string;
  category: string;
  title: string;
  method: 'POST' | 'GET' | 'DELETE' | 'PUT';
  path: string;
  description: string;
  headers: { key: string; value: string; desc: string }[];
  params: {
    required: { name: string; type: string; desc: string }[];
    optional: { name: string; type: string; desc: string }[];
  };
  requestBody: {
    minimal?: string;
    complete: string;
  };
  response: {
    status: number;
    title: string;
    body: string;
    attributes: { name: string; type: string; desc: string }[];
  };
  snippets: {
    curl: string;
    js: string;
    python: string;
    php: string;
    n8n: string;
    typebot: string;
  };
}

export const ApiDocsView: React.FC<ApiDocsViewProps> = ({ instances, onNavigateTab }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('create-instance');
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'js' | 'python' | 'php' | 'n8n' | 'typebot'>('curl');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'API Integration': true,
    'Instância': true,
    'Mensagens': true,
    'Conversas': false,
    'Contatos': false,
    'Grupos': false,
    'Webhooks': true,
    'Fila de mensagens': false,
  });

  const activeInstance = instances[0]?.instance_name || 'minha_instancia';
  const baseUrl = 'https://evolution.nsnexus.com.br';
  const apiKey = 'evol_go_sec_crm_987654321_token';

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Banco de Dados completo de Endpoints da Nexus API
  const endpoints: EndpointDoc[] = useMemo(() => [
    // 1. API Integration
    {
      id: 'create-instance',
      category: 'API Integration',
      title: 'Criar Nova Instância',
      method: 'POST',
      path: '/instance/create',
      description: 'Cria e inicializa uma nova instância do WhatsApp no cluster Nexus API. Retorna o ID único, token de segurança e os parâmetros de conexão.',
      headers: [
        { key: 'Content-Type', value: 'application/json', desc: 'Formato da requisição' },
        { key: 'apikey', value: apiKey, desc: 'Sua chave mestra de autenticação' },
      ],
      params: {
        required: [
          { name: 'instanceName', type: 'string', desc: 'Nome identificador único para a instância (ex: comercial_loja1).' },
        ],
        optional: [
          { name: 'token', type: 'string', desc: 'Token customizado de segurança para esta instância. Se omitido, é gerado automaticamente.' },
          { name: 'qrcode', type: 'boolean', desc: 'Define se deve gerar QR Code em base64 imediatamente na resposta (padrão: true).' },
          { name: 'number', type: 'string', desc: 'Número para conexão via Código de Emparelhamento (Pairing Code) de 8 dígitos.' },
          { name: 'webhook', type: 'string', desc: 'URL para envio imediato de webhooks de mensagens e status.' },
          { name: 'webhookByEvents', type: 'boolean', desc: 'Se falso, envia todos os eventos para a URL principal (recomendado).' },
          { name: 'integration', type: 'string', desc: 'Engine de conexão: WHATSAPP-BAILEYS (padrão estável de alta velocidade).' },
        ]
      },
      requestBody: {
        minimal: JSON.stringify({
          instanceName: activeInstance
        }, null, 2),
        complete: JSON.stringify({
          instanceName: activeInstance,
          token: "minha_chave_segura_123",
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
          webhook: "https://seu-dominio.com/api/webhook",
          webhookByEvents: false,
          events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE", "MESSAGES_UPDATE", "SEND_MESSAGE"]
        }, null, 2)
      },
      response: {
        status: 201,
        title: '201 Created — Instância criada',
        body: JSON.stringify({
          instance: {
            instanceName: activeInstance,
            instanceId: "inst_nexus_79021890",
            status: "created",
            apikey: apiKey
          },
          hash: {
            apikey: apiKey
          },
          qrcode: {
            pairingCode: "WXYZ-1234",
            code: "2@9vJ...",
            base64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
          }
        }, null, 2),
        attributes: [
          { name: 'instance.instanceName', type: 'string', desc: 'Nome da instância registrado com sucesso.' },
          { name: 'instance.instanceId', type: 'string', desc: 'Identificador único da instância no cluster.' },
          { name: 'instance.status', type: 'string', desc: 'Estado inicial: "created" ou "connecting".' },
          { name: 'qrcode.base64', type: 'string', desc: 'QR Code pronto para renderizar no seu frontend em tag <img>.' },
        ]
      },
      snippets: {
        curl: `curl -X POST "${baseUrl}/instance/create" \\
  -H "Content-Type: application/json" \\
  -H "apikey: ${apiKey}" \\
  -d '{
    "instanceName": "${activeInstance}",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'`,
        js: `const response = await fetch("${baseUrl}/instance/create", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "apikey": "${apiKey}"
  },
  body: JSON.stringify({
    instanceName: "${activeInstance}",
    qrcode: true,
    integration: "WHATSAPP-BAILEYS"
  })
});
const data = await response.json();
console.log("Instância Criada:", data);`,
        python: `import requests

url = "${baseUrl}/instance/create"
headers = {
    "Content-Type": "application/json",
    "apikey": "${apiKey}"
}
payload = {
    "instanceName": "${activeInstance}",
    "qrcode": True,
    "integration": "WHATSAPP-BAILEYS"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
        php: `<?php
$curl = curl_init();
curl_setopt_array($curl, [
  CURLOPT_URL => "${baseUrl}/instance/create",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => json_encode([
    "instanceName" => "${activeInstance}",
    "qrcode" => true,
    "integration" => "WHATSAPP-BAILEYS"
  ]),
  CURLOPT_HTTPHEADER => [
    "Content-Type: application/json",
    "apikey: ${apiKey}"
  ],
]);
$response = curl_exec($curl);
curl_close($curl);
echo $response;`,
        n8n: `// No nó HTTP Request do n8n:
// Method: POST
// URL: ${baseUrl}/instance/create
// Headers:
//   Content-Type: application/json
//   apikey: ${apiKey}
// Body (JSON):
{
  "instanceName": "${activeInstance}",
  "qrcode": true
}`,
        typebot: `// No bloco 'Webhook / Make HTTP Request' do Typebot:
// URL: ${baseUrl}/instance/create
// Method: POST
// Headers:
//   apikey: ${apiKey}
// Body:
{ "instanceName": "${activeInstance}" }`
      }
    },
    {
      id: 'fetch-instances',
      category: 'API Integration',
      title: 'Listar Todas Instâncias',
      method: 'GET',
      path: '/instance/fetchInstances',
      description: 'Retorna a lista completa de todas as instâncias ativas, seus estados de conexão, números de telefone sincronizados e nomes de perfil.',
      headers: [
        { key: 'apikey', value: apiKey, desc: 'Sua chave mestra de autenticação' },
      ],
      params: {
        required: [],
        optional: []
      },
      requestBody: {
        complete: '// N/A (Método GET não requer corpo de requisição)'
      },
      response: {
        status: 200,
        title: '200 OK — Lista de instâncias',
        body: JSON.stringify([
          {
            id: "inst_nexus_79021890",
            name: activeInstance,
            connectionStatus: "open",
            ownerJid: "559491064043@s.whatsapp.net",
            profileName: "Narciso Santos",
            profilePicUrl: "https://pps.whatsapp.net/v/..."
          }
        ], null, 2),
        attributes: [
          { name: 'name', type: 'string', desc: 'Nome identificador da instância.' },
          { name: 'connectionStatus', type: 'string', desc: 'Status atual: "open" (conectado), "close" ou "connecting".' },
          { name: 'ownerJid', type: 'string', desc: 'Número do WhatsApp conectado com código do país e DDD.' },
        ]
      },
      snippets: {
        curl: `curl -X GET "${baseUrl}/instance/fetchInstances" \\
  -H "apikey: ${apiKey}"`,
        js: `const response = await fetch("${baseUrl}/instance/fetchInstances", {
  method: "GET",
  headers: { "apikey": "${apiKey}" }
});
const instances = await response.json();
console.log(instances);`,
        python: `import requests
response = requests.get("${baseUrl}/instance/fetchInstances", headers={"apikey": "${apiKey}"})
print(response.json())`,
        php: `<?php
$ch = curl_init("${baseUrl}/instance/fetchInstances");
curl_setopt($ch, CURLOPT_HTTPHEADER, ["apikey: ${apiKey}"]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = curl_exec($ch);
curl_close($ch);
echo $res;`,
        n8n: `// HTTP Request Node
// Method: GET
// URL: ${baseUrl}/instance/fetchInstances
// Header: apikey: ${apiKey}`,
        typebot: `// Bloco Webhook:
// GET ${baseUrl}/instance/fetchInstances`
      }
    },

    // 2. Instância
    {
      id: 'instance-status',
      category: 'Instância',
      title: 'Status da Conexão',
      method: 'GET',
      path: `/instance/connectionState/${activeInstance}`,
      description: 'Verifica em tempo real se o WhatsApp do aparelho está sincronizado, conectado ou desconectado.',
      headers: [
        { key: 'apikey', value: apiKey, desc: 'Sua chave mestra de autenticação' },
      ],
      params: {
        required: [
          { name: ':instance', type: 'path param', desc: 'Nome da instância a consultar.' }
        ],
        optional: []
      },
      requestBody: {
        complete: '// N/A (Método GET)'
      },
      response: {
        status: 200,
        title: '200 OK — Estado da conexão',
        body: JSON.stringify({
          instance: {
            instanceName: activeInstance,
            state: "open"
          }
        }, null, 2),
        attributes: [
          { name: 'instance.state', type: 'string', desc: '"open" (conectado pronto para envio), "connecting" ou "close".' }
        ]
      },
      snippets: {
        curl: `curl -X GET "${baseUrl}/instance/connectionState/${activeInstance}" \\
  -H "apikey: ${apiKey}"`,
        js: `const res = await fetch("${baseUrl}/instance/connectionState/${activeInstance}", {
  headers: { "apikey": "${apiKey}" }
});
const { instance } = await res.json();
console.log("Status WhatsApp:", instance.state);`,
        python: `import requests
res = requests.get("${baseUrl}/instance/connectionState/${activeInstance}", headers={"apikey": "${apiKey}"})
print(res.json())`,
        php: `<?php
// Consulta status via GET
$res = file_get_contents("${baseUrl}/instance/connectionState/${activeInstance}", false, stream_context_create([
  "http" => ["header" => "apikey: ${apiKey}\r\n"]
]));
echo $res;`,
        n8n: `// GET ${baseUrl}/instance/connectionState/${activeInstance}`,
        typebot: `// GET ${baseUrl}/instance/connectionState/${activeInstance}`
      }
    },
    {
      id: 'instance-connect',
      category: 'Instância',
      title: 'Conectar QR Code / Pairing Code',
      method: 'GET',
      path: `/instance/connect/${activeInstance}`,
      description: 'Gera um QR Code atualizado ou código de pareamento de 8 dígitos para conectar o WhatsApp.',
      headers: [
        { key: 'apikey', value: apiKey, desc: 'Sua chave mestra de autenticação' },
      ],
      params: {
        required: [
          { name: ':instance', type: 'path param', desc: 'Nome da instância.' }
        ],
        optional: [
          { name: 'number', type: 'query param', desc: 'Se fornecido, gera o código de pareamento de 8 dígitos para o número informado.' }
        ]
      },
      requestBody: {
        complete: '// N/A (Método GET)'
      },
      response: {
        status: 200,
        title: '200 OK — QR Code emitido',
        body: JSON.stringify({
          pairingCode: "A8B2-99CD",
          code: "2@y4A9k...",
          base64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
        }, null, 2),
        attributes: [
          { name: 'base64', type: 'string', desc: 'String Base64 da imagem do QR Code para exibição em tela.' },
          { name: 'pairingCode', type: 'string', desc: 'Código de pareamento de 8 dígitos (se solicitado).' }
        ]
      },
      snippets: {
        curl: `curl -X GET "${baseUrl}/instance/connect/${activeInstance}" \\
  -H "apikey: ${apiKey}"`,
        js: `const res = await fetch("${baseUrl}/instance/connect/${activeInstance}", {
  headers: { "apikey": "${apiKey}" }
});
const qr = await res.json();
console.log(qr.base64);`,
        python: `import requests
res = requests.get("${baseUrl}/instance/connect/${activeInstance}", headers={"apikey": "${apiKey}"})
print(res.json().get("base64"))`,
        php: `<?php // GET QR Code`,
        n8n: `// GET ${baseUrl}/instance/connect/${activeInstance}`,
        typebot: `// GET ${baseUrl}/instance/connect/${activeInstance}`
      }
    },
    {
      id: 'instance-restart',
      category: 'Instância',
      title: 'Reiniciar Instância',
      method: 'POST',
      path: `/instance/restart/${activeInstance}`,
      description: 'Reinicia o socket de conexão do Baileys sem perder a sessão salva no disco.',
      headers: [
        { key: 'apikey', value: apiKey, desc: 'Sua chave mestra de autenticação' },
      ],
      params: { required: [], optional: [] },
      requestBody: { complete: '{}' },
      response: {
        status: 200,
        title: '200 OK — Instância reiniciada',
        body: JSON.stringify({ status: "SUCCESS", message: "Instance restarting..." }, null, 2),
        attributes: [{ name: 'status', type: 'string', desc: '"SUCCESS"' }]
      },
      snippets: {
        curl: `curl -X POST "${baseUrl}/instance/restart/${activeInstance}" -H "apikey: ${apiKey}"`,
        js: `await fetch("${baseUrl}/instance/restart/${activeInstance}", { method: "POST", headers: { "apikey": "${apiKey}" } });`,
        python: `requests.post("${baseUrl}/instance/restart/${activeInstance}", headers={"apikey": "${apiKey}"})`,
        php: `// POST restart`,
        n8n: `// POST restart`,
        typebot: `// POST restart`
      }
    },
    {
      id: 'instance-logout',
      category: 'Instância',
      title: 'Desconectar WhatsApp (Logout)',
      method: 'DELETE',
      path: `/instance/logout/${activeInstance}`,
      description: 'Desconecta a sessão do WhatsApp do aparelho (encerra a autenticação), mantendo a instância pronta para nova leitura.',
      headers: [
        { key: 'apikey', value: apiKey, desc: 'Sua chave mestra de autenticação' },
      ],
      params: { required: [], optional: [] },
      requestBody: { complete: '{}' },
      response: {
        status: 200,
        title: '200 OK — Sessão finalizada',
        body: JSON.stringify({ status: "SUCCESS", message: "Instance logged out" }, null, 2),
        attributes: [{ name: 'status', type: 'string', desc: 'Indica desconexão com sucesso.' }]
      },
      snippets: {
        curl: `curl -X DELETE "${baseUrl}/instance/logout/${activeInstance}" -H "apikey: ${apiKey}"`,
        js: `await fetch("${baseUrl}/instance/logout/${activeInstance}", { method: "DELETE", headers: { "apikey": "${apiKey}" } });`,
        python: `requests.delete("${baseUrl}/instance/logout/${activeInstance}", headers={"apikey": "${apiKey}"})`,
        php: `// DELETE logout`,
        n8n: `// DELETE logout`,
        typebot: `// DELETE logout`
      }
    },
    {
      id: 'instance-delete',
      category: 'Instância',
      title: 'Deletar Instância',
      method: 'DELETE',
      path: `/instance/delete/${activeInstance}`,
      description: 'Remove completamente a instância do servidor e limpa os arquivos de autenticação do disco.',
      headers: [
        { key: 'apikey', value: apiKey, desc: 'Sua chave mestra de autenticação' },
      ],
      params: { required: [], optional: [] },
      requestBody: { complete: '{}' },
      response: {
        status: 200,
        title: '200 OK — Instância deletada',
        body: JSON.stringify({ status: "SUCCESS", message: "Instance deleted" }, null, 2),
        attributes: [{ name: 'status', type: 'string', desc: '"SUCCESS"' }]
      },
      snippets: {
        curl: `curl -X DELETE "${baseUrl}/instance/delete/${activeInstance}" -H "apikey: ${apiKey}"`,
        js: `await fetch("${baseUrl}/instance/delete/${activeInstance}", { method: "DELETE", headers: { "apikey": "${apiKey}" } });`,
        python: `requests.delete("${baseUrl}/instance/delete/${activeInstance}", headers={"apikey": "${apiKey}"})`,
        php: `// DELETE delete`,
        n8n: `// DELETE delete`,
        typebot: `// DELETE delete`
      }
    },

    // 3. Mensagens
    {
      id: 'send-text',
      category: 'Mensagens',
      title: 'Enviar Mensagem de Texto',
      method: 'POST',
      path: `/message/sendText/${activeInstance}`,
      description: 'Envia uma mensagem de texto simples ou formatada (negrito, itálico, quebras de linha) para um número individual ou grupo do WhatsApp.',
      headers: [
        { key: 'Content-Type', value: 'application/json', desc: 'Formato da requisição' },
        { key: 'apikey', value: apiKey, desc: 'Sua chave mestra de autenticação' },
      ],
      params: {
        required: [
          { name: 'number', type: 'string', desc: 'Número de telefone com código do país e DDD (ex: "5511999998888") ou JID do grupo.' },
          { name: 'text', type: 'string', desc: 'Texto da mensagem a ser enviada.' }
        ],
        optional: [
          { name: 'delay', type: 'number', desc: 'Atraso de digitação em milissegundos antes do disparo (ex: 1200 simula humano digitando).' },
          { name: 'linkPreview', type: 'boolean', desc: 'Se verdadeiro, renderiza a prévia visual com imagem de links contidos no texto.' },
          { name: 'quoted', type: 'object', desc: 'Objeto de mensagem anterior para responder como citação (Reply).' }
        ]
      },
      requestBody: {
        minimal: JSON.stringify({
          number: "5511999998888",
          text: "Olá! Sua compra foi confirmada com sucesso 🎉"
        }, null, 2),
        complete: JSON.stringify({
          number: "5511999998888",
          text: "Olá Narciso! Seu pedido *#94812* foi aprovado com sucesso! 🚀\n\nAcompanhe seu rastreio em:\nhttps://rastreio.nsnexus.com.br",
          delay: 1500,
          linkPreview: true
        }, null, 2)
      },
      response: {
        status: 200,
        title: '200 OK — Mensagem enviada',
        body: JSON.stringify({
          key: {
            remoteJid: "5511999998888@s.whatsapp.net",
            fromMe: true,
            id: "BAE58921890XYZ"
          },
          message: {
            conversation: "Olá Narciso!..."
          },
          messageTimestamp: "1790218900",
          status: "PENDING"
        }, null, 2),
        attributes: [
          { name: 'key.id', type: 'string', desc: 'ID único da mensagem no WhatsApp (usado para checar confirmação de entrega e reações).' },
          { name: 'status', type: 'string', desc: 'Estado inicial: "PENDING" até confirmação do servidor da Meta.' }
        ]
      },
      snippets: {
        curl: `curl -X POST "${baseUrl}/message/sendText/${activeInstance}" \\
  -H "Content-Type: application/json" \\
  -H "apikey: ${apiKey}" \\
  -d '{
    "number": "5511999998888",
    "text": "Olá! Mensagem enviada via Nexus API 🚀",
    "delay": 1200
  }'`,
        js: `const response = await fetch("${baseUrl}/message/sendText/${activeInstance}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "apikey": "${apiKey}"
  },
  body: JSON.stringify({
    number: "5511999998888",
    text: "Olá! Enviado com Node.js / JavaScript 🚀",
    delay: 1200
  })
});
const data = await response.json();
console.log(data);`,
        python: `import requests

url = "${baseUrl}/message/sendText/${activeInstance}"
headers = {
    "Content-Type": "application/json",
    "apikey": "${apiKey}"
}
payload = {
    "number": "5511999998888",
    "text": "Olá! Enviado com Python requests 🐍",
    "delay": 1200
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
        php: `<?php
$curl = curl_init();
curl_setopt_array($curl, [
  CURLOPT_URL => "${baseUrl}/message/sendText/${activeInstance}",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => json_encode([
    "number" => "5511999998888",
    "text" => "Olá! Mensagem enviada via PHP 🐘",
    "delay" => 1200
  ]),
  CURLOPT_HTTPHEADER => [
    "Content-Type: application/json",
    "apikey: ${apiKey}"
  ],
]);
$response = curl_exec($curl);
curl_close($curl);
echo $response;`,
        n8n: `// No nó HTTP Request do n8n:
// Method: POST
// URL: ${baseUrl}/message/sendText/${activeInstance}
// Headers:
//   Content-Type: application/json
//   apikey: ${apiKey}
// Body:
{
  "number": "={{ $json.phone }}",
  "text": "={{ $json.message }}",
  "delay": 1200
}`,
        typebot: `// Bloco Webhook do Typebot:
// Method: POST
// URL: ${baseUrl}/message/sendText/${activeInstance}
// Headers:
//   apikey: ${apiKey}
// Body:
{
  "number": "{{phone}}",
  "text": "Olá {{name}}, recebemos sua mensagem!"
}`
      }
    },
    {
      id: 'send-audio-ptt',
      category: 'Mensagens',
      title: 'Áudio Nativo PTT (Nota de Voz)',
      method: 'POST',
      path: `/message/sendWhatsAppAudio/${activeInstance}`,
      description: 'Envia o áudio como NOTA DE VOZ GRAVADA NA HORA (microfone verde nativo do WhatsApp com ondas sonoras waveform), gerando altíssima conversão e confiança.',
      headers: [
        { key: 'Content-Type', value: 'application/json', desc: 'Formato da requisição' },
        { key: 'apikey', value: apiKey, desc: 'Sua chave de API' },
      ],
      params: {
        required: [
          { name: 'number', type: 'string', desc: 'Número destinatário com DDI e DDD.' },
          { name: 'audio', type: 'string', desc: 'URL pública acessível do arquivo de áudio (MP3, OGG, WAV) ou string Base64.' }
        ],
        optional: [
          { name: 'delay', type: 'number', desc: 'Atraso simulando gravação de áudio no WhatsApp (ex: 2000 milissegundos).' }
        ]
      },
      requestBody: {
        minimal: JSON.stringify({
          number: "5511999998888",
          audio: "https://meu-storage.com/audios/apresentacao.mp3"
        }, null, 2),
        complete: JSON.stringify({
          number: "5511999998888",
          audio: "https://meu-storage.com/audios/apresentacao.mp3",
          delay: 2500
        }, null, 2)
      },
      response: {
        status: 200,
        title: '200 OK — Áudio nativo enviado',
        body: JSON.stringify({
          key: { id: "AUDIO_99812", remoteJid: "5511999998888@s.whatsapp.net", fromMe: true },
          message: { audioMessage: { ptt: true, seconds: 14 } }
        }, null, 2),
        attributes: [
          { name: 'message.audioMessage.ptt', type: 'boolean', desc: 'true confirma envio como gravação ao vivo (PTT).' }
        ]
      },
      snippets: {
        curl: `curl -X POST "${baseUrl}/message/sendWhatsAppAudio/${activeInstance}" \\
  -H "Content-Type: application/json" \\
  -H "apikey: ${apiKey}" \\
  -d '{
    "number": "5511999998888",
    "audio": "https://meu-storage.com/audios/voz.mp3",
    "delay": 2000
  }'`,
        js: `const res = await fetch("${baseUrl}/message/sendWhatsAppAudio/${activeInstance}", {
  method: "POST",
  headers: { "Content-Type": "application/json", "apikey": "${apiKey}" },
  body: JSON.stringify({
    number: "5511999998888",
    audio: "https://meu-storage.com/audios/voz.mp3",
    delay: 2000
  })
});
console.log(await res.json());`,
        python: `import requests
requests.post("${baseUrl}/message/sendWhatsAppAudio/${activeInstance}", 
  json={"number": "5511999998888", "audio": "https://meu-storage.com/audios/voz.mp3"},
  headers={"apikey": "${apiKey}"})`,
        php: `// POST Áudio PTT`,
        n8n: `// HTTP Request Node (sendWhatsAppAudio)`,
        typebot: `// Bloco Webhook (sendWhatsAppAudio)`
      }
    },
    {
      id: 'send-media',
      category: 'Mensagens',
      title: 'Enviar Imagem, Vídeo ou PDF',
      method: 'POST',
      path: `/message/sendMedia/${activeInstance}`,
      description: 'Envia imagens (JPEG, PNG, WEBP), vídeos (MP4) ou documentos oficiais (PDF, DOCX, XLSX) com legenda opcional.',
      headers: [
        { key: 'Content-Type', value: 'application/json', desc: 'Formato da requisição' },
        { key: 'apikey', value: apiKey, desc: 'Sua chave de API' },
      ],
      params: {
        required: [
          { name: 'number', type: 'string', desc: 'Número destinatário.' },
          { name: 'mediatype', type: 'string', desc: '"image", "video" ou "document".' },
          { name: 'media', type: 'string', desc: 'URL pública do arquivo ou Base64.' }
        ],
        optional: [
          { name: 'caption', type: 'string', desc: 'Legenda exibida junto com o arquivo.' },
          { name: 'fileName', type: 'string', desc: 'Nome do arquivo para documentos (ex: "Contrato_Assinado.pdf").' }
        ]
      },
      requestBody: {
        complete: JSON.stringify({
          number: "5511999998888",
          mediatype: "document",
          media: "https://meu-storage.com/arquivos/proposta_comercial.pdf",
          fileName: "Proposta_Comercial_Nexus.pdf",
          caption: "Segue em anexo sua proposta personalizada 📄"
        }, null, 2)
      },
      response: {
        status: 200,
        title: '200 OK — Arquivo enviado',
        body: JSON.stringify({
          key: { id: "DOC_12345", fromMe: true },
          message: { documentMessage: { title: "Proposta_Comercial_Nexus.pdf" } }
        }, null, 2),
        attributes: [
          { name: 'key.id', type: 'string', desc: 'ID da mensagem da mídia.' }
        ]
      },
      snippets: {
        curl: `curl -X POST "${baseUrl}/message/sendMedia/${activeInstance}" \\
  -H "Content-Type: application/json" \\
  -H "apikey: ${apiKey}" \\
  -d '{
    "number": "5511999998888",
    "mediatype": "image",
    "media": "https://meu-storage.com/foto.jpg",
    "caption": "Confira nossos lançamentos!"
  }'`,
        js: `await fetch("${baseUrl}/message/sendMedia/${activeInstance}", {
  method: "POST",
  headers: { "Content-Type": "application/json", "apikey": "${apiKey}" },
  body: JSON.stringify({
    number: "5511999998888",
    mediatype: "image",
    media: "https://meu-storage.com/foto.jpg",
    caption: "Confira!"
  })
});`,
        python: `# Python sendMedia`,
        php: `// PHP sendMedia`,
        n8n: `// n8n sendMedia`,
        typebot: `// Typebot sendMedia`
      }
    },
    {
      id: 'send-location',
      category: 'Mensagens',
      title: 'Enviar Localização GPS',
      method: 'POST',
      path: `/message/sendLocation/${activeInstance}`,
      description: 'Envia um ponto geográfico com mapa interativo no WhatsApp do cliente.',
      headers: [
        { key: 'Content-Type', value: 'application/json', desc: 'JSON' },
        { key: 'apikey', value: apiKey, desc: 'API Key' },
      ],
      params: {
        required: [
          { name: 'number', type: 'string', desc: 'Número destinatário.' },
          { name: 'latitude', type: 'number', desc: 'Coordenada de latitude (ex: -23.55052).' },
          { name: 'longitude', type: 'number', desc: 'Coordenada de longitude (ex: -46.633308).' }
        ],
        optional: [
          { name: 'name', type: 'string', desc: 'Nome do local (ex: "Sede Nexus CRM").' },
          { name: 'address', type: 'string', desc: 'Endereço completo (ex: "Av. Paulista, 1000 - SP").' }
        ]
      },
      requestBody: {
        complete: JSON.stringify({
          number: "5511999998888",
          name: "Escritório Central Nexus",
          address: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP",
          latitude: -23.561414,
          longitude: -46.655881
        }, null, 2)
      },
      response: {
        status: 200,
        title: '200 OK — Localização enviada',
        body: JSON.stringify({ key: { id: "LOC_99" }, status: "PENDING" }, null, 2),
        attributes: [{ name: 'key.id', type: 'string', desc: 'ID da mensagem' }]
      },
      snippets: {
        curl: `curl -X POST "${baseUrl}/message/sendLocation/${activeInstance}" \\
  -H "Content-Type: application/json" \\
  -H "apikey: ${apiKey}" \\
  -d '{"number":"5511999998888","name":"Escritório","latitude":-23.56,"longitude":-46.65}'`,
        js: `// JS Send Location`,
        python: `# Python Send Location`,
        php: `// PHP Send Location`,
        n8n: `// n8n Send Location`,
        typebot: `// Typebot Send Location`
      }
    },
    {
      id: 'send-reaction',
      category: 'Mensagens',
      title: 'Enviar Reação com Emoji',
      method: 'POST',
      path: `/message/sendReaction/${activeInstance}`,
      description: 'Reage a qualquer mensagem existente com emojis nativos (👍, ❤️, 🔥, 🎉, 👏).',
      headers: [
        { key: 'Content-Type', value: 'application/json', desc: 'JSON' },
        { key: 'apikey', value: apiKey, desc: 'API Key' },
      ],
      params: {
        required: [
          { name: 'key', type: 'object', desc: 'Objeto chave da mensagem contendo { id, remoteJid, fromMe }' },
          { name: 'reaction', type: 'string', desc: 'Emoji da reação (ex: "❤️", "👍") ou string vazia "" para remover.' }
        ],
        optional: []
      },
      requestBody: {
        complete: JSON.stringify({
          key: {
            remoteJid: "5511999998888@s.whatsapp.net",
            fromMe: false,
            id: "BAE5991823901"
          },
          reaction: "❤️"
        }, null, 2)
      },
      response: {
        status: 200,
        title: '200 OK — Reação aplicada',
        body: JSON.stringify({ status: "SUCCESS" }, null, 2),
        attributes: [{ name: 'status', type: 'string', desc: '"SUCCESS"' }]
      },
      snippets: {
        curl: `curl -X POST "${baseUrl}/message/sendReaction/${activeInstance}" \\
  -H "Content-Type: application/json" \\
  -H "apikey: ${apiKey}" \\
  -d '{"key":{"remoteJid":"5511999998888@s.whatsapp.net","id":"BAE5..."},"reaction":"🔥"}'`,
        js: `// JS sendReaction`,
        python: `# Python sendReaction`,
        php: `// PHP sendReaction`,
        n8n: `// n8n sendReaction`,
        typebot: `// Typebot sendReaction`
      }
    },

    // 4. Webhooks
    {
      id: 'set-webhook',
      category: 'Webhooks',
      title: 'Configurar Webhook',
      method: 'POST',
      path: `/webhook/set/${activeInstance}`,
      description: 'Configura o destino em tempo real para onde a Nexus API dispara eventos de mensagens recebidas, confirmações de leitura (check azul) e mudanças de conexão.',
      headers: [
        { key: 'Content-Type', value: 'application/json', desc: 'JSON' },
        { key: 'apikey', value: apiKey, desc: 'API Key' },
      ],
      params: {
        required: [
          { name: 'enabled', type: 'boolean', desc: 'Ativa ou desativa os disparos para esta URL.' },
          { name: 'url', type: 'string', desc: 'URL HTTPS do seu servidor, n8n, Typebot ou Worker que receberá os POSTs.' }
        ],
        optional: [
          { name: 'webhookByEvents', type: 'boolean', desc: 'Manter como "false" para receber tudo no mesmo webhook (recomendado).' },
          { name: 'events', type: 'array', desc: 'Lista de eventos selecionados: ["MESSAGES_UPSERT", "CONNECTION_UPDATE", "MESSAGES_UPDATE"].' }
        ]
      },
      requestBody: {
        complete: JSON.stringify({
          enabled: true,
          url: "https://nexusapi.nsnexus.com.br/webhook",
          webhookByEvents: false,
          events: [
            "MESSAGES_UPSERT",
            "MESSAGES_UPDATE",
            "CONNECTION_UPDATE",
            "SEND_MESSAGE"
          ]
        }, null, 2)
      },
      response: {
        status: 200,
        title: '200 OK — Webhook gravado',
        body: JSON.stringify({
          webhook: {
            enabled: true,
            url: "https://...",
            events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"]
          }
        }, null, 2),
        attributes: [
          { name: 'webhook.enabled', type: 'boolean', desc: 'Confirmação do status do webhook.' }
        ]
      },
      snippets: {
        curl: `curl -X POST "${baseUrl}/webhook/set/${activeInstance}" \\
  -H "Content-Type: application/json" \\
  -H "apikey: ${apiKey}" \\
  -d '{
    "enabled": true,
    "url": "https://meu-servidor.com/webhook",
    "webhookByEvents": false,
    "events": ["MESSAGES_UPSERT", "CONNECTION_UPDATE"]
  }'`,
        js: `await fetch("${baseUrl}/webhook/set/${activeInstance}", {
  method: "POST",
  headers: { "Content-Type": "application/json", "apikey": "${apiKey}" },
  body: JSON.stringify({
    enabled: true,
    url: "https://meu-servidor.com/webhook",
    events: ["MESSAGES_UPSERT"]
  })
});`,
        python: `# Python webhook set`,
        php: `// PHP webhook set`,
        n8n: `// n8n webhook set`,
        typebot: `// Typebot webhook set`
      }
    },
    {
      id: 'find-webhook',
      category: 'Webhooks',
      title: 'Consultar Webhook Atual',
      method: 'GET',
      path: `/webhook/find/${activeInstance}`,
      description: 'Retorna os detalhes do webhook ativo configurado na instância.',
      headers: [
        { key: 'apikey', value: apiKey, desc: 'API Key' }
      ],
      params: { required: [], optional: [] },
      requestBody: { complete: '// N/A' },
      response: {
        status: 200,
        title: '200 OK',
        body: JSON.stringify({ enabled: true, url: "https://..." }, null, 2),
        attributes: [{ name: 'url', type: 'string', desc: 'URL de destino dos webhooks.' }]
      },
      snippets: {
        curl: `curl -X GET "${baseUrl}/webhook/find/${activeInstance}" -H "apikey: ${apiKey}"`,
        js: `// JS get webhook`,
        python: `# Python get webhook`,
        php: `// PHP get webhook`,
        n8n: `// n8n get webhook`,
        typebot: `// Typebot get webhook`
      }
    },

    // 5. Contatos
    {
      id: 'check-whatsapp-number',
      category: 'Contatos',
      title: 'Verificar se Número tem WhatsApp',
      method: 'POST',
      path: `/chat/whatsappNumbers/${activeInstance}`,
      description: 'Valida se uma lista de números telefônicos possui conta ativa no WhatsApp e retorna o JID oficial normalizado.',
      headers: [
        { key: 'Content-Type', value: 'application/json', desc: 'JSON' },
        { key: 'apikey', value: apiKey, desc: 'API Key' },
      ],
      params: {
        required: [
          { name: 'numbers', type: 'array', desc: 'Lista de telefones a consultar (ex: ["5511999998888", "5511888887777"]).' }
        ],
        optional: []
      },
      requestBody: {
        complete: JSON.stringify({
          numbers: ["559491064043", "5511999998888"]
        }, null, 2)
      },
      response: {
        status: 200,
        title: '200 OK — Verificação concluída',
        body: JSON.stringify([
          {
            exists: true,
            jid: "559491064043@s.whatsapp.net",
            number: "559491064043"
          }
        ], null, 2),
        attributes: [
          { name: '[].exists', type: 'boolean', desc: 'Indica se o número é válido no WhatsApp.' },
          { name: '[].jid', type: 'string', desc: 'JID oficial normalizado para envios seguros.' }
        ]
      },
      snippets: {
        curl: `curl -X POST "${baseUrl}/chat/whatsappNumbers/${activeInstance}" \\
  -H "Content-Type: application/json" \\
  -H "apikey: ${apiKey}" \\
  -d '{"numbers": ["559491064043"]}'`,
        js: `// JS check number`,
        python: `# Python check number`,
        php: `// PHP check number`,
        n8n: `// n8n check number`,
        typebot: `// Typebot check number`
      }
    },
    {
      id: 'find-profile',
      category: 'Contatos',
      title: 'Buscar Foto de Perfil & Nome',
      method: 'POST',
      path: `/chat/findProfile/${activeInstance}`,
      description: 'Recupera a foto de perfil em alta resolução e o recado/status público de qualquer número.',
      headers: [
        { key: 'Content-Type', value: 'application/json', desc: 'JSON' },
        { key: 'apikey', value: apiKey, desc: 'API Key' },
      ],
      params: {
        required: [{ name: 'number', type: 'string', desc: 'Número a consultar.' }],
        optional: []
      },
      requestBody: {
        complete: JSON.stringify({ number: "559491064043" }, null, 2)
      },
      response: {
        status: 200,
        title: '200 OK',
        body: JSON.stringify({
          number: "559491064043",
          profilePictureUrl: "https://pps.whatsapp.net/...",
          status: "Disponível"
        }, null, 2),
        attributes: [{ name: 'profilePictureUrl', type: 'string', desc: 'URL da imagem de perfil.' }]
      },
      snippets: {
        curl: `curl -X POST "${baseUrl}/chat/findProfile/${activeInstance}" \\
  -H "Content-Type: application/json" \\
  -H "apikey: ${apiKey}" \\
  -d '{"number": "559491064043"}'`,
        js: `// JS findProfile`,
        python: `# Python findProfile`,
        php: `// PHP findProfile`,
        n8n: `// n8n findProfile`,
        typebot: `// Typebot findProfile`
      }
    },

    // 6. Grupos
    {
      id: 'create-group',
      category: 'Grupos',
      title: 'Criar Novo Grupo',
      method: 'POST',
      path: `/group/createGroup/${activeInstance}`,
      description: 'Cria um novo grupo de WhatsApp adicionando os participantes selecionados.',
      headers: [
        { key: 'Content-Type', value: 'application/json', desc: 'JSON' },
        { key: 'apikey', value: apiKey, desc: 'API Key' },
      ],
      params: {
        required: [
          { name: 'subject', type: 'string', desc: 'Título / Nome do grupo (até 100 caracteres).' },
          { name: 'participants', type: 'array', desc: 'Array com os números dos membros iniciais.' }
        ],
        optional: []
      },
      requestBody: {
        complete: JSON.stringify({
          subject: "Grupo VIP Alunos Nexus",
          participants: ["559491064043", "5511999998888"]
        }, null, 2)
      },
      response: {
        status: 200,
        title: '200 OK — Grupo criado',
        body: JSON.stringify({
          id: "120363029182390@g.us",
          subject: "Grupo VIP Alunos Nexus",
          creation: 1790218900
        }, null, 2),
        attributes: [
          { name: 'id', type: 'string', desc: 'JID do grupo criado (utilize para enviar mensagens para o grupo).' }
        ]
      },
      snippets: {
        curl: `curl -X POST "${baseUrl}/group/createGroup/${activeInstance}" \\
  -H "Content-Type: application/json" \\
  -H "apikey: ${apiKey}" \\
  -d '{"subject":"Novo Grupo","participants":["559491064043"]}'`,
        js: `// JS createGroup`,
        python: `# Python createGroup`,
        php: `// PHP createGroup`,
        n8n: `// n8n createGroup`,
        typebot: `// Typebot createGroup`
      }
    },
    {
      id: 'fetch-groups',
      category: 'Grupos',
      title: 'Listar Todos os Grupos',
      method: 'GET',
      path: `/group/fetchAllGroups/${activeInstance}?getParticipants=true`,
      description: 'Lista todos os grupos dos quais o WhatsApp conectado participa, incluindo contagem e lista de membros.',
      headers: [
        { key: 'apikey', value: apiKey, desc: 'API Key' }
      ],
      params: { required: [], optional: [] },
      requestBody: { complete: '// N/A (GET)' },
      response: {
        status: 200,
        title: '200 OK',
        body: JSON.stringify([
          {
            id: "120363029182390@g.us",
            subject: "Comunidade Nexus",
            size: 48
          }
        ], null, 2),
        attributes: [{ name: 'id', type: 'string', desc: 'JID do grupo' }]
      },
      snippets: {
        curl: `curl -X GET "${baseUrl}/group/fetchAllGroups/${activeInstance}?getParticipants=true" \\
  -H "apikey: ${apiKey}"`,
        js: `// JS fetchGroups`,
        python: `# Python fetchGroups`,
        php: `// PHP fetchGroups`,
        n8n: `// n8n fetchGroups`,
        typebot: `// Typebot fetchGroups`
      }
    }
  ], [activeInstance, baseUrl, apiKey]);

  // Filtro de busca de endpoints
  const filteredEndpoints = useMemo(() => {
    if (!searchQuery.trim()) return endpoints;
    const q = searchQuery.toLowerCase();
    return endpoints.filter(ep => 
      ep.title.toLowerCase().includes(q) ||
      ep.path.toLowerCase().includes(q) ||
      ep.category.toLowerCase().includes(q) ||
      ep.description.toLowerCase().includes(q)
    );
  }, [endpoints, searchQuery]);

  // Agrupamento por Categoria
  const categories = useMemo(() => {
    const map: Record<string, EndpointDoc[]> = {};
    filteredEndpoints.forEach(ep => {
      if (!map[ep.category]) map[ep.category] = [];
      map[ep.category].push(ep);
    });
    return map;
  }, [filteredEndpoints]);

  // Endpoint ativo selecionado
  const currentEndpoint = useMemo(() => {
    return endpoints.find(e => e.id === selectedEndpointId) || endpoints[0];
  }, [endpoints, selectedEndpointId]);

  // Navegação anterior e próximo
  const currentIndex = endpoints.findIndex(e => e.id === currentEndpoint.id);
  const prevEndpoint = currentIndex > 0 ? endpoints[currentIndex - 1] : null;
  const nextEndpoint = currentIndex < endpoints.length - 1 ? endpoints[currentIndex + 1] : null;

  // Gerador de Prompt para IAs (ChatGPT, Claude, Gemini)
  const generateAiPrompt = () => {
    return `Olá! Preciso de ajuda para integrar um endpoint da Nexus API WhatsApp no meu projeto.

Endpoint: ${currentEndpoint.title}
Método: ${currentEndpoint.method}
URL: ${baseUrl}${currentEndpoint.path}

Headers necessários:
  Content-Type: application/json
  apikey: ${apiKey}

Atributos (body JSON):
${currentEndpoint.params.required.map(p => `  - ${p.name} (${p.type}) *obrigatório*: ${p.desc}`).join('\n')}
${currentEndpoint.params.optional.map(p => `  - ${p.name} (${p.type}): ${p.desc}`).join('\n')}

Exemplo de Body:
${currentEndpoint.requestBody.complete}

Por favor, me ajude com:
1. Um exemplo de código completo e funcional para chamar esse endpoint
2. Como tratar a resposta e possíveis erros (status 400, 401, 500)
3. Boas práticas para esta integração

Pode usar qualquer linguagem, mas prefiro [COLOQUE SUA LINGUAGEM AQUI].`;
  };

  const handleOpenAiAssistant = (service: 'chatgpt' | 'claude' | 'gemini') => {
    const prompt = generateAiPrompt();
    handleCopy(prompt, 'ai-prompt');
    const urls = {
      chatgpt: 'https://chatgpt.com/',
      claude: 'https://claude.ai/',
      gemini: 'https://gemini.google.com/'
    };
    window.open(urls[service], '_blank');
  };

  // Download da Coleção Postman Oficial Nexus API
  const handleDownloadPostman = () => {
    const postmanCollection = {
      info: {
        name: "Nexus API WhatsApp - Coleção Oficial",
        description: "Coleção completa de endpoints da Nexus API para WhatsApp, CRM e Bots",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      item: endpoints.map(ep => ({
        name: `${ep.method} - ${ep.title}`,
        request: {
          method: ep.method,
          header: ep.headers.map(h => ({ key: h.key, value: h.value })),
          body: ep.method !== 'GET' ? {
            mode: "raw",
            raw: ep.requestBody.complete
          } : undefined,
          url: {
            raw: `${baseUrl}${ep.path}`,
            protocol: "https",
            host: ["evolution", "nsnexus", "com", "br"],
            path: ep.path.split('/').filter(Boolean)
          }
        }
      }))
    };

    const blob = new Blob([JSON.stringify(postmanCollection, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Nexus_API_Postman_Collection.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0d14] text-slate-100 overflow-hidden font-sans">
      {/* 1. Header Global da Documentação */}
      <header className="h-16 border-b border-slate-800/80 bg-[#0e131f]/95 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between z-40 flex-shrink-0">
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Botão de Voltar para a Landing Page */}
          <button
            type="button"
            onClick={() => onNavigateTab ? onNavigateTab('landing') : (window.location.href = '/')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-emerald-400 transition-all group"
            title="Voltar para a página inicial"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Voltar ao Início</span>
          </button>

          <div className="h-6 w-px bg-slate-800/80 hidden sm:block" />

          {/* Logo 3D Oficial e Título */}
          <div 
            onClick={() => onNavigateTab ? onNavigateTab('landing') : (window.location.href = '/')}
            className="flex items-center gap-3 cursor-pointer group"
            title="NexusAPI - Início"
          >
            <div className="h-9 w-auto flex items-center">
              <img 
                src="/logo.png" 
                alt="Nexus API Logo" 
                className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105 drop-shadow-[0_2px_8px_rgba(16,185,129,0.3)]" 
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-white tracking-tight group-hover:text-emerald-400 transition-colors">
                Nexus<span className="text-emerald-400">API</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                Documentação
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Botão de Download Postman */}
          <button
            onClick={handleDownloadPostman}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-800/80 text-xs font-medium text-slate-300 transition-all active:scale-95"
            title="Baixar coleção Postman completa"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Postman</span>
          </button>

          {/* Botão Acessar Painel (Volta para o CRM) */}
          <button
            onClick={() => onNavigateTab ? onNavigateTab('instances') : window.location.reload()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95"
          >
            <span>Acessar painel</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Layout Principal com Sidebar de Navegação de Endpoints + Conteúdo */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Esquerda (320px) */}
        {/* Sidebar Esquerda (320px) - Apenas Referência de Endpoints */}
        <aside className="w-80 border-r border-slate-800/70 bg-[#0e131f]/60 flex flex-col flex-shrink-0">
          {/* Campo de Busca de Endpoints */}
          <div className="p-3 pb-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar endpoint..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/70 border border-slate-800/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
          </div>

          <div className="mx-3 my-1 h-px bg-slate-800/60" />

          {/* Lista de Endpoints por Categoria */}
          <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
            {Object.entries(categories).map(([category, items]) => {
              const isExpanded = expandedCategories[category] !== false;
              return (
                <div key={category} className="mb-1">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-slate-300 hover:bg-slate-900/40 text-xs font-bold transition-all group"
                  >
                    <div className="flex items-center gap-1.5">
                      <ChevronRight className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      <span>{category}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 font-semibold group-hover:text-slate-200">
                      {items.length}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="ml-3 pl-2 border-l border-slate-800/80 space-y-0.5 mt-0.5">
                      {items.map((ep) => {
                        const isSelected = selectedEndpointId === ep.id;
                        return (
                          <button
                            key={ep.id}
                            onClick={() => setSelectedEndpointId(ep.id)}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all text-xs ${
                              isSelected
                                ? 'bg-emerald-500/10 text-emerald-400 font-bold border-l-2 border-emerald-500'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                            }`}
                          >
                            <span
                              className={`text-[9px] font-mono font-black uppercase px-1 py-0.5 rounded tracking-wider ${
                                ep.method === 'POST'
                                  ? 'text-blue-400 bg-blue-500/10'
                                  : ep.method === 'GET'
                                  ? 'text-emerald-400 bg-emerald-500/10'
                                  : ep.method === 'DELETE'
                                  ? 'text-rose-400 bg-rose-500/10'
                                  : 'text-amber-400 bg-amber-500/10'
                              }`}
                            >
                              {ep.method}
                            </span>
                            <span className="truncate">{ep.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* 3. Área Principal do Conteúdo - Referência de Endpoints */}
        <main className="flex-1 overflow-y-auto bg-[#0a0d14] relative scroll-smooth">
          <div className="max-w-5xl mx-auto px-6 md:px-12 py-8 space-y-8">
              {/* Breadcrumb e Postman */}
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-400 font-medium">Referência API</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span className="text-slate-400 font-medium">{currentEndpoint.category}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span className="text-emerald-400 font-bold">{currentEndpoint.title}</span>
                </div>
              </div>

              {/* Título & Método & URL */}
              <div className="space-y-4">
                <div className="flex items-baseline gap-3">
                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    {currentEndpoint.title}
                  </h1>
                </div>

                <div className="flex items-center gap-2 bg-[#0e131f] border border-slate-800 rounded-xl px-4 py-2.5">
                  <span
                    className={`text-[11px] font-mono font-black uppercase px-2 py-0.5 rounded ${
                      currentEndpoint.method === 'POST'
                        ? 'text-blue-400 bg-blue-500/10'
                        : currentEndpoint.method === 'GET'
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : currentEndpoint.method === 'DELETE'
                        ? 'text-rose-400 bg-rose-500/10'
                        : 'text-amber-400 bg-amber-500/10'
                    }`}
                  >
                    {currentEndpoint.method}
                  </span>
                  <span className="text-slate-600 font-mono">|</span>
                  <code className="flex-1 font-mono text-xs text-slate-300 truncate select-all">
                    {baseUrl}{currentEndpoint.path}
                  </code>
                  <button
                    onClick={() => handleCopy(`${baseUrl}${currentEndpoint.path}`, 'url')}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    {copiedKey === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'url' ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Headers Necessários */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Headers Necessários
                </h3>
                <div className="rounded-xl border border-slate-800/80 overflow-hidden bg-[#0e131f]">
                  <div className="grid grid-cols-3 px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <span>Key</span>
                    <span>Value</span>
                    <span>Descrição</span>
                  </div>
                  {currentEndpoint.headers.map((h, i) => (
                    <div key={i} className="grid grid-cols-3 px-4 py-3 border-b border-slate-800/40 last:border-0 text-xs items-center">
                      <code className="font-mono text-emerald-400 font-semibold">{h.key}</code>
                      <code className="font-mono text-slate-300 truncate">{h.value}</code>
                      <span className="text-slate-400 text-[11px]">{h.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Entendimento */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Entendimento
                </h3>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed bg-[#0e131f] border border-slate-800/80 p-4 rounded-xl">
                  {currentEndpoint.description}
                </p>
              </div>

              {/* Atributos (Parâmetros) */}
              {(currentEndpoint.params.required.length > 0 || currentEndpoint.params.optional.length > 0) && (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Atributos (Body JSON)
                  </h3>

                  {/* Obrigatórios */}
                  {currentEndpoint.params.required.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Obrigatórios</span>
                        <div className="flex-1 h-px bg-rose-500/20" />
                      </div>
                      <div className="rounded-xl border border-slate-800/80 overflow-hidden bg-[#0e131f]">
                        <div className="grid grid-cols-12 px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                          <span className="col-span-3">Atributo</span>
                          <span className="col-span-2">Tipo</span>
                          <span className="col-span-7">Descrição</span>
                        </div>
                        {currentEndpoint.params.required.map((p, i) => (
                          <div key={i} className="grid grid-cols-12 px-4 py-3 border-b border-slate-800/40 last:border-0 text-xs items-center">
                            <span className="col-span-3 font-mono text-slate-200 font-semibold flex items-center gap-1">
                              {p.name}
                              <span className="text-rose-400 font-black">*</span>
                            </span>
                            <span className="col-span-2 font-mono text-[11px] text-slate-500">{p.type}</span>
                            <span className="col-span-7 text-slate-400 text-xs">{p.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Opcionais */}
                  {currentEndpoint.params.optional.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Opcionais</span>
                        <div className="flex-1 h-px bg-slate-800/60" />
                      </div>
                      <div className="rounded-xl border border-slate-800/80 overflow-hidden bg-[#0e131f]">
                        <div className="grid grid-cols-12 px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                          <span className="col-span-3">Atributo</span>
                          <span className="col-span-2">Tipo</span>
                          <span className="col-span-7">Descrição</span>
                        </div>
                        {currentEndpoint.params.optional.map((p, i) => (
                          <div key={i} className="grid grid-cols-12 px-4 py-3 border-b border-slate-800/40 last:border-0 text-xs items-center">
                            <span className="col-span-3 font-mono text-slate-300 font-semibold">{p.name}</span>
                            <span className="col-span-2 font-mono text-[11px] text-slate-500">{p.type}</span>
                            <span className="col-span-7 text-slate-400 text-xs">{p.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Snippets de Código Multi-Linguagem */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Snippet de Código
                </h3>
                <div className="rounded-2xl border border-slate-800 overflow-hidden bg-[#0d1117] shadow-xl">
                  {/* Abas de Linguagens */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 bg-slate-900/70">
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                      {(['curl', 'js', 'python', 'php', 'n8n', 'typebot'] as const).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setSelectedLanguage(lang)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap ${
                            selectedLanguage === lang
                              ? 'bg-emerald-500 text-slate-950 shadow-sm'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                          }`}
                        >
                          {lang === 'js' ? 'Node.js' : lang}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handleCopy(currentEndpoint.snippets[selectedLanguage], 'snippet')}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all active:scale-95"
                    >
                      {copiedKey === 'snippet' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'snippet' ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>

                  {/* Visualizador de Código */}
                  <pre className="p-5 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed bg-[#0d1117]">
                    <code>{currentEndpoint.snippets[selectedLanguage]}</code>
                  </pre>
                </div>
              </div>

              {/* Exemplo de Request Body */}
              {currentEndpoint.method !== 'GET' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Request Body (JSON)
                    </h3>
                    <button
                      onClick={() => handleCopy(currentEndpoint.requestBody.complete, 'body')}
                      className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-200"
                    >
                      {copiedKey === 'body' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'body' ? 'Copiado' : 'Copiar JSON'}</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl border border-slate-800/80 bg-[#0e131f] font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
                    <code>{currentEndpoint.requestBody.complete}</code>
                  </pre>
                </div>
              )}

              {/* Resposta de Exemplo */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    {currentEndpoint.response.status}
                  </span>
                  <span className="text-xs font-semibold text-slate-300">
                    {currentEndpoint.response.title}
                  </span>
                </div>
                <pre className="p-4 rounded-xl border border-slate-800/80 bg-[#0e131f] font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
                  <code>{currentEndpoint.response.body}</code>
                </pre>
              </div>

              {/* Caixa Oficial: Integrar com IA (ABRIR DIRETAMENTE EM CHATGPT / CLAUDE / GEMINI) */}
              <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/[0.05] via-slate-900 to-slate-900 p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-indigo-300 uppercase tracking-wider">
                        Integrar com Inteligência Artificial
                      </h4>
                      <p className="text-xs text-slate-400">
                        Copie o prompt estruturado com este endpoint e cole direto no seu assistente de IA preferido.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopy(generateAiPrompt(), 'ai-prompt')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition-all active:scale-95"
                  >
                    {copiedKey === 'ai-prompt' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'ai-prompt' ? 'Prompt Copiado!' : 'Copiar Prompt'}</span>
                  </button>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-2.5 border-t border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Abrir diretamente em:
                  </span>
                  <button
                    onClick={() => handleOpenAiAssistant('chatgpt')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-all active:scale-95"
                  >
                    <span>✦</span>
                    <span>ChatGPT</span>
                  </button>
                  <button
                    onClick={() => handleOpenAiAssistant('claude')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold transition-all active:scale-95"
                  >
                    <span>◆</span>
                    <span>Claude</span>
                  </button>
                  <button
                    onClick={() => handleOpenAiAssistant('gemini')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-bold transition-all active:scale-95"
                  >
                    <span>✸</span>
                    <span>Gemini</span>
                  </button>
                  <span className="text-[10px] text-slate-500 italic ml-auto">
                    *O prompt será copiado automaticamente ao clicar
                  </span>
                </div>
              </div>

              {/* Paginação: Anterior e Próximo */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-800/80">
                {prevEndpoint ? (
                  <button
                    onClick={() => setSelectedEndpointId(prevEndpoint.id)}
                    className="p-4 rounded-xl border border-slate-800 hover:border-emerald-500/40 bg-[#0e131f] hover:bg-slate-900/60 transition-all text-left group"
                  >
                    <div className="flex items-center gap-2 text-slate-500 group-hover:text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Anterior</span>
                    </div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                      {prevEndpoint.title}
                    </div>
                  </button>
                ) : <div />}

                {nextEndpoint ? (
                  <button
                    onClick={() => setSelectedEndpointId(nextEndpoint.id)}
                    className="p-4 rounded-xl border border-slate-800 hover:border-emerald-500/40 bg-[#0e131f] hover:bg-slate-900/60 transition-all text-right group ml-auto w-full"
                  >
                    <div className="flex items-center justify-end gap-2 text-slate-500 group-hover:text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                      <span>Próximo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                      {nextEndpoint.title}
                    </div>
                  </button>
                ) : <div />}
              </div>
            </div>
        </main>
      </div>
    </div>
  );
};

export default ApiDocsView;
