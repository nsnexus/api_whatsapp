import React, { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, Minus, Menu, X, Plus, Mic, FileText, ShieldCheck, History } from 'lucide-react';
import { CheckoutModal } from '../wapi/CheckoutModal';
import { HeroDemo } from './HeroDemo';
import { TeamInboxDemo, KanbanDemo, QuickReplyDemo, QrIllustration } from './FeatureDemos';

interface LandingPageViewProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  onEnterApp: () => void;
  onOpenDocs: () => void;
}

const navLinks = [
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#recursos', label: 'Recursos' },
  { href: '#api', label: 'API' },
  { href: '#precos', label: 'Preços' },
  { href: '#faq', label: 'Dúvidas' },
];

const timeline = [
  { time: '09:14', text: 'Uma cliente pergunta o preço de um bolo no WhatsApp da loja.' },
  { time: '09:15', text: 'O celular está com o Rafael, que está no caixa atendendo uma fila.' },
  { time: '11:02', text: 'A Júlia pega o celular, vê 43 conversas e não sabe quais já foram respondidas.' },
  { time: '15:30', text: 'A cliente comprou na confeitaria da esquina, que respondeu em cinco minutos.' },
];

const extras = [
  { icon: Mic, title: 'Áudio como se fosse gravado na hora', text: 'Grave pelo navegador. O cliente recebe com o microfone verde, igual a um áudio normal do WhatsApp.' },
  { icon: FileText, title: 'Fotos, PDFs e comprovantes', text: 'Mande orçamento em PDF, receba comprovante de PIX. Tudo fica guardado na conversa.' },
  { icon: ShieldCheck, title: 'Cuidado com bloqueio', text: 'Intervalos naturais entre envios e um guia de boas práticas para números novos.' },
  { icon: History, title: 'Histórico que não some', text: 'Trocou de atendente? A conversa inteira continua ali, com notas internas da equipe.' },
];

const comparison: { label: string; nexus: boolean | string; official: boolean | string; phone: boolean | string }[] = [
  { label: 'Usa o número que você já tem', nexus: true, official: 'Número novo ou migração', phone: true },
  { label: 'Começa a funcionar no mesmo dia', nexus: true, official: 'Aprovação da Meta', phone: true },
  { label: 'Preço fixo, sem cobrança por conversa', nexus: true, official: 'Paga por conversa', phone: true },
  { label: 'Vários atendentes ao mesmo tempo', nexus: true, official: 'Precisa de outro sistema', phone: false },
  { label: 'Funil de vendas', nexus: true, official: false, phone: false },
  { label: 'Respostas rápidas para a equipe toda', nexus: true, official: false, phone: 'Só no aparelho' },
  { label: 'API e webhooks para automação', nexus: true, official: true, phone: false },
];

const audiences = [
  {
    img: '/landing/loja.jpg',
    title: 'Lojas, confeitarias e delivery',
    text: 'Pedido, orçamento, PIX e entrega no mesmo lugar. Ninguém fica sem resposta no horário de pico.',
  },
  {
    img: '/landing/clinica.jpg',
    title: 'Clínicas, salões e serviços',
    text: 'Recepção e profissionais atendendo o mesmo número, com lembretes e confirmações por automação.',
  },
  {
    img: '/landing/agencia.jpg',
    title: 'Agências e quem automatiza',
    text: 'Vários números e clientes num painel só, e uma API simples para plugar n8n, Typebot ou Make.',
  },
];

const plans = [
  {
    id: '1_instancia',
    name: '1 Instância',
    tagline: 'Para automações e atendimento individual',
    price: 19.90,
    priceDisplay: '19,90',
    features: [
      '1 número de WhatsApp conectado',
      'API REST completa & Webhooks',
      'Envio de texto, mídia, PDF e áudio PTT',
      'Caixa de entrada Live Chat e Kanban',
      'Bots de IA para Venda de Cursos',
      'Suporte via WhatsApp',
    ],
  },
  {
    id: 'combo_5',
    name: 'Combo 5 Instâncias',
    tagline: 'Para agências, gestores e infoprodutores',
    price: 49.90,
    priceDisplay: '49,90',
    highlight: true,
    features: [
      '5 números de WhatsApp simultâneos',
      'Apenas R$ 9,98 por instância/mês',
      'API REST de alta velocidade para todos os números',
      'Webhooks dedicados para n8n, Make e Typebot',
      'Multi-atendentes ilimitados no Live Chat',
      'Bots de IA com ChatGPT em todos os números',
      'Fila anti-ban inteligente',
      'Suporte prioritário VIP no WhatsApp',
    ],
  },
  {
    id: '2_instancias',
    name: '2 Instâncias',
    tagline: 'Para quem divide atendimento e vendas',
    price: 29.90,
    priceDisplay: '29,90',
    features: [
      '2 números de WhatsApp simultâneos',
      'API REST ilimitada para ambos',
      'Webhooks em tempo real por instância',
      'Live Chat multi-agente e funil de vendas',
      'Bots de IA com ChatGPT para Venda de Cursos',
      'Integração com n8n, Typebot e Make',
      'Suporte prioritário',
    ],
  },
];

const faqs = [
  {
    q: 'Preciso trocar de número ou de celular?',
    a: 'Não. Você conecta o número que já usa escaneando um QR Code, do mesmo jeito que faz no WhatsApp Web. Seus clientes continuam falando com o mesmo contato de sempre.',
  },
  {
    q: 'O celular precisa ficar ligado?',
    a: 'Não. Depois de conectado, a sessão fica ativa nos nossos servidores 24 horas por dia. Você continua podendo usar o WhatsApp no celular normalmente.',
  },
  {
    q: 'Como funciona o teste grátis?',
    a: 'Você cria a conta, conecta seu WhatsApp e usa tudo por 3 dias. Se não fizer sentido para o seu negócio, é só não assinar.',
  },
  {
    q: 'Quantas pessoas podem atender ao mesmo tempo?',
    a: 'No Starter, até 3 atendentes. No Pro e no Enterprise, quantos você precisar. Cada um entra com o próprio login e só vê o que você permitir.',
  },
  {
    q: 'Existe risco de o número ser bloqueado?',
    a: 'Qualquer uso de WhatsApp fora do aplicativo oficial tem algum risco, principalmente com envios em massa. O Nexus usa intervalos naturais entre mensagens e traz um guia de boas práticas, mas o mais importante é não mandar spam.',
  },
  {
    q: 'Consigo integrar com n8n, Typebot ou Make?',
    a: 'Sim. Tem uma API REST para enviar mensagens e webhooks que avisam na hora quando chega uma mensagem nova. A documentação tem exemplos em cURL, Node.js e Python.',
  },
  {
    q: 'Tem fidelidade ou multa para cancelar?',
    a: 'Não. A assinatura é mensal e você cancela quando quiser.',
  },
];

const codeSnippet = `curl -X POST https://api.nsnexus.com.br/api/messages/send-text \\
  -H "Authorization: Bearer SUA_CHAVE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "instanceName": "minha_loja",
    "number": "5511982314410",
    "text": "Seu pedido saiu para entrega 🛵"
  }'`;

const brl = (n: number | string) => {
  if (typeof n === 'string') return n.startsWith('R$') ? n : `R$ ${n}`;
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
};

const PhotoSlot: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="aspect-[4/3] rounded-xl bg-paper-2 border border-paper-line bg-[repeating-linear-gradient(135deg,transparent,transparent_10px,rgba(22,20,15,0.035)_10px,rgba(22,20,15,0.035)_20px)]" />
    );
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className="aspect-[4/3] w-full object-cover rounded-xl border border-paper-line" />;
};

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[13px] font-medium text-leaf mb-4 flex items-center gap-2">
    <span className="w-5 h-px bg-leaf" />
    {children}
  </p>
);

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onOpenAuth, onEnterApp, onOpenDocs }) => {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState('pro');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // O painel do CRM trava a rolagem do body; a landing precisa rolar normalmente
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousTitle = document.title;
    document.body.style.overflow = 'auto';
    document.title = 'Nexus · Sua equipe atendendo no mesmo WhatsApp';
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      document.body.style.overflow = previousOverflow;
      document.title = previousTitle;
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const openCheckout = (plan: string) => {
    setSelectedPlanForCheckout(plan);
    setIsCheckoutOpen(true);
  };

  const renderCell = (value: boolean | string, strong = false) => {
    if (value === true) return <Check className={`w-5 h-5 mx-auto ${strong ? 'text-leaf' : 'text-ink-soft'}`} strokeWidth={2.5} />;
    if (value === false) return <Minus className="w-5 h-5 mx-auto text-ink-mute/60" />;
    return <span className="text-[12px] text-ink-soft">{value}</span>;
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-sans antialiased selection:bg-leaf selection:text-white pb-20 md:pb-0">
      {/* Cabeçalho */}
      <header className={`sticky top-0 z-40 bg-paper/90 backdrop-blur transition-colors ${scrolled ? 'border-b border-paper-line' : 'border-b border-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-leaf text-white font-display font-bold flex items-center justify-center text-[15px]">n</span>
            <span className="font-display font-bold text-[20px] tracking-tight">nexus</span>
          </a>

          <nav className="hidden md:flex items-center gap-7 text-[14px] text-ink-soft">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-ink transition-colors">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={() => onOpenAuth('login')} className="hidden sm:block px-3 py-2 text-[14px] text-ink-soft hover:text-ink">
              Entrar
            </button>
            <button onClick={() => onOpenAuth('register')} className="px-4 py-2 rounded-lg bg-ink text-paper text-[14px] font-medium hover:bg-ink/85 transition-colors">
              Testar grátis
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 -mr-2 text-ink" aria-label="Menu">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-paper-line bg-paper px-4 py-3">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="block py-2.5 text-[15px] text-ink">
                {l.label}
              </a>
            ))}
            <button onClick={() => onOpenAuth('login')} className="block py-2.5 text-[15px] text-ink-soft">
              Entrar
            </button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="pt-12 md:pt-20 pb-16 md:pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-[1.25fr_1fr] gap-8 lg:gap-16 items-end mb-12 md:mb-16">
            <div>
              <p className="text-[14px] text-ink-soft mb-5">CRM e API para WhatsApp</p>
              <h1 className="font-display font-bold tracking-[-0.03em] leading-[0.98] text-[44px] sm:text-[64px] lg:text-[80px]">
                Um WhatsApp.
                <br />
                <span className="text-leaf">A equipe inteira</span> atendendo.
              </h1>
            </div>
            <div className="lg:pb-3">
              <p className="text-[17px] leading-relaxed text-ink-soft mb-7">
                O Nexus junta as conversas do seu WhatsApp numa caixa de entrada que toda a equipe usa ao mesmo tempo. Cada conversa tem um responsável, cada venda
                aparece no funil, e o cliente continua falando com o número de sempre.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-6 py-3.5 rounded-lg bg-leaf text-white text-[15px] font-semibold hover:bg-leaf-dark transition-colors flex items-center justify-center gap-2"
                >
                  Testar grátis por 3 dias <ArrowRight className="w-4 h-4" />
                </button>
                <a href="#precos" className="px-6 py-3.5 rounded-lg border border-ink/15 text-[15px] font-medium hover:border-ink transition-colors text-center">
                  Ver planos
                </a>
              </div>
              <p className="text-[13px] text-ink-mute mt-4">Sem fidelidade. Conecta pelo QR Code em um minuto.</p>
            </div>
          </div>

          <HeroDemo />
        </div>
      </section>

      {/* Faixa de fatos */}
      <section className="border-y border-paper-line bg-paper-2/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-paper-line">
          {[
            ['Mesmo número', 'Nada de chip novo ou migração. Seus clientes nem percebem a mudança.'],
            ['Sem aprovação da Meta', 'Conectou o QR Code, está funcionando. Sem templates para aprovar.'],
            ['Preço fixo', 'Mensagens ilimitadas. Você não paga por conversa.'],
          ].map(([t, d]) => (
            <div key={t} className="py-6 sm:px-6 first:sm:pl-0 last:sm:pr-0">
              <p className="font-display font-semibold text-[18px] mb-1">{t}</p>
              <p className="text-[14px] text-ink-soft leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Problema */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20">
          <div>
            <SectionLabel>O problema</SectionLabel>
            <h2 className="font-display font-bold tracking-[-0.02em] text-[34px] sm:text-[44px] leading-[1.05] mb-6">Uma terça-feira comum no WhatsApp da loja.</h2>
            <p className="text-[17px] text-ink-soft leading-relaxed">
              O problema quase nunca é a equipe. É um celular só para todo mundo, sem saber quem respondeu quem, e sem nenhum registro do que ficou para depois.
            </p>
          </div>
          <ol className="relative border-l border-paper-line ml-2">
            {timeline.map((t, i) => (
              <li key={t.time} className="pl-8 pb-9 last:pb-0 relative">
                <span className={`absolute -left-[5px] top-2 w-[9px] h-[9px] rounded-full ${i === timeline.length - 1 ? 'bg-ember' : 'bg-ink'}`} />
                <p className="font-mono text-[13px] text-ink-mute mb-1">{t.time}</p>
                <p className={`text-[18px] leading-snug ${i === timeline.length - 1 ? 'text-ink font-semibold' : 'text-ink'}`}>{t.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="py-20 md:py-28 bg-white border-y border-paper-line scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionLabel>Como funciona</SectionLabel>
          <h2 className="font-display font-bold tracking-[-0.02em] text-[34px] sm:text-[44px] leading-[1.05] mb-14 max-w-2xl">
            Do cadastro à primeira conversa em menos de cinco minutos.
          </h2>
          <div className="grid md:grid-cols-3 gap-10 md:gap-8">
            <div>
              <div className="h-32 flex items-end mb-6">
                <QrIllustration />
              </div>
              <p className="font-display text-[15px] font-semibold text-ink-mute mb-2">01</p>
              <h3 className="font-display font-semibold text-[22px] mb-2">Conecte seu número</h3>
              <p className="text-[15px] text-ink-soft leading-relaxed">
                Abra o WhatsApp no celular, vá em Aparelhos conectados e escaneie o QR Code. É o mesmo processo do WhatsApp Web.
              </p>
            </div>
            <div>
              <div className="h-32 flex items-end mb-6">
                <div className="w-full max-w-[240px] rounded-lg border border-paper-line bg-paper/60 divide-y divide-paper-line text-[13px]">
                  {[
                    ['Júlia', 'Vendas'],
                    ['Rafael', 'Vendas'],
                    ['Bia', 'Suporte'],
                  ].map(([n, q]) => (
                    <div key={n} className="flex justify-between px-3 py-2">
                      <span className="font-medium">{n}</span>
                      <span className="text-ink-mute">{q}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="font-display text-[15px] font-semibold text-ink-mute mb-2">02</p>
              <h3 className="font-display font-semibold text-[22px] mb-2">Chame a equipe</h3>
              <p className="text-[15px] text-ink-soft leading-relaxed">
                Convide cada atendente pelo e-mail e separe por filas, como Vendas e Suporte. Cada um entra com o próprio login.
              </p>
            </div>
            <div>
              <div className="h-32 flex items-end mb-6">
                <div className="rounded-xl rounded-bl-sm bg-white border border-paper-line px-3.5 py-2.5 text-[14px] shadow-sm max-w-[240px]">
                  Oi, vocês ainda têm o de chocolate?
                  <p className="text-[11px] text-ember font-semibold mt-1">Nova conversa · Vendas</p>
                </div>
              </div>
              <p className="font-display text-[15px] font-semibold text-ink-mute mb-2">03</p>
              <h3 className="font-display font-semibold text-[22px] mb-2">Comece a atender</h3>
              <p className="text-[15px] text-ink-soft leading-relaxed">
                As conversas chegam na caixa de entrada. Quem assumir responde, e o resto da equipe vê que ela já tem dono.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recursos em detalhe */}
      <section id="recursos" className="py-20 md:py-28 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-24 md:space-y-32">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <SectionLabel>Caixa de entrada compartilhada</SectionLabel>
              <h2 className="font-display font-bold tracking-[-0.02em] text-[32px] sm:text-[40px] leading-[1.08] mb-5">Cada conversa tem um responsável.</h2>
              <p className="text-[17px] text-ink-soft leading-relaxed mb-6">
                Chega de duas pessoas respondendo o mesmo cliente, ou de ninguém responder porque achou que o outro já tinha visto.
              </p>
              <ul className="space-y-3 text-[15px]">
                {[
                  'Filas separadas por setor, como Vendas e Suporte',
                  'Conversas sem dono ficam destacadas, com o tempo de espera',
                  'Notas internas que só a equipe vê',
                  'Histórico completo mesmo quando troca o atendente',
                ].map((t) => (
                  <li key={t} className="flex gap-3">
                    <Check className="w-4 h-4 text-leaf mt-1 flex-shrink-0" strokeWidth={2.5} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <TeamInboxDemo />
          </div>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="lg:order-2">
              <SectionLabel>Funil de vendas</SectionLabel>
              <h2 className="font-display font-bold tracking-[-0.02em] text-[32px] sm:text-[40px] leading-[1.08] mb-5">Saiba quanto dinheiro está parado no WhatsApp.</h2>
              <p className="text-[17px] text-ink-soft leading-relaxed">
                Todo contato novo vira um card no funil. Arraste de Novo para Atendendo, Proposta e Fechado, coloque o valor da venda e veja no topo quanto está em
                negociação e quanto já fechou no mês.
              </p>
            </div>
            <div className="lg:order-1">
              <KanbanDemo />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <SectionLabel>Respostas rápidas</SectionLabel>
              <h2 className="font-display font-bold tracking-[-0.02em] text-[32px] sm:text-[40px] leading-[1.08] mb-5">Digite uma barra e responda em segundos.</h2>
              <p className="text-[17px] text-ink-soft leading-relaxed">
                Cadastre uma vez as respostas que a equipe manda o dia todo, como chave PIX, cardápio, horário e taxa de entrega. Todo mundo usa o mesmo texto, sem
                erro de digitação. Experimente ao lado: escolha uma resposta e envie.
              </p>
            </div>
            <QuickReplyDemo />
          </div>
        </div>
      </section>

      {/* Extras */}
      <section className="pb-20 md:pb-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 border-t border-paper-line">
            {extras.map(({ icon: Icon, title, text }) => (
              <div key={title} className="pt-7 pb-2 sm:pr-8">
                <Icon className="w-5 h-5 text-leaf mb-4" strokeWidth={1.75} />
                <h3 className="font-display font-semibold text-[18px] mb-2 leading-snug">{title}</h3>
                <p className="text-[14px] text-ink-soft leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API */}
      <section id="api" className="py-20 md:py-28 bg-ink text-paper scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <p className="text-[13px] font-medium text-[#7CD3A5] mb-4 flex items-center gap-2">
              <span className="w-5 h-px bg-[#7CD3A5]" />
              Para quem automatiza
            </p>
            <h2 className="font-display font-bold tracking-[-0.02em] text-[32px] sm:text-[40px] leading-[1.08] mb-5">Uma API que faz o básico muito bem.</h2>
            <p className="text-[17px] text-paper/70 leading-relaxed mb-8">
              Mande mensagem quando um pedido sai para entrega, quando um lead preenche o formulário ou quando o pagamento cai. Receba um webhook a cada mensagem nova e
              leve para o n8n, Typebot, Make ou para o seu próprio sistema.
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[14px] text-paper/80 mb-8">
              {['Texto, imagem, PDF e áudio', 'Webhook de mensagem recebida', 'Status de conexão do número', 'Exemplos em cURL, Node e Python'].map((t) => (
                <p key={t} className="flex gap-2">
                  <Check className="w-4 h-4 text-[#7CD3A5] mt-0.5 flex-shrink-0" /> {t}
                </p>
              ))}
            </div>
            <button onClick={onOpenDocs} className="inline-flex items-center gap-2 text-[15px] font-semibold text-paper border-b border-paper/40 pb-0.5 hover:border-paper">
              Ler a documentação <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="rounded-xl bg-[#0D0C09] border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 text-[12px] text-paper/50 font-mono">
              <span>POST /api/messages/send-text</span>
              <span className="text-[#7CD3A5]">200 OK</span>
            </div>
            <pre className="p-5 text-[12.5px] leading-relaxed font-mono text-paper/85 overflow-x-auto">{codeSnippet}</pre>
          </div>
        </div>
      </section>

      {/* Comparativo */}
      <section id="comparativo" className="py-20 md:py-28 scroll-mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <SectionLabel>Comparando</SectionLabel>
          <h2 className="font-display font-bold tracking-[-0.02em] text-[32px] sm:text-[40px] leading-[1.08] mb-10">Por que não só o celular, ou a API oficial?</h2>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full min-w-[560px] text-[14px]">
              <thead>
                <tr className="border-b-2 border-ink">
                  <th className="text-left py-3 font-medium text-ink-mute w-[40%]" />
                  <th className="py-3 font-display font-bold text-[16px] text-leaf">Nexus</th>
                  <th className="py-3 font-medium text-ink-soft">API oficial da Meta</th>
                  <th className="py-3 font-medium text-ink-soft">Só o celular</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.label} className="border-b border-paper-line">
                    <td className="py-3.5 pr-4">{row.label}</td>
                    <td className="py-3.5 text-center bg-leaf-light/40">{renderCell(row.nexus, true)}</td>
                    <td className="py-3.5 text-center px-2">{renderCell(row.official)}</td>
                    <td className="py-3.5 text-center px-2">{renderCell(row.phone)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Para quem é */}
      <section className="py-20 md:py-28 bg-white border-y border-paper-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionLabel>Para quem é</SectionLabel>
          <h2 className="font-display font-bold tracking-[-0.02em] text-[32px] sm:text-[40px] leading-[1.08] mb-12 max-w-2xl">Feito para quem vende e atende pelo WhatsApp.</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {audiences.map((a) => (
              <div key={a.title}>
                <PhotoSlot src={a.img} alt={a.title} />
                <h3 className="font-display font-semibold text-[20px] mt-5 mb-2">{a.title}</h3>
                <p className="text-[15px] text-ink-soft leading-relaxed">{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preços */}
      <section id="precos" className="py-20 md:py-28 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div>
              <SectionLabel>Preços da API WhatsApp & CRM</SectionLabel>
              <h2 className="font-display font-bold tracking-[-0.02em] text-[32px] sm:text-[40px] leading-[1.08]">
                Preço fixo por instância. Mensagens ilimitadas.
              </h2>
            </div>
            <p className="text-[15px] text-ink-soft md:max-w-xs">
              Conecte 1, 2 ou aproveite o Combo com 5 instâncias. Sem fidelidade.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`rounded-2xl p-7 flex flex-col ${p.highlight ? 'bg-ink text-paper' : 'bg-white border border-paper-line'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-display font-bold text-[22px]">{p.name}</h3>
                  {p.highlight && <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7CD3A5]">Mais escolhido</span>}
                </div>
                <p className={`text-[14px] mb-6 ${p.highlight ? 'text-paper/65' : 'text-ink-soft'}`}>{p.tagline}</p>
                <p className="mb-1">
                  <span className="font-display font-bold text-[44px] tracking-tight">{brl((p as any).priceDisplay || p.price)}</span>
                  <span className={`text-[14px] ${p.highlight ? 'text-paper/60' : 'text-ink-mute'}`}> /mês</span>
                </p>
                <p className={`text-[13px] mb-6 ${p.highlight ? 'text-paper/50' : 'text-ink-mute'}`}>
                  cerca de R$ {(p.price / 30).toFixed(2).replace('.', ',')} por dia
                </p>
                <ul className="space-y-2.5 text-[14px] mb-8 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${p.highlight ? 'text-[#7CD3A5]' : 'text-leaf'}`} strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => openCheckout(p.id)}
                  className={`w-full py-3 rounded-lg text-[15px] font-semibold transition-colors ${
                    p.highlight ? 'bg-[#7CD3A5] text-ink hover:bg-[#95DDB6]' : 'border border-ink/20 hover:border-ink'
                  }`}
                >
                  Assinar {p.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 md:py-28 border-t border-paper-line scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-[1fr_1.6fr] gap-10 lg:gap-20">
          <div>
            <SectionLabel>Dúvidas</SectionLabel>
            <h2 className="font-display font-bold tracking-[-0.02em] text-[32px] sm:text-[40px] leading-[1.08] mb-4">Perguntas que sempre aparecem.</h2>
            <p className="text-[15px] text-ink-soft">
              Ficou alguma?{' '}
              <button onClick={() => onOpenAuth('register')} className="text-ink underline underline-offset-4">
                Crie a conta e fale com a gente pelo painel.
              </button>
            </p>
          </div>
          <div className="border-t border-ink">
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={f.q} className="border-b border-paper-line">
                  <button onClick={() => setOpenFaq(open ? null : i)} className="w-full py-5 flex items-center justify-between gap-6 text-left" aria-expanded={open}>
                    <span className="font-display font-semibold text-[18px]">{f.q}</span>
                    <Plus className={`w-5 h-5 flex-shrink-0 transition-transform ${open ? 'rotate-45' : ''}`} />
                  </button>
                  {open && <p className="pb-6 -mt-1 text-[15px] text-ink-soft leading-relaxed max-w-2xl">{f.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-leaf text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-24 grid lg:grid-cols-[1.4fr_1fr] gap-10 items-end">
          <h2 className="font-display font-bold tracking-[-0.03em] text-[38px] sm:text-[56px] leading-[1.02]">
            Seu cliente mandou mensagem. Alguém já respondeu?
          </h2>
          <div>
            <p className="text-[17px] text-white/80 mb-6">Conecte seu número hoje e veja a equipe inteira atendendo pelo mesmo WhatsApp. São 3 dias grátis para testar.</p>
            <button
              onClick={() => onOpenAuth('register')}
              className="px-6 py-3.5 rounded-lg bg-paper text-ink text-[15px] font-semibold hover:bg-white transition-colors inline-flex items-center gap-2"
            >
              Criar minha conta <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="bg-paper py-10 text-[14px] text-ink-soft">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-leaf text-white font-display font-bold flex items-center justify-center text-[13px]">n</span>
            <span className="font-display font-bold text-ink">nexus</span>
            <span className="ml-2">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <a href="#precos" className="hover:text-ink">Preços</a>
            <button onClick={onOpenDocs} className="hover:text-ink">Documentação</button>
            <button onClick={() => onOpenAuth('login')} className="hover:text-ink">Entrar</button>
            <button onClick={onEnterApp} className="hover:text-ink">Painel</button>
          </div>
        </div>
      </footer>

      {/* CTA fixo no celular */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 p-3 bg-paper/95 backdrop-blur border-t border-paper-line">
        <button onClick={() => onOpenAuth('register')} className="w-full py-3 rounded-lg bg-leaf text-white text-[15px] font-semibold flex items-center justify-center gap-2">
          Testar grátis por 3 dias <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} selectedPlan={selectedPlanForCheckout} />
    </div>
  );
};
