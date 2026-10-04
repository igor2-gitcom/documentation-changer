.PHONY: help build up down logs restart clean dev prod

# Default target
help:
	@echo "============================================"
	@echo "  Qwen3 Document Correction - Docker"
	@echo "============================================"
	@echo ""
	@echo "Основные команды:"
	@echo "  make build      - Собрать образы"
	@echo "  make up         - Запустить приложение"
	@echo "  make down       - Остановить приложение"
	@echo "  make logs       - Показать логи"
	@echo "  make restart    - Перезапустить"
	@echo "  make clean      - Полная очистка"
	@echo ""
	@echo "Режимы:"
	@echo "  make dev        - Режим разработки (hot-reload)"
	@echo "  make prod       - Production режим"
	@echo ""

# Build images
build:
	docker compose build

# Start application
up:
	docker compose up -d

# Stop application
down:
	docker compose down

# Show logs
logs:
	docker compose logs -f

# Restart application
restart:
	docker compose restart

# Clean everything (containers, volumes, images)
clean:
	docker compose down -v --rmi local
	@echo "✓ Полная очистка завершена"

# Development mode (hot-reload)
dev:
	docker compose -f docker-compose.dev.yml up -d
	@echo ""
	@echo "✓ Dev-режим запущен"
	@echo "  Frontend: http://localhost:5173"
	@echo "  Backend:  http://localhost:3001"
	@echo ""

# Production mode
prod:
	docker compose up -d --build
	@echo ""
	@echo "✓ Production-режим запущен"
	@echo "  Приложение: http://localhost"
	@echo "  Health:     http://localhost/health"
	@echo ""

# Check status
status:
	@echo "=== Статус контейнеров ==="
	@docker compose ps
	@echo ""
	@echo "=== Backend Health ==="
	@curl -s http://localhost:3001/api/health | jq . 2>/dev/null || echo "Backend недоступен"
	@echo ""
	@echo "=== Frontend Health ==="
	@curl -s http://localhost/health || echo "Frontend недоступен"

# Setup (first time)
setup:
	@echo "=== Первоначальная настройка ==="
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✓ Создан файл .env из .env.example"; \
		echo "⚠  Отредактируйте .env и укажите QWEN_API_KEY"; \
	else \
		echo "✓ Файл .env уже существует"; \
	fi
	@echo ""
	@echo "Следующие шаги:"
	@echo "  1. Отредактируйте .env (укажите API ключ)"
	@echo "  2. make build"
	@echo "  3. make up"
