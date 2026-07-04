# Короткая вставка виджетов

Базовый формат для одного виджета:

```html
<script src="https://widgets0.github.io/widgets0/widget-loader.js" data-widget="wheel-fortune" data-source="client-name" async></script>
```

Формат для нескольких виджетов одной строкой:

```html
<script src="https://widgets0.github.io/widgets0/widget-loader.js" data-widgets="wheel-fortune,tinder-product,timer-form" data-source="client-name" async></script>
```

Если нужен секрет вебхука:

```html
<script src="https://widgets0.github.io/widgets0/widget-loader.js" data-widget="wheel-fortune" data-source="client-name" data-webhook-secret="WEBHOOK_SECRET" async></script>
```

## Общие настройки

- `data-widget` — один виджет.
- `data-widgets` — несколько виджетов через запятую.
- `data-source` — название клиента или сайта, придет в Telegram.
- `data-webhook-url` — адрес вебхука, по умолчанию `https://widgets0-production.up.railway.app`.
- `data-webhook-secret` — секрет для Railway, если включен.
- `data-delay` — задержка показа в секундах.
- `data-frequency` — частота показа: `always`, `once_per_hour`, `once_per_day`, `once_per_week`.
- `data-position` — позиция для поддерживаемых popup-виджетов: `center`, `bottom-left`, `bottom-right`.
- `data-version` — версия для сброса кэша после правок.

## ID виджетов

- `wheel-fortune` — Колесо фортуны
- `tinder-product` — Товарный Тиндер
- `cleaning-calculator` — Калькулятор стоимости
- `quiz` — Квиз
- `timer-form` — Форма с таймером
- `sale-banner` — Акционная полоса
- `mobile-sale-card` — Мобильная акция
- `manicure-game` — Игра-ловушка
- `purchase-counter` — Счетчик посетителей
- `bike-bonus-runner` — Велоигра за бонусы
- `gif-contact` — Форма с гифкой
- `organic-lead-form` — Арт-форма с бонусом
- `yandex-rating` — Рейтинг на Яндекс Картах
- `digital-business-card` — Электронная визитка
- `pic-form-glasses` — Форма с картинкой
