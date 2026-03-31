const Anthropic = require('@anthropic-ai/sdk');

const SYSTEM_PROMPT = `Você é o Metatron Bot, assistente pessoal inteligente e direto ao ponto.
Responda sempre em português brasileiro.
Seja conciso, útil e objetivo. Evite respostas muito longas a não ser que necessário.
Você pode ajudar com: informações gerais, análises, criatividade, planejamento e conversas.
Quando o usuário pedir algo específico (preço, alarme, busca, tiktok), informe que o comando foi processado se já foi tratado.
Nunca finja ter acesso a informações em tempo real sem uma ferramenta específica.`;

const INTENT_SYSTEM = `Classifique a intenção do usuário em UMA dessas categorias exatas:
- tiktok (gerar corte, vídeo viral, editar vídeo)
- price (preço de cripto, ação, ativo financeiro)  
- alarm (criar alarme, lembrete, acordar)
- search (pesquisar, buscar, procurar na internet, notícias)
- chat (qualquer outra coisa)

Responda SOMENTE com a palavra da categoria, sem explicação.`;

let client;

function getClient() {
  if (!client && process.env.ANTHROPIC_API_KEY) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

async function askClaude(userMessage, history = []) {
  const c = getClient();
  if (!c) {
    throw new Error('ANTHROPIC_API_KEY não configurada');
  }

  const messages = [
    ...history.slice(-10),
    { role: 'user', content: userMessage }
  ];

  const response = await c.messages.create({
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages
  });

  return response.content[0].text;
}

async function detectIntent(text) {
  const c = getClient();
  if (!c) return 'chat';

  try {
    const response = await c.messages.create({
      model: 'claude-haiku-4-5-20251001', // Fast model for intent detection
      max_tokens: 10,
      system: INTENT_SYSTEM,
      messages: [{ role: 'user', content: text }]
    });
    return response.content[0].text.trim().toLowerCase();
  } catch {
    return 'chat';
  }
}

async function generateWithClaude(prompt, maxTokens = 1500) {
  const c = getClient();
  if (!c) throw new Error('ANTHROPIC_API_KEY não configurada');

  const response = await c.messages.create({
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }]
  });

  return response.content[0].text;
}

module.exports = { askClaude, detectIntent, generateWithClaude };
