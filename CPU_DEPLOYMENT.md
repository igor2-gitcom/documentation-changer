# Запуск Qwen3 БЕЗ GPU (только CPU)

Полное руководство по запуску Qwen3 на обычном компьютере без видеокарты.

## 📋 Содержание

1. [Быстрый старт](#быстрый-старт)
2. [Требования к оборудованию](#требования-к-оборудованию)
3. [Выбор модели для CPU](#выбор-модели-для-cpu)
4. [Настройка и запуск](#настройка-и-запуск)
5. [Оптимизация производительности](#оптимизация-производительности)
6. [Ожидаемая скорость](#ожидаемая-скорость)
7. [Решение проблем](#решение-проблем)

---

## Быстрый старт

### 1. Запуск одной командой:

```bash
# Запуск без GPU (CPU mode)
docker compose -f docker-compose.cpu.yml up -d

# Проверка статуса
docker compose -f docker-compose.cpu.yml ps

# Открыть приложение
# http://localhost
```

### 2. Загрузка модели:

```bash
# Загрузите модель для CPU (квантованную)
docker exec -it qwen3-ollama-cpu ollama pull qwen3:4b

# Или более легкую версию
docker exec -it qwen3-ollama-cpu ollama pull qwen3:1.7b

# Проверьте список моделей
docker exec -it qwen3-ollama-cpu ollama list
```

### 3. Тестирование:

```bash
# Проверьте работоспособность
curl http://localhost:11434/api/tags

# Тестовый запрос
curl http://localhost:11434/api/generate -d '{
  "model": "qwen3:4b",
  "prompt": "Привет!",
  "stream": false
}'
```

---

## Требования к оборудованию

### Минимальные (Qwen3-0.6B)
- **CPU**: 4+ ядра
- **RAM**: 8 GB
- **Диск**: 5 GB
- **Скорость**: ~2-5 токенов/сек

### Рекомендуемые (Qwen3-1.7B)
- **CPU**: 8+ ядер
- **RAM**: 16 GB
- **Диск**: 10 GB
- **Скорость**: ~3-8 токенов/сек

### Оптимальные (Qwen3-4B)
- **CPU**: 8-16 ядер
- **RAM**: 16-32 GB
- **Диск**: 15 GB
- **Скорость**: ~1-3 токена/сек

### Максимальные (Qwen3-8B)
- **CPU**: 16+ ядер
- **RAM**: 32+ GB
- **Диск**: 25 GB
- **Скорость**: ~0.5-1.5 токена/сек

---

## Выбор модели для CPU

### Рекомендуемые модели (отсортированы по приоритету)

| Модель | Размер | RAM | Скорость | Качество | Рекомендация |
|--------|--------|-----|----------|----------|--------------|
| **qwen3:0.6b** | 1.2 GB | 4 GB | ⭐⭐⭐⭐⭐ | ⭐⭐ | Для тестирования |
| **qwen3:1.7b** | 3.4 GB | 8 GB | ⭐⭐⭐⭐ | ⭐⭐⭐ | **Рекомендуется для CPU** |
| **qwen3:4b** | 8 GB | 16 GB | ⭐⭐⭐ | ⭐⭐⭐⭐ | Хороший баланс |
| **qwen3:8b** | 16 GB | 32 GB | ⭐⭐ | ⭐⭐⭐⭐⭐ | Медленно, но качественно |

### Квантованные версии (еще быстрее)

Ollama автоматически использует квантованные версии:

```bash
# Q4 квантование (4-bit) - быстрее, меньше RAM
ollama pull qwen3:4b      # по умолчанию Q4

# Q8 квантование (8-bit) - лучше качество, больше RAM
# (если доступно)
```

### Как выбрать модель?

**Для тестирования:**
```bash
# Самая быстрая
docker exec -it qwen3-ollama-cpu ollama pull qwen3:0.6b
```

**Для повседневной работы:**
```bash
# Оптимальный выбор
docker exec -it qwen3-ollama-cpu ollama pull qwen3:1.7b
```

**Для качественного анализа:**
```bash
# Хорошее качество
docker exec -it qwen3-ollama-cpu ollama pull qwen3:4b
```

---

## Настройка и запуск

### Шаг 1: Подготовка .env

```bash
# Создайте .env файл для CPU режима
cat > .env << 'EOF'
# Модель для CPU (выберите подходящую)
QWEN_MODEL=qwen3:1.7b

# CORS
CORS_ORIGIN=http://localhost
EOF
```

### Шаг 2: Запуск

```bash
# Запустите без GPU
docker compose -f docker-compose.cpu.yml up -d

# Дождитесь загрузки модели (первый запуск может занять время)
docker logs -f qwen3-ollama-cpu
```

### Шаг 3: Загрузка модели

```bash
# Загрузите модель (выберите одну)
docker exec -it qwen3-ollama-cpu ollama pull qwen3:1.7b

# Или
docker exec -it qwen3-ollama-cpu ollama pull qwen3:4b

# Проверьте
docker exec -it qwen3-ollama-cpu ollama list
```

### Шаг 4: Проверка

```bash
# Проверьте API
curl http://localhost:11434/api/tags

# Откройте приложение
# http://localhost
```

---

## Оптимизация производительности

### 1. Увеличьте swap (если мало RAM)

**Linux:**
```bash
# Создайте swap файл 8GB
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Добавьте в /etc/fstab для постоянного использования
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Windows:**
- Увеличьте размер файла подкачки через Системные свойства

**macOS:**
- macOS автоматически управляет swap

### 2. Оптимизация Ollama

Отредактируйте `docker-compose.cpu.yml`:

```yaml
environment:
  # Количество параллельных запросов (уменьшите для экономии RAM)
  - OLLAMA_NUM_PARALLEL=1
  
  # Максимум загруженных моделей
  - OLLAMA_MAX_LOADED_MODELS=1
  
  # Размер контекста (меньше = быстрее)
  - OLLAMA_CONTEXT_LENGTH=2048
```

### 3. Используйте меньшую модель

Если 4B слишком медленная:

```bash
# Переключитесь на 1.7B
docker exec -it qwen3-ollama-cpu ollama pull qwen3:1.7b

# Обновите .env
echo "QWEN_MODEL=qwen3:1.7b" > .env

# Перезапустите backend
docker compose -f docker-compose.cpu.yml restart backend
```

### 4. Ограничьте ресурсы Docker

```yaml
deploy:
  resources:
    limits:
      cpus: '4'        # Ограничьте до 4 ядер
      memory: 8G       # Ограничьте RAM
```

---

## Ожидаемая скорость

### Примерная производительность (токенов в секунду)

| CPU | RAM | Модель | Скорость | Время ответа (500 токенов) |
|-----|-----|--------|----------|---------------------------|
| i5-8250U (4 ядра) | 8 GB | qwen3:0.6b | ~5-8 tok/s | ~1 мин |
| i5-8250U (4 ядра) | 16 GB | qwen3:1.7b | ~3-5 tok/s | ~2 мин |
| i7-9700 (8 ядер) | 16 GB | qwen3:1.7b | ~5-8 tok/s | ~1 мин |
| i7-9700 (8 ядер) | 32 GB | qwen3:4b | ~2-3 tok/s | ~3 мин |
| Ryzen 7 5800X (8 ядер) | 32 GB | qwen3:4b | ~3-4 tok/s | ~2 мин |
| Ryzen 9 5900X (12 ядер) | 64 GB | qwen3:8b | ~1-2 tok/s | ~5 мин |

### Что влияет на скорость?

1. **Количество ядер CPU** - больше ядер = быстрее
2. **Частота CPU** - выше частота = быстрее
3. **Объем RAM** - больше RAM = меньше swap = быстрее
4. **Размер модели** - меньше модель = быстрее
5. **Длина контекста** - короче контекст = быстрее

---

## Решение проблем

### Проблема: Очень медленно

**Решение 1: Используйте меньшую модель**
```bash
docker exec -it qwen3-ollama-cpu ollama pull qwen3:1.7b
# Обновите .env: QWEN_MODEL=qwen3:1.7b
docker compose -f docker-compose.cpu.yml restart backend
```

**Решение 2: Уменьшите контекст**
```yaml
# В docker-compose.cpu.yml
environment:
  - OLLAMA_CONTEXT_LENGTH=1024  # вместо 4096
```

**Решение 3: Добавьте swap**
```bash
# Linux
sudo fallocate -l 8G /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Проблема: Out of Memory

**Решение 1: Используйте меньшую модель**
```bash
docker exec -it qwen3-ollama-cpu ollama pull qwen3:0.6b
```

**Решение 2: Увеличьте лимит памяти**
```yaml
# В docker-compose.cpu.yml
deploy:
  resources:
    limits:
      memory: 16G  # увеличьте
```

**Решение 3: Добавьте swap**
```bash
sudo fallocate -l 16G /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Проблема: Модель не загружается

**Решение:**
```bash
# Проверьте свободное место
df -h

# Проверьте RAM
free -h

# Перезапустите Ollama
docker restart qwen3-ollama-cpu

# Попробуйте загрузить снова
docker exec -it qwen3-ollama-cpu ollama pull qwen3:1.7b
```

### Проблема: Docker использует GPU

**Решение:**
```bash
# Убедитесь, что в docker-compose.cpu.yml НЕТ секции GPU
# Запустите именно cpu версию
docker compose -f docker-compose.cpu.yml up -d
```

---

## Мониторинг

### Проверка использования ресурсов

```bash
# Docker статистика
docker stats

# CPU и RAM
top

# Swap
swapon --show
```

### Логи Ollama

```bash
docker logs -f qwen3-ollama-cpu
```

### Проверка производительности

```bash
# Тест скорости
time curl http://localhost:11434/api/generate -d '{
  "model": "qwen3:1.7b",
  "prompt": "Расскажи о квантовой физике в 100 словах",
  "stream": false
}'
```

---

## Советы по использованию

### ✅ Что работает хорошо на CPU:

- Короткие тексты (до 1000 токенов)
- Простые задачи (исправление опечаток, форматирование)
- Анализ небольших документов
- Генерация коротких ответов

### ⚠️ Что работает медленно на CPU:

- Длинные документы (более 5000 токенов)
- Сложные задачи (реструктуризация, глубокий анализ)
- Множественные запросы подряд

### 💡 Рекомендации:

1. **Используйте qwen3:1.7b** - оптимальный баланс для CPU
2. **Обрабатывайте документы по частям** - не загружайте всё сразу
3. **Делайте перерывы** - давайте CPU остыть
4. **Закройте другие приложения** - освободите RAM
5. **Используйте swap** - если мало RAM

---

## Альтернативы для CPU

### 1. llama.cpp (еще быстрее на CPU)

```bash
# Установите llama.cpp
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make

# Запустите сервер
./server -m models/qwen3-1.7b-q4_k_m.gguf --port 8080
```

### 2. LM Studio (графический интерфейс)

1. Скачайте LM Studio
2. Загрузите Qwen3 модель
3. Запустите локальный сервер

### 3. Ollama + меньшая модель

```bash
# Используйте самую маленькую модель
ollama pull qwen3:0.6b
```

---

## Сравнение: CPU vs GPU

| Параметр | CPU (8 ядер) | GPU (RTX 3060) | Разница |
|----------|--------------|----------------|---------|
| Скорость (qwen3:4b) | ~2 tok/s | ~20 tok/s | **10x медленнее** |
| Время ответа (500 токенов) | ~4 мин | ~25 сек | **10x дольше** |
| RAM/VRAM | 16 GB | 6 GB | - |
| Стоимость | $0 (есть у всех) | $300+ | - |
| Энергопотребление | 65W | 170W | **2.6x меньше** |

**Вывод:** CPU работает в 10 раз медленнее GPU, но подходит для:
- Тестирования и разработки
- Небольших задач
- Когда нет GPU
- Экономии энергии

---

## Дополнительные ресурсы

- [Ollama CPU Performance](https://ollama.com/blog/cpu-performance)
- [llama.cpp Optimization](https://github.com/ggerganov/llama.cpp#performance)
- [Qwen3 Models](https://huggingface.co/Qwen)

---

## Поддержка

Если возникли проблемы:
1. Проверьте RAM: `free -h`
2. Проверьте CPU: `top`
3. Проверьте логи: `docker logs qwen3-ollama-cpu`
4. Попробуйте меньшую модель
5. Добавьте swap

**Помните:** Работа на CPU возможна, но медленнее. Для production лучше использовать GPU.
