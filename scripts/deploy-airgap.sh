#!/bin/bash
# ============================================
# Развёртывание в закрытой сети (Air-Gapped)
# ============================================
# Выполните этот скрипт на машине БЕЗ интернета
# после переноса файлов с prepare-airgap.sh

set -e

echo "============================================"
echo "  Развёртывание в закрытой сети"
echo "  Qwen3 Document Correction"
echo "============================================"
echo ""

# Проверка Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен!"
    echo ""
    echo "Установите Docker:"
    echo "  1. Скачайте установщик на машине с интернетом"
    echo "  2. Перенесите в закрытую сеть"
    echo "  3. Установите: sudo dpkg -i docker-ce_*.deb"
    echo ""
    exit 1
fi

echo "✅ Docker найден: $(docker --version)"
echo ""

# Проверка Docker Compose
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose не установлен!"
    exit 1
fi

echo "✅ Docker Compose найден"
echo ""

# ------------------------------------------
# 1. Загрузка Docker образов
# ------------------------------------------
echo "🐳 Шаг 1: Загрузка Docker образов..."

# Ищем архивы в текущей или родительской директории
PARENT_DIR="$(dirname "$PWD")"

if [ -f "ollama-image.tar.gz" ]; then
    echo "  → Загрузка Ollama..."
    gunzip -c ollama-image.tar.gz | docker load
elif [ -f "$PARENT_DIR/ollama-image.tar.gz" ]; then
    echo "  → Загрузка Ollama..."
    gunzip -c "$PARENT_DIR/ollama-image.tar.gz" | docker load
else
    echo "⚠️  Ollama образ не найден"
fi

if [ -f "vllm-image.tar.gz" ]; then
    echo "  → Загрузка vLLM..."
    gunzip -c vllm-image.tar.gz | docker load
elif [ -f "$PARENT_DIR/vllm-image.tar.gz" ]; then
    echo "  → Загрузка vLLM..."
    gunzip -c "$PARENT_DIR/vllm-image.tar.gz" | docker load
fi

if [ -f "nginx-image.tar.gz" ]; then
    echo "  → Загрузка Nginx..."
    gunzip -c nginx-image.tar.gz | docker load
elif [ -f "$PARENT_DIR/nginx-image.tar.gz" ]; then
    echo "  → Загрузка Nginx..."
    gunzip -c "$PARENT_DIR/nginx-image.tar.gz" | docker load
fi

if [ -f "node-image.tar.gz" ]; then
    echo "  → Загрузка Node.js..."
    gunzip -c node-image.tar.gz | docker load
elif [ -f "$PARENT_DIR/node-image.tar.gz" ]; then
    echo "  → Загрузка Node.js..."
    gunzip -c "$PARENT_DIR/node-image.tar.gz" | docker load
fi

echo "✅ Docker образы загружены"
echo ""

# ------------------------------------------
# 2. Загрузка модели Qwen3
# ------------------------------------------
echo "🤖 Шаг 2: Загрузка модели Qwen3..."

# Проверяем наличие GPU
HAS_GPU=false
if command -v nvidia-smi &> /dev/null; then
    if nvidia-smi &> /dev/null; then
        HAS_GPU=true
        echo "✅ GPU обнаружена:"
        nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
        echo ""
    fi
fi

# Проверка наличия Docker GPU support
if [ "$HAS_GPU" = true ]; then
    if ! docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi &> /dev/null; then
        echo "⚠️  Docker не может использовать GPU"
        echo "   Установите NVIDIA Container Toolkit:"
        echo "   https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html"
        HAS_GPU=false
    fi
fi

# Загрузка модели для Ollama
if [ -f "qwen3-ollama-models.tar.gz" ]; then
    echo "  → Распаковка модели Ollama..."
    mkdir -p ~/ollama-data
    
    # Запускаем Ollama временно для распаковки
    docker run -d --name ollama-temp -v ~/ollama-data:/root/.ollama ollama/ollama:latest
    tar -xzf qwen3-ollama-models.tar.gz -C ~/ollama-data/
    docker stop ollama-temp
    docker rm ollama-temp
    
    echo "✅ Модель Ollama загружена"
    
    # Определяем модель
    MODEL_NAME=$(ls ~/ollama-data/models/manifests/registry.ollama.ai/library/ 2>/dev/null | head -1)
    if [ -z "$MODEL_NAME" ]; then
        MODEL_NAME="qwen3:8b"
    fi
    
elif [ -f "qwen3-hf-models.tar.gz" ]; then
    echo "  → Распаковка модели HuggingFace..."
    tar -xzf qwen3-hf-models.tar.gz
    
    # Определяем модель
    MODEL_NAME=$(ls models/ | head -1)
    if [ -z "$MODEL_NAME" ]; then
        MODEL_NAME="Qwen3-8B"
    fi
    
    echo "✅ Модель HuggingFace загружена"
    
elif [ -f "$PARENT_DIR/qwen3-ollama-models.tar.gz" ]; then
    echo "  → Распаковка модели Ollama..."
    mkdir -p ~/ollama-data
    docker run -d --name ollama-temp -v ~/ollama-data:/root/.ollama ollama/ollama:latest
    tar -xzf "$PARENT_DIR/qwen3-ollama-models.tar.gz" -C ~/ollama-data/
    docker stop ollama-temp
    docker rm ollama-temp
    
    MODEL_NAME=$(ls ~/ollama-data/models/manifests/registry.ollama.ai/library/ 2>/dev/null | head -1)
    if [ -z "$MODEL_NAME" ]; then
        MODEL_NAME="qwen3:8b"
    fi
    
    echo "✅ Модель Ollama загружена"
    
elif [ -f "$PARENT_DIR/qwen3-hf-models.tar.gz" ]; then
    echo "  → Распаковка модели HuggingFace..."
    tar -xzf "$PARENT_DIR/qwen3-hf-models.tar.gz"
    
    MODEL_NAME=$(ls models/ | head -1)
    if [ -z "$MODEL_NAME" ]; then
        MODEL_NAME="Qwen3-8B"
    fi
    
    echo "✅ Модель HuggingFace загружена"
    
else
    echo "⚠️  Модель Qwen3 не найдена!"
    echo "   Убедитесь, что перенесли архив с моделью"
    exit 1
fi

echo ""

# ------------------------------------------
# 3. Настройка .env
# ------------------------------------------
echo "⚙️  Шаг 3: Настройка окружения..."

if [ ! -f .env ]; then
    cat > .env << EOF
# Локальная модель Qwen3
QWEN_MODEL=$MODEL_NAME
CORS_ORIGIN=http://localhost

# Для vLLM (если используется)
# MAX_MODEL_LEN=4096
# GPU_MEM_UTIL=0.9
# TP_SIZE=1
EOF
    echo "✅ Файл .env создан"
else
    echo "✅ Файл .env уже существует"
fi

echo ""

# ------------------------------------------
# 4. Выбор и запуск
# ------------------------------------------
echo "🚀 Шаг 4: Запуск приложения..."
echo ""

if [ -f "qwen3-ollama-models.tar.gz" ] || [ -f "$PARENT_DIR/qwen3-ollama-models.tar.gz" ]; then
    echo "Обнаружена модель для Ollama"
    COMPOSE_FILE="docker-compose.local.yml"
elif [ -f "qwen3-hf-models.tar.gz" ] || [ -f "$PARENT_DIR/qwen3-hf-models.tar.gz" ]; then
    echo "Обнаружена модель для vLLM"
    COMPOSE_FILE="docker-compose.vllm.yml"
else
    echo "Не удалось определить тип модели"
    exit 1
fi

echo ""
echo "Будет использован: $COMPOSE_FILE"
echo ""

# Сборка и запуск
echo "Сборка образов приложения..."
docker compose -f "$COMPOSE_FILE" build

echo ""
echo "Запуск сервисов..."
docker compose -f "$COMPOSE_FILE" up -d

echo ""
echo "Ожидание запуска..."
sleep 10

# ------------------------------------------
# 5. Проверка
# ------------------------------------------
echo "============================================"
echo "  ✅ РАЗВЁРТЫВАНИЕ ЗАВЕРШЕНО!"
echo "============================================"
echo ""

# Проверка статуса
echo "📊 Статус сервисов:"
docker compose -f "$COMPOSE_FILE" ps

echo ""
echo "🔍 Проверка доступности:"

# Проверяем backend
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "  ✅ Backend: http://localhost:3001/api/health"
    curl -s http://localhost:3001/api/health | jq . 2>/dev/null || curl -s http://localhost:3001/api/health
else
    echo "  ❌ Backend: недоступен"
fi

echo ""

# Проверяем frontend
if curl -s http://localhost/health > /dev/null 2>&1; then
    echo "  ✅ Frontend: http://localhost"
else
    echo "  ❌ Frontend: недоступен"
fi

echo ""
echo "============================================"
echo "  🎉 ПРИЛОЖЕНИЕ ГОТОВО К РАБОТЕ!"
echo "============================================"
echo ""
echo "🌐 Откройте в браузере: http://localhost"
echo ""
echo "📝 Полезные команды:"
echo "  Логи:       docker compose -f $COMPOSE_FILE logs -f"
echo "  Статус:     docker compose -f $COMPOSE_FILE ps"
echo "  Остановка:  docker compose -f $COMPOSE_FILE down"
echo "  Перезапуск: docker compose -f $COMPOSE_FILE restart"
echo ""

if [ "$HAS_GPU" = true ]; then
    echo "🎮 GPU мониторинг:"
    echo "  nvidia-smi"
    echo ""
fi

echo "💡 Если возникли проблемы, смотрите AIRGAP_DEPLOYMENT.md"
echo ""
