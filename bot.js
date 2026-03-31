const TelegramBot = require('node-telegram-bot-api');
const { askClaude, detectIntent } = require('./claude');
const { generateTikTokScript } = require('./tiktok');
const { searchWeb } = require('./search');

const TOKEN = process.env.TELEGRAM_TOKEN;
const APP_URL = process.env.APP_URL;
const DEV_MODE = process.env.DEV_MODE === 'true';

// Conversation history per chat
const conversations = new Map();
// Alarms per chat
const alarms = new Map();

let bot;

function setupBot(app) {
  if (!TOKEN) {
    console.warn('⚠️  TELEGRAM_TOKEN não definido. Bot desativado.');
    return null;
  }

  if (DEV_MODE || !APP_URL || APP_URL.includes('SEU-DOMINIO')) {
    // Polling mode (local dev)
    bot = new TelegramBot(TOKEN, { polling: true });
    console.log('🔄 Telegram: modo polling (desenvolvimento)');
  } else {
    // Webhook mode (produção)
    bot = new TelegramBot(TOKEN, { webHook: { port: false } });
    const webhookUrl = `${APP_URL}/webhook/${TOKEN}`;
    bot.setWebHook(webhookUrl).then(() => {
      console.log(`🔗 Webhook configurado: ${webhookUrl}`);
    });
    app.post(`/webhook/${TOKEN}`, (req, res) => {
      bot.processUpdate(req.body);
      res.sendStatus(200);
    });
  }

  registerHandlers(bot);
  return bot;
}

function getHistory(chatId) {
  if (!conversations.has(chatId)) conversations.set(chatId, []);
  return conversations.get(chatId);
}

function clearHistory(chatId) {
  conversations.set(chatId, []);
}

function registerHandlers(bot) {

  // ─── /start ───────────────────────────────────
  bot.onText(/\/start/, async (msg) => {
    const name = msg.from.first_name || 'usuário';
    await bot.sendMessage(msg.chat.id,
      `⬡ *METATRON BOT ONLINE* ⬡\n\nOlá, *${name}*! Estou pronto para executar seus comandos.\n\n` +
      `*Comandos disponíveis:*\n` +
      `🎬 \`/tiktok <url>\` — Gerar corte viral\n` +
      `💰 \`/btc\` — Preço do Bitcoin\n` +
      `🔍 \`/buscar <query>\` — Pesquisar na web\n` +
      `⏰ \`/alarme HH:MM [label]\` — Criar alarme\n` +
      `🗑 \`/limpar\` — Limpar histórico\n` +
      `❓ \`/ajuda\` — Ver todos os comandos\n\n` +
      `_Ou simplesmente me escreva em linguagem natural!_ 💬`,
      { parse_mode: 'Markdown' }
    );
  });

  // ─── /ajuda ───────────────────────────────────
  bot.onText(/\/ajuda/, async (msg) => {
    await bot.sendMessage(msg.chat.id,
      `⬡ *METATRON BOT — Ajuda* ⬡\n\n` +
      `*🎬 TikTok & Vídeo*\n` +
      `\`/tiktok <url>\` — Roteiro viral completo\n` +
      `\`/corte <url> [estilo]\` — Corte com estilo específico\n\n` +
      `*💰 Finanças*\n` +
      `\`/btc\` — Preço do Bitcoin\n` +
      `\`/eth\` — Preço do Ethereum\n` +
      `\`/preco <símbolo>\` — Preço de qualquer ativo\n\n` +
      `*🔍 Pesquisa*\n` +
      `\`/buscar <query>\` — Pesquisa na web\n` +
      `\`/news <tema>\` — Últimas notícias\n\n` +
      `*⏰ Alarmes & Agenda*\n` +
      `\`/alarme 07:30\` — Criar alarme\n` +
      `\`/alarme 07:30 Academia\` — Alarme com rótulo\n` +
      `\`/alarmes\` — Ver alarmes ativos\n\n` +
      `*🗣 Linguagem Natural*\n` +
      `Escreva qualquer coisa e a IA entende!\n` +
      `Ex: _"Gerar corte viral desse vídeo: url"_\n` +
      `Ex: _"Qual o preço do BTC agora?"_\n` +
      `Ex: _"Cria um alarme pra 6 da manhã"_`,
      { parse_mode: 'Markdown' }
    );
  });

  // ─── /limpar ──────────────────────────────────
  bot.onText(/\/limpar/, async (msg) => {
    clearHistory(msg.chat.id);
    await bot.sendMessage(msg.chat.id, '🗑 Histórico de conversa limpo!');
  });

  // ─── /tiktok <url> ────────────────────────────
  bot.onText(/\/tiktok (.+)/, async (msg, match) => {
    const url = match[1].trim();
    await handleTikTok(msg.chat.id, url, 'viral');
  });

  // ─── /corte <url> [estilo] ────────────────────
  bot.onText(/\/corte (.+)/, async (msg, match) => {
    const parts = match[1].trim().split(' ');
    const url = parts[0];
    const style = parts[1] || 'viral';
    await handleTikTok(msg.chat.id, url, style);
  });

  // ─── /btc /eth ────────────────────────────────
  bot.onText(/\/btc/, (msg) => handlePrice(msg.chat.id, 'bitcoin'));
  bot.onText(/\/eth/, (msg) => handlePrice(msg.chat.id, 'ethereum'));

  // ─── /preco <símbolo> ─────────────────────────
  bot.onText(/\/preco (.+)/, async (msg, match) => {
    await handlePrice(msg.chat.id, match[1].trim().toLowerCase());
  });

  // ─── /buscar <query> ──────────────────────────
  bot.onText(/\/buscar (.+)/, async (msg, match) => {
    const query = match[1].trim();
    await handleSearch(msg.chat.id, query);
  });

  bot.onText(/\/news (.+)/, async (msg, match) => {
    await handleSearch(msg.chat.id, match[1].trim() + ' notícias recentes');
  });

  // ─── /alarme HH:MM [label] ────────────────────
  bot.onText(/\/alarme (.+)/, async (msg, match) => {
    const parts = match[1].trim().split(' ');
    const time = parts[0];
    const label = parts.slice(1).join(' ') || 'Alarme';
    await handleAlarm(msg.chat.id, time, label, bot);
  });

  // ─── /alarmes ─────────────────────────────────
  bot.onText(/\/alarmes/, async (msg) => {
    const chatAlarms = alarms.get(msg.chat.id) || [];
    if (chatAlarms.length === 0) {
      await bot.sendMessage(msg.chat.id, '⏰ Nenhum alarme ativo.');
      return;
    }
    const list = chatAlarms.map((a, i) => `${i + 1}. ⏰ ${a.time} — ${a.label}`).join('\n');
    await bot.sendMessage(msg.chat.id, `*Alarmes ativos:*\n${list}`, { parse_mode: 'Markdown' });
  });

  // ─── Voice messages ───────────────────────────
  bot.on('voice', async (msg) => {
    await bot.sendMessage(msg.chat.id,
      '🎙️ Recebi seu áudio! Para transcrição de voz, configure a chave OpenAI Whisper.\n' +
      'Por enquanto, envie comandos por texto. Funcionalidade em breve!'
    );
  });

  // ─── Free text → Claude ───────────────────────
  bot.on('message', async (msg) => {
    if (!msg.text) return;
    if (msg.text.startsWith('/')) return; // already handled

    const chatId = msg.chat.id;
    const text = msg.text;

    // Show typing
    await bot.sendChatAction(chatId, 'typing');

    // Detect intent first
    const intent = await detectIntent(text);

    if (intent === 'tiktok') {
      const urlMatch = text.match(/https?:\/\/\S+/);
      if (urlMatch) {
        await handleTikTok(chatId, urlMatch[0], 'viral');
        return;
      }
    }

    if (intent === 'price') {
      const coinMatch = text.match(/\b(bitcoin|btc|ethereum|eth|bnb|solana|sol|doge|xrp)\b/i);
      if (coinMatch) {
        await handlePrice(chatId, coinMatch[1].toLowerCase());
        return;
      }
    }

    if (intent === 'alarm') {
      const timeMatch = text.match(/(\d{1,2})[:\h](\d{2})|(\d{1,2})\s*(h|hora|horas)/i);
      if (timeMatch) {
        let hour, min;
        if (timeMatch[1]) { hour = timeMatch[1]; min = timeMatch[2]; }
        else { hour = timeMatch[3]; min = '00'; }
        const time = `${hour.padStart(2,'0')}:${min.padStart(2,'0')}`;
        await handleAlarm(chatId, time, 'Alarme', bot);
        return;
      }
    }

    if (intent === 'search') {
      const query = text.replace(/pesquisar?|buscar?|procurar?/gi, '').trim();
      await handleSearch(chatId, query);
      return;
    }

    // Default: chat with Claude
    await handleChat(chatId, text);
  });
}

// ═══════════════════════════════════════════════
// HANDLERS
// ═══════════════════════════════════════════════

async function handleTikTok(chatId, url, style) {
  await bot.sendMessage(chatId, `🎬 Gerando roteiro viral para:\n\`${url}\`\n\n⏳ Aguarde...`, { parse_mode: 'Markdown' });
  try {
    const script = await generateTikTokScript(url, style);
    // Split long messages
    const chunks = splitMessage(script, 4000);
    for (const chunk of chunks) {
      await bot.sendMessage(chatId, chunk, { parse_mode: 'Markdown' });
    }
  } catch (e) {
    await bot.sendMessage(chatId, `❌ Erro ao processar vídeo: ${e.message}`);
  }
}

async function handlePrice(chatId, coin) {
  await bot.sendChatAction(chatId, 'typing');
  try {
    const axios = require('axios');
    const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd,brl&include_24hr_change=true`);
    const data = res.data[coin];
    if (!data) throw new Error('Ativo não encontrado');
    const change = data.usd_24h_change?.toFixed(2);
    const arrow = change >= 0 ? '📈' : '📉';
    const sign = change >= 0 ? '+' : '';
    await bot.sendMessage(chatId,
      `${arrow} *${coin.toUpperCase()}*\n\n` +
      `💵 USD: $${data.usd?.toLocaleString('en-US')}\n` +
      `🇧🇷 BRL: R$${data.brl?.toLocaleString('pt-BR')}\n` +
      `📊 24h: ${sign}${change}%\n\n` +
      `_Fonte: CoinGecko • ${new Date().toLocaleTimeString('pt-BR')}_`,
      { parse_mode: 'Markdown' }
    );
  } catch (e) {
    await bot.sendMessage(chatId, `❌ Não encontrei o preço de "${coin}". Tente: /preco bitcoin`);
  }
}

async function handleSearch(chatId, query) {
  await bot.sendChatAction(chatId, 'typing');
  try {
    const results = await searchWeb(query);
    let msg = `🔍 *Resultados para:* "${query}"\n\n`;
    for (const r of results.slice(0, 4)) {
      msg += `*${r.title}*\n${r.snippet}\n[Abrir ↗](${r.url})\n\n`;
    }
    await bot.sendMessage(chatId, msg, { parse_mode: 'Markdown', disable_web_page_preview: false });
  } catch (e) {
    await bot.sendMessage(chatId, `❌ Erro na busca: ${e.message}`);
  }
}

async function handleAlarm(chatId, time, label, bot) {
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m) || h > 23 || m > 59) {
    await bot.sendMessage(chatId, '❌ Horário inválido. Use o formato HH:MM\nExemplo: `/alarme 07:30`', { parse_mode: 'Markdown' });
    return;
  }

  const chatAlarms = alarms.get(chatId) || [];
  const alarm = { time, label, id: Date.now() };
  chatAlarms.push(alarm);
  alarms.set(chatId, chatAlarms);

  // Schedule
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  const delay = target - now;
  const hours = Math.floor(delay / 3600000);
  const mins = Math.floor((delay % 3600000) / 60000);

  setTimeout(async () => {
    await bot.sendMessage(chatId,
      `🔔 *ALARME!* ⏰\n\n*${label}*\nHorário: ${time}`,
      { parse_mode: 'Markdown' }
    );
    // Remove from list
    const current = alarms.get(chatId) || [];
    alarms.set(chatId, current.filter(a => a.id !== alarm.id));
  }, delay);

  await bot.sendMessage(chatId,
    `✅ *Alarme criado!*\n⏰ ${time} — ${label}\n\n_Dispara em ${hours}h ${mins}min_`,
    { parse_mode: 'Markdown' }
  );
}

async function handleChat(chatId, text) {
  const history = getHistory(chatId);
  try {
    const response = await askClaude(text, history);
    history.push({ role: 'user', content: text });
    history.push({ role: 'assistant', content: response });
    // Keep last 20 messages
    if (history.length > 20) history.splice(0, 2);
    const chunks = splitMessage(response, 4000);
    for (const chunk of chunks) {
      await bot.sendMessage(chatId, chunk, { parse_mode: 'Markdown' });
    }
  } catch (e) {
    await bot.sendMessage(chatId, `❌ Erro ao processar: ${e.message}\n\nConfigure ANTHROPIC_API_KEY para usar a IA.`);
  }
}

function splitMessage(text, maxLen) {
  if (text.length <= maxLen) return [text];
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLen) {
    chunks.push(text.slice(i, i + maxLen));
  }
  return chunks;
}

module.exports = { setupBot, bot: () => bot };
