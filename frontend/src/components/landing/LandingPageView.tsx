import React, { useEffect, useState } from 'react';
import { 
  ArrowRight, 
  Check, 
  Minus, 
  Menu, 
  X, 
  Mic, 
  FileText, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  CreditCard, 
  Bot, 
  Workflow, 
  Code2, 
  Terminal, 
  Copy, 
  CheckCircle2, 
  ChevronDown, 
  Lock, 
  Smartphone,
  ExternalLink,
  Flame,
  CheckCheck,
  Cpu,
  Layers,
  Webhook
} from 'lucide-react';
import { CheckoutModal } from '../wapi/CheckoutModal';
import { HeroDemo } from './HeroDemo';

interface LandingPageViewProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  onEnterApp: () => void;
  onOpenDocs: () => void;
}

const navLinks = [
  { href: '#como-funciona', label: 'Como Funciona' },
  { href: '#recursos', label: 'Recursos da API' },
  { href: '#integracoes', label: 'n8n & Automações' },
  { href: '#comparativo', label: 'Comparativo' },
  { href: '#planos', label: 'Planos & Preços' },
  { href: '#faq', label: 'Dúvidas' },
];

const stats = [
  { value: '99.98%', label: 'Uptime dos Servidores', sub: 'Clusters em nuvem de alta disponibilidade' },
  { value: '< 140ms', label: 'Latência de Envio', sub: 'Disparos instantâneos via REST' },
  { value: 'R$ 0,00', label: 'Custo por Mensagem', sub: 'Sem pegadinhas ou cobranças em dólar' },
  { value: '+15M', label: 'Requisições Processadas', sub: 'Mensagens e Webhooks entregues' },
];

const steps = [
  {
    step: '01',
    badge: '30 Segundos',
    title: 'Crie sua conta & Gere sua API Key',
    description: 'Faça seu cadastro gratuito em segundos e receba imediatamente sua chave de autenticação (Bearer Token) para integrar com seus sistemas.',
    highlight: 'Token pronto para uso imediato em cURL, Postman ou código.',
    icon: Code2,
    color: 'emerald',
  },
  {
    step: '02',
    badge: 'Conexão Instantânea',
    title: 'Conecte o WhatsApp via QR Code',
    description: 'Abra o WhatsApp no seu celular, aponte a câmera para o QR Code gerado no painel e seu número estará sincronizado aos servidores da NexusAPI.',
    highlight: 'Roda 100% na nuvem. Seu celular pode ficar desligado ou sem bateria.',
    icon: Smartphone,
    color: 'teal',
  },
  {
    step: '03',
    badge: 'Automação Ativa',
    title: 'Envie Mensagens & Receba Webhooks',
    description: 'Dispare textos, áudios PTT, mídias e receba eventos em tempo real no seu n8n, Make, Typebot ou servidor backend com latência sub-150ms.',
    highlight: 'Total liberdade sem aprovações de templates ou taxas por conversa.',
    icon: Zap,
    color: 'purple',
  },
];

const features = [
  {
    icon: Webhook,
    title: 'Webhooks em Tempo Real (<50ms)',
    text: 'Receba notificações automáticas de mensagens recebidas, confirmações de entrega (sent, delivered, read), status de conexão e QR Codes com retry automático.',
  },
  {
    icon: Mic,
    title: 'Áudio PTT com Microfone Verde',
    text: 'Envie mensagens de voz gravadas como se você estivesse falando no celular naquele instante. Gera máxima autoridade e humanização no atendimento.',
  },
  {
    icon: FileText,
    title: 'Disparo de PDFs, Imagens & Vídeos',
    text: 'Envie faturas, boletos, e-books, tabelas, fotos de produtos e vídeos demonstrativos através de uma única requisição JSON simples.',
  },
  {
    icon: Workflow,
    title: 'Compatibilidade 100% n8n & Make',
    text: 'Integre fluxos complexos de automação sem escrever uma linha de código. Compatível com nós HTTP de n8n, Make, Zapier, Typebot e Chatwoot.',
  },
  {
    icon: ShieldCheck,
    title: 'Blindagem Anti-Ban & Filas Inteligentes',
    text: 'Intervalos humanizados de digitação, simulação de gravação de áudio e controle de taxa de envio para preservar a reputação do seu número.',
  },
  {
    icon: Layers,
    title: 'Multi-Instâncias Centralizadas',
    text: 'Gerencie 1, 5, 10 ou mais números de WhatsApp em um único painel administrativo, com métricas, logs e chaves de API independentes.',
  },
];

const comparisonData = [
  { feature: 'Conexão rápida via QR Code em 30 segundos', nexus: true, meta: 'Dias / burocracia do Facebook Business', outras: true },
  { feature: 'Mensagens e conversas ilimitadas sem custo por disparo', nexus: true, meta: 'Cobrança em DÓLAR por conversa', outras: 'Cobram por disparo' },
  { feature: 'Envio de áudio PTT com microfone verde (gravado na hora)', nexus: true, meta: false, outras: 'Parcial' },
  { feature: 'Webhooks instantâneos de mensagens e leitura', nexus: true, meta: true, outras: 'Fila lenta' },
  { feature: 'Integração direta com n8n, Make e Typebot', nexus: true, meta: 'Complexo (Graph API)', outras: 'Limitado' },
  { feature: 'Sem bloqueio de janela de 24 horas', nexus: true, meta: 'Bloqueia sem template pago', outras: true },
  { feature: 'Disparo de arquivos, PDFs e documentos pesados', nexus: true, meta: 'Limitações rígidas', outras: true },
  { feature: 'Suporte humanizado em português via WhatsApp', nexus: true, meta: false, outras: 'Apenas tickets em inglês' },
];

const plans = [
  {
    id: '1_instancia',
    name: '1 Instância (Starter)',
    tagline: 'Ideal para desenvolvedores, automações pontuais e projetos únicos',
    price: 49.90,
    priceDisplay: '49,90',
    popular: false,
    features: [
      '1 número de WhatsApp conectado',
      'Mensagens e conversas ilimitadas',
      'API REST completa & Documentação',
      'Envio de Áudio PTT (Microfone Verde)',
      'Envio de PDFs, Imagens e Vídeos',
      'Webhooks em tempo real dedicados',
      '100% Compatível com n8n, Make e Typebot',
      'Fila Anti-Ban Inteligente',
      'Suporte via WhatsApp',
    ],
  },
  {
    id: 'combo_5',
    name: 'Combo 5 Instâncias (Pro)',
    tagline: 'Mais Vendido • Para agências, múltiplos clientes e operações em escala',
    price: 149.90,
    priceDisplay: '149,90',
    popular: true,
    badge: 'MELHOR CUSTO-BENEFÍCIO',
    features: [
      '5 números de WhatsApp simultâneos',
      'Apenas R$ 29,98 por instância/mês',
      'Mensagens ilimitadas em todas as instâncias',
      'API Keys independentes por número',
      'Webhooks dedicados de alta velocidade (<50ms)',
      'Cluster prioritário com maior taxa de envio',
      'Compatível com n8n, Make, Chatwoot e CRM',
      'Painel de Gerenciamento Centralizado',
      'Suporte Prioritário VIP via WhatsApp',
    ],
  },
  {
    id: '10_instancias',
    name: '10 Instâncias (Enterprise)',
    tagline: 'Para grandes plataformas, SaaS e empresas de automação em massa',
    price: 269.90,
    priceDisplay: '269,90',
    popular: false,
    features: [
      '10 números de WhatsApp simultâneos',
      'Apenas R$ 26,99 por instância/mês',
      'Infraestrutura dedicada com auto-scaling',
      'Tráfego ilimitado de mídias e arquivos',
      'Failover automático de reconexão',
      'Gerenciamento multi-tenant de clientes',
      'Acesso antecipado a novos endpoints',
      'Gerente de Conta & Suporte 24/7',
    ],
  },
];

const faqs = [
  {
    q: 'Preciso de aprovação do Facebook / Meta Business para usar a API?',
    a: 'Não! A NexusAPI funciona de forma independente e descomplicada. Você não precisa passar por dias de verificação burocrática de empresa, nem enviar documentos do CNPJ para a Meta. Basta escanear o QR Code no seu painel e em 30 segundos sua API já está pronta para enviar e receber mensagens.',
  },
  {
    q: 'A NexusAPI é compatível com n8n, Make e Typebot?',
    a: 'Sim, 100%! Nossa API foi desenvolvida seguindo o padrão REST JSON universal. No n8n ou Make, basta adicionar um nó HTTP Request com a URL do endpoint e o seu Bearer Token. Fornecemos exemplos prontos de fluxos que você pode importar com 1 clique.',
  },
  {
    q: 'Como funciona o envio de áudio com microfone verde (PTT)?',
    a: 'Ao chamar o endpoint `/api/messages/send-audio` e passar o parâmetro `"ptt": true`, a NexusAPI converte e transmite o arquivo no codec nativo do WhatsApp (Ogg Opus). O destinatário recebe o áudio exatamente como se tivesse sido gravado e falado na hora, com a barra de onda e o microfone verde.',
  },
  {
    q: 'Existe cobrança por mensagem enviada como na Meta?',
    a: 'Não! Você tem disparos e conversas ILIMITADAS. Diferente da API Cloud oficial da Meta que cobra em dólares por cada janela de 24 horas, na NexusAPI você paga apenas a mensalidade fixa do plano escolhido e pode enviar quantas mensagens sua operação precisar.',
  },
  {
    q: 'O que acontece se meu celular descarregar ou ficar sem internet?',
    a: 'A NexusAPI roda 100% em servidores em nuvem de alta disponibilidade. Uma vez conectado pelo QR Code, seu sistema continua funcionando mesmo se o seu celular estiver desligado ou sem bateria.',
  },
  {
    q: 'Como funciona o teste grátis de 3 dias?',
    a: 'Você cria sua conta gratuitamente em menos de 1 minuto sem precisar cadastrar cartão de crédito. Conecta seu WhatsApp pelo QR Code e pode fazer testes reais de envio, áudios e webhooks por 3 dias sem nenhum compromisso.',
  },
];

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onOpenAuth,
  onEnterApp,
  onOpenDocs,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (mobileMenuOpen) setMobileMenuOpen(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden">
      {/* Background Gradients & Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] -left-40 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[160px]" />
        <div className="absolute top-[70%] -right-40 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[160px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#070b14]/80 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo 3D Oficial */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="relative h-11 flex items-center group-hover:scale-105 transition-transform">
              <img
                src="/logo.png"
                alt="NexusAPI Logo"
                className="h-10 w-auto object-contain drop-shadow-[0_4px_12px_rgba(16,185,129,0.25)]"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  Nexus<span className="text-emerald-400">API</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  v2.0 REST
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                API Oficial para Automações WhatsApp
              </span>
            </div>
          </a>

          {/* Links Desktop */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.querySelector(link.href);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                    window.history.pushState(null, '', link.href);
                  }
                }}
                className="hover:text-emerald-400 transition-colors py-1 cursor-pointer"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Botões de Ação */}
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenDocs}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all border border-slate-800 flex items-center gap-1.5"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Documentação</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all"
            >
              Entrar
            </button>

            <button
              type="button"
              onClick={() => onOpenAuth('register')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs hover:from-emerald-400 hover:to-teal-300 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-95 flex items-center gap-1.5"
            >
              <span>Testar Grátis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Botão Mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Menu Mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0d1222] border-b border-slate-800 px-4 pt-3 pb-6 space-y-3 animate-fadeIn">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  const el = document.querySelector(link.href);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                    window.history.pushState(null, '', link.href);
                  }
                }}
                className="block py-2 text-sm font-semibold text-slate-300 hover:text-emerald-400"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenDocs();
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 text-center flex items-center justify-center gap-2"
              >
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Ver Documentação da API</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('login');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 text-center"
              >
                Entrar na Conta
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('register');
                }}
                className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs text-center shadow-lg shadow-emerald-500/25"
              >
                Criar Conta Grátis (3 Dias)
              </button>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge de Lançamento */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-7 shadow-inner">
            <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span>API REST v2.0 • Clusters Dedicados & Webhooks em Alta Performance</span>
          </div>

          {/* Headline Principal */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-5xl mx-auto">
            A API de WhatsApp mais <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">rápida, estável e simples</span> para suas automações.
          </h1>

          {/* Subheadline Focada em Devs & Automações */}
          <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
            Conecte qualquer sistema, CRM, <b>n8n</b> ou <b>Typebot</b> ao WhatsApp em minutos. 
            Envie textos, áudios PTT gravados na hora, mídias e receba Webhooks em tempo real com alta disponibilidade e zero burocracia.
          </p>

          {/* Botões de Conversão */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-slate-950 font-black text-sm md:text-base hover:opacity-95 transition-all shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2.5"
            >
              <span>Testar Grátis por 3 Dias</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenDocs}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700/80 hover:border-slate-600 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Ver Documentação REST</span>
            </button>
          </div>

          {/* Prova Rápida / Badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
              Conexão via QR Code em 10s
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
              Webhooks em &lt; 150ms
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
              100% Compatível com n8n & Make
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
              Mensagens Ilimitadas (sem custo Meta)
            </span>
          </div>

          {/* SIMULADOR INTERATIVO DA API (HERO DEMO) */}
          <div className="mt-14 relative z-10">
            <HeroDemo />
          </div>
        </div>
      </section>

      {/* STRIP DE ESTATÍSTICAS */}
      <section className="py-12 border-y border-slate-800/80 bg-[#0b101e]/60 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {stats.map((s, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
                <p className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                  {s.value}
                </p>
                <p className="text-xs sm:text-sm font-bold text-white mt-1">{s.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEÇÃO 1: COMO FUNCIONA (PASSO A PASSO) */}
      <section id="como-funciona" className="py-20 md:py-28 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Integração Descomplicada
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mt-3">
              Como automatizar seu WhatsApp em 3 passos
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-4">
              Sem burocracias de aprovação da Meta ou configurações complexas. Tudo pronto para rodar em minutos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-8 rounded-3xl bg-[#0f1424] border border-slate-800 hover:border-slate-700 transition-all space-y-5 shadow-xl flex flex-col justify-between group hover:-translate-y-1"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-mono font-black text-emerald-400 text-sm">
                        {item.step}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                        {item.badge}
                      </span>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white">{item.title}</h3>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80">
                    <p className="text-[11px] text-emerald-400/90 font-medium">
                      💡 {item.highlight}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SEÇÃO 2: RECURSOS DA API */}
      <section id="recursos" className="py-20 md:py-28 bg-[#0b101e]/80 border-y border-slate-800/80 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
              Arquitetura de Alta Performance
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mt-3">
              Tudo o que sua empresa precisa para escalar no WhatsApp
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-4">
              Recursos de nível enterprise desenvolvidos especificamente para desenvolvedores e integradores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-[#0f1424] border border-slate-800 hover:border-emerald-500/40 transition-all space-y-4 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {feat.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SEÇÃO 3: INTEGRAÇÃO N8N & NO-CODE */}
      <section id="integracoes" className="py-20 md:py-28 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-tr from-[#0e1424] via-[#11192e] to-[#0e1424] border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  Ecosistema No-Code & Low-Code
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                  Compatível com <span className="text-emerald-400">n8n, Make, Typebot</span> e qualquer sistema HTTP.
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Automatize notificações de vendas do seu checkout, envie lembretes de agendamento do Google Agenda, 
                  conecte robôs do Typebot e dispare áudios de pós-venda sem complicação.
                </p>

                <div className="space-y-3 pt-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Nó HTTP nativo: apenas passe URL e Bearer Token</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Webhooks compatíveis com JSON Schema padrão</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Suporte a variáveis dinâmicas e placeholders</span>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={onOpenDocs}
                    className="px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <span>Ver Exemplos de Integração</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenAuth('register')}
                    className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700 transition-all"
                  >
                    Começar Gratuitamente
                  </button>
                </div>
              </div>

              {/* Mockup de Integração n8n */}
              <div className="p-5 rounded-2xl bg-[#080d1a] border border-slate-800 font-mono text-xs shadow-inner space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-2">
                    <Workflow className="w-4 h-4" /> Fluxo de Exemplo: n8n Workflow
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                    ATIVO
                  </span>
                </div>

                {/* Nós Simulados */}
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[10px]">
                        WEB
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-white">Webhook Hotmart / Kiwify</p>
                        <p className="text-[10px] text-slate-400">Gatilho: Compra Aprovada</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500">Trigger</span>
                  </div>

                  <div className="flex justify-center text-slate-600">
                    <ArrowRight className="w-4 h-4 rotate-90" />
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-[10px]">
                        NX
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-emerald-300">NexusAPI • Enviar Áudio PTT</p>
                        <p className="text-[10px] text-slate-400">POST /api/messages/send-audio</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold">&lt; 120ms</span>
                  </div>

                  <div className="flex justify-center text-slate-600">
                    <ArrowRight className="w-4 h-4 rotate-90" />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-[10px]">
                        NX
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-white">NexusAPI • Enviar Acesso e PDF</p>
                        <p className="text-[10px] text-slate-400">POST /api/messages/send-media</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">Sucesso</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 4: TABELA COMPARATIVA */}
      <section id="comparativo" className="py-20 md:py-28 bg-[#0b101e]/60 border-y border-slate-800/80 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Economia & Liberdade
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mt-3">
              Por que a NexusAPI é a escolha inteligente?
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-4">
              Compare e veja a diferença de autonomia, preço e velocidade técnica.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full max-w-5xl mx-auto rounded-3xl overflow-hidden bg-[#0f1424] border border-slate-800 text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80">
                  <th className="p-5 font-bold text-white text-sm">Recurso / Diferencial</th>
                  <th className="p-5 font-bold text-emerald-400 text-sm bg-emerald-500/10 border-x border-emerald-500/20 text-center">
                    NexusAPI
                  </th>
                  <th className="p-5 font-semibold text-slate-400 text-center">Meta Cloud API (Oficial)</th>
                  <th className="p-5 font-semibold text-slate-400 text-center">Outras APIs Não Oficiais</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {comparisonData.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4 font-medium text-slate-200">{row.feature}</td>
                    <td className="p-4 bg-emerald-500/5 border-x border-emerald-500/20 text-center font-bold text-emerald-400">
                      {typeof row.nexus === 'boolean' ? (
                        row.nexus ? <Check className="w-4 h-4 text-emerald-400 mx-auto stroke-[3]" /> : <Minus className="w-4 h-4 text-slate-500 mx-auto" />
                      ) : (
                        row.nexus
                      )}
                    </td>
                    <td className="p-4 text-center text-slate-400">
                      {typeof row.meta === 'boolean' ? (
                        row.meta ? <Check className="w-4 h-4 text-slate-400 mx-auto" /> : <Minus className="w-4 h-4 text-rose-500/80 mx-auto" />
                      ) : (
                        row.meta
                      )}
                    </td>
                    <td className="p-4 text-center text-slate-400">
                      {typeof row.outras === 'boolean' ? (
                        row.outras ? <Check className="w-4 h-4 text-slate-400 mx-auto" /> : <Minus className="w-4 h-4 text-slate-600 mx-auto" />
                      ) : (
                        row.outras
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SEÇÃO 5: PLANOS & PREÇOS */}
      <section id="planos" className="py-20 md:py-28 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Preço Justo & Sem Pegadinhas
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mt-3">
              Planos transparentes para qualquer tamanho de operação
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-4">
              Mensagens ilimitadas em todos os planos. Pague apenas pela quantidade de instâncias de WhatsApp conectadas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {plans.map((p) => {
              const isPopular = p.popular;
              return (
                <div
                  key={p.id}
                  className={`rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative ${
                    isPopular
                      ? 'bg-gradient-to-b from-[#131c31] to-[#0f1526] border-2 border-emerald-500 shadow-2xl shadow-emerald-500/15 md:-translate-y-2'
                      : 'bg-[#0f1424] border border-slate-800 hover:border-slate-700 shadow-xl'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                      <span className="inline-flex items-center px-4 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-[11px] uppercase tracking-wider shadow-lg shadow-emerald-500/20 whitespace-nowrap">
                        {p.badge}
                      </span>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-bold text-white">{p.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{p.tagline}</p>

                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="text-xs text-slate-400 font-bold">R$</span>
                      <span className="text-4xl sm:text-5xl font-black text-white">{p.priceDisplay}</span>
                      <span className="text-xs text-slate-400">/mês</span>
                    </div>

                    <div className="mt-8 space-y-3 pt-6 border-t border-slate-800">
                      {p.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2.5 text-xs text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setSelectedPlan(p)}
                      className={`w-full py-3.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                        isPopular
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:opacity-95 shadow-emerald-500/25'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      <span>Assinar Plano {p.name.split(' ')[0]}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <p className="text-center text-[10px] text-slate-500 mt-2.5">
                      Ativação imediata via PIX ou Cartão • Cancele quando quiser
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SEÇÃO 6: FAQ */}
      <section id="faq" className="py-20 md:py-28 bg-[#0b101e]/60 border-t border-slate-800/80 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Tire Suas Dúvidas
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mt-3">
              Perguntas Frequentes
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-4">
              Tudo o que você precisa saber antes de conectar suas automações.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className="rounded-2xl bg-[#0f1424] border border-slate-800 overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-white hover:text-emerald-400 transition-colors"
                  >
                    <span>{f.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-emerald-400 transition-transform duration-200 flex-shrink-0 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3 animate-fadeIn">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA FINAL PRÉ-FOOTER */}
      <section className="py-20 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#10192e] to-teal-950/40 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
            <div className="space-y-5 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight">
                Pronto para automatizar seu WhatsApp hoje?
              </h2>
              <p className="text-slate-300 text-sm sm:text-base">
                Crie sua conta agora mesmo e teste gratuitamente por 3 dias com acesso completo a todos os endpoints e webhooks.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => onOpenAuth('register')}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>Iniciar Teste Gratuito</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onOpenDocs}
                  className="w-full sm:w-auto px-7 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Explorar Documentação</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-slate-800/80 bg-[#060911] text-xs text-slate-400 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="NexusAPI" className="h-8 w-auto object-contain" />
            <div>
              <p className="font-bold text-white text-sm">NexusAPI</p>
              <p className="text-[11px] text-slate-500">API Profissional de WhatsApp para Automações</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <button type="button" onClick={onOpenDocs} className="hover:text-emerald-400 transition-colors">
              Documentação da API
            </button>
            <a href="#planos" className="hover:text-emerald-400 transition-colors">
              Planos & Preços
            </a>
            <button type="button" onClick={() => onOpenAuth('login')} className="hover:text-emerald-400 transition-colors">
              Painel do Cliente
            </button>
          </div>

          <p className="text-[11px] text-slate-600">
            © {new Date().getFullYear()} NexusAPI. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* Modal de Checkout */}
      {selectedPlan && (
        <CheckoutModal
          isOpen={Boolean(selectedPlan)}
          selectedPlan={selectedPlan.name}
          onClose={() => setSelectedPlan(null)}
          onPaymentSuccess={() => {
            setSelectedPlan(null);
            onOpenAuth('register');
          }}
        />
      )}
    </div>
  );
};
