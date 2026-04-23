// Classifies whether a user prompt is in-scope for ImaginAI (home / construction
// items only). Returns the classification + optional suggested rewrite when the
// user message is conversational rather than a generation request.

import { generateText } from "./vertex";
import { env } from "./env";

export type PromptIntent = "generate_image" | "conversational" | "out_of_scope";

export interface ScopeClassification {
  intent: PromptIntent;
  // Short message to reply with when intent is conversational or out_of_scope.
  reply?: string;
  // Cleaned-up image prompt when intent === generate_image.
  imagePrompt?: string;
  // True when the user is asking to tweak the previous image (change color,
  // material, size, layout…) rather than generate a brand new item. Only
  // meaningful when there is a previous image in the conversation. Callers
  // use this flag to decide whether to feed the previous image back into the
  // image model as a reference.
  isRefinement?: boolean;
}

export interface ClassifyContext {
  /** Prompt that generated the previous image in the same conversation. */
  previousImagePrompt?: string;
  /** Whether the user already gave 👎 feedback on the previous image. */
  previousImageDisliked?: boolean;
}

const SYSTEM_BASE = `Você é o classificador de mensagens do ImaginAI, uma
ferramenta da Astra usada por CLIENTES ASTRA (idealizadores) para imaginar
itens para casa (utilidades domésticas, móveis, decoração, utensílios de
cozinha, banheiro, lavanderia) ou materiais de construção civil que a Astra
pode vir a produzir. O objetivo é gerar prévias visuais realistas desses
itens.

Classifique a próxima mensagem do usuário em UMA das categorias:

1. "generate_image": o usuário está descrevendo um item de casa ou construção
   e quer uma imagem gerada. Inclui variações do mesmo item (cor, formato,
   material, cenário doméstico).
2. "conversational": a mensagem é uma saudação, agradecimento, comentário
   sobre imagem anterior, dúvida operacional. NÃO é pedido de geração.
3. "out_of_scope": pede imagem/coisa que NÃO é item de casa/construção
   (pessoas, animais, paisagens, carros, comida pronta, cenas de praia sem
   produto doméstico específico, etc).

Além disso, quando EXISTIR uma imagem anterior na conversa, você DEVE indicar
se a nova mensagem é um refinamento/ajuste daquela imagem ou um novo item
completamente diferente:

- "isRefinement": true quando o usuário só quer mudar ATRIBUTOS do item
  anterior (cor, material, acabamento, tamanho, proporção, cenário, estilo,
  adicionar/remover detalhe) mantendo o mesmo objeto base. Exemplos: "deixa
  verde", "um pouco maior", "em madeira clara", "tira a maçaneta".
- "isRefinement": false quando o usuário está pedindo um ITEM DIFERENTE
  ("agora um sofá", "quero ver uma mesa de jantar") ou quando não há imagem
  anterior. Se você não tiver certeza, use "isRefinement": false.

Responda SEMPRE em JSON válido com o formato:
{
  "intent": "generate_image" | "conversational" | "out_of_scope",
  "isRefinement": true | false,
  "reply": "texto curto para responder ao usuário (obrigatório para conversational e out_of_scope)",
  "imagePrompt": "prompt reescrito e enriquecido em português para gerar a imagem (obrigatório para generate_image). Quando for refinamento, descreva APENAS a mudança solicitada em relação à imagem anterior."
}

Para "out_of_scope", o reply DEVE redirecionar educadamente ao escopo, algo
como: "Por favor, descreva um objeto doméstico específico para gerar a
imagem." Você pode variar a frase mantendo o sentido.

Para "conversational", responda de forma amigável e traga o foco de volta à
idealização. Ex.: "Que bom que gostou! Quer explorar variações dessa ideia
ou pensar em outro item para sua casa?".

Para "generate_image" em modo de refinamento, o imagePrompt deve ser uma
instrução curta e precisa (ex.: "Mudar apenas a cor do armário para verde,
mantendo todo o resto igual."). Para geração nova, reescreva o prompt do
usuário de forma clara, descritiva e em português, mantendo a intenção
original.`;

function buildSystem(ctx?: ClassifyContext): string {
  if (!ctx?.previousImagePrompt) return SYSTEM_BASE;
  const disliked = ctx.previousImageDisliked
    ? "O usuário não aprovou essa imagem e agora está sugerindo o que mudar."
    : "O usuário pode estar pedindo um ajuste sobre essa imagem.";
  return `${SYSTEM_BASE}\n\nCONTEXTO: a conversa já produziu uma imagem anterior descrita como: "${ctx.previousImagePrompt}". ${disliked} Considere isso ao decidir se a nova mensagem é refinamento (isRefinement=true) ou um novo item.`;
}

export async function classifyPrompt(
  userMessage: string,
  ctx?: ClassifyContext,
): Promise<ScopeClassification> {
  // Fast local fallback when GCP is not configured — allows dev without creds.
  if (!env.GCP_ENABLED) {
    return localClassify(userMessage, ctx);
  }
  try {
    const raw = await generateText(userMessage, buildSystem(ctx));
    const json = extractJson(raw);
    if (!json) return localClassify(userMessage, ctx);
    return normalize(json, ctx);
  } catch (err) {
    console.warn("[scope] classifier failed, using local fallback:", err);
    return localClassify(userMessage, ctx);
  }
}

function extractJson(raw: string): Record<string, unknown> | null {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

function normalize(
  obj: Record<string, unknown>,
  ctx?: ClassifyContext,
): ScopeClassification {
  const intent = obj.intent as PromptIntent;
  const reply = typeof obj.reply === "string" ? obj.reply : undefined;
  const imagePrompt = typeof obj.imagePrompt === "string" ? obj.imagePrompt : undefined;
  const isRefinement =
    ctx?.previousImagePrompt !== undefined && obj.isRefinement === true;
  if (intent === "generate_image") {
    return { intent, imagePrompt: imagePrompt ?? "", isRefinement };
  }
  if (intent === "conversational" || intent === "out_of_scope") {
    return { intent, reply: reply ?? defaultReply(intent) };
  }
  return { intent: "conversational", reply: defaultReply("conversational") };
}

function defaultReply(intent: "conversational" | "out_of_scope"): string {
  if (intent === "out_of_scope")
    return "Por favor, descreva um objeto doméstico específico para gerar a imagem.";
  return "Olá! Sou o ImaginAI. Me conta: que item para casa ou construção você gostaria de visualizar hoje?";
}

// -----------------------------------------------------------
// Local keyword-based fallback classifier.
// -----------------------------------------------------------

const HOME_KEYWORDS = [
  "armário", "armario", "banheiro", "cozinha", "sala", "quarto", "lavanderia",
  "prateleira", "cadeira", "mesa", "sofá", "sofa", "cama", "rack", "estante",
  "luminária", "luminaria", "vaso", "planta", "tapete", "cortina", "copo",
  "xícara", "xicara", "prato", "talher", "panela", "escorredor", "louça",
  "louca", "pia", "torneira", "chuveiro", "vaso sanitário", "vaso sanitario",
  "privada", "descarga", "caixa d'água", "tubo", "cano", "pvc", "construção",
  "construcao", "tijolo", "cimento", "telha", "piso", "azulejo", "porta",
  "janela", "fechadura", "garrafa", "dispenser", "porta-sabão", "puxador",
  "suporte", "gancho", "cabide", "lixeira", "pano", "vassoura",
];

const CONVERSATIONAL_KEYWORDS = [
  "oi", "olá", "ola", "bom dia", "boa tarde", "boa noite", "obrigad",
  "valeu", "gostei", "adorei", "legal", "ok", "tudo bem", "?",
];

const OUT_OF_SCOPE_KEYWORDS = [
  "carro", "moto", "pessoa", "menina", "menino", "homem", "mulher", "animal",
  "cachorro", "gato", "praia", "montanha", "floresta", "paisagem",
];

const REFINEMENT_KEYWORDS = [
  "mud", "troc", "deixa", "deixe", "coloc", "pinta", "tira", "tire",
  "aument", "diminu", "menor", "maior", "mesm", "só a", "so a", "apenas",
  "agora ", "em vez", "invés", "inves", "virar", "vira ", "fica",
];

export function localClassify(
  message: string,
  ctx?: ClassifyContext,
): ScopeClassification {
  const lower = message.toLowerCase().trim();
  const hasPrevious = !!ctx?.previousImagePrompt;
  const looksLikeRefinement =
    hasPrevious &&
    (REFINEMENT_KEYWORDS.some((k) => lower.includes(k)) || lower.length <= 40);

  if (
    OUT_OF_SCOPE_KEYWORDS.some((k) => lower.includes(k)) &&
    !HOME_KEYWORDS.some((k) => lower.includes(k))
  ) {
    return {
      intent: "out_of_scope",
      reply: defaultReply("out_of_scope"),
    };
  }

  if (HOME_KEYWORDS.some((k) => lower.includes(k))) {
    return {
      intent: "generate_image",
      imagePrompt: message.trim(),
      isRefinement: looksLikeRefinement,
    };
  }

  if (looksLikeRefinement) {
    return {
      intent: "generate_image",
      imagePrompt: message.trim(),
      isRefinement: true,
    };
  }

  if (
    lower.length < 20 ||
    CONVERSATIONAL_KEYWORDS.some((k) => lower.includes(k))
  ) {
    return {
      intent: "conversational",
      reply: defaultReply("conversational"),
    };
  }

  // Assume in-scope generation if longer and no red flags.
  return {
    intent: "generate_image",
    imagePrompt: message.trim(),
    isRefinement: looksLikeRefinement,
  };
}
