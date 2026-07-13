(function() {
  "use strict";

  var currentScript = document.currentScript || (function() {
    var scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
  })();
  if (!currentScript) return;

  var WIDGETS = {
    "wheel-fortune": {
      path: "gallery/widgets/wheel-fortune-widget.html",
      title: "Колесо фортуны",
      mode: "modal"
    },
    "tinder-product": {
      path: "gallery/widgets/tinder-product-widget.html",
      title: "Товарный Тиндер",
      mode: "modal"
    },
    "cleaning-calculator": {
      path: "gallery/widgets/cleaning-calculator-widget.html",
      title: "Калькулятор стоимости",
      mode: "modal"
    },
    "quiz": {
      path: "gallery/widgets/quees.html",
      title: "Квиз",
      mode: "modal"
    },
    "timer-form": {
      path: "gallery/widgets/black-friday-timer-form-widget.html",
      title: "Форма с таймером",
      mode: "modal"
    },
    "sale-banner": {
      path: "gallery/widgets/sale-banner-timer-widget-embed.html",
      title: "Акционная полоса",
      mode: "inline",
      height: "120px"
    },
    "mobile-sale-card": {
      path: "gallery/widgets/mobile-sale-card-widget.html",
      title: "Мобильная акция",
      mode: "modal"
    },
    "manicure-game": {
      path: "gallery/widgets/manicure-game-widget.html",
      title: "Игра-ловушка",
      mode: "modal"
    },
    "purchase-counter": {
      path: "gallery/widgets/purchase-counter-widget.html",
      title: "Счётчик посетителей",
      mode: "inline",
      height: "120px"
    },
    "bike-bonus-runner": {
      path: "gallery/widgets/bike-bonus-runner-widget.html",
      title: "Велоигра за бонусы",
      mode: "modal"
    },
    "gif-contact": {
      path: "gallery/widgets/gif-contact-widget.html",
      title: "Форма с гифкой",
      mode: "modal"
    },
    "organic-lead-form": {
      path: "gallery/widgets/organic-lead-form-widget.html",
      title: "Арт-форма с бонусом",
      mode: "modal"
    },
    "yandex-rating": {
      path: "gallery/widgets/yandex-rating-widget.html",
      title: "Рейтинг на Яндекс Картах",
      mode: "inline",
      height: "360px"
    },
    "digital-business-card": {
      path: "gallery/widgets/digital-business-card-widget.html",
      title: "Электронная визитка",
      mode: "inline",
      height: "680px"
    },
    "pic-form-glasses": {
      path: "gallery/widgets/pic-form%20glasses.html",
      title: "Форма с картинкой",
      mode: "modal"
    }
  };

  function attr(name, fallback) {
    var value = currentScript.getAttribute(name);
    return value === null || value === "" ? fallback : value;
  }

  function getBaseUrl() {
    var src = currentScript.src.split("?")[0];
    return src.slice(0, src.lastIndexOf("/") + 1);
  }

  function parseWidgetIds() {
    if (remoteConfig) {
      var configuredWidgets = remoteConfig.widgets || remoteConfig.widget;
      if (Array.isArray(configuredWidgets)) {
        return configuredWidgets.map(function(item) {
          return String(item).trim();
        }).filter(Boolean);
      }
      if (typeof configuredWidgets === "string" && configuredWidgets.trim()) {
        return configuredWidgets.split(",").map(function(item) {
          return item.trim();
        }).filter(Boolean);
      }
    }

    var list = attr("data-widgets", "");
    if (!list) list = attr("data-widget", "wheel-fortune");
    if (list === "all") {
      return Object.keys(WIDGETS);
    }
    return list.split(",").map(function(item) {
      return item.trim();
    }).filter(Boolean);
  }

  function addParam(params, key, value) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, value);
    }
  }

  function getFrequencyMs(frequency) {
    switch (frequency) {
      case "once_per_hour":
      case "hour":
        return 60 * 60 * 1000;
      case "once_per_day":
      case "day":
        return 24 * 60 * 60 * 1000;
      case "once_per_week":
      case "week":
        return 7 * 24 * 60 * 60 * 1000;
      case "always":
      default:
        return 0;
    }
  }

  var baseUrl = getBaseUrl();
  var source = attr("data-source", "");
  var webhookUrl = attr("data-webhook-url", "https://widgets0-production.up.railway.app");
  var webhookSecret = attr("data-webhook-secret", "");
  var frequency = attr("data-frequency", "always");
  var position = attr("data-position", "center");
  var version = attr("data-version", "20260704-universal-loader");
  var zIndex = attr("data-z-index", "2147483000");
  var dimColor = attr("data-dim-color", "rgba(0, 0, 0, 0.52)");
  var accentColor = attr("data-accent-color", "");
  var activeLayer = null;
  var remoteConfig = null;

  function configDisplay() {
    return remoteConfig && remoteConfig.display ? remoteConfig.display : {};
  }

  function configValue(object, key, fallback) {
    return object && object[key] !== undefined && object[key] !== null && object[key] !== "" ? object[key] : fallback;
  }

  function getConfigUrl(path) {
    if (!path) return "";
    try {
      return new URL(path, baseUrl).href;
    } catch (error) {
      return "";
    }
  }

  function applyRemoteConfig(config) {
    remoteConfig = config || null;
    if (!remoteConfig) return true;
    if (remoteConfig.enabled === false) return false;

    var display = configDisplay();
    source = configValue(remoteConfig, "source", source);
    webhookUrl = configValue(remoteConfig, "webhookUrl", webhookUrl);
    webhookSecret = configValue(remoteConfig, "webhookSecret", webhookSecret);
    frequency = configValue(display, "frequency", frequency);
    position = configValue(display, "position", position);
    version = configValue(remoteConfig, "version", version);
    zIndex = String(configValue(remoteConfig, "zIndex", zIndex));
    dimColor = configValue(display, "dimColor", dimColor);
    accentColor = configValue(remoteConfig.theme, "accentColor", accentColor);
    return true;
  }

  function getStorageKey(widgetId) {
    return "widgets0:" + (source || "default") + ":" + widgetId + ":shownAt";
  }

  function canShow(widgetId) {
    var frequencyMs = getFrequencyMs(frequency);
    if (!frequencyMs) return true;
    var lastShownAt = Number(localStorage.getItem(getStorageKey(widgetId)) || 0);
    return !lastShownAt || Date.now() - lastShownAt > frequencyMs;
  }

  function rememberShown(widgetId) {
    if (getFrequencyMs(frequency)) {
      localStorage.setItem(getStorageKey(widgetId), String(Date.now()));
    }
  }

  function buildWidgetUrl(widgetId, widget) {
    var url = new URL(widget.path, baseUrl);
    url.searchParams.set("embed", "1");
    url.searchParams.set("preview", "0");
    url.searchParams.set("delay", "0");
    url.searchParams.set("frequency", "always");
    url.searchParams.set("position", position);
    url.searchParams.set("pageUrl", window.location.href.split("#")[0]);
    url.searchParams.set("v", version);
    addParam(url.searchParams, "source", source || widgetId);
    addParam(url.searchParams, "webhookUrl", webhookUrl);
    addParam(url.searchParams, "webhookSecret", webhookSecret);
    addParam(url.searchParams, "accentColor", accentColor);

    if (remoteConfig) {
      addParam(url.searchParams, "client", remoteConfig.client);
      addParam(url.searchParams, "domain", remoteConfig.domain);
      addParam(url.searchParams, "instanceId", remoteConfig.id);
    }

    return url.href;
  }

  function createCloseButton(remove) {
    var button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", "Закрыть виджет");
    button.innerHTML = "×";
    button.style.position = "fixed";
    button.style.top = "max(14px, env(safe-area-inset-top))";
    button.style.right = "max(14px, env(safe-area-inset-right))";
    button.style.zIndex = String(Number(zIndex) + 1);
    button.style.width = "46px";
    button.style.height = "46px";
    button.style.border = "0";
    button.style.borderRadius = "999px";
    button.style.background = "rgba(255, 255, 255, 0.9)";
    button.style.color = "#1f1f1f";
    button.style.font = "34px/1 Arial, sans-serif";
    button.style.cursor = "pointer";
    button.style.boxShadow = "0 12px 34px rgba(0, 0, 0, 0.18)";
    button.style.display = "grid";
    button.style.placeItems = "center";
    button.addEventListener("click", remove);
    return button;
  }

  function mountModal(widgetId, widget) {
    if (!canShow(widgetId)) return;

    if (activeLayer) {
      window.setTimeout(function() {
        mountModal(widgetId, widget);
      }, 1000);
      return;
    }

    var layer = document.createElement("div");
    layer.setAttribute("data-widgets0-layer", widgetId);
    layer.style.position = "fixed";
    layer.style.inset = "0";
    layer.style.zIndex = zIndex;
    layer.style.pointerEvents = "none";
    layer.style.opacity = "0";
    layer.style.transition = "opacity 240ms ease";

    var backdrop = document.createElement("div");
    backdrop.style.position = "absolute";
    backdrop.style.inset = "0";
    backdrop.style.background = dimColor;
    backdrop.style.backdropFilter = "blur(2px)";
    backdrop.style.webkitBackdropFilter = "blur(2px)";
    backdrop.style.pointerEvents = "auto";

    var iframe = document.createElement("iframe");
    iframe.src = buildWidgetUrl(widgetId, widget);
    iframe.title = widget.title;
    iframe.loading = "eager";
    iframe.setAttribute("allow", "clipboard-write");
    iframe.setAttribute("scrolling", "auto");
    iframe.setAttribute("allowtransparency", "true");
    iframe.style.position = "absolute";
    iframe.style.inset = "0";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "0";
    iframe.style.background = "transparent";
    iframe.style.colorScheme = "normal";
    iframe.style.pointerEvents = "auto";

    function activate() {
      layer.style.pointerEvents = "auto";
      layer.style.opacity = "1";
      rememberShown(widgetId);
    }

    function removeLayer() {
      layer.style.opacity = "0";
      layer.style.pointerEvents = "none";
      window.setTimeout(function() {
        window.removeEventListener("message", handleMessage);
        if (layer.parentNode) layer.parentNode.removeChild(layer);
        if (activeLayer === layer) activeLayer = null;
      }, 260);
    }

    function handleMessage(event) {
      if (event.source !== iframe.contentWindow) return;
      if (event.data && event.data.type === "widgets0:open") activate();
      if (event.data && event.data.type === "widgets0:close") removeLayer();
    }

    layer.appendChild(backdrop);
    layer.appendChild(iframe);
    layer.appendChild(createCloseButton(removeLayer));
    activeLayer = layer;

    window.addEventListener("message", handleMessage);
    iframe.addEventListener("load", function() {
      window.setTimeout(activate, 120);
    }, { once: true });

    document.body.appendChild(layer);
  }

  function mountInline(widgetId, widget) {
    if (!canShow(widgetId)) return;

    var holder = document.createElement("div");
    holder.setAttribute("data-widgets0-inline", widgetId);
    holder.style.width = "100%";
    holder.style.maxWidth = attr("data-inline-max-width", "100%");
    holder.style.margin = attr("data-inline-margin", "0 auto");

    var iframe = document.createElement("iframe");
    iframe.src = buildWidgetUrl(widgetId, widget);
    iframe.title = widget.title;
    iframe.loading = "lazy";
    iframe.setAttribute("allow", "clipboard-write");
    iframe.style.display = "block";
    iframe.style.width = "100%";
    iframe.style.height = attr("data-inline-height", widget.height || "420px");
    iframe.style.border = "0";
    iframe.style.background = "transparent";
    iframe.style.colorScheme = "normal";

    holder.appendChild(iframe);
    currentScript.parentNode.insertBefore(holder, currentScript.nextSibling);
    rememberShown(widgetId);
  }

  function mountLauncher(widgetId, widget) {
    if (!canShow(widgetId)) return;

    var display = configDisplay();
    var button = document.createElement("button");
    button.type = "button";
    button.textContent = configValue(display, "buttonText", widget.title || "Открыть виджет");
    button.setAttribute("data-widgets0-launcher", widgetId);
    button.style.position = "fixed";
    button.style.zIndex = zIndex;
    button.style.border = "0";
    button.style.borderRadius = "999px";
    button.style.padding = "16px 22px";
    button.style.background = configValue(remoteConfig && remoteConfig.theme, "accentColor", "#1f1f1f");
    button.style.color = "#ffffff";
    button.style.font = "700 16px/1.2 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    button.style.boxShadow = "0 18px 45px rgba(0, 0, 0, 0.22)";
    button.style.cursor = "pointer";
    button.style.right = "24px";
    button.style.bottom = "24px";

    if (position === "bottom-left" || position === "left-bottom") {
      button.style.left = "24px";
      button.style.right = "auto";
    }

    button.addEventListener("click", function() {
      if (button.parentNode) button.parentNode.removeChild(button);
      mountModal(widgetId, widget);
    });

    document.body.appendChild(button);
  }

  function mountWidget(widgetId, index) {
    var widget = WIDGETS[widgetId];
    if (!widget) {
      console.warn("[widgets0] Unknown widget:", widgetId);
      return;
    }

    var display = configDisplay();
    var modeOverride = configValue(display, "mode", attr("data-mode", ""));
    var mode = modeOverride || widget.mode || "modal";
    var delayValue = configValue(display, "delaySeconds", attr("data-delay", ""));
    var delay = Math.max(0, Number(delayValue) || 0) + index * 0.8;
    var trigger = configValue(display, "trigger", attr("data-trigger", "auto"));

    window.setTimeout(function() {
      if (trigger === "button" && mode !== "inline") {
        mountLauncher(widgetId, widget);
      } else if (mode === "inline") {
        mountInline(widgetId, widget);
      } else {
        mountModal(widgetId, widget);
      }
    }, delay * 1000);
  }

  function init() {
    if (attr("data-enabled", "true") === "false") return;
    parseWidgetIds().forEach(mountWidget);
  }

  function start() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
      init();
    }
  }

  var configUrl = getConfigUrl(attr("data-config", ""));
  if (configUrl) {
    fetch(configUrl, { cache: "no-store" })
      .then(function(response) {
        if (!response.ok) throw new Error("Config load failed");
        return response.json();
      })
      .then(function(config) {
        if (applyRemoteConfig(config)) start();
      })
      .catch(function(error) {
        console.warn("[widgets0] Config was not loaded:", error);
        start();
      });
  } else {
    start();
  }
})();
