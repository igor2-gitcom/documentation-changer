# Корректировка документов с Qwen3

Веб-приложение для автоматической корректировки документов на основе замечаний из Excel-таблицы с использованием AI-модели Qwen3.

## 🚀 Возможности

- **Загрузка документов**: Поддержка .docx файлов и Excel-таблиц с замечаниями
- **AI-анализ**: Qwen3 анализирует замечания и предлагает действия
- **Интерактивный выбор**: Пользователь выбирает нужные корректировки
- **Генерация документа**: Экспорт скорректированного документа в .docx
- **Confluence интеграция**: Поддержка ссылок на документы в Confluence

## 📋 Требования

- Docker & Docker Compose
- API ключ Qwen3 (DashScope) — опционально, работает и в демо-режиме

## 🏗️ Архитектура

```
┌─────────────────────────────────────────────────────┐
│                  Docker Compose                      │
│                                                      │
│  ┌──────────────┐         ┌──────────────────────┐  │
│  │   Frontend   │  /api/* │      Backend         │  │
│  │  (nginx:80)  │ ──────▶ │  (node:3001)         │  │
│  │  React+Vite  │         │  Express API Proxy   │  │
│  └──────────────┘         └──────────┬───────────┘  │
│                                       │              │
│                                       ▼              │
│                           ┌──────────────────────┐  │
│                           │    Qwen3 API          │  │
│                           │  (DashScope/Cloud)    │  │
│                           └──────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## 📦 Быстрый старт

### 1. Клонирование и настройка

```bash
# Клонируйте репозиторий
git clone <your-repo-url>
cd qwen3-doc-correction

# Скопируйте файл окружения
cp .env.example .env

# Отредактируйте .env — укажите API ключ Qwen3
nano .env
```

### 2. Запуск в Docker Compose

```bash
# Сборка и запуск всех сервисов
docker compose up -d --build

# Проверка статуса
docker compose ps

# Просмотр логов
docker compose logs -f
```

### 3. Открыть приложение

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3001/api/health
- **Health Check**: http://localhost/health

## 🔧 Конфигурация

### Переменные окружения (.env)

| Переменная | Описание | По умолчанию |
|-----------|----------|--------------|
| `QWEN_API_KEY` | API ключ DashScope | (пусто — демо-режим) |
| `QWEN_BASE_URL` | URL API Qwen3 | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| `QWEN_MODEL` | Модель Qwen3 | `qwen3` |
| `CORS_ORIGIN` | Разрешённый домен | `http://localhost` |

### Доступные модели Qwen3

- `qwen3` — последняя версия (рекомендуется)
- `qwen3-235b-a22b` — самая мощная (MoE)
- `qwen3-32b` — большой размер
- `qwen3-14b` — средний размер
- `qwen3-8b` — компактная
- `qwen3-4b` — лёгкая
- `qwen3-1.7b` — очень лёгкая
- `qwen3-0.6b` — минимальная

## 🛠️ Команды Docker

```bash
# Запуск
docker compose up -d

# Остановка
docker compose down

# Пересборка после изменений
docker compose up -d --build

# Только пересборка frontend
docker compose up -d --build frontend

# Только пересборка backend
docker compose up -d --build backend

# Логи
docker compose logs -f frontend
docker compose logs -f backend

# Выполнить команду в контейнере
docker compose exec frontend sh
docker compose exec backend sh

# Очистка (удалить volumes)
docker compose down -v
```

## 🧪 Режим разработки

```bash
# Запуск в dev-режиме с hot-reload
docker compose -f docker-compose.dev.yml up -d

# Frontend будет доступен на http://localhost:5173
# Backend на http://localhost:3001
```

## 🌐 Production с SSL

Для production-развёртывания с HTTPS:

1. Раскомментируйте секцию `nginx-proxy` в `docker-compose.yml`
2. Поместите SSL-сертификаты в папку `./ssl/`
3. Настройте `nginx-proxy.conf`

## 📁 Структура проекта

```
.
├── src/                    # Frontend исходники (React + Vite)
│   ├── components/         # React компоненты
│   ├── utils/              # Утилиты (Qwen API, файлы)
│   ├── App.tsx             # Главный компонент
│   └── types.ts            # TypeScript типы
├── backend/                # Backend API proxy
│   ├── server.js           # Express сервер
│   ├── package.json        # Backend зависимости
│   └── Dockerfile          # Backend образ
├── public/                 # Статические файлы
├── Dockerfile              # Frontend образ (multi-stage)
├── docker-compose.yml      # Production конфигурация
├── docker-compose.dev.yml  # Development конфигурация
├── nginx.conf              # Nginx конфигурация
├── .env.example            # Пример переменных окружения
└── README.md               # Документация
```

## 🔐 Безопасность

- API ключ Qwen3 хранится только на backend (не передаётся на клиент)
- Backend ограничивает запросы (rate limiting: 100 запросов / 15 минут)
- HTTP security headers (Helmet)
- CORS настроен только для разрешённых доменов

## 🐛 Troubleshooting

### Backend не подключается к Qwen3 API
```bash
# Проверьте настройки
docker compose logs backend

# Проверьте health
curl http://localhost:3001/api/health
```

### Frontend не загружается
```bash
# Проверьте nginx
docker compose logs frontend

# Проверьте health
curl http://localhost/health
```

### Пересборка после изменений кода
```bash
# Frontend
docker compose up -d --build frontend

# Backend
docker compose up -d --build backend
```

## 🔒 Развёртывание в закрытой сети (Air-Gapped)

Для организаций без доступа к интернету доступно развёртывание с локальной моделью Qwen3.

### Быстрый старт для закрытой сети:

**На машине с интернетом:**
```bash
# Подготовьте всё для переноса
bash scripts/prepare-airgap.sh
```

**На закрытой машине:**
```bash
# Разверните после переноса файлов
bash scripts/deploy-airgap.sh
```

### Подробная документация:
Смотрите [AIRGAP_DEPLOYMENT.md](./AIRGAP_DEPLOYMENT.md) для полной инструкции.

### Варианты локального развёртывания:

| Вариант | Команда | Требования |
|---------|---------|------------|
| **Ollama** (проще) | `docker compose -f docker-compose.local.yml up -d` | 16+ GB RAM, GPU опционально |
| **vLLM** (production) | `docker compose -f docker-compose.vllm.yml up -d` | 32+ GB RAM, NVIDIA GPU обязательно |

### Проверка работоспособности:
```bash
bash scripts/check-local.sh
```

---

## 📄 Лицензия

MIT
