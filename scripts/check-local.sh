#!/bin/bash
# ============================================
# Проверка локальной модели Qwen3
# ============================================

echo "============================================"
echo "  Проверка локальной модели Qwen3"
echo "============================================"
echo ""

# ------------------------------------------
# 1. Проверка Ollama
# ------------------------------------------
echo "🔍 Проверка Ollama..."

if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama сервер доступен"
    echo ""
    echo "📋 Доступные модели:"
    curl -s http://localhost:11434/api/tags | jq -r '.models[] | "  - \(.name) (\(.size / 1024 / 1024 / 1024 | floor) GB)"' 2>/dev/null || echo "  (не удалось получить список)"
    echo ""
    
    # Тестовый запрос
    echo "🧪 Тестовый запрос к модели..."
    RESPONSE=$(curl -s http://localhost:11434/api/generate -d '{
        "model": "qwen3:8b",
        "prompt": "Скажи привет",
        "stream": false
    }' | jq -r '.response' 2>/dev/null)
    
    if [ -n "$RESPONSE" ]; then
        echo "✅ Модель отвечает: $RESPONSE"
    else
        echo "❌ Модель не отвечает"
    fi
else
    echo "❌ Ollama сервер недоступен"
    echo "   Проверьте: docker ps | grep ollama"
fi

echo ""

# ------------------------------------------
# 2. Проверка vLLM
# ------------------------------------------
echo "🔍 Проверка vLLM..."

if curl -s http://localhost:8000/v1/models > /dev/null 2>&1; then
    echo "✅ vLLM сервер доступен"
    echo ""
    echo "📋 Доступные модели:"
    curl -s http://localhost:8000/v1/models | jq -r '.data[] | "  - \(.id)"' 2>/dev/null || echo "  (не удалось получить список)"
    echo ""
    
    # Тестовый запрос
    echo "🧪 Тестовый запрос к модели..."
    RESPONSE=$(curl -s http://localhost:8000/v1/chat/completions \
        -H "Content-Type: application/json" \
        -d '{
            "model": "qwen3",
            "messages": [{"role": "user", "content": "Скажи привет"}],
            "temperature": 0.7
        }' | jq -r '.choices[0].message.content' 2>/dev/null)
    
    if [ -n "$RESPONSE" ]; then
        echo "✅ Модель отвечает: $RESPONSE"
    else
        echo "❌ Модель не отвечает"
    fi
else
    echo "❌ vLLM сервер недоступен"
    echo "   Проверьте: docker ps | grep vllm"
fi

echo ""

# ------------------------------------------
# 3. Проверка Backend
# ------------------------------------------
echo "🔍 Проверка Backend..."

if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend доступен"
    echo ""
    echo "📊 Информация:"
    curl -s http://localhost:3001/api/health | jq . 2>/dev/null || curl -s http://localhost:3001/api/health
else
    echo "❌ Backend недоступен"
    echo "   Проверьте: docker compose ps"
fi

echo ""

# ------------------------------------------
# 4. Проверка Frontend
# ------------------------------------------
echo "🔍 Проверка Frontend..."

if curl -s http://localhost/health > /dev/null 2>&1; then
    echo "✅ Frontend доступен"
    echo "   Откройте: http://localhost"
else
    echo "❌ Frontend недоступен"
    echo "   Проверьте: docker compose ps"
fi

echo ""

# ------------------------------------------
# 5. GPU статус
# ------------------------------------------
if command -v nvidia-smi &> /dev/null; then
    echo "🎮 Статус GPU:"
    nvidia-smi --query-gpu=name,temperature.gpu,utilization.gpu,memory.used,memory.total --format=csv,noheader
    echo ""
fi

echo "============================================"
echo "  Проверка завершена"
echo "============================================"
