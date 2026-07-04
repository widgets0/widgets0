// Local webhook server for testing widget leads through ngrok.
// Run: node local-server.js

const http = require("http");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env");
const env = Object.assign({}, process.env, loadEnv(envPath));
const PORT = Number(env.PORT || 8787);
const HOST = env.HOST || "0.0.0.0";

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};

  return fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce((acc, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return acc;
      const index = trimmed.indexOf("=");
      if (index === -1) return acc;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim();
      acc[key] = value;
      return acc;
    }, {});
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type, X-Webhook-Secret",
    "Access-Control-Max-Age": "86400"
  };
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    ...corsHeaders(),
    "Content-Type": "application/json; charset=utf-8"
  });
  res.end(JSON.stringify(payload, null, 2));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        req.destroy();
        reject(new Error("Body too large"));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
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

function isEmptyValue(value) {
  if (value === undefined || value === null || value === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

function compactArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => valueToText(item).trim())
    .filter(Boolean);
}

function normalizeWidgetName(value) {
  const widget = String(value || "").trim();
  if (widget.startsWith("Товарный Тиндер")) return "Товарный Тиндер";
  return widget || "не указан";
}

function formatMoscowTime(value) {
  const date = value ? new Date(value) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const moscow = new Date(safeDate.getTime() + 3 * 60 * 60 * 1000);
  const pad = number => String(number).padStart(2, "0");

  return [
    pad(moscow.getUTCDate()),
    pad(moscow.getUTCMonth() + 1),
    moscow.getUTCFullYear()
  ].join(".") + ", " + pad(moscow.getUTCHours()) + ":" + pad(moscow.getUTCMinutes()) + " (МСК)";
}

function findConsentValue(lead) {
  const key = Object.keys(lead).find(item => item.toLowerCase().includes("согласие") || item.toLowerCase().includes("consent"));
  return key ? lead[key] : "";
}

function formatSelectedProducts(lead) {
  const products = compactArray(lead.selectedProducts);
  const links = compactArray(lead.productLinks);
  if (!products.length) return [];

  const lines = ["<b>Выбрала:</b>"];
  products.forEach((product, index) => {
    lines.push(`${index + 1}. ${escapeHtml(product)}`);
    if (links[index]) lines.push(escapeHtml(links[index]));
  });
  return lines;
}

function leadDomain(lead, req) {
  const fallback = req.headers.origin || "";
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

function isWebhookAuthorized(req) {
  if (!env.WEBHOOK_SECRET) return true;
  return req.headers["x-webhook-secret"] === env.WEBHOOK_SECRET;
}

function parseClientChatIds() {
  if (!env.CLIENT_CHAT_IDS) return {};

  try {
    const parsed = JSON.parse(env.CLIENT_CHAT_IDS);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    console.warn("CLIENT_CHAT_IDS is not valid JSON");
    return {};
  }
}

function getTargetChatIds(lead) {
  const adminChatId = env.ADMIN_CHAT_ID || env.TELEGRAM_CHAT_ID || "";
  const source = String(lead.source || "").trim();
  const clientChatIds = parseClientChatIds();
  const chatIds = [];

  if (adminChatId) chatIds.push(adminChatId);
  if (source && clientChatIds[source]) chatIds.push(clientChatIds[source]);

  return [...new Set(chatIds.map(String).filter(Boolean))];
}

function formatLead(lead, req) {
  const selectedProductLines = formatSelectedProducts(lead);
  const consent = findConsentValue(lead);
  const preferredKeys = ["source", "prize", "discount", "selectedTours", "score"];
  const technicalKeys = new Set([
    "widget",
    "name",
    "phone",
    "selectedProducts",
    "productLinks",
    "page",
    "createdAt"
  ]);
  Object.keys(lead).forEach(key => {
    if (key.toLowerCase().includes("согласие") || key.toLowerCase().includes("consent")) {
      technicalKeys.add(key);
    }
  });
  const usedKeys = new Set([...preferredKeys, ...technicalKeys]);
  const lines = [
    "📩 <b>Новая заявка — " + escapeHtml(leadDomain(lead, req)) + "</b>",
    "<b>Виджет:</b> " + escapeHtml(normalizeWidgetName(lead.widget)),
    ""
  ];

  if (!isEmptyValue(lead.name)) lines.push("👤 " + escapeHtml(valueToText(lead.name)));
  if (!isEmptyValue(lead.phone)) lines.push("📞 " + escapeHtml(valueToText(lead.phone)));
  if (!isEmptyValue(lead.name) || !isEmptyValue(lead.phone)) lines.push("");

  if (selectedProductLines.length) {
    lines.push(...selectedProductLines, "");
  }

  preferredKeys.forEach(key => {
    const value = lead[key];
    if (isEmptyValue(value)) return;

    if (key === "discount") {
      lines.push("🎁 <b>Скидка:</b> " + escapeHtml(valueToText(value)));
      return;
    }

    if (key === "prize") {
      lines.push("🎁 <b>Приз:</b> " + escapeHtml(valueToText(value)));
      return;
    }

    lines.push("<b>" + fieldLabel(key) + ":</b> " + escapeHtml(valueToText(value)));
  });

  if (consent) lines.push("✅ <b>Согласие на ПД получено</b>");

  Object.keys(lead).forEach(key => {
    if (usedKeys.has(key)) return;
    const value = lead[key];
    if (isEmptyValue(value)) return;
    lines.push("<b>" + escapeHtml(fieldLabel(key)) + ":</b> " + escapeHtml(valueToText(value)));
  });

  if (lead.page || lead.createdAt) lines.push("");
  if (lead.page) lines.push("📄 <b>Страница:</b> " + escapeHtml(lead.page));
  lines.push("🕐 " + escapeHtml(formatMoscowTime(lead.createdAt)));

  return lines.join("\n");
}

async function sendToTelegram(lead, req) {
  if (!env.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is missing in .env");
  }

  const chatIds = getTargetChatIds(lead);
  if (!chatIds.length) {
    throw new Error("No Telegram chat target configured. Set TELEGRAM_CHAT_ID, ADMIN_CHAT_ID, or CLIENT_CHAT_IDS.");
  }

  const text = formatLead(lead, req);
  const results = [];

  for (const chatId of chatIds) {
    const response = await fetch("https://api.telegram.org/bot" + env.TELEGRAM_BOT_TOKEN + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        parse_mode: "HTML",
        text
      })
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    results.push(await response.json());
  }

  return results;
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, { ok: true, service: "widget-telegram-webhook" });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  if (!isWebhookAuthorized(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  try {
    const body = await readBody(req);
    const lead = JSON.parse(body || "{}");
    await sendToTelegram(lead, req);
    console.log("Lead sent:", {
      widget: lead.widget || "",
      source: lead.source || "",
      domain: leadDomain(lead, req)
    });
    sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { ok: false, error: error.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log("Local webhook listening on http://" + HOST + ":" + PORT);
  console.log("Health check: http://" + HOST + ":" + PORT + "/health");
});
