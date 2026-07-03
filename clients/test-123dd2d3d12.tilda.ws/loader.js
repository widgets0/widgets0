(function () {
  "use strict";

  // ==============================
  // НАСТРОЙКИ КЛИЕНТА
  // Меняй только этот блок.
  // ==============================
  var CLIENT_CONFIG = {
    clientId: "test-123dd2d3d12.tilda.ws",

    // Будет приходить в Telegram в поле "Источник".
    source: "test-123dd2d3d12-tilda-ws",

    // Railway webhook для приема заявок.
    webhookUrl: "https://widgets0-production.up.railway.app",

    // Если на Railway включен WEBHOOK_SECRET, впиши его сюда.
    // Если секрет пока не нужен, оставь пустую строку.
    webhookSecret: "",

    // Затемнение вокруг всплывающих виджетов.
    backdropColor: "rgba(0, 0, 0, 0.52)",

    widgets: [
      {
        id: "wheel-fortune",
        file: "wheel-fortune-widget.html",
        enabled: true,

        // Через сколько секунд после открытия страницы показать виджет.
        delaySeconds: 2,

        // Варианты: always, once_per_hour, once_per_day, once_per_week.
        frequency: "once_per_day",

        // Варианты для десктопа: center, bottom-left, bottom-right.
        position: "center"
      },
      {
        id: "timer-form",
        file: "timer-form-widget.html",
        enabled: true,
        delaySeconds: 18,
        frequency: "once_per_day",
        position: "center",

        // Варианты: popup, static. Для сайта клиента обычно нужен popup.
        mode: "popup"
      }
    ]
  };

  var currentScript = document.currentScript || (function () {
    var scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
  })();

  var baseUrl = new URL(".", currentScript.src).href;
  var activeLayer = null;

  function getFrequencyMs(frequency) {
    switch (frequency) {
      case "once_per_hour":
        return 60 * 60 * 1000;
      case "once_per_day":
        return 24 * 60 * 60 * 1000;
      case "once_per_week":
        return 7 * 24 * 60 * 60 * 1000;
      case "always":
      default:
        return 0;
    }
  }

  function getStorageKey(widget) {
    return "widgets0:" + CLIENT_CONFIG.clientId + ":" + widget.id + ":shownAt";
  }

  function canShowWidget(widget) {
    var frequencyMs = getFrequencyMs(widget.frequency);
    if (!frequencyMs) return true;

    var lastShownAt = Number(localStorage.getItem(getStorageKey(widget)) || 0);
    return !lastShownAt || Date.now() - lastShownAt > frequencyMs;
  }

  function rememberWidgetShown(widget) {
    if (getFrequencyMs(widget.frequency)) {
      localStorage.setItem(getStorageKey(widget), String(Date.now()));
    }
  }

  function buildWidgetUrl(widget) {
    var url = new URL(widget.file, baseUrl);
    url.searchParams.set("embed", "1");
    url.searchParams.set("preview", "0");
    url.searchParams.set("delay", "0");
    url.searchParams.set("source", widget.source || CLIENT_CONFIG.source);
    url.searchParams.set("webhookUrl", CLIENT_CONFIG.webhookUrl);
    url.searchParams.set("pageUrl", window.location.href.split("#")[0]);

    if (CLIENT_CONFIG.webhookSecret) {
      url.searchParams.set("webhookSecret", CLIENT_CONFIG.webhookSecret);
    }
    if (widget.position) {
      url.searchParams.set("position", widget.position);
    }
    if (widget.mode) {
      url.searchParams.set("mode", widget.mode);
    }

    return url.href;
  }

  function createLayer() {
    var layer = document.createElement("div");
    layer.setAttribute("data-widgets0-client-layer", CLIENT_CONFIG.clientId);
    layer.style.position = "fixed";
    layer.style.inset = "0";
    layer.style.zIndex = "2147483000";
    layer.style.display = "none";
    layer.style.background = CLIENT_CONFIG.backdropColor;
    layer.style.opacity = "0";
    layer.style.transition = "opacity 220ms ease";
    layer.style.pointerEvents = "none";

    var iframe = document.createElement("iframe");
    iframe.title = "Виджет";
    iframe.loading = "eager";
    iframe.allow = "clipboard-write";
    iframe.style.position = "absolute";
    iframe.style.inset = "0";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "0";
    iframe.style.background = "transparent";
    iframe.style.pointerEvents = "auto";

    layer.appendChild(iframe);
    document.body.appendChild(layer);

    return { layer: layer, iframe: iframe };
  }

  function removeLayer(instance) {
    if (!instance || !instance.layer) return;

    instance.layer.style.opacity = "0";
    instance.layer.style.pointerEvents = "none";
    setTimeout(function () {
      if (instance.layer && instance.layer.parentNode) {
        instance.layer.parentNode.removeChild(instance.layer);
      }
      if (activeLayer === instance) {
        activeLayer = null;
      }
    }, 240);
  }

  function showWhenFree(widget) {
    if (!widget.enabled || !canShowWidget(widget)) return;

    if (activeLayer) {
      setTimeout(function () {
        showWhenFree(widget);
      }, 1000);
      return;
    }

    var instance = createLayer();
    activeLayer = instance;

    function handleMessage(event) {
      if (event.source !== instance.iframe.contentWindow) return;
      if (!event.data || typeof event.data !== "object") return;

      if (event.data.type === "widgets0:open") {
        instance.layer.style.display = "block";
        instance.layer.style.pointerEvents = "auto";
        requestAnimationFrame(function () {
          instance.layer.style.opacity = "1";
        });
        rememberWidgetShown(widget);
      }

      if (event.data.type === "widgets0:close") {
        window.removeEventListener("message", handleMessage);
        removeLayer(instance);
      }
    }

    window.addEventListener("message", handleMessage);
    instance.iframe.src = buildWidgetUrl(widget);

    // Если старый виджет не прислал событие открытия, не оставляем пустой iframe навсегда.
    setTimeout(function () {
      if (activeLayer === instance && instance.layer.style.display === "none") {
        window.removeEventListener("message", handleMessage);
        removeLayer(instance);
      }
    }, 15000);
  }

  function scheduleWidget(widget) {
    if (!widget.enabled || !canShowWidget(widget)) return;
    setTimeout(function () {
      showWhenFree(widget);
    }, Math.max(0, Number(widget.delaySeconds) || 0) * 1000);
  }

  function init() {
    CLIENT_CONFIG.widgets.forEach(scheduleWidget);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
