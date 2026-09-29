import { SupabaseClient } from '@supabase/supabase-js';
import { generatePixBrcode } from './pix';

export interface MaterialItem {
  id: string;
  name: string;
  url: string;
  type: 'document' | 'image' | 'video' | 'audio' | 'link';
  description?: string;
  mimetype?: string;
}

export interface BonusItem {
  id: string;
  name: string;
  description?: string;
  value?: number;
}

export interface FaqObjection {
  objection: string;
  reply_guide: string;
}

export interface FlowStep {
  id: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'wait_reply' | 'generate_pix' | 'deliver_materials' | 'deliver_bonus';
  title: string;
  content?: string;
  caption?: string;
  delay_seconds?: number;
  wait_condition?: string;
  media_name?: string;
  material_ids?: string[];
}

export interface Course {
  id: string;
  organization_id: string;
  name: string;
  slug?: string;
  description: string;
  triggers: string[];
  price: number;
  original_price?: number;
  pix_key: string;
  pix_key_type: 'cpf' | 'cnpj' | 'phone' | 'email' | 'random';
  pix_name: string;
  pix_city?: string;
  ai_persona: string;
  materials: MaterialItem[];
  bonuses: BonusItem[];
  faq_objections: FaqObjection[];
  flow_steps?: FlowStep[];
  is_active: boolean;
}

export interface AiSettings {
  id?: string;
  organization_id: string;
  openai_api_key?: string;
  openai_model: string;
  is_enabled: boolean;
  human_handover_minutes: number;
  greeting_message?: string;
}

export interface AiAction {
  type: 'send_media' | 'pix_generated' | 'human_handover' | 'deliver_course_materials' | 'deliver_bonus';
  payload?: any;
}

export interface FlowDispatchItem {
  type: 'text' | 'image' | 'audio' | 'video' | 'deliver_materials' | 'generate_pix' | 'deliver_bonus';
  text?: string;
  url?: string;
  caption?: string;
  fileName?: string;
  pixPayload?: any;
  materialsPayload?: any[];
  bonusPayload?: any;
}

export interface AiReplyResult {
  replyText: string;
  actions: AiAction[];
  courseId?: string;
  courseName?: string;
  ignored?: boolean;
  dispatchItems?: FlowDispatchItem[];
}

/**
 * Normaliza texto para busca de gatilhos (sem acentos, minúsculo)
 */
function cleanTextForMatching(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Verifica se a resposta do cliente é uma confirmação/aceite (Sim, Pode mandar, Quero)
 */
function isConfirmationReply(text: string): boolean {
  const norm = cleanTextForMatching(text);
  const words = norm.split(/\s+/);
  const directWords = [
    'sim',
    's',
    'quero',
    'pode',
    'manda',
    'mande',
    'envia',
    'enviar',
    'topo',
    'aceito',
    'claro',
    'vamos',
    'ok',
    'beleza',
    'pago',
    'comprar',
    'opa',
    'concordo',
  ];
  if (words.some((w) => directWords.includes(w))) return true;
  if (
    /pode mandar|pode enviar|manda ai|manda aí|mande ai|mande aí|quero sim|pode sim|com certeza|sim por favor|manda logo|mande por favor|pode ser|manda pra ca|manda pra mim/i.test(
      norm
    )
  ) {
    return true;
  }
  return false;
}

/**
 * Verifica se a resposta do cliente é uma confirmação de pagamento PIX
 */
function isPaymentReply(text: string): boolean {
  const norm = cleanTextForMatching(text);
  const paymentWords = ['paguei', 'pago', 'transferi', 'comprovante', 'pronto'];
  const words = norm.split(/\s+/);
  if (words.some((w) => paymentWords.includes(w))) return true;
  if (
    /fiz o pix|fiz o pagamento|ta pago|tá pago|ja fiz|já fiz|mandei o pix|mandei o comprovante|segue o comprovante|ja transferi|já transferi|pix feito|pagamento feito|mandei ai/i.test(
      norm
    )
  ) {
    return true;
  }
  return false;
}

/**
 * Converte blocos do Construtor de Fluxo em itens prontos para disparo
 */
function convertStepsToDispatchItems(
  steps: FlowStep[],
  course: Course,
  customerName?: string
): FlowDispatchItem[] {
  const items: FlowDispatchItem[] = [];

  for (const step of steps) {
    let text = step.content || '';
    if (customerName && text.includes('{nome}')) {
      text = text.replace(/{nome}/gi, customerName);
    }

    if (step.type === 'text') {
      if (text.trim()) {
        items.push({
          type: 'text',
          text,
        });
      }
    } else if (step.type === 'image') {
      items.push({
        type: 'image',
        url: step.content || '',
        caption: step.caption || undefined,
        fileName: step.title || 'Foto',
      });
    } else if (step.type === 'audio') {
      items.push({
        type: 'audio',
        url: step.content || '',
        fileName: step.title || 'Áudio de Voz',
      });
    } else if (step.type === 'video') {
      items.push({
        type: 'video',
        url: step.content || '',
        caption: step.caption || undefined,
        fileName: step.title || 'Vídeo Demonstrativo',
      });
    } else if (step.type === 'deliver_materials') {
      items.push({
        type: 'deliver_materials',
        text: text.trim() ? text : undefined,
        materialsPayload: course.materials,
      });
    } else if (step.type === 'generate_pix') {
      let brCode = '';
      try {
        brCode = generatePixBrcode({
          pixKey: course.pix_key,
          pixKeyType: course.pix_key_type,
          merchantName: course.pix_name || 'CURSO ONLINE',
          merchantCity: course.pix_city || 'SAO PAULO',
          amount: Number(course.price),
          description: course.name.slice(0, 20),
        });
      } catch (err) {
        console.error('Erro ao gerar código PIX Copia e Cola:', err);
      }

      items.push({
        type: 'generate_pix',
        text: text.trim() ? text : undefined,
        pixPayload: {
          pixKey: course.pix_key,
          pixKeyType: course.pix_key_type,
          merchantName: course.pix_name || 'Equipe do Curso',
          amount: Number(course.price),
          courseName: course.name,
          brCode,
        },
      });
    } else if (step.type === 'deliver_bonus') {
      items.push({
        type: 'deliver_bonus',
        text: text.trim() ? text : undefined,
        bonusPayload: {
          bonuses: course.bonuses,
          materials: course.materials,
        },
      });
    }
  }

  return items;
}

/**
 * Motor de IA para Venda de Cursos no WhatsApp usando OpenAI ChatGPT
 */
export async function generateCourseAiReply(params: {
  supabase: SupabaseClient;
  organizationId: string;
  chatId: string;
  incomingText: string;
  customerName?: string;
  customerPhone?: string;
  historyMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  forceCourseId?: string;
}): Promise<AiReplyResult | null> {
  const {
    supabase,
    organizationId,
    chatId,
    incomingText,
    customerName,
    customerPhone,
    historyMessages = [],
    forceCourseId,
  } = params;

  // 1. Carregar Configurações Globais da IA
  const { data: aiSettings } = await supabase
    .from('ai_settings')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (!aiSettings || !aiSettings.is_enabled || !aiSettings.openai_api_key) {
    console.log('AI desabilitada ou chave OpenAI ausente.');
    return null;
  }

  // 2. Verificar se o chat tem a IA desativada ou pausada por intervenção humana
  const { data: chat } = await supabase
    .from('chats')
    .select('id, contact_id, active_course_id, ai_disabled, ai_paused_until')
    .eq('id', chatId)
    .maybeSingle();

  if (chat) {
    if (chat.ai_disabled) {
      console.log(`IA desabilitada manualmente para o chat ${chatId}`);
      return null;
    }
    if (chat.ai_paused_until && new Date(chat.ai_paused_until).getTime() > Date.now()) {
      console.log(`IA em pausa (human handover) para o chat ${chatId} até ${chat.ai_paused_until}`);
      return null;
    }
  }

  // Carregar dados e custom_fields do contato para acompanhar a etapa do funil
  let contactRecord: any = null;
  if (chat?.contact_id) {
    const { data: cData } = await supabase
      .from('contacts')
      .select('id, custom_fields, name, push_name')
      .eq('id', chat.contact_id)
      .maybeSingle();
    contactRecord = cData;
  }

  // 3. Buscar todos os cursos ativos desta empresa
  const { data: coursesData } = await supabase
    .from('courses')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  const courses: Course[] = (coursesData || []).map((c: any) => {
    let steps: FlowStep[] = [];
    if (Array.isArray(c.flow_steps)) {
      steps = c.flow_steps;
    } else if (c.ai_persona) {
      const match = c.ai_persona.match(/<!--FLOW_STEPS:(.*?)-->/s);
      if (match) {
        try {
          steps = JSON.parse(match[1]);
        } catch {}
      }
    }

    return {
      ...c,
      materials: Array.isArray(c.materials) ? c.materials : [],
      bonuses: Array.isArray(c.bonuses) ? c.bonuses : [],
      faq_objections: Array.isArray(c.faq_objections) ? c.faq_objections : [],
      triggers: Array.isArray(c.triggers) ? c.triggers : [],
      flow_steps: steps,
    };
  });

  if (courses.length === 0) {
    console.log('Nenhum curso ativo cadastrado.');
    return null;
  }

  // 4. Identificar se a mensagem tem relação estrita com cursos ou com um funil em andamento
  let activeCourse: Course | undefined;
  const normalizedIncoming = cleanTextForMatching(incomingText);

  // Palavras-chave que indicam intenção explícita sobre cursos
  const GENERAL_COURSE_KEYWORDS = [
    'curso',
    'cursos',
    'treinamento',
    'treinamentos',
    'apostila',
    'apostilas',
    'metodo',
    'metodos',
    'modulo',
    'modulos',
    'inscricao',
    'inscricoes',
    'matricula',
    'matriculas',
    'vaga',
    'vagas',
    'certificado',
    'certificados',
    'comprar curso',
    'preco do curso',
    'valor do curso',
    'quero aprender',
    'quero o curso',
    'conteudo do curso',
    'fazer o curso',
    'sabonete',
    'sabonetes',
  ];

  // Respostas esperadas de quem já está dentro do funil de vendas conversando ativamente com o bot
  const FUNNEL_CONTINUATION_KEYWORDS = [
    'sim',
    'quero',
    'pode',
    'pode mandar',
    'pode enviar',
    'manda',
    'manda ai',
    'mande',
    'envia',
    'enviar',
    'topo',
    'aceito',
    'claro',
    'com certeza',
    'fechado',
    'vamos',
    'paguei',
    'fiz o pix',
    'ta pago',
    'tá pago',
    'ja fiz',
    'mandei',
    'comprovante',
    'pix',
    'chave pix',
    'codigo pix',
    'quanto custa',
    'quanto e',
    'qual o valor',
    'tem desconto',
    'como funciona',
    'garantia',
  ];

  // A. Se foi passado curso forçado (ex: no simulador do CRM)
  if (forceCourseId) {
    activeCourse = courses.find((c) => c.id === forceCourseId);
  }

  // B. Verificar se a mensagem do cliente dispara algum gatilho específico de curso
  if (!activeCourse) {
    for (const course of courses) {
      const matchTrigger = course.triggers.some((trig) => {
        const cleanTrig = cleanTextForMatching(trig);
        return cleanTrig && normalizedIncoming.includes(cleanTrig);
      });

      const matchName = cleanTextForMatching(course.name) && normalizedIncoming.includes(cleanTextForMatching(course.name));
      const matchSlug = course.slug && cleanTextForMatching(course.slug) && normalizedIncoming.includes(cleanTextForMatching(course.slug));

      if (matchTrigger || matchName || matchSlug) {
        activeCourse = course;
        break;
      }
    }
  }

  // C. Se a mensagem contém palavras-chave gerais sobre cursos (ex: "tem curso?", "qual valor da apostila?")
  const hasGeneralCourseKeyword = GENERAL_COURSE_KEYWORDS.some((kw) => normalizedIncoming.includes(kw));

  if (!activeCourse && hasGeneralCourseKeyword) {
    if (chat?.active_course_id) {
      activeCourse = courses.find((c) => c.id === chat.active_course_id);
    }
    // Apenas seleciona o curso único se a pessoa EXPLICITAMENTE falou sobre cursos
    if (!activeCourse && courses.length === 1) {
      activeCourse = courses[0];
    }
  }

  // D. Se não mencionou curso, verificar se é uma continuação válida de um diálogo de funil em andamento
  // (ex: o robô perguntou "Posso te mandar o material?" e o cliente respondeu "Sim", "Pode", "Paguei", etc.)
  const hasRecentBotInteraction = historyMessages.some((m) => m.role === 'assistant');
  const isFunnelReply = FUNNEL_CONTINUATION_KEYWORDS.some((kw) => {
    if (kw.length <= 4) {
      const regex = new RegExp(`(^|\\s)${kw}(\\s|!|\\?|\\.|$)`, 'i');
      return regex.test(normalizedIncoming);
    }
    return normalizedIncoming.includes(kw);
  });

  if (!activeCourse && hasRecentBotInteraction && isFunnelReply && chat?.active_course_id) {
    activeCourse = courses.find((c) => c.id === chat.active_course_id);
  }

  // 🛑 FILTRO DE SEGURANÇA MÁXIMA: Se a mensagem NÃO contém gatilho de curso, NÃO contém palavra de curso
  // e NÃO é continuação de funil em andamento:
  // IGNORAR IMEDIATAMENTE (sem chamar a OpenAI, sem gastar tokens e sem responder mensagens pessoais/outros clientes)
  if (!activeCourse && !hasGeneralCourseKeyword) {
    console.log(`[BOT CURSOS] Mensagem ignorada por não ter relação com curso: "${incomingText}"`);
    return null;
  }

  // Atualizar no banco o curso ativo da conversa se houver mudança
  if (activeCourse && chat && chat.active_course_id !== activeCourse.id) {
    await supabase.from('chats').update({ active_course_id: activeCourse.id }).eq('id', chatId);
  }

  // 5. Construir o Prompt do Sistema para o ChatGPT
  let systemPrompt = '';

  if (activeCourse) {
    // 5.1 Prompt com foco no CURSO ESPECÍFICO
    const materialsStr =
      activeCourse.materials.length > 0
        ? activeCourse.materials
            .map(
              (m) =>
                `- [ID: ${m.id}] ${m.name} (${m.type}): ${m.description || 'Sem descrição'}. Link: ${m.url}`
            )
            .join('\n')
        : 'Nenhum material adicional configurado.';

    const bonusesStr =
      activeCourse.bonuses.length > 0
        ? activeCourse.bonuses
            .map(
              (b) =>
                `- ${b.name}: ${b.description || ''} ${b.value ? `(Valor de R$ ${b.value.toFixed(2)} que sairá DE GRAÇA)` : ''}`
            )
            .join('\n')
        : 'Nenhum bônus extra cadastrado.';

    const objectionsStr =
      activeCourse.faq_objections.length > 0
        ? activeCourse.faq_objections
            .map((o) => `* Se o cliente disser: "${o.objection}" -> Responda guiado por: "${o.reply_guide}"`)
            .join('\n')
        : '';

    // 5.1 SE O CURSO TEM FLUXO VISUAL PROGRAMADO (FLOW BUILDER)
    if (activeCourse.flow_steps && activeCourse.flow_steps.length > 0) {
      // Agrupar os passos em fases separadas por blocos do tipo 'wait_reply'
      const phases: FlowStep[][] = [];
      let currentPhase: FlowStep[] = [];
      for (const s of activeCourse.flow_steps) {
        if (s.type === 'wait_reply') {
          phases.push(currentPhase);
          currentPhase = [];
        } else {
          currentPhase.push(s);
        }
      }
      if (currentPhase.length > 0) {
        phases.push(currentPhase);
      }

      // Estado atual do contato no funil
      let courseFunnels = contactRecord?.custom_fields?.course_funnels || {};
      let funnelState = courseFunnels[activeCourse.id];

      // Se o cliente pedir para recomeçar o fluxo
      if (
        normalizedIncoming.includes('reiniciar') ||
        normalizedIncoming.includes('comecar de novo') ||
        normalizedIncoming.includes('recomecar')
      ) {
        funnelState = null;
      }

      const isConfirmation = isConfirmationReply(incomingText);
      const isPayment = isPaymentReply(incomingText);

      // Verificar no histórico se a apresentação já havia sido enviada
      const botSentPresentation = historyMessages.some((m) =>
        m.role === 'assistant' && (
          m.content.toLowerCase().includes('posso te mandar') ||
          m.content.toLowerCase().includes('posso enviar') ||
          m.content.toLowerCase().includes('henrique') ||
          m.content.toLowerCase().includes('confianca') ||
          m.content.toLowerCase().includes('confiança')
        )
      );

      let targetPhaseIndex: number | null = null;
      let nextPhaseIndex: number = 0;
      let nextWaitingFor: string = 'confirmation';

      if (!funnelState) {
        if (botSentPresentation && isConfirmation) {
          // Cliente já tinha recebido a apresentação anteriormente e agora confirmou -> Avança para Fase 1
          targetPhaseIndex = 1;
          nextPhaseIndex = 1;
          nextWaitingFor = 'payment';
        } else {
          // Início do funil do curso: dispara a Fase 0 (Apresentação, Banner, Oferta e Pergunta)
          targetPhaseIndex = 0;
          nextPhaseIndex = 0;
          nextWaitingFor = 'confirmation';
        }
      } else if (funnelState.phase === 0) {
        // Estava aguardando confirmação da Fase 0
        if (isConfirmation) {
          targetPhaseIndex = 1;
          nextPhaseIndex = 1;
          nextWaitingFor = 'payment';
        } else if (isPayment) {
          targetPhaseIndex = 2;
          nextPhaseIndex = 2;
          nextWaitingFor = 'completed';
        }
      } else if (funnelState.phase === 1) {
        // Estava aguardando pagamento da Fase 1
        if (isPayment) {
          targetPhaseIndex = 2;
          nextPhaseIndex = 2;
          nextWaitingFor = 'completed';
        }
      }

      // Se temos uma fase programada para disparar diretamente
      if (targetPhaseIndex !== null && phases[targetPhaseIndex] && phases[targetPhaseIndex].length > 0) {
        if (contactRecord?.id) {
          courseFunnels = {
            ...courseFunnels,
            [activeCourse.id]: {
              phase: nextPhaseIndex,
              waiting_for: nextWaitingFor,
              updated_at: new Date().toISOString(),
            },
          };

          await supabase
            .from('contacts')
            .update({
              custom_fields: {
                ...(contactRecord.custom_fields || {}),
                course_funnels: courseFunnels,
              },
            })
            .eq('id', contactRecord.id);
        }

        const dispatchItems = convertStepsToDispatchItems(phases[targetPhaseIndex], activeCourse, customerName);

        return {
          replyText: '',
          actions: [],
          courseId: activeCourse.id,
          courseName: activeCourse.name,
          dispatchItems,
        };
      }

      // Se o cliente NÃO confirmou (enviou uma dúvida, pergunta prática ou objeção):
      // Usamos a OpenAI para responder a dúvida de forma humana e retomar o fluxo
      const closingQuestion =
        phases[0] && phases[0].length > 0
          ? phases[0][phases[0].length - 1]?.content || 'Posso enviar o material agora e contar com sua honestidade?'
          : 'Posso enviar o material agora e contar com sua honestidade?';

      let phaseContext = '';
      if (!funnelState || funnelState.phase === 0) {
        phaseContext = `
O cliente está na fase inicial de apresentação do curso "${activeCourse.name}".
Ele ainda NÃO confirmou se quer receber o material, mas fez a seguinte pergunta ou objeção: "${incomingText}".
INSTRUÇÕES OBRIGATÓRIAS:
1. Responda à dúvida dele de forma clara, simpática e convincente (máximo 2 parágrafos curtos).
2. Não tente fechar a venda com PIX agora.
3. Conclua sua resposta convidando-o a continuar com a pergunta exata do fechamento da apresentação:
"${closingQuestion}"
`;
      } else if (funnelState.phase === 1) {
        phaseContext = `
O cliente já recebeu os materiais do curso "${activeCourse.name}" e os dados para pagamento do PIX promocional de R$ ${Number(activeCourse.price).toFixed(2)}.
Ele ainda NÃO enviou o comprovante, mas mandou a mensagem: "${incomingText}".
INSTRUÇÕES OBRIGATÓRIAS:
1. Esclareça a dúvida dele sobre o PIX, pagamento ou materiais de forma prestativa.
2. Lembre-o da Chave PIX: ${activeCourse.pix_key} (${activeCourse.pix_key_type}) e valor R$ ${Number(activeCourse.price).toFixed(2)}.
3. Lembre-o que assim que enviar o comprovante aqui, você libera o SUPER BÔNUS EXCLUSIVO!
`;
      } else {
        phaseContext = `
O cliente já concluiu a compra e recebeu os materiais e bônus.
Mensagem do cliente: "${incomingText}".
Atenda-o como um instrutor prestativo e dê o suporte necessário.
`;
      }

      const objectionSystemPrompt = `
Você é o consultor de vendas oficial do curso "${activeCourse.name}".
DESCRIÇÃO: ${activeCourse.description || 'Curso prático.'}
PREÇO: R$ ${Number(activeCourse.price).toFixed(2)}
CHAVE PIX: ${activeCourse.pix_key} (${activeCourse.pix_key_type})
BENEFICIÁRIO: ${activeCourse.pix_name || 'Equipe do Curso'}

PERSONA DO INSTRUTOR:
${activeCourse.ai_persona ? activeCourse.ai_persona.replace(/<!--FLOW_STEPS:.*?-->/gs, '').trim() : 'Atenda com entusiasmo e conduza com clareza.'}

MATERIAIS CADASTRADOS:
${materialsStr}

BÔNUS:
${bonusesStr}

QUEBRA DE OBJEÇÕES E DÚVIDAS:
${objectionsStr}

SITUAÇÃO ATUAL DO CLIENTE NO FUNIL:
${phaseContext}

REGRAS DE CONVERSAÇÃO:
- Responda como uma pessoa real no WhatsApp (parágrafos curtos, emojis com bom senso, tom amigável).
- NUNCA diga que é uma IA ou robô.
- Se o cliente solicitar atendimento humano explicitamente, inclua a tag [CHAMAR_HUMANO].
`.trim();

      const openAiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: objectionSystemPrompt },
      ];
      for (const h of historyMessages.slice(-6)) {
        openAiMessages.push({ role: h.role, content: h.content });
      }
      openAiMessages.push({ role: 'user', content: incomingText });

      const modelToUse = aiSettings.openai_model || 'gpt-5.6-luna';
      const isReasoningModel =
        modelToUse.includes('gpt-5') ||
        modelToUse.includes('o1') ||
        modelToUse.includes('o3');

      const requestPayload: Record<string, any> = {
        model: modelToUse,
        messages: openAiMessages,
        max_completion_tokens: 450,
      };
      if (!isReasoningModel) {
        requestPayload.temperature = 0.7;
      }

      try {
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${aiSettings.openai_api_key}`,
          },
          body: JSON.stringify(requestPayload),
        });

        if (resp.ok) {
          const json = (await resp.json()) as any;
          let reply = json?.choices?.[0]?.message?.content || '';
          const actions: AiAction[] = [];
          if (reply.includes('[CHAMAR_HUMANO]')) {
            actions.push({ type: 'human_handover' });
            reply = reply.replace(/\[CHAMAR_HUMANO\]/gi, '').trim();
            if (chat) {
              await supabase.from('chats').update({ ai_disabled: true }).eq('id', chatId);
            }
          }
          return {
            replyText: reply,
            actions,
            courseId: activeCourse.id,
            courseName: activeCourse.name,
          };
        }
      } catch (err) {
        console.error('Erro na chamada da OpenAI para objeção:', err);
      }
    }

    // 5.2 Se o curso NÃO possui fluxo visual cadastrado: segue a estratégia padrão de 3 etapas
    const customFlowStr = '';

    systemPrompt = `
🚨 REGRA NÚMERO 1 ABSOLUTA (LEIA ANTES DE TUDO):
Analise com rigor extremo a intenção da mensagem do cliente:
- Você SÓ PODE RESPONDER se o cliente estiver tratando especificamente sobre o curso "${activeCourse.name}" ou sobre o processo de dúvidas, negociação ou compra deste curso.
- SE A MENSAGEM DO CLIENTE NÃO FOR SOBRE O CURSO (ex: conversas pessoais, familiares, saudações aleatórias sem menção a curso, cobranças externas, outros produtos ou serviços, engano de número ou piadas):
👉 Responda EXATAMENTE E APENAS COM A PALAVRA: [IGNORAR]
NÃO cumprimente, NÃO ofereça o curso, NÃO peça desculpas e NÃO diga que é uma IA. Apenas responda: [IGNORAR]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DADOS DO CURSO:
Você é o consultor de vendas oficial e especialista do seguinte curso:
NOME DO CURSO: "${activeCourse.name}"
DESCRIÇÃO: ${activeCourse.description || 'Curso prático focado em resultados rápidos.'}
PREÇO OFICIAL / PROMOCIONAL: R$ ${Number(activeCourse.price).toFixed(2)}
${activeCourse.original_price ? `VALOR NORMAL (SEM DESCONTO): R$ ${Number(activeCourse.original_price).toFixed(2)}` : ''}

PERSONA E INSTRUÇÕES ESPECÍFICAS DESTE CURSO (SIGA FIELMENTE):
${activeCourse.ai_persona || 'Atenda com entusiasmo, tire dúvidas com clareza, mostre a transformação do curso e conduza para o fechamento.'}

MATERIAIS E APOSTILAS DO CURSO CADASTRADAS:
${materialsStr}

BÔNUS EXCLUSIVOS INCLUSOS NA COMPRA HOJE:
${bonusesStr}

QUEBRA DE OBJEÇÕES:
${objectionsStr}
${customFlowStr}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ESTRATÉGIA DO FUNIL DE ALTA CONVERSÃO EM 3 ETAPAS (REFERÊNCIA DE FECHAMENTO):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 ETAPA 1: APRESENTAÇÃO + PROPOSTA DO VOTO DE CONFIANÇA
- Quando o cliente iniciar a conversa, perguntar sobre o curso ou quiser detalhes:
1. Cumprimente com simpatia e entusiasmo (Nome do cliente: ${customerName || 'Amigo(a)'}).
2. Apresente os benefícios práticos do curso (o que ele vai aprender a fabricar/fazer) e a oportunidade de economizar ou lucrar.
3. Mencione o valor promocional de apenas R$ ${Number(activeCourse.price).toFixed(2)} (desconto especial).
4. FAÇA A PROPOSTA DO VOTO DE CONFIANÇA (MANDATÓRIO):
   Diga que você confia tanto na honestidade das pessoas e na qualidade do conteúdo que vai fazer algo diferente:
   Pergunte se pode mandar o material completo agora mesmo para ele ver e conferir com os próprios olhos antes de pagar. Se ele gostar, ele faz o PIX de R$ ${Number(activeCourse.price).toFixed(2)} depois.
5. Finalize sempre com a pergunta de fechamento: "Posso te mandar o material agora para você dar uma olhada?"
* IMPORTANTE: NESTA ETAPA 1, NÃO entregue arquivos nem envie dados do PIX ainda. Aguarde a confirmação dele!

📌 ETAPA 2: ENTREGA DO CONTEÚDO + COBRANÇA PIX + ISCA DO SUPER BÔNUS
- Quando o cliente concordar com a proposta (ex: "sim", "pode mandar", "quero", "manda aí", "mande", "pode enviar"):
1. Comemore com alegria a confiança mútua ("Maravilha! Sabia que podia confiar em você! Já estou enviando todo o material para você conferir acima 🚀").
2. Inclua OBRIGATORIAMENTE a tag exata: [ENTREGAR_CURSO]
   (O sistema automatizado irá disparar todos os materiais e arquivos do curso para o cliente).
3. Inclua OBRIGATORIAMENTE a tag exata: [GERAR_PIX]
   (O sistema automatizado irá enviar os dados do PIX e uma mensagem exclusiva com o código Copia e Cola para facilitar o pagamento no celular).
4. REFORCE A ISCA DO SUPER BÔNUS:
   Diga: "🎁 E olha que especial: assim que você fizer o PIX de R$ ${Number(activeCourse.price).toFixed(2)} e me mandar o comprovante aqui, vou liberar imediatamente para você o nosso SUPER BÔNUS EXCLUSIVO (${bonusesStr || 'Guia Prático Avançado Bônus'})!".

📌 ETAPA 3: CONFIRMAÇÃO DO PAGAMENTO + LIBERAÇÃO DO SUPER BÔNUS
- Quando o cliente disser que pagou ("paguei", "já fiz o pix", "tá pago", "mandei", "segue o comprovante" ou enviar foto de comprovante):
1. Agradeça calorosamente pela honestidade, integridade e parceria! ("Sensacional! Muito obrigado pela sua honestidade e parabéns pela excelente decisão! 👏🎉").
2. Diga que o acesso dele está 100% vitalício e garantido.
3. Inclua OBRIGATORIAMENTE a tag exata: [LIBERAR_BONUS]
   (O sistema automatizado irá liberar o Super Bônus prometido).
4. Finalize desejando muito sucesso e se colocando à disposição para tirar qualquer dúvida prática.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRAS GERAIS DE CONVERSAÇÃO NO WHATSAPP:
- Responda como uma pessoa real no WhatsApp: use mensagens diretas, parágrafos curtos (1 a 3 frases por parágrafo), tom caloroso e natural.
- Nome do cliente: ${customerName ? customerName : 'Cliente'}.
- Use emojis com bom senso para deixar a leitura agradável.
- NUNCA diga que você é um robô, IA da OpenAI ou ChatGPT. Você é o consultor oficial do curso.
- Se o cliente tiver dúvidas sobre o curso, tire as dúvidas com clareza e volte para a pergunta da etapa correspondente.
- Se o cliente solicitar atendimento humano explicitamente, use a tag [CHAMAR_HUMANO].

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 REGRA CRÍTICA DE FILTRO (DESCONSIDERAR ASSUNTOS NÃO REFERENTES A CURSOS):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Você só deve responder se a mensagem tiver relação com o curso "${activeCourse.name}", com nossos treinamentos, materiais, dúvidas do conteúdo ou se for parte do diálogo de negociação em andamento (ex: "sim", "pode mandar", "já fiz o pix", etc.).

SE A MENSAGEM DO CLIENTE NÃO FOR SOBRE O CURSO (ex: conversas pessoais, familiares, cobranças externas de terceiros, propaganda de outros produtos, piadas, engano de número, spam ou assuntos fora de contexto):
👉 Responda EXATAMENTE E APENAS COM A PALAVRA: [IGNORAR]
NÃO cumprimente, NÃO tente vender, NÃO peça desculpas e NÃO diga que é uma IA. Apenas responda: [IGNORAR]
`.trim();
  } else {
    // 5.2 Prompt GERAL - Cliente ainda não escolheu um curso
    const catalogStr = courses
      .map(
        (c) =>
          `• *${c.name}* - Apenas R$ ${Number(c.price).toFixed(2)}\n  _${c.description || 'Aprenda do zero com método prático.'}_`
      )
      .join('\n\n');

    systemPrompt = `
Você é o recepcionista e consultor educacional da nossa plataforma de cursos.
O cliente mandou uma mensagem geral no nosso WhatsApp e ainda não especificou qual curso deseja.

NOSSOS CURSOS DISPONÍVEIS:
${catalogStr}

SEU OBJETIVO NESTE PRIMEIRO CONTATO:
1. Cumprimente o cliente com calor e simpatia (Nome do cliente: ${customerName || 'Amigo(a)'}).
2. Informe brevemente que temos excelentes cursos práticos com acesso imediato e valores acessíveis.
3. Pergunte em qual área ou curso ele tem mais interesse em aprender ou evoluir no momento.
4. Mantenha a resposta concisa (máximo 2 a 3 parágrafos curtos) para facilitar a leitura no WhatsApp.

🚨 REGRA CRÍTICA DE FILTRO:
Se a mensagem recebida NÃO tiver relação com cursos, treinamentos, estudos ou não demonstrar interesse em aprender (ex: conversas pessoais, engano de número, cobranças externas, spam, outros serviços não relacionados):
👉 Responda EXATAMENTE E APENAS com a palavra: [IGNORAR]
NÃO envie o catálogo e NÃO responda nada além de: [IGNORAR]
`.trim();
  }

  // 6. Montar o array de mensagens para a API da OpenAI
  const openAiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  // Adicionar histórico recente da conversa (se houver)
  for (const h of historyMessages.slice(-8)) {
    openAiMessages.push({ role: h.role, content: h.content });
  }

  // Adicionar a mensagem atual recebida
  openAiMessages.push({ role: 'user', content: incomingText });

  // 7. Chamada à API da OpenAI (ChatGPT)
  const modelToUse = aiSettings.openai_model || 'gpt-5.6-luna';
  const isReasoningModel =
    modelToUse.includes('gpt-5') ||
    modelToUse.includes('o1') ||
    modelToUse.includes('o3');

  const requestPayload: Record<string, any> = {
    model: modelToUse,
    messages: openAiMessages,
    max_completion_tokens: 650,
  };

  // Modelos clássicos (GPT-4o, GPT-4o-mini) aceitam temperature; modelos de raciocínio (GPT-5.6, o1, o3) gerenciam internamente
  if (!isReasoningModel) {
    requestPayload.temperature = 0.7;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiSettings.openai_api_key}`,
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`Erro na API da OpenAI [${response.status}]:`, errBody);
      return null;
    }

    const json = (await response.json()) as any;
    let rawReply: string = json?.choices?.[0]?.message?.content || '';

    if (!rawReply.trim()) {
      return null;
    }

    // 7.1 Se a IA identificou que a mensagem não é referente a cursos, desconsiderar
    if (rawReply.includes('[IGNORAR]')) {
      console.log('Mensagem desconsiderada pela IA (assunto fora do escopo de cursos).');
      return {
        replyText: '',
        actions: [],
        ignored: true,
        courseId: activeCourse?.id,
        courseName: activeCourse?.name,
      };
    }

    const actions: AiAction[] = [];

    // 8. Processar Ação: [ENTREGAR_CURSO]
    if (rawReply.includes('[ENTREGAR_CURSO]') && activeCourse) {
      actions.push({
        type: 'deliver_course_materials',
        payload: activeCourse.materials,
      });
      rawReply = rawReply.replace(/\[ENTREGAR_CURSO\]/gi, '').trim();
    }

    // 9. Processar Ação: [LIBERAR_BONUS]
    if (rawReply.includes('[LIBERAR_BONUS]') && activeCourse) {
      actions.push({
        type: 'deliver_bonus',
        payload: {
          bonuses: activeCourse.bonuses,
          materials: activeCourse.materials,
        },
      });
      rawReply = rawReply.replace(/\[LIBERAR_BONUS\]/gi, '').trim();
    }

    // 10. Processar Ação: [ENVIAR_MATERIAL: ...]
    const materialTagMatch = rawReply.match(/\[ENVIAR_MATERIAL:\s*([^\]]+)\]/i);
    if (materialTagMatch && activeCourse) {
      const targetQuery = cleanTextForMatching(materialTagMatch[1]);
      const matchedMaterial = activeCourse.materials.find(
        (m) =>
          cleanTextForMatching(m.id) === targetQuery ||
          cleanTextForMatching(m.name).includes(targetQuery) ||
          targetQuery.includes(cleanTextForMatching(m.id))
      );

      if (matchedMaterial) {
        actions.push({
          type: 'send_media',
          payload: matchedMaterial,
        });
      }
      // Remove a tag do texto visível ao cliente
      rawReply = rawReply.replace(/\[ENVIAR_MATERIAL:\s*[^\]]+\]/gi, '').trim();
    }

    // 11. Processar Ação: [CHAMAR_HUMANO]
    if (rawReply.includes('[CHAMAR_HUMANO]')) {
      actions.push({ type: 'human_handover' });
      rawReply = rawReply.replace(/\[CHAMAR_HUMANO\]/gi, '').trim();
      if (chat) {
        await supabase
          .from('chats')
          .update({
            ai_disabled: true,
          })
          .eq('id', chatId);
      }
    }

    // 12. Processar Ação: [GERAR_PIX]
    if (rawReply.includes('[GERAR_PIX]') && activeCourse) {
      let brCode = '';
      try {
        brCode = generatePixBrcode({
          pixKey: activeCourse.pix_key,
          pixKeyType: activeCourse.pix_key_type,
          merchantName: activeCourse.pix_name || 'CURSO ONLINE',
          merchantCity: activeCourse.pix_city || 'SAO PAULO',
          amount: Number(activeCourse.price),
          description: activeCourse.name.slice(0, 20),
        });
      } catch (err) {
        console.error('Erro ao gerar código PIX Copia e Cola:', err);
      }

      actions.push({
        type: 'pix_generated',
        payload: {
          pixKey: activeCourse.pix_key,
          pixKeyType: activeCourse.pix_key_type,
          merchantName: activeCourse.pix_name || 'Equipe do Curso',
          amount: Number(activeCourse.price),
          courseName: activeCourse.name,
          brCode,
        },
      });

      rawReply = rawReply.replace(/\[GERAR_PIX\]/gi, '').trim();
    }

    return {
      replyText: rawReply,
      actions,
      courseId: activeCourse?.id,
      courseName: activeCourse?.name,
    };
  } catch (e: any) {
    console.error('Erro ao chamar OpenAI:', e);
    return null;
  }
}
