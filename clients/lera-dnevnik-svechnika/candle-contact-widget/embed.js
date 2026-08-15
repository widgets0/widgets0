/* Inline banner loader for the Lera candle contact widget. */
(function () {
  'use strict';

  if (window.__WIDGETS0_LERA_CANDLE_CONTACT_LOADED__) return;
  window.__WIDGETS0_LERA_CANDLE_CONTACT_LOADED__ = true;

  var currentScript = document.currentScript;
  var WIDGET_HTML = "<!doctype html>\n<html lang=\"ru\">\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n  <title>Задать вопрос</title>\n  <style>\n    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&family=Tenor+Sans&display=swap');\n\n    :root {\n      --lera-ink: #382b23;\n      --lera-ink-soft: #7c6959;\n      --lera-beige: #c1b6a4;\n      --lera-paper: #fcfaf8;\n      --lera-white: #ffffff;\n    }\n\n    * { box-sizing: border-box; }\n\n    body {\n      margin: 0;\n      min-height: 100vh;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      padding: 18px;\n      background: var(--lera-white);\n      font-family: 'Montserrat', Arial, sans-serif;\n      color: var(--lera-white);\n    }\n\n    .cat-banner-wrapper {\n      width: 100%;\n      font-family: 'Montserrat', Arial, sans-serif;\n    }\n\n    .cat-banner-wrapper * { box-sizing: border-box; }\n\n    .cat-card {\n      width: min(100%, 920px);\n      height: 340px;\n      margin: 0 auto;\n      display: grid;\n      grid-template-columns: minmax(0, 1fr) 304px;\n      background: var(--lera-paper);\n      border: 1px solid #c1b6a4;\n      border-radius: 28px;\n      position: relative;\n      overflow: hidden;\n      box-shadow: 0 20px 50px rgba(85, 60, 42, 0.09);\n    }\n\n    .cat-content {\n      align-self: center;\n      padding: 30px 44px 30px 46px;\n      position: relative;\n      z-index: 2;\n    }\n\n    .cat-title {\n      margin: 0 0 15px;\n      color: var(--lera-ink);\n      font-family: 'Tenor Sans', Arial, sans-serif;\n      font-size: clamp(32px, 4.5vw, 43px);\n      font-weight: 400;\n      line-height: 1.08;\n      letter-spacing: 0.025em;\n      text-transform: uppercase;\n    }\n\n    .cat-subtitle {\n      max-width: 470px;\n      margin: 0 0 25px;\n      color: var(--lera-ink-soft);\n      font-size: 14px;\n      font-weight: 300;\n      line-height: 1.62;\n    }\n\n    .cat-btn {\n      min-height: 48px;\n      display: inline-flex;\n      align-items: center;\n      justify-content: center;\n      padding: 13px 28px;\n      border: 0;\n      border-radius: 999px;\n      background: var(--lera-beige);\n      color: var(--lera-white);\n      box-shadow: 0 10px 24px rgba(86, 58, 39, 0.14);\n      cursor: pointer;\n      font: 500 12px/1 'Tenor Sans', Arial, sans-serif;\n      letter-spacing: 0.12em;\n      text-transform: uppercase;\n      text-decoration: none;\n      transition: transform 0.22s ease, background 0.22s ease, box-shadow 0.22s ease;\n    }\n\n    .cat-btn:hover {\n      background: #aea18e;\n      transform: translateY(-2px);\n      box-shadow: 0 14px 28px rgba(86, 58, 39, 0.2);\n    }\n\n    .cat-image-wrapper {\n      min-width: 0;\n      margin: 15px 15px 15px 0;\n      position: relative;\n      z-index: 1;\n      overflow: hidden;\n      border-radius: 20px;\n      background: #3a2d27;\n    }\n\n    .cat-image-wrapper::after {\n      content: '';\n      position: absolute;\n      inset: 0;\n      background: linear-gradient(90deg, rgba(21, 19, 17, 0.18), transparent 38%), linear-gradient(0deg, rgba(21, 19, 17, 0.24), transparent 44%);\n      pointer-events: none;\n    }\n\n    .cat-video {\n      position: absolute;\n      inset: 0;\n      width: 100%;\n      height: 100%;\n      display: block;\n      object-fit: cover;\n      object-position: 50% 48%;\n      filter: saturate(0.86) contrast(1.04) brightness(0.94);\n    }\n\n    @media (max-width: 700px) {\n      body { padding: 18px; }\n\n      .cat-card {\n        grid-template-columns: 1fr;\n        height: auto;\n        border-radius: 24px;\n      }\n\n      .cat-content {\n        padding: 40px 30px 34px;\n        text-align: center;\n      }\n\n      .cat-title {\n        margin-bottom: 18px;\n        font-size: clamp(29px, 9.5vw, 36px);\n      }\n\n      .cat-subtitle {\n        margin: 0 auto 28px;\n        font-size: 13px;\n      }\n\n      .cat-image-wrapper {\n        width: calc(100% - 36px);\n        height: auto;\n        aspect-ratio: 1 / 1;\n        margin: 6px 18px 18px;\n        border-radius: 16px;\n      }\n    }\n\n    @media (prefers-reduced-motion: reduce) {\n      .cat-btn { transition: none; }\n    }\n  </style>\n</head>\n<body>\n  <div class=\"cat-banner-wrapper\">\n    <div class=\"cat-card\">\n      <div class=\"cat-content\">\n        <h2 class=\"cat-title\">Остались вопросы?</h2>\n        <p class=\"cat-subtitle\">\n          Свяжись с нашей службой заботы напрямую и задай любые уточняющие вопросы\n        </p>\n        <a class=\"cat-btn\" href=\"https://t.me/valeriechvileva_help\" target=\"_blank\" rel=\"noopener noreferrer\">Задать вопрос</a>\n      </div>\n\n      <div class=\"cat-image-wrapper\">\n        <video class=\"cat-video\" autoplay muted loop playsinline preload=\"metadata\" aria-label=\"Зажигаем свечу\">\n          <source src=\"./candle-contact-loop.mp4\" type=\"video/mp4\">\n        </video>\n      </div>\n    </div>\n  </div>\n\n  <script>\n    (function () {\n      const analytics = Object.assign({\n        endpoint: '',\n        clientId: 'tnt',\n        widgetId: 'lera-candle-contact',\n        source: 'lera-candle-contact-widget'\n      }, window.LERA_CANDLE_CONTACT_ANALYTICS_CONFIG || {});\n      const contactCard = document.querySelector('.cat-card');\n      const contactLink = document.querySelector('.cat-btn');\n      let viewTracked = false;\n\n      function track(eventName) {\n        const endpoint = String(analytics.endpoint || '').trim();\n        if (!endpoint) return;\n\n        const body = JSON.stringify({\n          event: eventName,\n          widgetId: analytics.widgetId,\n          clientId: analytics.clientId,\n          source: analytics.source,\n          page: window.location.href,\n          referrer: document.referrer || '',\n          createdAt: new Date().toISOString()\n        });\n\n        try {\n          fetch(endpoint, {\n            method: 'POST',\n            headers: { 'Content-Type': 'text/plain;charset=UTF-8' },\n            body,\n            mode: 'cors',\n            keepalive: true\n          }).catch(function () {\n            try {\n              if (navigator.sendBeacon) navigator.sendBeacon(endpoint, body);\n            } catch (error) {}\n          });\n        } catch (error) {\n          try {\n            if (navigator.sendBeacon) navigator.sendBeacon(endpoint, body);\n          } catch (beaconError) {}\n        }\n      }\n\n      track('widget_loaded');\n\n      function trackView() {\n        if (viewTracked) return;\n        viewTracked = true;\n        track('widget_shown');\n      }\n\n      if (contactCard && 'IntersectionObserver' in window) {\n        const observer = new IntersectionObserver(function (entries) {\n          if (!entries.some(function (entry) { return entry.isIntersecting && entry.intersectionRatio >= 0.4; })) return;\n          observer.disconnect();\n          trackView();\n        }, { threshold: [0.4] });\n        observer.observe(contactCard);\n      } else {\n        trackView();\n      }\n\n      if (contactLink) {\n        contactLink.addEventListener('click', function () {\n          track('prize_link_click');\n        });\n      }\n    })();\n  </script>\n\n</body>\n</html>\n";
  var ASSET_BASE = 'https://widgets0.github.io/widgets0/clients/lera-dnevnik-svechnika/candle-contact-widget/';

  function runInlineScript(code) {
    var script = document.createElement('script');
    script.text = code;
    (document.body || document.documentElement).appendChild(script);
  }

  function installWidget() {
    var parser = new DOMParser();
    var doc = parser.parseFromString(WIDGET_HTML, 'text/html');
    var root = document.createElement('div');
    root.className = 'lera-candle-contact-embed-root';

    var css = Array.prototype.map.call(doc.querySelectorAll('style'), function (style) {
      return style.textContent || '';
    }).join('\n');

    css = css
      .replace(/:root/g, '.lera-candle-contact-embed-root')
      .replace(/\bbody\b/g, '.lera-candle-contact-embed-root')
      .replace('* { box-sizing: border-box; }', '.lera-candle-contact-embed-root, .lera-candle-contact-embed-root * { box-sizing: border-box; }');

    css += '\n.lera-candle-contact-embed-root {' +
      'width:100%;min-height:0;display:block;padding:18px;' +
      'box-sizing:border-box;background:#fff;' +
      "font-family:'Montserrat',Arial,sans-serif;color:#fff;" +
      '}\n' +
      '@media (max-width:700px){.lera-candle-contact-embed-root{padding:18px;}}';

    var style = document.createElement('style');
    style.id = 'widgets0-lera-candle-contact-embed-styles';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);

    Array.prototype.forEach.call(doc.querySelectorAll('video source'), function (source) {
      var src = source.getAttribute('src') || '';
      if (src && !/^https?:/i.test(src)) source.setAttribute('src', new URL(src, ASSET_BASE).toString());
    });

    Array.prototype.forEach.call(doc.body.childNodes, function (node) {
      if (node.nodeType === 1 && node.tagName === 'SCRIPT') return;
      root.appendChild(document.importNode(node, true));
    });

    window.LERA_CANDLE_CONTACT_CONFIG = {
      webhookUrl: currentScript && currentScript.dataset.webhookUrl
        ? currentScript.dataset.webhookUrl
        : 'https://155-212-191-195.sslip.io/widgets0-webhook/',
      webhookSecret: currentScript && currentScript.dataset.webhookSecret
        ? currentScript.dataset.webhookSecret
        : '',
      widget: currentScript && currentScript.dataset.widget
        ? currentScript.dataset.widget
        : 'Форма с видео — Дневник свечника',
      source: currentScript && currentScript.dataset.source
        ? currentScript.dataset.source
        : 'lera-candle-contact-widget'
    };

    window.LERA_CANDLE_CONTACT_ANALYTICS_CONFIG = {
      endpoint: currentScript && currentScript.dataset.analyticsEndpoint
        ? currentScript.dataset.analyticsEndpoint
        : 'https://155-212-191-195.sslip.io/widgets0-webhook/analytics/events',
      clientId: currentScript && currentScript.dataset.clientId
        ? currentScript.dataset.clientId
        : 'tnt',
      widgetId: currentScript && currentScript.dataset.widgetId
        ? currentScript.dataset.widgetId
        : 'lera-candle-contact',
      source: currentScript && currentScript.dataset.source
        ? currentScript.dataset.source
        : 'lera-candle-contact-widget'
    };

    var parent = currentScript && currentScript.parentNode;
    if (parent) parent.insertBefore(root, currentScript);
    else (document.body || document.documentElement).appendChild(root);

    Array.prototype.forEach.call(doc.querySelectorAll('script:not([src])'), function (script) {
      runInlineScript(script.textContent || '');
    });
  }

  function onReady() {
    if (document.head && document.body) installWidget();
    else setTimeout(onReady, 30);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady, { once: true });
  } else {
    onReady();
  }
})();
