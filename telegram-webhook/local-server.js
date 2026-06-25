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
    "Access-Control-Allow-Headers": "Content-Type",
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

function formatLead(lead, req) {
  const preferredKeys = ["widget", "name", "phone", "prize", "selectedTours", "score"];
  const technicalKeys = new Set(["page", "createdAt"]);
  const usedKeys = new Set([...preferredKeys, ...technicalKeys]);
  const lines = ["<b>Новая заявка с сайта:</b> " + escapeHtml(leadDomain(lead, req))];

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

async function sendToTelegram(lead, req) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    throw new Error("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing in .env");
  }

  const response = await fetch(
    "https://api.telegram.org/bot" + env.TELEGRAM_BOT_TOKEN + "/sendMessage",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        parse_mode: "HTML",
        text: formatLead(lead, req)
      })
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
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

  try {
    const body = await readBody(req);
    const lead = JSON.parse(body || "{}");
    const telegram = await sendToTelegram(lead, req);
    console.log("Lead sent:", lead);
    sendJson(res, 200, { ok: true, telegram });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { ok: false, error: error.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log("Local webhook listening on http://" + HOST + ":" + PORT);
  console.log("Health check: http://" + HOST + ":" + PORT + "/health");
});
