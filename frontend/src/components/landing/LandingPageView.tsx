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
  Gift, 
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
  CheckCheck
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
  { href: '#recursos', label: 'Recursos da IA' },
  { href: '#api', label: 'API & Automações' },
  { href: '#comparativo', label: 'Comparativo' },
  { href: '#planos', label: 'Planos & Preços' },
  { href: '#faq', label: 'Dúvidas' },
];

const stats = [
  { value: '+2.4M', label: 'Mensagens Entregues', sub: 'Sem perda de conexão' },
  { value: '< 850ms', label: 'Tempo de Resposta', sub: 'Motor GPT-5.6 Luna' },
  { value: '4x Mais', label: 'Conversão em Vendas', sub: 'Funil Voto de Confiança' },
  { value: '100%', label: 'Sem Taxa por Mensagem', sub: 'Economia total vs Meta API' },
];

const funnelSteps = [
  {
    step: '01',
    badge: 'Oferta Invertida',
    title: 'Apresentação & Voto de Confiança',
    description: 'O bot apresenta o curso com entusiasmo e quebra imediatamente o medo de golpe: propõe enviar as apostilas e materiais antes de qualquer pagamento.',
    highlight: '“Posso te mandar o material agora para você dar uma olhada antes de pagar?”',
    icon: ShieldCheck,
    color: 'emerald',
  },
  {
    step: '02',
    badge: 'Disparo Imediato',
    title: 'Entrega dos PDFs + PIX Copia e Cola',
    description: 'Assim que o lead confirma, o bot dispara as apostilas completas em PDF, áudio com microfone verde (PTT) e envia o código PIX avulso pronto para copiar no banco.',
    highlight: 'Envio de mensagem separada com código PIX puro para facilitar cópia no celular.',
    icon: CreditCard,
    color: 'teal',
  },
  {
    step: '03',
    badge: 'Recompensa Instantânea',
    title: 'Pagamento & Entrega do Super Bônus',
    description: 'O cliente realiza o pagamento e envia a confirmação. O robô celebra a integridade do cliente e libera o Super Bônus exclusivo prometido.',
    highlight: 'Gera satisfação máxima e fidelização para compras de novos cursos.',
    icon: Gift,
    color: 'purple',
  },
];

const features = [
  {
    icon: Bot,
    title: 'Inteligência Artificial GPT-5.6 Luna',
    text: 'Conversas que parecem 100% humanas. Respostas ágeis, empáticas e focadas em fechamento, sem respostas robóticas ou engessadas.',
  },
  {
    icon: Mic,
    title: 'Áudio Gravado com Microfone Verde (PTT)',
    text: 'Envie mensagens de voz gravadas como se você estivesse falando no celular naquele exato instante. Aumenta a autoridade e a conexão.',
  },
  {
    icon: FileText,
    title: 'Disparo de PDFs, Apostilas e Vídeos',
    text: 'Entregue materiais de estudo, vídeos demonstrativos e e-books automaticamente quando o cliente pedir ou após a confirmação.',
  },
  {
    icon: CreditCard,
    title: 'Geração Dinâmica de PIX Copia e Cola',
    text: 'Criação instantânea de códigos PIX padrão Banco Central em mensagens dedicadas para o lead apenas clicar e colar no app do banco.',
  },
  {
    icon: ShieldCheck,
    title: 'Proteção Anti-Ban & Aquecimento',
    text: 'Intervalos inteligentes, delays humanizados de digitação e fila de disparos para proteger a integridade do seu número do WhatsApp.',
  },
  {
    icon: Workflow,
    title: 'Múltiplos Cursos no Mesmo WhatsApp',
    text: 'Cadastre 1, 5 ou 20 cursos no mesmo número. O robô reconhece automaticamente pelo gatilho sobre qual curso o cliente está falando.',
  },
];

const comparisonData = [
  { feature: 'Bots de Vendas com GPT-5.6 nativo', nexus: true, meta: false, manual: false },
  { feature: 'Funil com Voto de Confiança & Super Bônus', nexus: true, meta: false, manual: 'Difícil escalar' },
  { feature: 'Geração de PIX Copia e Cola automático', nexus: true, meta: 'Requer dev externo', manual: 'Lento / Manual' },
  { feature: 'Envio de áudio com microfone verde (PTT)', nexus: true, meta: false, manual: true },
  { feature: 'Conversas ilimitadas sem custo por mensagem', nexus: true, meta: false, manual: true },
  { feature: 'Conexão via QR Code em 30 segundos', nexus: true, meta: 'Demora dias / burocracia', manual: true },
  { feature: 'API REST & Webhooks para n8n, Make e Typebot', nexus: true, meta: true, manual: false },
  { feature: 'Atendimento 24 horas por dia sem parar', nexus: true, meta: 'Cobra por conversa', manual: false },
];

const plans = [
  {
    id: '1_instancia',
    name: '1 Instância',
    tagline: 'Ideal para validar um infoproduto ou operação inicial',
    price: 19.90,
    priceDisplay: '19,90',
    popular: false,
    features: [
      '1 número de WhatsApp conectado',
      'Bots de IA ilimitados (GPT-5.6)',
      'Funil de Voto de Confiança & PIX',
      'Disparo de PDFs, Áudios PTT e Vídeos',
      'API REST completa & Webhooks',
      'Live Chat & Painel CRM Web',
      'Fila Anti-Ban Inteligente',
      'Suporte via WhatsApp',
    ],
  },
  {
    id: 'combo_5',
    name: 'Combo 5 Instâncias',
    tagline: 'Mais Vendido • Para agências, infoprodutores e múltiplos números',
    price: 49.90,
    priceDisplay: '49,90',
    popular: true,
    badge: 'MELHOR CUSTO-BENEFÍCIO',
    features: [
      '5 números de WhatsApp simultâneos',
      'Apenas R$ 9,98 por número/mês',
      'Bots de Vendas IA em todas as instâncias',
      'Funis de Vendas e PIX Ilimitados',
      'API REST de alta velocidade para n8n e Make',
      'Webhooks dedicados em tempo real',
      'Atendentes humanos ilimitados',
      'Prioridade máxima no cluster de envio',
      'Suporte Prioritário VIP no WhatsApp',
    ],
  },
  {
    id: '2_instancias',
    name: '2 Instâncias',
    tagline: 'Para quem divide número de vendas e suporte',
    price: 29.90,
    priceDisplay: '29,90',
    popular: false,
    features: [
      '2 números de WhatsApp conectados',
      'Apenas R$ 14,95 por instância/mês',
      'Bots de IA configuráveis para cada número',
      'Cobrança PIX Copia e Cola automática',
      'API REST & Webhooks integrados',
      'Live Chat & Funil Kanban',
      'Suporte via WhatsApp',
    ],
  },
];

const faqs = [
  {
    q: 'Como funciona o funil com Voto de Confiança?',
    a: 'O robô com inteligência artificial atende o cliente, apresenta o curso com persuasão e propõe enviar os materiais completos adiantados para o cliente conferir antes de pagar. Assim que o cliente aceita, os arquivos são disparados na hora junto com o código PIX Copia e Cola e a promessa do Super Bônus. Essa inversão de risco destrói a desconfiança de golpes na internet e multiplica as conversões.',
  },
  {
    q: 'Eu preciso deixar meu celular ligado ou computador aberto?',
    a: 'Não! Depois que você conecta seu WhatsApp escaneando o QR Code pelo painel, a NexusAPI roda 100% em servidores na nuvem (Cloudflare & clusters dedicados). O bot atende e vende mesmo com seu celular desligado ou sem bateria.',
  },
  {
    q: 'Tem custo por mensagem igual à API oficial da Meta?',
    a: 'Não cobramos NADA por mensagem! Na Meta você paga em dólares por cada janela de conversa. Na NexusAPI você paga uma mensalidade fixa super acessível e pode trocar mensagens, áudios e arquivos ilimitadamente.',
  },
  {
    q: 'Como funciona o envio do PIX Copia e Cola?',
    a: 'Nosso sistema gera o código padrão oficial do Banco Central (EMV BRCode) com base na sua chave cadastrada e valor do curso. O código é enviado em uma mensagem separada e limpa no WhatsApp, permitindo que o cliente copie com um único toque no celular e cole direto no banco.',
  },
  {
    q: 'Posso integrar a NexusAPI com n8n, Make ou Typebot?',
    a: 'Sim! Oferecemos uma API REST completa e Webhooks em tempo real. Você pode conectar seu WhatsApp a fluxos no n8n, Make, Typebot, Zapier ou em qualquer linguagem de programação (Node, Python, PHP, etc.).',
  },
  {
    q: 'Como funciona o teste grátis?',
    a: 'Você cria sua conta gratuitamente em menos de 1 minuto, conecta seu WhatsApp pelo QR Code e tem 3 dias de acesso completo sem compromisso para testar os robôs e as automações na prática.',
  },
];

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onOpenAuth,
  onEnterApp,
  onOpenDocs,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'js' | 'python'>('curl');
  const [codeCopied, setCodeCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fecha o menu mobile ao rolar
  useEffect(() => {
    const handleScroll = () => {
      if (mobileMenuOpen) setMobileMenuOpen(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileMenuOpen]);

  const curlExample = `curl -X POST "https://api.nexusapi.com.br/message/sendText" \\
  -H "apikey: sua_chave_nexus_api" \\
  -H "Content-Type: application/json" \\
  -d '{
    "number": "5511999998888",
    "text": "Olá! Seu material foi liberado com sucesso 🚀"
  }'`;

  const jsExample = `const res = await fetch("https://api.nexusapi.com.br/message/sendText", {
  method: "POST",
  headers: {
    "apikey": "sua_chave_nexus_api",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    number: "5511999998888",
    text: "Olá! Seu material foi liberado com sucesso 🚀"
  })
});
const data = await res.json();`;

  const pyExample = `import requests

url = "https://api.nexusapi.com.br/message/sendText"
headers = {
    "apikey": "sua_chave_nexus_api",
    "Content-Type": "application/json"
}
payload = {
    "number": "5511999998888",
    "text": "Olá! Seu material foi liberado com sucesso 🚀"
}
response = requests.post(url, json=payload, headers=headers)
print(response.json())`;

  const activeCodeSnippet =
    activeCodeTab === 'curl' ? curlExample : activeCodeTab === 'js' ? jsExample : pyExample;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeCodeSnippet);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 selection:bg-emerald-500 selection:text-slate-950 font-sans overflow-x-hidden">
      
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#080c14]/85 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo NexusAPI com Imagem 3D Oficial */}
          <a href="#" className="flex items-center gap-3 group">
            <img 
              src="/logo.png" 
              alt="NexusAPI" 
              className="h-10 w-auto object-contain drop-shadow-[0_0_15px_rgba(16,185,129,0.35)] group-hover:scale-105 transition-transform"
            />
            <div className="hidden sm:block">
              <span className="font-extrabold text-lg text-white tracking-tight flex items-center gap-1.5">
                NexusAPI
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  v2.0
                </span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium leading-none">
                Bots de Vendas IA & WhatsApp
              </p>
            </div>
          </a>

          {/* Links Desktop */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
            {navLinks.map((l) => (
              <a 
                key={l.href} 
                href={l.href} 
                className="hover:text-emerald-400 transition-colors py-1"
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Ações / Botões */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all"
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth('register')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-300 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <span>Testar Grátis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Menu Mobile Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Menu Mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-2 pb-6 bg-[#0e1320] border-b border-slate-800 space-y-3 animate-fadeIn">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-emerald-400"
              >
                {l.label}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        {/* Glow de Fundo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-transparent blur-[120px] pointer-events-none rounded-full" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          
          {/* Badge Chamativa */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold animate-fadeIn">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Novo Motor GPT-5.6 Luna · Bots que Vendem no Piloto Automático</span>
          </div>

          {/* Headline Principal */}
          <div className="max-w-4xl mx-auto space-y-4">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
              Transforme seu WhatsApp em uma{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Máquina de Vendas com IA
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
              Atendentes inteligentes que apresentam seus cursos, enviam apostilas e áudios gravados na hora,
              cobram no <b>PIX Copia e Cola</b> e liberam bônus sozinhos 24h por dia.
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-sm hover:from-emerald-400 hover:to-teal-300 transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 group"
            >
              <span>Testar Grátis por 3 Dias</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <a
              href="#como-funciona"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-800 text-sm font-bold transition-all flex items-center justify-center gap-2"
            >
              <span>Ver Como o Robô Vende</span>
            </a>
          </div>

          {/* Micro Trust */}
          <p className="text-xs text-slate-500 flex items-center justify-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Sem cartão para testar</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Conexão via QR Code em 30s</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Sem taxas por mensagem</span>
          </p>

          {/* DEMO INTERATIVA AO VIVO */}
          <div className="pt-6">
            <HeroDemo />
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="border-y border-slate-800/80 bg-[#0b0f1a]/80 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {stats.map((s, idx) => (
              <div key={idx} className="space-y-1">
                <p className="text-2xl sm:text-3xl font-black text-white font-mono bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  {s.value}
                </p>
                <p className="text-xs font-bold text-slate-200">{s.label}</p>
                <p className="text-[11px] text-slate-500">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA: O FUNIL "VOTO DE CONFIANÇA" */}
      <section id="como-funciona" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
              <Workflow className="w-3.5 h-3.5" />
              <span>Estratégia Exclusiva de Alta Conversão</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              O Funil de Voto de Confiança que vende até 4x mais
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              O maior medo de quem compra pelo WhatsApp é tomar golpe. A NexusAPI inverte o jogo: entrega o conteúdo
              antes do pagamento, gerando reciprocidade e fechamento instantâneo no PIX.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {funnelSteps.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="p-8 bg-[#101626] border border-slate-800/80 rounded-3xl space-y-5 shadow-xl hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-black text-slate-700 font-mono group-hover:text-emerald-500/40 transition-colors">
                        {f.step}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        {f.badge}
                      </span>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shadow-md">
                      <Icon className="w-6 h-6" />
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {f.title}
                    </h3>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {f.description}
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 text-[11px] text-slate-300 font-medium leading-snug">
                    💡 {f.highlight}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* RECURSOS DA NEXUSAPI */}
      <section id="recursos" className="py-24 bg-[#0a0f1c] border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Tudo o que você precisa para escalar suas vendas
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Criado especificamente para infoprodutores, criadores de cursos, agências e negócios digitais no WhatsApp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={i}
                  className="p-6 bg-[#12192c] border border-slate-800 rounded-3xl space-y-3.5 hover:border-slate-700 transition-all shadow-md"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">{feat.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{feat.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SEÇÃO DESENVOLVEDORES & API REST */}
      <section id="api" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-xl space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-bold border border-teal-500/20">
                <Code2 className="w-3.5 h-3.5" />
                <span>API REST Completa & Webhooks</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Pluge seu WhatsApp no n8n, Make, Typebot ou seu código
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Dispare mensagens, envie arquivos e receba confirmações de leitura com uma API limpa e ultrarrápida.
                Totalmente compatível com qualquer ferramenta no-code ou linguagem de programação.
              </p>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onOpenDocs}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold text-xs hover:border-slate-700 transition-all flex items-center gap-2"
                >
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Ver Documentação Interativa</span>
                </button>
              </div>
            </div>

            {/* Terminal com Code Snippet */}
            <div className="w-full lg:w-1/2 rounded-3xl bg-[#0f1422] border border-slate-800 overflow-hidden shadow-2xl">
              <div className="px-4 py-3 bg-[#151c2e] border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-[11px] text-slate-400 font-mono ml-2">POST /message/sendText</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() => setActiveCodeTab('curl')}
                      className={`px-2 py-1 rounded ${activeCodeTab === 'curl' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                    >
                      cURL
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCodeTab('js')}
                      className={`px-2 py-1 rounded ${activeCodeTab === 'js' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                    >
                      Node.js
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCodeTab('python')}
                      className={`px-2 py-1 rounded ${activeCodeTab === 'python' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                    >
                      Python
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Copiar código"
                  >
                    {codeCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <pre className="p-5 font-mono text-[11px] text-emerald-300 leading-relaxed overflow-x-auto bg-[#0a0e18]">
                <code>{activeCodeSnippet}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* TABELA COMPARATIVA */}
      <section id="comparativo" className="py-24 bg-[#0a0f1c] border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Por que a NexusAPI é a escolha inteligente?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Economia real, velocidade instantânea e recursos nativos de vendas que nenhuma outra plataforma entrega.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 overflow-hidden bg-[#101626] shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#141b2f]">
                    <th className="p-4 sm:p-5 text-xs font-bold text-slate-400">Recurso / Vantagem</th>
                    <th className="p-4 sm:p-5 text-xs font-black text-emerald-400 bg-emerald-500/10">NexusAPI</th>
                    <th className="p-4 sm:p-5 text-xs font-bold text-slate-400">API Oficial Meta</th>
                    <th className="p-4 sm:p-5 text-xs font-bold text-slate-400">Atendimento Manual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-xs">
                  {comparisonData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 sm:p-5 font-medium text-slate-200">{row.feature}</td>
                      <td className="p-4 sm:p-5 bg-emerald-500/5 font-bold text-emerald-400">
                        {row.nexus === true ? <CheckCheck className="w-5 h-5 text-emerald-400" /> : row.nexus}
                      </td>
                      <td className="p-4 sm:p-5 text-slate-400">
                        {row.meta === true ? (
                          <Check className="w-4 h-4 text-slate-300" />
                        ) : row.meta === false ? (
                          <Minus className="w-4 h-4 text-slate-600" />
                        ) : (
                          row.meta
                        )}
                      </td>
                      <td className="p-4 sm:p-5 text-slate-400">
                        {row.manual === true ? (
                          <Check className="w-4 h-4 text-slate-300" />
                        ) : row.manual === false ? (
                          <Minus className="w-4 h-4 text-slate-600" />
                        ) : (
                          row.manual
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* PLANOS & PREÇOS */}
      <section id="planos" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Investimento Acessível e Transparente</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Escolha o plano ideal para a sua operação
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Comece agora mesmo com 3 dias grátis. Cancele quando quiser, sem contratos de fidelidade.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {plans.map((p) => {
              return (
                <div
                  key={p.id}
                  className={`rounded-3xl p-8 flex flex-col justify-between relative transition-all shadow-xl ${
                    p.popular
                      ? 'bg-gradient-to-b from-[#152336] to-[#0f172a] border-2 border-emerald-500 shadow-emerald-500/15 md:-translate-y-2'
                      : 'bg-[#101626] border border-slate-800'
                  }`}
                >
                  {p.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-md">
                      {p.badge}
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-white">{p.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{p.tagline}</p>
                    </div>

                    <div className="flex items-baseline gap-1 border-b border-slate-800 pb-6">
                      <span className="text-xs text-slate-400 font-bold">R$</span>
                      <span className="text-4xl font-black text-white font-mono">{p.priceDisplay}</span>
                      <span className="text-xs text-slate-400">/mês</span>
                    </div>

                    <ul className="space-y-3 text-xs">
                      {p.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-8">
                    <button
                      type="button"
                      onClick={() => setSelectedPlan(p)}
                      className={`w-full py-3.5 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
                        p.popular
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 shadow-emerald-500/25'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      <span>Assinar {p.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-[#0a0f1c] border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Perguntas Frequentes
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Tudo o que você precisa saber antes de começar a vender no automático.
            </p>
          </div>

          <div className="space-y-3.5">
            {faqs.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className="rounded-2xl bg-[#101626] border border-slate-800 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full p-5 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-white hover:text-emerald-400 transition-colors"
                  >
                    <span>{f.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3 animate-fadeIn">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-b from-[#0a0f1c] to-[#0d1627] border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/10">
            <Zap className="w-8 h-8" />
          </div>

          <div className="space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Comece a vender seus cursos e produtos no automático hoje
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Conecte seu WhatsApp em menos de 1 minuto e veja a inteligência artificial trabalhando para o seu negócio 24 horas por dia.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenAuth('register')}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-sm hover:from-emerald-400 hover:to-teal-300 transition-all shadow-xl shadow-emerald-500/25 inline-flex items-center gap-2 group"
          >
            <span>Criar Conta & Testar 3 Dias Grátis</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-[#070a12] py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="NexusAPI" className="h-8 w-auto object-contain opacity-80" />
            <div>
              <span className="font-bold text-sm text-slate-300">NexusAPI</span>
              <p className="text-[10px] text-slate-500">Automação de WhatsApp e Vendas com Inteligência Artificial</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button type="button" onClick={onOpenDocs} className="hover:text-emerald-400 transition-colors">
              Documentação da API
            </button>
            <a href="#planos" className="hover:text-emerald-400 transition-colors">
              Preços
            </a>
            <button type="button" onClick={() => onOpenAuth('login')} className="hover:text-emerald-400 transition-colors">
              Acessar Painel
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
