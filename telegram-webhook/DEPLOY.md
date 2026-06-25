# Deploy webhook to Railway or Render

Backend stack:

- Language: JavaScript
- Runtime: Node.js
- Framework: none
- Server: built-in Node `http`
- Start command: `npm start`
- Health check: `/health`

## Required environment variables

```text
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
ALLOWED_ORIGIN=
HOST=0.0.0.0
```

`PORT` is usually provided by Railway/Render automatically.

## Railway

1. Push the project to GitHub.
2. Open Railway.
3. Create a new project from GitHub.
4. Select this repository.
5. Set Root Directory:

```text
embeddable-tilda/telegram-webhook
```

6. Add Variables:

```text
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=803748492
ALLOWED_ORIGIN=
HOST=0.0.0.0
```

7. Railway should detect Node.js automatically.
8. Start command:

```text
npm start
```

9. After deploy, open:

```text
https://your-railway-domain.up.railway.app/health
```

Expected response:

```json
{
  "ok": true,
  "service": "widget-telegram-webhook"
}
```

## Render

1. Push the project to GitHub.
2. Open Render.
3. Create New Web Service.
4. Select this repository.
5. Set Root Directory:

```text
embeddable-tilda/telegram-webhook
```

6. Runtime:

```text
Node
```

7. Build Command:

```text
npm install
```

8. Start Command:

```text
npm start
```

9. Add Environment Variables:

```text
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=803748492
ALLOWED_ORIGIN=
HOST=0.0.0.0
```

10. After deploy, open:

```text
https://your-render-service.onrender.com/health
```

## Connect widgets

Use the deployed URL as `webhookUrl`:

```html
<script>
window.WIDGET_LEAD_CONFIG = {
  webhookUrl: 'https://your-webhook-url',
  telegramBotToken: '',
  telegramChatId: '',
  storageKey: 'widget_leads'
};
</script>
```

The lead flow will be:

```text
Widget -> Railway/Render webhook -> Telegram Bot -> Telegram Chat
```
