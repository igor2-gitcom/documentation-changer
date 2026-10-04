#!/bin/bash
# ============================================
# Быстрый запуск Qwen3 БЕЗ GPU (CPU mode)
# ============================================

set -e

echo "============================================"
echo "  Запуск Qwen3 без GPU (CPU mode)"
echo "============================================"
echo ""

# Проверка Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен!"
    exit 1
fi

echo "✅ Docker найден"
echo ""

# Проверка RAM
echo "📊 Проверка системных ресурсов..."
if command -v free &> /dev/null; then
    # Linux
    TOTAL_RAM=$(free -g | awk '/^Mem:/{print $2}')
    FREE_RAM=$(free -g | awk '/^Mem:/{print $7}')
    echo "  RAM: ${TOTAL_RAM} GB (свободно: ${FREE_RAM} GB)"
elif command -v sysctl &> /dev/null; then
    # macOS
    TOTAL_RAM=$(sysctl -n hw.memsize | awk '{print $1/1024/1024/1024}')
    echo "  RAM: ${TOTAL_RAM%.0f} GB"
else
    echo "  RAM: не удалось определить"
fi

# Проверка CPU
if command -v nproc &> /dev/null; then
    CPU_CORES=$(nproc)
    echo "  CPU: ${CPU_CORES} ядер"
elif command -v sysctl &> /dev/null; then
    CPU_CORES=$(sysctl -n hw.ncpu)
    echo "  CPU: ${CPU_CORES} ядер"
fi

echo ""

# Проверка GPU
if command -v nvidia-smi &> /dev/null; then
    if nvidia-smi &> /dev/null; then
        echo "⚠️  Обнаружена GPU!"
        echo "   Для максимальной производительности используйте:"
        echo "   docker compose -f docker-compose.local.yml up -d"
        echo ""
        read -p "Продолжить с CPU режимом? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 0
        fi
    fi
fi

echo ""

# Выбор модели
echo "🤖 Выберите модель для CPU:"
echo ""
echo "  1) qwen3:0.6b  (1.2 GB RAM) - очень быстро, базовое качество"
echo "  2) qwen3:1.7b  (3.4 GB RAM) - быстро, хорошее качество ⭐ РЕКОМЕНДУЕТСЯ"
echo "  3) qwen3:4b    (8 GB RAM)   - средне, отличное качество"
echo "  4) qwen3:8b    (16 GB RAM)  - медленно, максимальное качество"
echo ""
read -p "Ваш выбор (1-4) [2]: " MODEL_CHOICE

case $MODEL_CHOICE in
    1) MODEL="qwen3:0.6b" ;;
    2) MODEL="qwen3:1.7b" ;;
    3) MODEL="qwen3:4b" ;;
    4) MODEL="qwen3:8b" ;;
    *) MODEL="qwen3:1.7b" ;;
esac

echo ""
echo "✅ Выбрана модель: $MODEL"
echo ""

# Создание .env
echo "⚙️  Настройка окружения..."
cat > .env << EOF
# Модель для CPU режима
QWEN_MODEL=$MODEL

# CORS
CORS_ORIGIN=http://localhost
EOF

echo "✅ Файл .env создан"
echo ""

# Остановка старых контейнеров (если есть)
echo "🧹 Остановка старых контейнеров..."
docker compose -f docker-compose.cpu.yml down 2>/dev/null || true
echo ""

# Запуск
echo "🚀 Запуск приложения (CPU mode)..."
docker compose -f docker-compose.cpu.yml up -d

echo ""
echo "⏳ Ожидание запуска сервисов..."
sleep 5

# Загрузка модели
echo "📥 Загрузка модели $MODEL..."
echo "   (это может занять несколько минут при первом запуске)"
echo ""

docker exec -it qwen3-ollama-cpu ollama pull $MODEL

echo ""
echo "✅ Модель загружена"
echo ""

# Проверка
echo "🔍 Проверка работоспособности..."

if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama API доступен"
else
    echo "❌ Ollama API недоступен"
    echo "   Проверьте логи: docker logs qwen3-ollama-cpu"
fi

if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend доступен"
else
    echo "❌ Backend недоступен"
    echo "   Проверьте логи: docker compose -f docker-compose.cpu.yml logs backend"
fi

if curl -s http://localhost/health > /dev/null 2>&1; then
    echo "✅ Frontend доступен"
else
    echo "❌ Frontend недоступен"
    echo "   Проверьте логи: docker compose -f docker-compose.cpu.yml logs frontend"
fi

echo ""
echo "============================================"
echo "  ✅ ЗАПУСК ЗАВЕРШЕН!"
echo "============================================"
echo ""
echo "🌐 Откройте в браузере: http://localhost"
echo ""
echo "📊 Информация:"
echo "  Модель: $MODEL"
echo "  Режим: CPU (без GPU)"
echo "  Ожидаемая скорость: 1-5 токенов/сек"
echo ""
echo "📝 Полезные команды:"
echo "  Логи:       docker compose -f docker-compose.cpu.yml logs -f"
echo "  Статус:     docker compose -f docker-compose.cpu.yml ps"
echo "  Остановка:  docker compose -f docker-compose.cpu.yml down"
echo "  Перезапуск: docker compose -f docker-compose.cpu.yml restart"
echo ""
echo "💡 Советы:"
echo "  - Если медленно, используйте меньшую модель"
echo "  - Закройте другие приложения для освобождения RAM"
echo "  - Добавьте swap если мало памяти"
echo ""
echo "📚 Документация: CPU_DEPLOYMENT.md"
echo ""
