(function() {
  // 1. ЗАГРУЗКА ЗАВИСИМОСТЕЙ (Tailwind и Confetti)
  function loadDependencies() {
    const scripts = [
      "https://cdn.tailwindcss.com",
      "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js"
    ];
    scripts.forEach(src => {
      if (!document.querySelector(`script[src="${src}"]`)) {
        const s = document.createElement('script');
        s.src = src;
        document.head.appendChild(s);
      }
    });
  }
  loadDependencies();

  // 2. ВСТАВКА HTML В ТЕЛО СТРАНИЦЫ
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'anton-tinder-root';
  // Делаем виджет фиксированным, чтобы он не улетал при скролле
  widgetContainer.style = "position: fixed; bottom: 20px; right: 20px; z-index: 99999; max-width: 380px; width: 100%; height: 600px;";
  
  widgetContainer.innerHTML = `
    <div id="tinder-widget-container" class="w-full h-full bg-slate-50 rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-white relative flex flex-col font-sans" style="font-family: 'Inter', sans-serif;">
      <div id="tinder-state-intro" class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-indigo-50 to-white transition-opacity duration-300">
        <div class="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
          <svg class="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <h2 class="text-2xl font-black text-slate-800 mb-4">Найди тур своей мечты</h2>
        <p class="text-slate-500 mb-8 text-sm">Свайпай вправо, если нравится. В конце тебя ждет подарок! 🎁</p>
        <button id="tinder-btn-start" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg hover:scale-[1.02]">Начать поиск</button>
      </div>

      <div id="tinder-state-swiping" class="flex-1 relative p-4 flex flex-col hidden opacity-0 transition-opacity duration-300">
        <div class="text-center mb-4 mt-2">
          <span class="text-sm font-bold text-slate-400 uppercase tracking-widest" id="tinder-cards-left">Загрузка...</span>
        </div>
        <div class="flex-1 relative w-full mx-auto" id="tinder-cards-container"></div>
      </div>

      <div id="tinder-state-summary" class="hidden p-8 text-center">
         <h2 class="text-xl font-bold">Идеальный мэтч!</h2>
         <div id="tinder-liked-list" class="my-4"></div>
         <button id="tinder-btn-lead" class="w-full bg-indigo-600 text-white py-3 rounded-xl">Получить предложение</button>
      </div>
      
      <div id="tinder-state-success" class="hidden p-8 text-center items-center justify-center flex-col h-full">
         <div class="text-4xl mb-4">✅</div>
         <h2 class="text-2xl font-black mb-2">Готово!</h2>
         <p>Менеджер уже пишет вам.</p>
      </div>
    </div>
  `;
  document.body.appendChild(widgetContainer);

  // 3. ЛОГИКА ВИДЖЕТА
  setTimeout(() => {
    const TOURS = [
      { id: 1, title: 'Мальдивы', description: 'Белоснежный песок...', image: 'https://picsum.photos/seed/maldives/600/800' },
      { id: 2, title: 'Швейцария', description: 'Горные лыжи и уют...', image: 'https://picsum.photos/seed/alps/600/800' },
      { id: 3, title: 'Токио', description: 'Неоновые огни мегаполиса...', image: 'https://picsum.photos/seed/tokyo/600/800' }
    ];

    let likedItems = [];
    let currentCards = [...TOURS];

    function switchState(stateId) {
      ['intro', 'swiping', 'summary', 'success'].forEach(id => {
        const el = document.getElementById('tinder-state-' + id);
        if (el) el.classList.add('hidden', 'opacity-0');
      });
      const target = document.getElementById('tinder-state-' + stateId);
      if (target) {
        target.classList.remove('hidden');
        setTimeout(() => target.classList.remove('opacity-0'), 50);
      }
    }

    function renderCards() {
      const container = document.getElementById('tinder-cards-container');
      const counter = document.getElementById('tinder-cards-left');
      container.innerHTML = '';
      counter.innerText = `Осталось: ${currentCards.length}`;

      if (currentCards.length === 0) {
        switchState('summary');
        if (typeof confetti === 'function') confetti();
        return;
      }

      const item = currentCards[0];
      const card = document.createElement('div');
      card.className = "w-full h-full bg-white rounded-3xl shadow-lg overflow-hidden border p-2";
      card.innerHTML = `
        <img src="${item.image}" class="w-full h-2/3 object-cover rounded-2xl mb-4">
        <h3 class="font-bold text-lg">${item.title}</h3>
        <p class="text-xs text-gray-500">${item.description}</p>
        <div class="flex gap-4 mt-4">
          <button id="btn-nope" class="flex-1 bg-red-100 text-red-500 py-2 rounded-xl">❌</button>
          <button id="btn-like" class="flex-1 bg-green-100 text-green-500 py-2 rounded-xl">❤️</button>
        </div>
      `;
      container.appendChild(card);

      document.getElementById('btn-nope').onclick = () => {
        currentCards.shift();
        renderCards();
      };
      document.getElementById('btn-like').onclick = () => {
        likedItems.push(item);
        currentCards.shift();
        renderCards();
      };
    }

    // Привязка кнопок
    document.getElementById('tinder-btn-start').onclick = () => {
      switchState('swiping');
      renderCards();
    };
    
    document.getElementById('tinder-btn-lead').onclick = () => {
      switchState('success');
    };

  }, 500); // Небольшая задержка, чтобы Tailwind успел подгрузиться
})();
