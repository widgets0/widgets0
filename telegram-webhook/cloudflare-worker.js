// Cloudflare Worker: receives widget leads and forwards them to Telegram.
//
// Required environment variables:
// TELEGRAM_BOT_TOKEN - token from BotFather
// TELEGRAM_CHAT_ID   - chat/channel/user id where leads should be sent
//
// Optional environment variables:
// ALLOWED_ORIGIN     - your site origin, for example https://example.com
// SETUP_SECRET       - optional password for /setup?secret=...
// WEBHOOK_SECRET     - optional secret expected in X-Webhook-Secret header

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Webhook-Secret",
    "Access-Control-Max-Age": "86400"
  };
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function valueToText(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value || "");
}

function leadDomain(lead, request) {
  const fallback = request.headers.get("Origin") || "";
  const source = lead.page || fallback;

  try {
    return new URL(source).hostname;
  } catch (error) {
    return source || "не указан";
  }
}

function fieldLabel(key) {
  const labels = {
    widget: "Виджет",
    source: "Источник",
    name: "Имя",
    phone: "Телефон",
    prize: "Приз",
    selectedTours: "Выбрано",
    score: "Счёт",
    page: "Страница",
    createdAt: "Время"
  };

  return labels[key] || key;
}

function isWebhookAuthorized(request, env) {
  if (!env.WEBHOOK_SECRET) return true;
  return request.headers.get("X-Webhook-Secret") === env.WEBHOOK_SECRET;
}

function formatLead(lead, request) {
  const preferredKeys = ["widget", "source", "name", "phone", "prize", "selectedTours", "score"];
  const technicalKeys = new Set(["page", "createdAt"]);
  const usedKeys = new Set([...preferredKeys, ...technicalKeys]);

  const lines = ["<b>Новая заявка с сайта:</b> " + escapeHtml(leadDomain(lead, request))];

  preferredKeys.forEach(key => {
    const value = lead[key];
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value) && value.length === 0) return;
    lines.push("<b>" + fieldLabel(key) + ":</b> " + escapeHtml(valueToText(value)));
  });

  Object.keys(lead).forEach(key => {
    if (usedKeys.has(key)) return;
    const value = lead[key];
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value) && value.length === 0) return;
    lines.push("<b>" + escapeHtml(fieldLabel(key)) + ":</b> " + escapeHtml(valueToText(value)));
  });

  if (lead.page) lines.push("<b>Страница:</b> " + escapeHtml(lead.page));
  if (lead.createdAt) lines.push("<b>Время:</b> " + escapeHtml(lead.createdAt));

  return lines.join("\n");
}

async function getTelegramChats(env) {
  const response = await fetch(
    "https://api.telegram.org/bot" + env.TELEGRAM_BOT_TOKEN + "/getUpdates"
  );

  if (!response.ok) {
    return { ok: false, error: "Telegram error", details: await response.text() };
  }

  const data = await response.json();
  const chats = [];
  const seen = new Set();

  (data.result || []).forEach(update => {
    const message = update.message || update.channel_post || update.edited_message;
    const chat = message && message.chat;
    if (!chat || seen.has(chat.id)) return;
    seen.add(chat.id);
    chats.push({
      id: chat.id,
      type: chat.type,
      title: chat.title || "",
      username: chat.username || "",
      first_name: chat.first_name || "",
      last_name: chat.last_name || "",
      last_text: message.text || ""
    });
  });

  return { ok: true, chats };
}

export default {
  async fetch(request, env) {
    const headers = corsHeaders(env);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (request.method === "GET" && url.pathname === "/setup") {
      if (env.SETUP_SECRET && url.searchParams.get("secret") !== env.SETUP_SECRET) {
        return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), {
          status: 403,
          headers: { ...headers, "Content-Type": "application/json" }
        });
      }

      if (!env.TELEGRAM_BOT_TOKEN) {
        return new Response(JSON.stringify({ ok: false, error: "TELEGRAM_BOT_TOKEN is missing" }), {
          status: 500,
          headers: { ...headers, "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify(await getTelegramChats(env), null, 2), {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
        status: 405,
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }

    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
      return new Response(JSON.stringify({ ok: false, error: "Telegram env vars are missing" }), {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }

    if (!isWebhookAuthorized(request, env)) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }

    let lead;
    try {
      lead = await request.json();
    } catch (error) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }

    const telegramResponse = await fetch(
      "https://api.telegram.org/bot" + env.TELEGRAM_BOT_TOKEN + "/sendMessage",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          parse_mode: "HTML",
          text: formatLead(lead, request)
        })
      }
    );

    if (!telegramResponse.ok) {
      const details = await telegramResponse.text();
      return new Response(JSON.stringify({ ok: false, error: "Telegram error", details }), {
        status: 502,
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" }
    });
  }
};
