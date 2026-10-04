# Шпаргалка: Запуск Qwen3 БЕЗ GPU

## 🚀 Быстрый старт (одна команда)

```bash
bash scripts/start-cpu.sh
```

---

## 📦 Ручной запуск

```bash
# 1. Запуск
docker compose -f docker-compose.cpu.yml up -d

# 2. Загрузка модели
docker exec -it qwen3-ollama-cpu ollama pull qwen3:1.7b

# 3. Открыть
# http://localhost
```

---

## 🎯 Выбор модели

| Модель | RAM | Скорость | Для чего |
|--------|-----|----------|----------|
| **qwen3:0.6b** | 4 GB | ⭐⭐⭐⭐⭐ | Тесты |
| **qwen3:1.7b** | 8 GB | ⭐⭐⭐⭐ | **Работа** ✅ |
| **qwen3:4b** | 16 GB | ⭐⭐⭐ | Качество |
| **qwen3:8b** | 32 GB | ⭐⭐ | Максимум |

---

## 📊 Производительность

**Скорость:** 1-5 токенов/сек  
**Время ответа:** 1-5 минут (500 токенов)  
**В 10 раз медленнее GPU**, но работает!

---

## ⚡ Оптимизация

### Если медленно:
```bash
# Используйте меньшую модель
docker exec -it qwen3-ollama-cpu ollama pull qwen3:1.7b
```

### Если мало RAM:
```bash
# Добавьте swap (Linux)
sudo fallocate -l 8G /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Закройте лишнее:
- Браузер с вкладками
- Другие приложения
- Освободите RAM

---

## 🔧 Команды

```bash
# Логи
docker compose -f docker-compose.cpu.yml logs -f

# Статус
docker compose -f docker-compose.cpu.yml ps

# Остановка
docker compose -f docker-compose.cpu.yml down

# Перезапуск
docker compose -f docker-compose.cpu.yml restart

# Список моделей
docker exec -it qwen3-ollama-cpu ollama list

# Тест скорости
time curl http://localhost:11434/api/generate -d '{
  "model": "qwen3:1.7b",
  "prompt": "Привет!",
  "stream": false
}'
```

---

## 💡 Советы

✅ **Что работает хорошо:**
- Короткие тексты (до 1000 токенов)
- Простые задачи (опечатки, форматирование)
- Небольшие документы

⚠️ **Что медленно:**
- Длинные документы (5000+ токенов)
- Сложные задачи (реструктуризация)
- Много запросов подряд

---

## 🆘 Проблемы

**Медленно?** → Используйте qwen3:1.7b или qwen3:0.6b  
**Нет памяти?** → Добавьте swap 8-16 GB  
**Не запускается?** → Проверьте RAM: `free -h`  
**Ошибки?** → Смотрите логи: `docker logs qwen3-ollama-cpu`

---

## 📚 Документация

- [Полная инструкция](./CPU_DEPLOYMENT.md)
- [Ollama Docs](https://ollama.com/docs)

---

**Помните:** CPU работает в 10 раз медленнее GPU, но подходит для тестирования и небольших задач!
