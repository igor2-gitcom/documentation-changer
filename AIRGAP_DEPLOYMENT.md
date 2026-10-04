# Развёртывание Qwen3 в закрытой сети (Air-Gapped)

Полное руководство по установке и запуску Qwen3 в изолированной сети без доступа к интернету.

## 📋 Содержание

1. [Обзор вариантов](#обзор-вариантов)
2. [Требования к оборудованию](#требования-к-оборудованию)
3. [Подготовка на машине с интернетом](#подготовка-на-машине-с-интернетом)
4. [Перенос в закрытую сеть](#перенос-в-закрытую-сеть)
5. [Развёртывание с Ollama](#развёртывание-с-ollama-рекомендуется)
6. [Развёртывание с vLLM](#развёртывание-с-vllm-для-production)
7. [Настройка приложения](#настройка-приложения)
8. [Мониторинг и обслуживание](#мониторинг-и-обслуживание)

---

## Обзор вариантов

| Инструмент | Сложность | Производительность | GPU | Рекомендация |
|------------|-----------|-------------------|-----|--------------|
| **Ollama** | ⭐ Простой | Средняя | Да/Нет | ✅ Рекомендуется для начала |
| **vLLM** | ⭐⭐⭐ Сложный | Высокая | Обязательно | ✅ Для production с GPU |
| **llama.cpp** | ⭐⭐ Средний | Низкая/Средняя | Опционально | Для CPU или слабой GPU |
| **LM Studio** | ⭐ Очень простой | Средняя | Да/Нет | Для тестирования |

---

## Требования к оборудованию

### Минимальные (Qwen3-4B)
- **CPU**: 8+ ядер
- **RAM**: 16 GB
- **GPU**: Опционально (ускоряет в 5-10 раз)
- **Диск**: 10 GB (модель + Docker)

### Рекомендуемые (Qwen3-14B)
- **CPU**: 16+ ядер
- **RAM**: 32 GB
- **GPU**: NVIDIA с 12+ GB VRAM (RTX 3060/4070 или лучше)
- **Диск**: 30 GB

### Production (Qwen3-32B/235B)
- **CPU**: 32+ ядер
- **RAM**: 64+ GB
- **GPU**: NVIDIA A100/H100 или 2x RTX 4090
- **Диск**: 100+ GB

### Размеры моделей

| Модель | Размер | VRAM (FP16) | VRAM (Q4) | Скорость (GPU) |
|--------|--------|-------------|-----------|----------------|
| Qwen3-0.6B | 1.2 GB | 2 GB | 1 GB | Очень быстро |
| Qwen3-1.7B | 3.4 GB | 4 GB | 2 GB | Быстро |
| Qwen3-4B | 8 GB | 10 GB | 4 GB | Быстро |
| Qwen3-8B | 16 GB | 18 GB | 6 GB | Средняя |
| Qwen3-14B | 28 GB | 30 GB | 10 GB | Средняя |
| Qwen3-32B | 64 GB | 66 GB | 20 GB | Медленно |
| Qwen3-235B | 470 GB | 480 GB | 120 GB | Очень медленно |

---

## Подготовка на машине с интернетом

### Шаг 1: Скачивание Docker образов

```bash
#!/bin/bash
# download-images.sh - Выполнить на машине с интернетом

echo "Скачивание Docker образов..."

# Ollama (рекомендуется)
docker pull ollama/ollama:latest

# vLLM (для production)
docker pull vllm/vllm-openai:latest

# Приложение
docker pull nginx:1.25-alpine
docker pull node:20-alpine

echo "Сохранение образов в архив..."
docker save ollama/ollama:latest > ollama-image.tar
docker save vllm/vllm-openai:latest > vllm-image.tar
docker save nginx:1.25-alpine > nginx-image.tar
docker save node:20-alpine > node-image.tar

echo "✅ Образы сохранены"
```

### Шаг 2: Скачивание модели Qwen3

#### Вариант A: Через Ollama (проще)

```bash
#!/bin/bash
# download-qwen-ollama.sh

# Установите Ollama локально
curl -fsSL https://ollama.com/install.sh | sh

# Скачайте нужную модель
ollama pull qwen3:8b      # 8B параметров (рекомендуется)
# или
ollama pull qwen3:14b     # 14B параметров (лучше качество)
# или
ollama pull qwen3:4b      # 4B параметров (для слабого железа)

# Экспортируйте модель
ollama show qwen3:8b --modelfile > qwen3-modelfile.txt

# Скопируйте директорию моделей
# Linux: ~/.ollama/models
# macOS: ~/.ollama/models
# Windows: C:\Users\username\.ollama\models

tar -czf qwen3-ollama-models.tar.gz ~/.ollama/models
```

#### Вариант B: Через HuggingFace (для vLLM)

```bash
#!/bin/bash
# download-qwen-hf.sh

# Установите huggingface-cli
pip install huggingface-hub

# Скачайте модель (выберите нужную)
huggingface-cli download Qwen/Qwen3-8B --local-dir ./models/Qwen3-8B
# или
huggingface-cli download Qwen/Qwen3-14B --local-dir ./models/Qwen3-14B

# Упакуйте
tar -czf qwen3-hf-models.tar.gz ./models/
```

### Шаг 3: Скачивание исходников приложения

```bash
# Клонируйте репозиторий
git clone <your-repo-url> qwen3-docs-app
cd qwen3-docs-app

# Или просто скопируйте папку проекта
```

---

## Перенос в закрытую сеть

### Что нужно перенести:

```
📁 Переносимые файлы:
├── ollama-image.tar              # Docker образ Ollama
├── vllm-image.tar                # Docker образ vLLM (опционально)
├── nginx-image.tar               # Docker образ nginx
├── node-image.tar                # Docker образ Node.js
├── qwen3-ollama-models.tar.gz    # Модель Qwen3 для Ollama
├── qwen3-hf-models.tar.gz        # Модель Qwen3 для vLLM (опционально)
└── qwen3-docs-app/               # Исходники приложения
```

### Способы переноса:

1. **USB-накопитель** - самый простой способ
2. **Внутренний файловый сервер** - если есть
3. **Записываемые диски** - для очень закрытых сетей

---

## Развёртывание с Ollama (Рекомендуется)

### Шаг 1: Загрузка Docker образов

```bash
#!/bin/bash
# load-images.sh - Выполнить на закрытой машине

echo "Загрузка Docker образов..."

docker load < ollama-image.tar
docker load < nginx-image.tar
docker load < node-image.tar

echo "✅ Образы загружены"
docker images
```

### Шаг 2: Установка Ollama

```bash
# Создайте директорию для Ollama
mkdir -p ~/ollama-data

# Запустите Ollama в Docker
docker run -d \
  --name ollama \
  --gpus all \
  -p 11434:11434 \
  -v ~/ollama-data:/root/.ollama \
  ollama/ollama:latest

# Или без GPU (медленнее)
docker run -d \
  --name ollama \
  -p 11434:11434 \
  -v ~/ollama-data:/root/.ollama \
  ollama/ollama:latest
```

### Шаг 3: Загрузка модели

```bash
# Распакуйте модель
tar -xzf qwen3-ollama-models.tar.gz -C ~/

# Скопируйте в директорию Ollama
cp -r ~/.ollama/models/* ~/ollama-data/models/

# Перезапустите Ollama
docker restart ollama

# Проверьте доступность модели
docker exec ollama ollama list
```

### Шаг 4: Тестирование Ollama

```bash
# Проверьте API
curl http://localhost:11434/api/tags

# Должны увидеть список моделей
# {"models":[{"name":"qwen3:8b",...}]}

# Тестовый запрос
curl http://localhost:11434/api/generate -d '{
  "model": "qwen3:8b",
  "prompt": "Привет!",
  "stream": false
}'
```

### Шаг 5: Запуск приложения

```bash
# Скопируйте приложение
cp -r qwen3-docs-app ~/

# Перейдите в директорию
cd ~/qwen3-docs-app

# Запустите с локальной моделью
docker compose -f docker-compose.local.yml up -d
```

---

## Развёртывание с vLLM (Для Production)

### Шаг 1: Загрузка образов и модели

```bash
# Загрузите Docker образ
docker load < vllm-image.tar

# Распакуйте модель
tar -xzf qwen3-hf-models.tar.gz -C ~/
```

### Шаг 2: Запуск vLLM сервера

```bash
# Для GPU (обязательно)
docker run -d \
  --name vllm \
  --gpus all \
  --shm-size 10.24g \
  -p 8000:8000 \
  -v ~/models/Qwen3-8B:/model \
  vllm/vllm-openai:latest \
  --model /model \
  --served-model-name qwen3 \
  --host 0.0.0.0 \
  --port 8000 \
  --tensor-parallel-size 1 \
  --max-model-len 4096

# Для нескольких GPU
docker run -d \
  --name vllm \
  --gpus all \
  --shm-size 10.24g \
  -p 8000:8000 \
  -v ~/models/Qwen3-14B:/model \
  vllm/vllm-openai:latest \
  --model /model \
  --served-model-name qwen3 \
  --host 0.0.0.0 \
  --port 8000 \
  --tensor-parallel-size 2 \
  --max-model-len 8192
```

### Шаг 3: Тестирование vLLM

```bash
# Проверьте API (OpenAI-совместимый)
curl http://localhost:8000/v1/models

# Тестовый запрос
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3",
    "messages": [{"role": "user", "content": "Привет!"}],
    "temperature": 0.7
  }'
```

---

## Настройка приложения

### Шаг 1: Создание .env файла

```bash
cd ~/qwen3-docs-app

# Создайте .env для локальной модели
cat > .env << 'EOF'
# Локальный Qwen3 (Ollama)
QWEN_API_KEY=ollama
QWEN_BASE_URL=http://ollama:11434/v1
QWEN_MODEL=qwen3:8b

# Или для vLLM
# QWEN_API_KEY=empty
# QWEN_BASE_URL=http://vllm:8000/v1
# QWEN_MODEL=qwen3

CORS_ORIGIN=http://localhost
EOF
```

### Шаг 2: Запуск всех сервисов

```bash
# Для Ollama
docker compose -f docker-compose.local.yml up -d

# Для vLLM
docker compose -f docker-compose.vllm.yml up -d
```

### Шаг 3: Проверка работоспособности

```bash
# Проверьте все сервисы
docker compose ps

# Проверьте backend
curl http://localhost:3001/api/health

# Откройте приложение
# http://localhost
```

---

## Мониторинг и обслуживание

### Логи

```bash
# Все сервисы
docker compose logs -f

# Только Ollama
docker logs ollama -f

# Только backend
docker compose logs -f backend

# Только frontend
docker compose logs -f frontend
```

### Производительность

```bash
# Статистика GPU (NVIDIA)
nvidia-smi

# Использование ресурсов
docker stats

# Проверка Ollama
curl http://localhost:11434/api/ps
```

### Обновление модели

```bash
# На машине с интернетом скачайте новую версию
ollama pull qwen3:8b

# Перенесите в закрытую сеть и обновите
docker cp ~/.ollama/models ollama:/root/.ollama/
docker restart ollama
```

### Резервное копирование

```bash
# Сохраните состояние Ollama
docker exec ollama tar -czf - /root/.ollama > ollama-backup-$(date +%Y%m%d).tar.gz

# Восстановление
docker exec ollama tar -xzf - /root/.ollama < ollama-backup-YYYYMMDD.tar.gz
docker restart ollama
```

---

## Решение проблем

### Ollama не видит модель

```bash
# Проверьте права доступа
ls -la ~/ollama-data/models/

# Перезапустите Ollama
docker restart ollama

# Проверьте логи
docker logs ollama
```

### vLLM не запускается

```bash
# Проверьте наличие GPU
nvidia-smi

# Проверьте логи
docker logs vllm

# Увеличьте shared memory
docker run --shm-size 10.24g ...
```

### Медленная работа

1. **Используйте GPU** - ускоряет в 5-10 раз
2. **Выберите меньшую модель** - Qwen3-4B вместо 14B
3. **Уменьшите max-model-len** - меньше памяти = быстрее
4. **Используйте квантование** - Q4 вместо FP16

### Ошибки памяти

```bash
# Для Ollama - используйте меньшую модель
ollama pull qwen3:4b

# Для vLLM - уменьшите параметры
--max-model-len 2048
--gpu-memory-utilization 0.8
```

---

## Безопасность в закрытой сети

### Рекомендации:

1. **Изоляция сети** - LLM сервер только в внутренней сети
2. **Firewall** - закройте порты 11434 и 8000 от внешнего доступа
3. **Мониторинг** - логируйте все запросы к LLM
4. **Обновления** - регулярно обновляйте модели и Docker образы
5. **Бэкапы** - делайте резервные копии конфигурации

### Пример firewall правил:

```bash
# Разрешите доступ к LLM только с frontend
sudo ufw allow from 172.18.0.0/16 to any port 11434
sudo ufw allow from 172.18.0.0/16 to any port 8000

# Запретите внешний доступ
sudo ufw deny 11434
sudo ufw deny 8000
```

---

## Дополнительные ресурсы

- [Ollama Documentation](https://ollama.com/docs)
- [vLLM Documentation](https://docs.vllm.ai/)
- [Qwen3 Model Card](https://huggingface.co/Qwen/Qwen3-8B)
- [Docker GPU Support](https://docs.docker.com/config/containers/resource_constraints/#gpu)

---

## Поддержка

Если возникли проблемы:
1. Проверьте логи: `docker compose logs`
2. Убедитесь, что модель загружена: `docker exec ollama ollama list`
3. Проверьте доступность API: `curl http://localhost:11434/api/tags`
4. Обратитесь к разделу "Решение проблем" выше
