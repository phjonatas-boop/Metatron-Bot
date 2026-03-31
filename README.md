# ⬡ METATRON BOT

> Assistente pessoal via Telegram com IA (Claude), cortes virais para TikTok, alarmes e pesquisa web.

---

## 🚀 Deploy no Railway (recomendado — gratuito)

### Passo 1 — Criar conta e projeto

1. Acesse [railway.app](https://railway.app) e crie uma conta gratuita
2. Clique em **New Project → Deploy from GitHub repo**
3. Faça upload do código ou conecte ao GitHub

### Passo 2 — Configurar variáveis de ambiente

No painel do Railway, vá em **Variables** e adicione:

| Variável | Valor | Obrigatório |
|---|---|---|
| `TELEGRAM_TOKEN` | Token do @BotFather | ✅ Sim |
| `ANTHROPIC_API_KEY` | Chave da Anthropic | ⚠️ Recomendado |
| `APP_URL` | URL do seu deploy (ex: `https://metatron.railway.app`) | ✅ Sim |
| `DASHBOARD_PASSWORD` | Senha do painel web | ✅ Sim |
| `CLAUDE_MODEL` | `claude-sonnet-4-20250514` | Opcional |

### Passo 3 — Deploy automático

O Railway detecta o `package.json` e faz o deploy automaticamente.
Após o deploy, copie a URL gerada e adicione como `APP_URL`.

### Passo 4 — Testar

1. Abra `https://sua-url.railway.app` no navegador
2. Entre com a senha configurada em `DASHBOARD_PASSWORD`
3. No Telegram, envie `/start` para seu bot

---

## 💻 Rodar localmente (desenvolvimento)

```bash
# 1. Instalar dependências
npm install

# 2. Copiar e editar variáveis
cp .env.example .env
# Edite o .env com seus tokens

# 3. Modo desenvolvimento (sem webhook)
echo "DEV_MODE=true" >> .env

# 4. Iniciar
npm run dev
```

Acesse: `http://localhost:3000`

---

## ✈️ Criar Bot no Telegram

1. Abra o Telegram e fale com **@BotFather**
2. Envie `/newbot`
3. Escolha um nome: `Metatron Bot`
4. Escolha um username: `@MeuMetatronBot`
5. Copie o token gerado
6. Adicione ao `.env` como `TELEGRAM_TOKEN=SEU_TOKEN`

---

## 🤖 Obter Chave Claude (opcional mas recomendado)

1. Acesse [console.anthropic.com](https://console.anthropic.com)
2. Crie uma conta e vá em **API Keys**
3. Clique em **Create Key**
4. Adicione ao `.env` como `ANTHROPIC_API_KEY=sk-ant-...`

> Sem a chave, o bot funciona com comandos básicos (preços, alarmes, TikTok com template) mas sem respostas de IA livre.

---

## 📋 Comandos do Bot

| Comando | Descrição |
|---|---|
| `/start` | Apresentação e lista de comandos |
| `/ajuda` | Ajuda detalhada |
| `/tiktok <url>` | Gera roteiro viral completo |
| `/corte <url> <estilo>` | Corte com estilo: viral, humor, educacional, motivacional |
| `/btc` | Preço do Bitcoin |
| `/eth` | Preço do Ethereum |
| `/preco <coin>` | Preço de qualquer cripto |
| `/buscar <query>` | Pesquisa na web |
| `/news <tema>` | Notícias sobre o tema |
| `/alarme 07:30` | Cria alarme |
| `/alarme 07:30 Label` | Alarme com rótulo |
| `/alarmes` | Lista alarmes ativos |
| `/limpar` | Limpa histórico de conversa |
| Texto livre | IA detecta intenção e executa |

---

## 🏗️ Estrutura do Projeto

```
metatron-bot/
├── src/
│   ├── server.js      # Servidor Express principal
│   ├── bot.js         # Handlers do Telegram
│   ├── claude.js      # Integração Claude AI
│   ├── tiktok.js      # Gerador de roteiros virais
│   ├── search.js      # Pesquisa web (DuckDuckGo)
│   └── api.js         # Rotas da API REST
├── public/
│   └── index.html     # Dashboard web
├── .env.example       # Template de variáveis
├── railway.json       # Config do Railway
├── Procfile           # Config Heroku/Render
└── package.json
```

---

## 🔧 Outras plataformas de deploy

### Render.com
1. Crie conta em [render.com](https://render.com)
2. New → Web Service → Connect GitHub
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Adicione as variáveis de ambiente

### Heroku
```bash
heroku create metatron-bot
heroku config:set TELEGRAM_TOKEN=xxx ANTHROPIC_API_KEY=xxx APP_URL=https://metatron-bot.herokuapp.com
git push heroku main
```

---

## 📡 Endpoints da API

| Endpoint | Método | Descrição |
|---|---|---|
| `/health` | GET | Status do servidor |
| `/api/status` | GET | Status detalhado |
| `/api/chat` | POST | Chat com Claude |
| `/api/tiktok` | POST | Gerar roteiro |
| `/api/search?q=` | GET | Pesquisar web |
| `/api/price/:coin` | GET | Preço de cripto |

---

## 📄 Licença

MIT — Uso livre para projetos pessoais e comerciais.
