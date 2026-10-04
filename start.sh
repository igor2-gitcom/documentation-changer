#!/bin/bash
# ============================================
# Быстрый старт - Qwen3 Document Correction
# ============================================

set -e

echo "============================================"
echo "  Qwen3 Document Correction - Setup"
echo "============================================"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен!"
    echo "   Установите Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose не установлен!"
    echo "   Установите Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker и Docker Compose найдены"
echo ""

# Create .env if not exists
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Создан файл .env из .env.example"
    echo ""
    echo "⚠️  ВАЖНО: Отредактируйте .env и укажите:"
    echo "   - QWEN_API_KEY (получить на dashscope.aliyuncs.com)"
    echo "   - QWEN_MODEL (по умолчанию: qwen3)"
    echo ""
    read -p "Хотите открыть .env для редактирования? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ${EDITOR:-nano} .env
    fi
else
    echo "✅ Файл .env уже существует"
fi

echo ""
echo "🔨 Сборка образов..."
docker compose build

echo ""
echo "🚀 Запуск приложения..."
docker compose up -d

echo ""
echo "============================================"
echo "  ✅ Приложение запущено!"
echo "============================================"
echo ""
echo "  🌐 Frontend:    http://localhost"
echo "  🔧 Backend API: http://localhost:3001/api/health"
echo "  💚 Health:      http://localhost/health"
echo ""
echo "  Логи: docker compose logs -f"
echo "  Стоп: docker compose down"
echo ""
