#!/bin/bash
# ============================================
# Подготовка к переносу в закрытую сеть
# ============================================
# Выполните этот скрипт на машине С интернетом
# для скачивания всех необходимых компонентов

set -e

echo "============================================"
echo "  Подготовка к переносу в закрытую сеть"
echo "  Qwen3 Document Correction"
echo "============================================"
echo ""

# Создаём директорию для переноса
TRANSFER_DIR="airgap-transfer-$(date +%Y%m%d)"
mkdir -p "$TRANSFER_DIR"
cd "$TRANSFER_DIR"

echo "📁 Директория для переноса: $(pwd)"
echo ""

# ------------------------------------------
# 1. Скачивание Docker образов
# ------------------------------------------
echo "🐳 Шаг 1: Скачивание Docker образов..."

# Ollama
echo "  → Ollama..."
docker pull ollama/ollama:latest
docker save ollama/ollama:latest | gzip > ollama-image.tar.gz

# vLLM (опционально, для production)
read -p "Скачать vLLM для production? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "  → vLLM..."
    docker pull vllm/vllm-openai:latest
    docker save vllm/vllm-openai:latest | gzip > vllm-image.tar.gz
fi

# Nginx и Node.js
echo "  → Nginx..."
docker pull nginx:1.25-alpine
docker save nginx:1.25-alpine | gzip > nginx-image.tar.gz

echo "  → Node.js..."
docker pull node:20-alpine
docker save node:20-alpine | gzip > node-image.tar.gz

echo "✅ Docker образы сохранены"
echo ""

# ------------------------------------------
# 2. Скачивание модели Qwen3
# ------------------------------------------
echo "🤖 Шаг 2: Скачивание модели Qwen3..."
echo ""
echo "Выберите способ загрузки:"
echo "  1) Ollama (проще, рекомендуется)"
echo "  2) HuggingFace (для vLLM, production)"
echo ""
read -p "Ваш выбор (1/2): " MODEL_METHOD

case $MODEL_METHOD in
    1)
        echo "Загрузка через Ollama..."
        
        # Проверяем наличие Ollama
        if ! command -v ollama &> /dev/null; then
            echo "Установка Ollama..."
            curl -fsSL https://ollama.com/install.sh | sh
        fi
        
        # Выбор модели
        echo ""
        echo "Выберите модель:"
        echo "  1) qwen3:0.6b  (1.2 GB, очень быстро)"
        echo "  2) qwen3:1.7b  (3.4 GB, быстро)"
        echo "  3) qwen3:4b    (8 GB, рекомендуется)"
        echo "  4) qwen3:8b    (16 GB, хорошее качество)"
        echo "  5) qwen3:14b   (28 GB, отличное качество)"
        echo ""
        read -p "Ваш выбор (1-5): " MODEL_CHOICE
        
        case $MODEL_CHOICE in
            1) MODEL="qwen3:0.6b" ;;
            2) MODEL="qwen3:1.7b" ;;
            3) MODEL="qwen3:4b" ;;
            4) MODEL="qwen3:8b" ;;
            5) MODEL="qwen3:14b" ;;
            *) MODEL="qwen3:8b" ;;
        esac
        
        echo "Скачивание $MODEL..."
        ollama pull "$MODEL"
        
        # Копируем модели
        echo "Упаковка моделей..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            tar -czf qwen3-ollama-models.tar.gz -C "$HOME/.ollama" models
        else
            # Linux
            tar -czf qwen3-ollama-models.tar.gz -C "$HOME/.ollama" models
        fi
        
        echo "✅ Модель $MODEL сохранена"
        ;;
        
    2)
        echo "Загрузка через HuggingFace..."
        
        # Проверяем наличие huggingface-cli
        if ! command -v huggingface-cli &> /dev/null; then
            echo "Установка huggingface-hub..."
            pip install huggingface-hub
        fi
        
        # Выбор модели
        echo ""
        echo "Выберите модель:"
        echo "  1) Qwen/Qwen3-4B   (8 GB)"
        echo "  2) Qwen/Qwen3-8B   (16 GB, рекомендуется)"
        echo "  3) Qwen/Qwen3-14B  (28 GB)"
        echo ""
        read -p "Ваш выбор (1-3): " HF_MODEL_CHOICE
        
        case $HF_MODEL_CHOICE in
            1) HF_MODEL="Qwen/Qwen3-4B" ;;
            2) HF_MODEL="Qwen/Qwen3-8B" ;;
            3) HF_MODEL="Qwen/Qwen3-14B" ;;
            *) HF_MODEL="Qwen/Qwen3-8B" ;;
        esac
        
        echo "Скачивание $HF_MODEL..."
        mkdir -p models
        huggingface-cli download "$HF_MODEL" --local-dir "./models/$(basename $HF_MODEL)"
        
        # Упаковка
        echo "Упаковка моделей..."
        tar -czf qwen3-hf-models.tar.gz ./models/
        
        echo "✅ Модель $HF_MODEL сохранена"
        ;;
        
    *)
        echo "Неверный выбор, пропускаем загрузку модели"
        ;;
esac

echo ""

# ------------------------------------------
# 3. Копирование исходников приложения
# ------------------------------------------
echo "📦 Шаг 3: Копирование исходников приложения..."

# Переходим в родительскую директорию
cd ..

# Копируем приложение (исключая node_modules и build)
rsync -av --exclude='node_modules' --exclude='dist' --exclude='.git' \
    --exclude='airgap-transfer-*' \
    ./ "$TRANSFER_DIR/qwen3-docs-app/"

echo "✅ Исходники скопированы"
echo ""

# ------------------------------------------
# 4. Создание инструкций
# ------------------------------------------
echo "📝 Шаг 4: Создание инструкций..."

cd "$TRANSFER_DIR"

cat > README_TRANSFER.txt << 'EOF'
============================================
  ПЕРЕНОС В ЗАКРЫТУЮ СЕТЬ
  Qwen3 Document Correction
============================================

СОДЕРЖИМОЕ АРХИВА:
------------------
1. Docker образы:
   - ollama-image.tar.gz      (Ollama сервер)
   - vllm-image.tar.gz        (vLLM сервер, если скачан)
   - nginx-image.tar.gz       (Frontend)
   - node-image.tar.gz        (Backend)

2. Модель Qwen3:
   - qwen3-ollama-models.tar.gz  (для Ollama)
   - или qwen3-hf-models.tar.gz  (для vLLM)

3. Исходники приложения:
   - qwen3-docs-app/

ИНСТРУКЦИЯ ПО РАЗВЁРТЫВАНИЮ:
-----------------------------
Смотрите файл AIRGAP_DEPLOYMENT.md в папке qwen3-docs-app/

ИЛИ выполните скрипт:
   cd qwen3-docs-app
   bash scripts/deploy-airgap.sh

КОНТАКТЫ:
---------
При возникновении проблем обратитесь к документации.
EOF

echo "✅ Инструкции созданы"
echo ""

# ------------------------------------------
# 5. Финальная информация
# ------------------------------------------
echo "============================================"
echo "  ✅ ПОДГОТОВКА ЗАВЕРШЕНА!"
echo "============================================"
echo ""
echo "📁 Директория для переноса: $TRANSFER_DIR"
echo ""
echo "📦 Содержимое:"
du -h --max-depth=1 "$TRANSFER_DIR" 2>/dev/null || du -sh "$TRANSFER_DIR"/*
echo ""
echo "📏 Общий размер:"
du -sh "$TRANSFER_DIR"
echo ""
echo "🚀 Следующие шаги:"
echo "  1. Скопируйте папку '$TRANSFER_DIR' на USB-накопитель"
echo "  2. Перенесите в закрытую сеть"
echo "  3. Распакуйте и запустите:"
echo "     cd $TRANSFER_DIR/qwen3-docs-app"
echo "     bash scripts/deploy-airgap.sh"
echo ""
echo "💡 Или используйте архив:"
echo "     tar -czf $TRANSFER_DIR.tar.gz $TRANSFER_DIR"
echo ""
