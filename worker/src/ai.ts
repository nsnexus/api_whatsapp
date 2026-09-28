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
  type: 'send_media' | 'pix_generated' | 'human_handover';
  payload?: any;
}

export interface AiReplyResult {
  replyText: string;
  actions: AiAction[];
  courseId?: string;
  courseName?: string;
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
    .select('id, active_course_id, ai_disabled, ai_paused_until')
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

  // 3. Buscar todos os cursos ativos desta empresa
  const { data: coursesData } = await supabase
    .from('courses')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  const courses: Course[] = (coursesData || []).map((c: any) => ({
    ...c,
    materials: Array.isArray(c.materials) ? c.materials : [],
    bonuses: Array.isArray(c.bonuses) ? c.bonuses : [],
    faq_objections: Array.isArray(c.faq_objections) ? c.faq_objections : [],
    triggers: Array.isArray(c.triggers) ? c.triggers : [],
  }));

  if (courses.length === 0) {
    console.log('Nenhum curso ativo cadastrado.');
    return null;
  }

  // 4. Identificar o curso ativo
  let activeCourse: Course | undefined;
  const normalizedIncoming = cleanTextForMatching(incomingText);

  // A. Se foi passado curso forçado (ex: no simulador)
  if (forceCourseId) {
    activeCourse = courses.find((c) => c.id === forceCourseId);
  }

  // B. Verificar se a mensagem do cliente dispara algum gatilho de curso
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

  // C. Se não achou gatilho na mensagem atual, usar o curso que já estava ativo nesta conversa
  if (!activeCourse && chat?.active_course_id) {
    activeCourse = courses.find((c) => c.id === chat.active_course_id);
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

    systemPrompt = `
Você é o consultor de vendas oficial e especialista do seguinte curso:
NOME DO CURSO: "${activeCourse.name}"
DESCRIÇÃO: ${activeCourse.description || 'Curso prático focado em resultados rápidos.'}
PREÇO OFICIAL / PROMOCIONAL: R$ ${Number(activeCourse.price).toFixed(2)}
${activeCourse.original_price ? `VALOR NORMAL (SEM DESCONTO): R$ ${Number(activeCourse.original_price).toFixed(2)}` : ''}

PERSONA E INSTRUÇÕES ESPECÍFICAS DESTE CURSO (SIGA FIELMENTE):
${activeCourse.ai_persona || 'Atenda com entusiasmo, tire dúvidas com clareza, mostre a transformação do curso e conduza para o fechamento.'}

MATERIAIS E AMOSTRAS DISPONÍVEIS:
${materialsStr}

* REGRA DE ENVIO DE MATERIAIS:
Se o cliente pedir para ver uma amostra, demonstração, resumo ou conteúdo grátis, mencione com entusiasmo e inclua na sua resposta a tag exata:
[ENVIAR_MATERIAL: ID_DO_MATERIAL] (ex: [ENVIAR_MATERIAL: ${activeCourse.materials[0]?.id || '1'}])
O sistema irá interceptar essa tag e enviar o arquivo/link automaticamente ao cliente!

BÔNUS EXCLUSIVOS INCLUSOS NA COMPRA HOJE:
${bonusesStr}

QUEBRA DE OBJEÇÕES:
${objectionsStr}

DADOS DE PAGAMENTO (PIX):
- Chave PIX: ${activeCourse.pix_key || 'Chave cadastrada no sistema'}
- Titular: ${activeCourse.pix_name || 'Beneficiário'}
- Valor: R$ ${Number(activeCourse.price).toFixed(2)}

* REGRA CRUCIAL DE COBRANÇA / PIX:
Quando o cliente concordar em comprar, disser que quer o curso, perguntar como pagar, ou pedir a chave PIX:
1. Comemore a decisão dele e reforce que ele terá acesso imediato com todos os bônus inclusos.
2. Inclua OBRIGATORIAMENTE a tag exata: [GERAR_PIX]
O nosso sistema automatizado irá gerar a chave oficial e o código "PIX Copia e Cola" do Banco Central e anexar à sua mensagem!

* REGRA DE ATENDIMENTO HUMANO:
Se o cliente fizer uma pergunta muito fora do escopo do curso ou insistir que deseja falar com um atendente humano, seja educado e inclua a tag:
[CHAMAR_HUMANO]

REGRAS DE CONVERSAÇÃO NO WHATSAPP:
- Responda como uma pessoa real no WhatsApp: use mensagens diretas, parágrafos curtos (1 a 3 frases por parágrafo), tom caloroso e natural.
- Nome do cliente: ${customerName ? customerName : 'Cliente'}.
- Use emojis com bom senso para deixar a leitura agradável.
- NUNCA diga que você é um robô, IA da OpenAI ou ChatGPT. Você é o consultor de atendimento do curso.
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

    const actions: AiAction[] = [];

    // 8. Processar Ação: [ENVIAR_MATERIAL: ...]
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

    // 9. Processar Ação: [CHAMAR_HUMANO]
    if (rawReply.includes('[CHAMAR_HUMANO]')) {
      actions.push({ type: 'human_handover' });
      rawReply = rawReply.replace(/\[CHAMAR_HUMANO\]/gi, '').trim();
      if (chat) {
        // Pausar IA para este chat
        await supabase
          .from('chats')
          .update({
            ai_disabled: true,
          })
          .eq('id', chatId);
      }
    }

    // 10. Processar Ação: [GERAR_PIX]
    if (rawReply.includes('[GERAR_PIX]') && activeCourse) {
      actions.push({ type: 'pix_generated' });
      rawReply = rawReply.replace(/\[GERAR_PIX\]/gi, '').trim();

      // Gerar o código BRCode Copia e Cola Oficial
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

      const pixBlock = `
\n\n━━━━━━━━━━━━━━━━━━━━
💳 *DADOS PARA PAGAMENTO VIA PIX:*
📚 *Curso:* ${activeCourse.name}
💰 *Valor:* R$ ${Number(activeCourse.price).toFixed(2)}
👤 *Beneficiário:* ${activeCourse.pix_name || 'Equipe do Curso'}
🔑 *Chave PIX:* \`${activeCourse.pix_key}\`
${
  brCode
    ? `\n📋 *PIX Copia e Cola (Basta copiar e colar no banco):*\n\`${brCode}\``
    : ''
}
━━━━━━━━━━━━━━━━━━━━
📲 *Assim que realizar o pagamento, me envie o comprovante aqui para liberarmos seu acesso imediatamente!* 🚀`.trim();

      rawReply = `${rawReply}\n\n${pixBlock}`;
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
