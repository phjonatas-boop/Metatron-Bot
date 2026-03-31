const express = require('express');
const router = express.Router();
const { generateTikTokScript } = require('./tiktok');
const { searchWeb } = require('./search');
const { askClaude } = require('./claude');
const axios = require('axios');

// ─── Auth middleware ──────────────────────────
function checkAuth(req, res, next) {
  const pwd = process.env.DASHBOARD_PASSWORD || 'metatron2025';
  const auth = req.headers['x-dashboard-key'];
  if (auth !== pwd) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// ─── Status ──────────────────────────────────
router.get('/status', (req, res) => {
  res.json({
    online: true,
    telegram: !!process.env.TELEGRAM_TOKEN,
    ai: !!process.env.ANTHROPIC_API_KEY,
    uptime: Math.floor(process.uptime()),
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514'
  });
});

// ─── TikTok script ───────────────────────────
router.post('/tiktok', checkAuth, async (req, res) => {
  const { url, style } = req.body;
  if (!url) return res.status(400).json({ error: 'URL obrigatória' });
  try {
    const script = await generateTikTokScript(url, style || 'viral');
    res.json({ script });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Search ──────────────────────────────────
router.get('/search', checkAuth, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query obrigatória' });
  try {
    const results = await searchWeb(q);
    res.json({ results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Chat ─────────────────────────────────────
router.post('/chat', checkAuth, async (req, res) => {
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: 'Mensagem obrigatória' });
  try {
    const reply = await askClaude(message, history || []);
    res.json({ reply });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Crypto price ─────────────────────────────
router.get('/price/:coin', async (req, res) => {
  try {
    const coin = req.params.coin.toLowerCase();
    const r = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd,brl&include_24hr_change=true`,
      { timeout: 6000 }
    );
    res.json(r.data);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar preço' });
  }
});

module.exports = { router };
