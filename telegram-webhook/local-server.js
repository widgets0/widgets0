// Local webhook server for testing widget leads through ngrok.
// Run: node local-server.js

const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env");
const env = Object.assign({}, process.env, loadEnv(envPath));
const PORT = Number(env.PORT || 8787);
const HOST = env.HOST || "0.0.0.0";
const ANALYTICS_EVENTS_PATH = env.ANALYTICS_EVENTS_PATH || path.join(__dirname, "analytics-events.jsonl");
const ADMIN_USERNAME = env.ADMIN_USERNAME || "";
const ADMIN_PASSWORD_SALT = env.ADMIN_PASSWORD_SALT || "";
const ADMIN_PASSWORD_HASH = env.ADMIN_PASSWORD_HASH || "";
const ADMIN_SESSION_SECRET = env.ADMIN_SESSION_SECRET || "";
const ADMIN_SESSION_COOKIE = "widgets0_admin_session";
const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_ATTEMPT_LIMIT = 7;
const loginAttempts = new Map();
const ALLOWED_ANALYTICS_EVENTS = new Set([
  "widget_loaded",
  "widget_shown",
  "widget_closed",
  "wheel_spin_click",
  "prize_shown",
  "prize_link_click"
]);

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

function sendHtml(res, status, html, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Security-Policy": "default-src 'self'; img-src 'self'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    ...headers
  });
  res.end(html);
}

function parseCookies(req) {
  return String(req.headers.cookie || "")
    .split(";")
    .map(item => item.trim())
    .filter(Boolean)
    .reduce((result, item) => {
      const separator = item.indexOf("=");
      if (separator === -1) return result;
      result[item.slice(0, separator)] = item.slice(separator + 1);
      return result;
    }, {});
}

function safeBufferEqual(left, right) {
  if (!Buffer.isBuffer(left) || !Buffer.isBuffer(right) || left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function createAdminSession() {
  const expiresAt = Date.now() + ADMIN_SESSION_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ username: ADMIN_USERNAME, expiresAt })).toString("base64url");
  const signature = crypto.createHmac("sha256", ADMIN_SESSION_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function hasValidAdminSession(req) {
  if (!ADMIN_SESSION_SECRET) return false;
  const token = parseCookies(req)[ADMIN_SESSION_COOKIE] || "";
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = crypto.createHmac("sha256", ADMIN_SESSION_SECRET).update(payload).digest();
  let supplied;
  try {
    supplied = Buffer.from(signature, "base64url");
  } catch (error) {
    return false;
  }
  if (!safeBufferEqual(expected, supplied)) return false;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return session.username === ADMIN_USERNAME && Number(session.expiresAt) > Date.now();
  } catch (error) {
    return false;
  }
}

function matchesAdminCredentials(username, password) {
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD_SALT || !ADMIN_PASSWORD_HASH || !ADMIN_SESSION_SECRET) return false;
  const suppliedUsername = Buffer.from(String(username || ""));
  const expectedUsername = Buffer.from(ADMIN_USERNAME);
  const usernameMatches = safeBufferEqual(suppliedUsername, expectedUsername);
  const suppliedHash = crypto.scryptSync(String(password || ""), ADMIN_PASSWORD_SALT, 32);
  const expectedHash = Buffer.from(ADMIN_PASSWORD_HASH, "hex");
  return usernameMatches && safeBufferEqual(suppliedHash, expectedHash);
}

function requestIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",")[0].trim();
}

function loginAttemptState(req) {
  const key = requestIp(req);
  const now = Date.now();
  const current = loginAttempts.get(key);
  if (!current || current.resetAt <= now) {
    const fresh = { count: 0, resetAt: now + LOGIN_ATTEMPT_WINDOW_MS };
    loginAttempts.set(key, fresh);
    return { key, value: fresh };
  }
  return { key, value: current };
}

function adminLoginPage(errorMessage = "") {
  const error = errorMessage ? `<div class="error" role="alert">${escapeHtml(errorMessage)}</div>` : "";
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Olly · Вход в админку</title>
  <link rel="icon" type="image/png" href="/favicon.png">
  <style>
    :root { color-scheme: light; --bg:#f4f3f0; --nav:#3f6175; --ink:#12181d; --muted:#6b7580; --line:rgba(17,24,28,.14); --blue:#256fd4; }
    * { box-sizing:border-box; }
    html, body { margin:0; min-height:100%; }
    body { min-height:100vh; display:grid; place-items:center; padding:28px; background:var(--bg); color:var(--ink); font-family:Manrope,Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; -webkit-font-smoothing:antialiased; }
    .login { width:min(100%, 430px); overflow:hidden; border:1px solid var(--line); border-radius:16px; background:#fff; box-shadow:0 24px 70px rgba(17,24,28,.12); }
    .brand { display:flex; align-items:center; gap:18px; min-height:112px; padding:26px 30px; background:var(--nav); color:#fff; }
    .brand img { width:104px; height:auto; filter:brightness(0) invert(1); }
    .brand-line { width:1px; height:38px; background:rgba(255,255,255,.2); }
    .brand-copy { display:grid; gap:5px; }
    .brand-copy span { color:rgba(255,255,255,.62); font-size:10px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; }
    .brand-copy strong { font-size:17px; line-height:1.2; }
    .form { display:grid; gap:20px; padding:32px 30px 30px; }
    .heading { display:grid; gap:8px; }
    h1 { margin:0; font-size:27px; line-height:1.15; letter-spacing:0; }
    p { margin:0; color:var(--muted); font-size:14px; line-height:1.5; }
    .fields { display:grid; gap:15px; }
    label { display:grid; gap:7px; color:#3e4851; font-size:12px; font-weight:750; }
    input { width:100%; height:48px; padding:0 14px; border:1px solid var(--line); border-radius:9px; outline:none; background:#fff; color:var(--ink); font:600 15px/1 inherit; transition:border-color .18s ease, box-shadow .18s ease; }
    input:focus { border-color:var(--blue); box-shadow:0 0 0 3px rgba(37,111,212,.12); }
    button { height:48px; border:0; border-radius:9px; background:var(--blue); color:#fff; cursor:pointer; font:800 14px/1 inherit; box-shadow:0 12px 24px rgba(37,111,212,.2); }
    button:hover { background:#1f63bf; }
    .error { padding:11px 13px; border:1px solid #f0c9cc; border-radius:8px; background:#fff2f2; color:#a52f38; font-size:12px; font-weight:700; line-height:1.4; }
    .secure { color:#8a949d; font-size:11px; line-height:1.4; text-align:center; }
    @media (max-width:520px) { body { padding:16px; } .brand { padding:23px; } .form { padding:27px 23px 24px; } .brand img { width:94px; } h1 { font-size:24px; } }
  </style>
</head>
<body>
  <main class="login">
    <header class="brand">
      <img src="/brand-logo.png" alt="Olly">
      <span class="brand-line" aria-hidden="true"></span>
      <div class="brand-copy"><span>Личный кабинет</span><strong>Статистика виджетов</strong></div>
    </header>
    <form class="form" method="post" action="/admin-login">
      <div class="heading"><h1>Вход в адинку</h1><p>Введи данные для доступа к проектам и статистике.</p></div>
      ${error}
      <div class="fields">
        <label>Логин<input name="username" type="text" autocomplete="username" required autofocus></label>
        <label>Пароль<input name="password" type="password" autocomplete="current-password" required></label>
      </div>
      <button type="submit">Войти</button>
      <div class="secure">Защищённое соединение · сессия на 8 часов</div>
    </form>
  </main>
</body>
</html>`;
}

function normalizeText(value, fallback = "") {
  return String(value || fallback).trim().slice(0, 500);
}

function normalizeUrl(value) {
  const text = normalizeText(value);
  if (!text) return "";
  try {
    const url = new URL(text);
    url.hash = "";
    return url.toString().slice(0, 700);
  } catch (error) {
    return text.slice(0, 700);
  }
}

function eventDomain(event) {
  const source = event.page || "";
  try {
    return new URL(source).hostname;
  } catch (error) {
    return "";
  }
}

function normalizeAnalyticsEvent(payload, req) {
  const event = normalizeText(payload.event || payload.eventName);
  if (!ALLOWED_ANALYTICS_EVENTS.has(event)) {
    throw new Error("Unknown analytics event");
  }

  return {
    event,
    widgetId: normalizeText(payload.widgetId || payload.widget || payload.source, "unknown-widget"),
    clientId: normalizeText(payload.clientId || payload.client || "unknown-client"),
    source: normalizeText(payload.source || payload.widgetId || payload.widget || "unknown-source"),
    page: normalizeUrl(payload.page || req.headers.origin || ""),
    referrer: normalizeUrl(payload.referrer || ""),
    prize: normalizeText(payload.prize || ""),
    createdAt: new Date().toISOString()
  };
}

async function appendAnalyticsEvent(event) {
  await fs.promises.mkdir(path.dirname(ANALYTICS_EVENTS_PATH), { recursive: true });
  await fs.promises.appendFile(ANALYTICS_EVENTS_PATH, JSON.stringify(event) + "\n", "utf8");
}

async function readAnalyticsEvents() {
  try {
    const raw = await fs.promises.readFile(ANALYTICS_EVENTS_PATH, "utf8");
    return raw
      .split(/\r?\n/)
      .filter(Boolean)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (error) {
          return null;
        }
      })
      .filter(Boolean);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

function emptyEventCounters() {
  return {
    widget_loaded: 0,
    widget_shown: 0,
    widget_closed: 0,
    wheel_spin_click: 0,
    prize_shown: 0,
    prize_link_click: 0
  };
}

function summarizeAnalyticsEvents(events) {
  const widgets = new Map();
  const totals = emptyEventCounters();

  events.forEach(event => {
    if (!ALLOWED_ANALYTICS_EVENTS.has(event.event)) return;

    const key = event.widgetId || event.source || "unknown-widget";
    if (!widgets.has(key)) {
      widgets.set(key, {
        widgetId: key,
        clientId: event.clientId || "",
        source: event.source || key,
        domain: eventDomain(event),
        domains: {},
        events: emptyEventCounters(),
        firstSeenAt: event.createdAt || "",
        lastSeenAt: event.createdAt || ""
      });
    }

    const item = widgets.get(key);
    const domain = eventDomain(event) || "unknown-domain";
    item.clientId = item.clientId || event.clientId || "";
    item.source = item.source || event.source || key;
    item.domain = item.domain || (domain === "unknown-domain" ? "" : domain);
    item.events[event.event] += 1;
    item.lastSeenAt = event.createdAt || item.lastSeenAt;
    if (event.createdAt && (!item.firstSeenAt || event.createdAt < item.firstSeenAt)) {
      item.firstSeenAt = event.createdAt;
    }

    if (!item.domains[domain]) {
      item.domains[domain] = {
        domain,
        events: emptyEventCounters(),
        firstSeenAt: event.createdAt || "",
        lastSeenAt: event.createdAt || ""
      };
    }

    const domainItem = item.domains[domain];
    domainItem.events[event.event] += 1;
    domainItem.lastSeenAt = event.createdAt || domainItem.lastSeenAt;
    if (event.createdAt && (!domainItem.firstSeenAt || event.createdAt < domainItem.firstSeenAt)) {
      domainItem.firstSeenAt = event.createdAt;
    }

    totals[event.event] += 1;
  });

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    totals,
    widgets: Array.from(widgets.values())
      .map(item => ({
        ...item,
        domains: Object.values(item.domains).sort((a, b) => String(b.lastSeenAt).localeCompare(String(a.lastSeenAt)))
      }))
      .sort((a, b) => String(b.lastSeenAt).localeCompare(String(a.lastSeenAt)))
  };
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
  const requestPath = req.url.split("?")[0];

  if (req.method === "GET" && requestPath === "/admin-login") {
    if (hasValidAdminSession(req)) {
      res.writeHead(303, { Location: "/admin/", "Cache-Control": "no-store" });
      res.end();
      return;
    }
    sendHtml(res, 200, adminLoginPage());
    return;
  }

  if (req.method === "POST" && requestPath === "/admin-login") {
    const attempt = loginAttemptState(req);
    if (attempt.value.count >= LOGIN_ATTEMPT_LIMIT) {
      sendHtml(res, 429, adminLoginPage("Слишком много попыток. Попробуй снова через 15 минут."), { "Retry-After": "900" });
      return;
    }

    try {
      const form = new URLSearchParams(await readBody(req));
      if (!matchesAdminCredentials(form.get("username"), form.get("password"))) {
        attempt.value.count += 1;
        sendHtml(res, 401, adminLoginPage("Неверный логин или пароль."));
        return;
      }

      loginAttempts.delete(attempt.key);
      const maxAge = Math.floor(ADMIN_SESSION_TTL_MS / 1000);
      res.writeHead(303, {
        Location: "/admin/",
        "Cache-Control": "no-store",
        "Set-Cookie": `${ADMIN_SESSION_COOKIE}=${createAdminSession()}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`
      });
      res.end();
    } catch (error) {
      console.error(error);
      sendHtml(res, 400, adminLoginPage("Не получилось выполнить вход. Попробуй ещё раз."));
    }
    return;
  }

  if (req.method === "GET" && requestPath === "/admin-auth/check") {
    if (hasValidAdminSession(req)) {
      res.writeHead(204, { "Cache-Control": "no-store" });
      res.end();
      return;
    }
    res.writeHead(302, { Location: "/admin-login", "Cache-Control": "no-store" });
    res.end();
    return;
  }

  if (req.method === "GET" && requestPath === "/admin-logout") {
    res.writeHead(303, {
      Location: "/admin-login",
      "Cache-Control": "no-store",
      "Set-Cookie": `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
    });
    res.end();
    return;
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, { ok: true, service: "widget-telegram-webhook" });
    return;
  }

  if (req.method === "GET" && req.url.split("?")[0] === "/analytics/summary") {
    try {
      const events = await readAnalyticsEvents();
      sendJson(res, 200, summarizeAnalyticsEvents(events));
    } catch (error) {
      console.error(error);
      sendJson(res, 500, { ok: false, error: error.message });
    }
    return;
  }

  if (req.method === "POST" && req.url.split("?")[0] === "/analytics/events") {
    try {
      const body = await readBody(req);
      const event = normalizeAnalyticsEvent(JSON.parse(body || "{}"), req);
      await appendAnalyticsEvent(event);
      sendJson(res, 200, { ok: true });
    } catch (error) {
      console.error(error);
      sendJson(res, 400, { ok: false, error: error.message });
    }
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
