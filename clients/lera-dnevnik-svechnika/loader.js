(function () {
  'use strict';

  const currentScript = document.currentScript || Array.from(document.scripts).find((script) => {
    return /clients\/lera-dnevnik-svechnika\/loader\.js/.test(script.src || '');
  });

  const settings = {
    delaySeconds: Number(currentScript?.dataset.delay || 0),
    frequency: currentScript?.dataset.frequency || 'always',
    position: currentScript?.dataset.position || 'center',
    source: currentScript?.dataset.source || 'lera-dnevnik-svechnika',
    quizUrl: currentScript?.dataset.quizUrl || 'https://lk.dnevniksvechnika.ru/anketa',
    storageKey: currentScript?.dataset.storageKey || 'lw_lera_wheel_last_show'
  };

  const prizes = [
    'Бесплатный урок',
    'Чек-лист поставщиков',
    'МК новичку за 490 ₽',
    '−15% на тариф ПРОФИ',
    'Гайд новичку',
    '−2000 ₽ на тариф ВИП'
  ];

  let selectedPrize = prizes[0];
  let rootEl = null;

  function canShow() {
    if (settings.frequency === 'always') return true;

    try {
      const lastShown = Number(localStorage.getItem(settings.storageKey) || 0);
      const now = Date.now();

      if (settings.frequency === 'once') return !lastShown;
      if (settings.frequency === 'hour') return now - lastShown > 60 * 60 * 1000;
      if (settings.frequency === 'day') return now - lastShown > 24 * 60 * 60 * 1000;
    } catch (error) {
      return true;
    }

    return true;
  }

  function markShown() {
    try {
      localStorage.setItem(settings.storageKey, String(Date.now()));
    } catch (error) {
      // localStorage can be unavailable in strict privacy modes.
    }
  }

  function addFonts() {
    if (!document.getElementById('lw-google-fonts-preconnect')) {
      const preconnect = document.createElement('link');
      preconnect.id = 'lw-google-fonts-preconnect';
      preconnect.rel = 'preconnect';
      preconnect.href = 'https://fonts.googleapis.com';
      document.head.appendChild(preconnect);
    }

    if (!document.getElementById('lw-google-fonts-static-preconnect')) {
      const preconnectStatic = document.createElement('link');
      preconnectStatic.id = 'lw-google-fonts-static-preconnect';
      preconnectStatic.rel = 'preconnect';
      preconnectStatic.href = 'https://fonts.gstatic.com';
      preconnectStatic.crossOrigin = 'anonymous';
      document.head.appendChild(preconnectStatic);
    }

    if (!document.getElementById('lw-google-fonts')) {
      const link = document.createElement('link');
      link.id = 'lw-google-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800;900&family=Playfair+Display:wght@600;700&display=swap';
      document.head.appendChild(link);
    }
  }

  function addStyles() {
    if (document.getElementById('lw-loader-styles')) return;

    const style = document.createElement('style');
    style.id = 'lw-loader-styles';
    style.textContent = `
      .lw-root, .lw-root * { box-sizing: border-box; }
      .lw-root {
        position: fixed;
        inset: 0;
        z-index: 2147483000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 28px;
        font-family: "Montserrat", Arial, sans-serif;
        pointer-events: auto;
      }
      .lw-root[data-position="bottom-left"] { align-items: flex-end; justify-content: flex-start; }
      .lw-root[data-position="bottom-right"] { align-items: flex-end; justify-content: flex-end; }
      .lw-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, .62);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
      }
      .lw-modal {
        position: relative;
        z-index: 2;
        width: min(1120px, calc(100vw - 56px));
        min-height: 560px;
        border: 5px solid #17110d;
        border-radius: 24px;
        overflow: visible;
        color: #f4ead9;
        background:
          repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,.055) 0deg 10deg, rgba(0,0,0,.08) 10deg 20deg),
          linear-gradient(135deg, #382f28, #241c17);
        box-shadow: 16px 18px 0 rgba(0,0,0,.72), 0 30px 90px rgba(0,0,0,.42);
      }
      .lw-content {
        display: grid;
        grid-template-columns: minmax(360px, .95fr) minmax(340px, 1fr);
        gap: 54px;
        align-items: center;
        min-height: 560px;
        padding: 58px 72px;
      }
      .lw-close {
        position: absolute;
        top: -26px;
        right: -26px;
        z-index: 8;
        width: 54px;
        height: 54px;
        border: 0;
        border-radius: 50%;
        background: rgba(255,255,255,.96);
        color: #7b736a;
        cursor: pointer;
        box-shadow: 0 10px 28px rgba(0,0,0,.18);
        display: grid;
        place-items: center;
        transition: transform .18s ease, background .18s ease;
      }
      .lw-close:hover { transform: scale(1.04); background: #fff; }
      .lw-close svg { width: 28px; height: 28px; pointer-events: none; }
      .lw-star {
        position: absolute;
        width: 58px;
        height: 58px;
        color: #d5b586;
        filter: drop-shadow(4px 5px 0 rgba(0,0,0,.6));
        pointer-events: none;
      }
      .lw-star-1 { top: -32px; left: -31px; }
      .lw-star-2 { right: 28px; bottom: 18px; width: 46px; height: 46px; }
      .lw-wheel-wrap {
        position: relative;
        display: grid;
        place-items: center;
        min-width: 0;
      }
      .lw-pointer {
        position: absolute;
        top: -23px;
        left: 50%;
        z-index: 5;
        width: 62px;
        transform: translateX(-50%);
        filter: drop-shadow(5px 7px 0 rgba(0,0,0,.72));
        pointer-events: none;
      }
      .lw-wheel {
        width: min(420px, 100%);
        aspect-ratio: 1;
        border-radius: 50%;
        filter: drop-shadow(12px 14px 0 rgba(0,0,0,.65));
        transition: transform 4.8s cubic-bezier(.14, .82, .12, 1);
      }
      .lw-copy {
        position: relative;
        z-index: 2;
        min-width: 0;
      }
      .lw-title {
        margin: 0 0 18px;
        max-width: 520px;
        font-family: "Playfair Display", Georgia, "Times New Roman", serif;
        font-size: clamp(40px, 5.5vw, 66px);
        line-height: .95;
        font-weight: 600;
        letter-spacing: 0;
        color: #d1ad7e;
        text-transform: uppercase;
      }
      .lw-text {
        margin: 0 0 44px;
        max-width: 500px;
        color: #f3eadc;
        font-size: clamp(18px, 2.1vw, 27px);
        line-height: 1.35;
      }
      .lw-spin,
      .lw-prize-link {
        width: 100%;
        min-height: 86px;
        border: 4px solid #17110d;
        border-radius: 16px;
        background: #c8a77b;
        color: #201914;
        box-shadow: 7px 9px 0 #17110d;
        cursor: pointer;
        font: 900 clamp(24px, 3.3vw, 40px)/1 "Montserrat", Arial, sans-serif;
        letter-spacing: 0;
        text-transform: uppercase;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 20px 24px;
        transition: transform .14s ease, box-shadow .14s ease, filter .14s ease;
      }
      .lw-spin:hover,
      .lw-prize-link:hover { transform: translate(-2px, -2px); box-shadow: 9px 11px 0 #17110d; filter: brightness(1.04); }
      .lw-spin:active,
      .lw-prize-link:active { transform: translate(5px, 7px); box-shadow: 2px 2px 0 #17110d; }
      .lw-result {
        display: none;
        position: relative;
        z-index: 4;
        min-height: 560px;
        grid-template-columns: .82fr 1fr;
        gap: 34px;
        align-items: center;
        padding: 48px 58px;
      }
      .lw-modal.is-result .lw-content { display: none; }
      .lw-modal.is-result .lw-result { display: grid; }
      .lw-result-card {
        min-height: 520px;
        border-left: 2px solid rgba(23,17,13,.2);
        background: #fbf1dd;
        color: #251d17;
        padding: 42px 42px 36px;
        box-shadow: -8px 0 0 rgba(0,0,0,.18);
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .lw-prize-label {
        margin: 0 0 8px;
        font-size: 16px;
        font-weight: 900;
        letter-spacing: 0;
        text-transform: uppercase;
        color: #6b5140;
        text-align: center;
      }
      .lw-prize-title {
        margin: 0 0 22px;
        font-size: clamp(34px, 4vw, 56px);
        line-height: .92;
        font-weight: 1000;
        text-align: center;
        color: #241b14;
        text-transform: uppercase;
      }
      .lw-prize-text {
        margin: 0 0 28px;
        text-align: center;
        color: #3b2e25;
        font-size: 20px;
        line-height: 1.35;
        font-weight: 800;
      }
      .lw-prize-link { min-height: 78px; font-size: clamp(22px, 2.6vw, 34px); }
      .lw-confetti {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
        border-radius: 20px;
      }
      .lw-confetti span {
        position: absolute;
        top: -20px;
        width: 9px;
        height: 15px;
        background: #d5b586;
        opacity: .82;
        animation: lwFall 3.4s linear infinite;
      }
      @keyframes lwFall {
        from { transform: translate3d(0, -30px, 0) rotate(0deg); }
        to { transform: translate3d(var(--x, 30px), 620px, 0) rotate(420deg); }
      }
      @media (max-width: 760px) {
        .lw-root { padding: 20px 12px; align-items: center; }
        .lw-modal {
          width: min(430px, calc(100vw - 24px));
          min-height: auto;
          max-height: calc(100vh - 56px);
          overflow: auto;
          border-radius: 24px;
          box-shadow: 10px 12px 0 rgba(0,0,0,.72), 0 28px 70px rgba(0,0,0,.42);
        }
        .lw-content {
          display: flex;
          flex-direction: column;
          gap: 22px;
          min-height: auto;
          padding: 34px 24px 28px;
          text-align: center;
        }
        .lw-close { top: 12px; right: 12px; width: 46px; height: 46px; background: rgba(255,255,255,.28); color: #fff; }
        .lw-wheel { width: min(310px, 76vw); }
        .lw-pointer { top: -14px; width: 46px; }
        .lw-title { font-size: 35px; max-width: none; margin-bottom: 12px; }
        .lw-text { font-size: 19px; margin-bottom: 22px; }
        .lw-spin, .lw-prize-link { min-height: 68px; font-size: 24px; }
        .lw-result {
          display: none;
          min-height: auto;
          padding: 24px;
          grid-template-columns: 1fr;
          gap: 18px;
        }
        .lw-result-card { min-height: auto; border-left: 0; border-top: 2px solid rgba(23,17,13,.2); padding: 30px 22px; border-radius: 18px; }
        .lw-star-1 { top: -20px; left: -18px; width: 44px; height: 44px; }
        .lw-star-2 { right: 14px; bottom: 12px; }
      }
    `;
    document.head.appendChild(style);
  }

  function starSvg(className) {
    return `
      <svg class="${className}" viewBox="0 0 100 100" fill="none" aria-hidden="true">
        <path d="M50 3L62 38L97 50L62 62L50 97L38 62L3 50L38 38L50 3Z" fill="currentColor" stroke="#17110d" stroke-width="6" stroke-linejoin="round"/>
      </svg>
    `;
  }

  function pointerSvg() {
    return `
      <svg class="lw-pointer" viewBox="0 0 70 92" fill="none" aria-hidden="true">
        <path d="M35 88L9 37C-.5 18 11 4 35 4s35.5 14 26 33L35 88Z" fill="#c8a77b" stroke="#17110d" stroke-width="6" stroke-linejoin="round"/>
        <circle cx="35" cy="28" r="11" fill="#fff7e8" stroke="#17110d" stroke-width="6"/>
      </svg>
    `;
  }

  function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let line = '';

    words.forEach((word) => {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    });

    if (line) lines.push(line);
    return lines.slice(0, 3);
  }

  function drawWheel(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 52;
    const arc = (Math.PI * 2) / prizes.length;
    const colors = ['#fbf1dd', '#c8a77b'];

    ctx.clearRect(0, 0, size, size);

    ctx.beginPath();
    ctx.arc(center, center, radius + 30, 0, Math.PI * 2);
    ctx.fillStyle = '#c8a77b';
    ctx.fill();
    ctx.lineWidth = 11;
    ctx.strokeStyle = '#17110d';
    ctx.stroke();

    prizes.forEach((prize, index) => {
      const start = index * arc - Math.PI / 2;
      const end = start + arc;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      ctx.lineWidth = 7;
      ctx.strokeStyle = '#17110d';
      ctx.stroke();

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(start + arc / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#221914';
      ctx.font = '900 38px Montserrat, Arial, sans-serif';

      const lines = wrapText(ctx, prize, 245);
      const lineHeight = 42;
      const startY = -((lines.length - 1) * lineHeight) / 2;
      lines.forEach((line, lineIndex) => {
        ctx.fillText(line, radius * 0.58, startY + lineIndex * lineHeight);
      });
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(center, center, 72, 0, Math.PI * 2);
    ctx.fillStyle = '#c8a77b';
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#17110d';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, 33, 0, Math.PI * 2);
    ctx.fillStyle = '#211813';
    ctx.fill();
  }

  function resultUrl(prize) {
    const url = new URL(settings.quizUrl);
    url.searchParams.set('priz', prize);
    url.searchParams.set('source', settings.source);
    return url.toString();
  }

  function closeWidget() {
    if (!rootEl) return;
    rootEl.remove();
    rootEl = null;
  }

  function makeConfetti() {
    return Array.from({ length: 70 }, (_, index) => {
      const left = Math.random() * 100;
      const delay = Math.random() * 2.2;
      const duration = 2.7 + Math.random() * 2;
      const x = `${-80 + Math.random() * 160}px`;
      const colors = ['#d5b586', '#fbf1dd', '#ffffff', '#8a6d4c'];
      return `<span style="left:${left}%;--x:${x};animation-delay:${delay}s;animation-duration:${duration}s;background:${colors[index % colors.length]}"></span>`;
    }).join('');
  }

  function buildWidget() {
    const root = document.createElement('div');
    root.className = 'lw-root';
    root.dataset.position = settings.position;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');

    root.innerHTML = `
      <div class="lw-backdrop" data-lw-close></div>
      <section class="lw-modal" aria-label="Колесо фортуны">
        ${starSvg('lw-star lw-star-1')}
        ${starSvg('lw-star lw-star-2')}
        <button class="lw-close" type="button" data-lw-close aria-label="Закрыть виджет">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>

        <div class="lw-content">
          <div class="lw-wheel-wrap">
            ${pointerSvg()}
            <canvas class="lw-wheel" width="900" height="900" aria-label="Колесо призов"></canvas>
          </div>
          <div class="lw-copy">
            <h2 class="lw-title">Твой подарок от школы ждёт!</h2>
            <p class="lw-text">Крути колесо — каждая участница получает приз. Без исключений!</p>
            <button class="lw-spin" type="button" data-track="wheel-spin">Крутить!</button>
          </div>
        </div>

        <div class="lw-result">
          <div class="lw-wheel-wrap">
            ${pointerSvg()}
            <canvas class="lw-wheel lw-wheel-result" width="900" height="900" aria-label="Колесо призов"></canvas>
          </div>
          <div class="lw-result-card">
            <p class="lw-prize-label">Твой приз:</p>
            <h3 class="lw-prize-title"></h3>
            <p class="lw-prize-text">Поздравляем! Переходи к анкете — приз передадим вместе с рекомендацией.</p>
            <a class="lw-prize-link" href="#" data-track="wheel-get-prize">Забрать приз</a>
          </div>
          <div class="lw-confetti">${makeConfetti()}</div>
        </div>
      </section>
    `;

    const wheel = root.querySelector('.lw-wheel');
    const resultWheel = root.querySelector('.lw-wheel-result');
    const modal = root.querySelector('.lw-modal');
    const spinButton = root.querySelector('.lw-spin');
    const prizeTitle = root.querySelector('.lw-prize-title');
    const prizeLink = root.querySelector('.lw-prize-link');

    drawWheel(wheel);
    drawWheel(resultWheel);

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        drawWheel(wheel);
        drawWheel(resultWheel);
      }).catch(() => {});
    }

    root.addEventListener('click', (event) => {
      if (event.target.closest('[data-lw-close]')) closeWidget();
    });

    spinButton.addEventListener('click', () => {
      spinButton.disabled = true;
      spinButton.textContent = 'Крутим...';

      const prizeIndex = Math.floor(Math.random() * prizes.length);
      selectedPrize = prizes[prizeIndex];
      const sectorDeg = 360 / prizes.length;
      const targetDeg = 360 * 6 + (360 - prizeIndex * sectorDeg) - sectorDeg / 2;

      wheel.style.transform = `rotate(${targetDeg}deg)`;
      resultWheel.style.transform = `rotate(${targetDeg}deg)`;

      window.setTimeout(() => {
        prizeTitle.textContent = selectedPrize;
        prizeLink.href = resultUrl(selectedPrize);
        modal.classList.add('is-result');
      }, 4900);
    });

    document.addEventListener('keydown', function onKeydown(event) {
      if (event.key === 'Escape') {
        closeWidget();
        document.removeEventListener('keydown', onKeydown);
      }
    });

    return root;
  }

  function init() {
    if (!canShow()) return;
    markShown();
    addFonts();
    addStyles();

    window.setTimeout(() => {
      if (rootEl) return;
      rootEl = buildWidget();
      document.body.appendChild(rootEl);
    }, Math.max(0, settings.delaySeconds) * 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
