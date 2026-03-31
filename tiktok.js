const { generateWithClaude } = require('./claude');

const STYLE_PROMPTS = {
  viral:        'Maximize o engajamento e viralidade. Use linguagem de impacto, FOMO, curiosidade.',
  educational:  'Foco didático e informativo. Estruture com aprendizado claro e chamada para salvar.',
  motivacional: 'Tom inspirador e energético. Frases de impacto, storytelling emocional.',
  humor:        'Descontraído, engraçado, com memes e referências populares.',
  news:         'Jornalístico e factual. Destaque o fato mais chocante ou surpreendente.',
};

async function generateTikTokScript(url, style = 'viral') {
  const styleGuide = STYLE_PROMPTS[style] || STYLE_PROMPTS.viral;

  const prompt = `Você é um especialista em criação de conteúdo viral para TikTok e Reels.

URL do vídeo: ${url}
Estilo: ${style.toUpperCase()} — ${styleGuide}

Gere um roteiro completo de corte viral com exatamente esta estrutura:

🎯 *GANCHO (0-3s)*
[Frase de abertura que para o scroll — máx 10 palavras]

📋 *ROTEIRO DO CORTE*
[Descrição de cada cena com timestamps sugeridos]
00:00 — [descrição]
00:03 — [descrição]  
00:10 — [descrição]
[continue até o tempo escolhido]

🏷️ *LEGENDAS (estilo TikTok)*
[5 blocos de texto em MAIÚSCULO para aparecer na tela]
1. 
2.
3.
4.
5.

🎵 *SUGESTÃO DE MÚSICA*
[Gênero ou música trending que combina]

📌 *THUMBNAIL IDEAL*
[Descrição visual da thumbnail perfeita]

📣 *CALL TO ACTION*
[Frase para o final do vídeo]

#️⃣ *HASHTAGS*
[15 hashtags virais relevantes]

⚡ *DICA DE EDIÇÃO*
[1 técnica específica para maximizar retenção]

Responda em português, seja específico e criativo.`;

  return await generateWithClaude(prompt, 1500);
}

module.exports = { generateTikTokScript };
