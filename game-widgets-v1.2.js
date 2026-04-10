(function() {
    // 1. ЗАГРУЗКА ЗАВИСИМОСТЕЙ
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

    // 2. ДАННЫЕ (Контент)
    const TOURS = [
        { id: 1, title: 'Мальдивы', description: 'Белоснежный песок и полное уединение в бунгало на воде.', image: 'https://picsum.photos/seed/maldives/600/800' },
        { id: 2, title: 'Швейцарские Альпы', description: 'Горные лыжи, горячий глинтвейн и уютные шале.', image: 'https://picsum.photos/seed/alps/600/800' },
        { id: 3, title: 'Токио, Япония', description: 'Неоновые огни мегаполиса и древние храмы.', image: 'https://picsum.photos/seed/tokyo/600/800' },
        { id: 4, title: 'Каппадокия', description: 'Полет на воздушном шаре на рассвете над скалами.', image: 'https://picsum.photos/seed/cappadocia/600/800' },
        { id: 5, title: 'Сафари в Кении', description: 'Дикая природа, львы и незабываемые закаты.', image: 'https://picsum.photos/seed/safari/600/800' }
    ];

    let currentCards = [...TOURS];
    let likedItems = [];

    // 3. СОЗДАНИЕ КОНТЕЙНЕРА
    const root = document.createElement('div');
    root.id = 'anton-tinder-root';
    root.style = "position: fixed; bottom: 20px; right: 20px; z-index: 999999; width: 360px; height: 600px;";
    
    root.innerHTML = `
        <div id="tinder-widget-container" class="w-full h-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-white relative flex flex-col font-sans text-slate-800">
            
            <div id="tinder-state-intro" class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-indigo-50 to-white transition-opacity duration-300">
                <div class="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
                    <svg class="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h2 class="text-2xl font-black mb-4 leading-tight">Найди тур мечты</h2>
                <p class="text-slate-500 mb-8 text-sm">Свайпай (нажимай) ❤️ если нравится. В конце подарок! 🎁</p>
                <button id="tinder-btn-start" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-transform hover:scale-105 active:scale-95">Начать поиск</button>
            </div>

            <div id="tinder-state-swiping" class="hidden opacity-0 flex-1 relative p-4 flex flex-col transition-all duration-300">
                <div class="text-center mb-4">
                    <span id="tinder-cards-left" class="text-xs font-bold text-slate-400 uppercase tracking-widest"></span>
                </div>
                <div id="tinder-cards-container" class="flex-1 relative w-full h-full"></div>
            </div>

            <div id="tinder-state-summary" class="hidden opacity-0 flex-1 flex flex-col p-8 text-center transition-all duration-300">
                <div class="text-4xl mb-4">🎉</div>
                <h2 class="text-xl font-black mb-2">Отличный вкус!</h2>
                <p class="text-sm text-slate-500 mb-6">Мы подобрали лучшие варианты на основе ваших лайков.</p>
                <div id="tinder-liked-list" class="flex-1 overflow-y-auto space-y-2 mb-6 text-left"></div>
                <button id="tinder-btn-lead" class="w-full bg-green-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-green-600 transition-all">Получить скидку 10%</button>
            </div>

            <div id="tinder-state-success" class="hidden opacity-0 flex-1 flex flex-col items-center justify-center p-8 text-center transition-all duration-300">
                <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-3xl">✅</div>
                <h2 class="text-2xl font-black mb-2">Заявка принята!</h2>
                <p class="text-slate-500">Менеджер свяжется с вами в ближайшее время.</p>
            </div>
        </div>
    `;
    document.body.appendChild(root);

    // 4. ФУНКЦИИ УПРАВЛЕНИЯ
    function switchState(stateId) {
        const states = ['intro', 'swiping', 'summary', 'success'];
        states.forEach(id => {
            const el = document.getElementById('tinder-state-' + id);
            if (el) {
                el.classList.add('hidden');
                el.classList.add('opacity-0');
            }
        });
        const activeState = document.getElementById('tinder-state-' + stateId);
        if (activeState) {
            activeState.classList.remove('hidden');
            setTimeout(() => activeState.classList.remove('opacity-0'), 50);
        }
    }

    function renderCards() {
        const container = document.getElementById('tinder-cards-container');
        const counter = document.getElementById('tinder-cards-left');
        if (!container) return;

        container.innerHTML = '';
        counter.innerText = `Осталось вариантов: ${currentCards.length}`;

        if (currentCards.length === 0) {
            showSummary();
            return;
        }

        const item = currentCards[0];
        const card = document.createElement('div');
        card.className = "absolute inset-0 bg-white rounded-3xl shadow-md border border-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300";
        card.innerHTML = `
            <div class="h-3/5 relative">
                <img src="${item.image}" class="w-full h-full object-cover">
                <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent text-white">
                    <h3 class="text-lg font-bold">${item.title}</h3>
                </div>
            </div>
            <div class="p-4 flex-1 flex flex-col justify-between">
                <p class="text-sm text-slate-600 leading-snug">${item.description}</p>
                <div class="flex gap-4 mt-4">
                    <button id="btn-nope" class="flex-1 bg-slate-100 text-slate-400 py-3 rounded-2xl font-bold hover:bg-rose-50 hover:text-rose-500 transition-all">Пропустить</button>
                    <button id="btn-like" class="flex-1 bg-indigo-600 text-white py-3 rounded-2xl font-bold hover:bg-indigo-700 shadow-md transition-all">Хочу!</button>
                </div>
            </div>
        `;
        container.appendChild(card);

        // Вешаем события на кнопки ВНУТРИ карточки
        document.getElementById('btn-nope').onclick = () => nextCard(false);
        document.getElementById('btn-like').onclick = () => nextCard(true, item);
    }

    function nextCard(isLiked, item) {
        if (isLiked) likedItems.push(item);
        currentCards.shift();
        renderCards();
    }

    function showSummary() {
        switchState('summary');
        const list = document.getElementById('tinder-liked-list');
        if (likedItems.length === 0) {
            list.innerHTML = `<div class="p-4 bg-slate-50 rounded-xl text-center text-slate-400">Вы ничего не выбрали, но мы все равно дарим вам бонус!</div>`;
        } else {
            likedItems.forEach(item => {
                list.innerHTML += `
                    <div class="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs font-bold">
                        <img src="${item.image}" class="w-10 h-10 rounded-lg object-cover">
                        <span>${item.title}</span>
                    </div>
                `;
            });
        }
        if (typeof confetti === 'function') {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }
    }

    // 5. ГЛАВНАЯ ИНИЦИАЛИЗАЦИЯ (Ждем DOM)
    function init() {
        const startBtn = document.getElementById('tinder-btn-start');
        const leadBtn = document.getElementById('tinder-btn-lead');

        if (startBtn) {
            startBtn.onclick = () => {
                switchState('swiping');
                renderCards();
            };
        }

        if (leadBtn) {
            leadBtn.onclick = () => {
                switchState('success');
            };
        }

        // Если элементы не найдены, пробуем еще раз через 200мс
        if (!startBtn) setTimeout(init, 200);
    }

    init();
})();
