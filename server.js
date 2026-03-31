require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const { setupBot } = require('./bot');
const { router: apiRouter } = require('./api');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// ─── API Routes ───────────────────────────────
app.use('/api', apiRouter);

// ─── Telegram Webhook ─────────────────────────
const bot = setupBot(app);

// ─── Health check ─────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    bot: !!process.env.TELEGRAM_TOKEN,
    ai: !!process.env.ANTHROPIC_API_KEY,
    uptime: Math.floor(process.uptime()),
    time: new Date().toISOString()
  });
});

// ─── Dashboard (SPA fallback) ─────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ─── Start ────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n⬡ METATRON BOT ⬡`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🚀 Servidor: http://localhost:${PORT}`);
  console.log(`🤖 Telegram: ${process.env.TELEGRAM_TOKEN ? '✅ Configurado' : '❌ Token não definido'}`);
  console.log(`🧠 Claude AI: ${process.env.ANTHROPIC_API_KEY ? '✅ Configurado' : '⚠️  Sem chave (modo básico)'}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});

module.exports = { app, bot };
