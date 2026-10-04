# Шпаргалка: Qwen3 в закрытой сети

## 🚀 Быстрый старт

### На машине с интернетом:
```bash
bash scripts/prepare-airgap.sh
```

### На закрытой машине:
```bash
bash scripts/deploy-airgap.sh
```

---

## 📦 Что нужно перенести

После выполнения `prepare-airgap.sh` вы получите папку с:

```
airgap-transfer-YYYYMMDD/
├── ollama-image.tar.gz           # Docker образ Ollama
├── vllm-image.tar.gz             # Docker образ vLLM (опционально)
├── nginx-image.tar.gz            # Docker образ Nginx
├── node-image.tar.gz             # Docker образ Node.js
├── qwen3-ollama-models.tar.gz    # Модель для Ollama
│   или qwen3-hf-models.tar.gz    # Модель для vLLM
└── qwen3-docs-app/               # Исходники приложения
```

---

## 🎯 Выбор модели

| Модель | Размер | RAM | GPU VRAM | Качество | Скорость |
|--------|--------|-----|----------|----------|----------|
| **qwen3:0.6b** | 1.2 GB | 4 GB | 2 GB | ⭐ | ⭐⭐⭐⭐⭐ |
| **qwen3:1.7b** | 3.4 GB | 8 GB | 4 GB | ⭐⭐ | ⭐⭐⭐⭐ |
| **qwen3:4b** | 8 GB | 16 GB | 6 GB | ⭐⭐⭐ | ⭐⭐⭐ |
| **qwen3:8b** | 16 GB | 32 GB | 10 GB | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **qwen3:14b** | 28 GB | 64 GB | 16 GB | ⭐⭐⭐⭐⭐ | ⭐⭐ |

**Рекомендация:** Начните с `qwen3:8b` - оптимальный баланс качества и скорости.

---

## 🔧 Команды

### Запуск с Ollama (проще)
```bash
docker compose -f docker-compose.local.yml up -d
```

### Запуск с vLLM (production)
```bash
docker compose -f docker-compose.vllm.yml up -d
```

### Проверка статуса
```bash
bash scripts/check-local.sh
```

### Логи
```bash
# Все сервисы
docker compose logs -f

# Только Ollama
docker logs ollama -f

# Только backend
docker compose logs -f backend
```

### Остановка
```bash
docker compose -f docker-compose.local.yml down
# или
docker compose -f docker-compose.vllm.yml down
```

---

## 📊 Мониторинг

### GPU (NVIDIA)
```bash
nvidia-smi
```

### Использование ресурсов
```bash
docker stats
```

### Статус модели (Ollama)
```bash
docker exec ollama ollama list
docker exec ollama ollama ps
```

### Статус модели (vLLM)
```bash
curl http://localhost:8000/v1/models
```

---

## 🐛 Решение проблем

### Ollama не видит модель
```bash
# Проверьте наличие моделей
docker exec ollama ollama list

# Перезапустите Ollama
docker restart ollama
```

### vLLM не запускается
```bash
# Проверьте GPU
nvidia-smi

# Увеличьте shared memory
docker compose -f docker-compose.vllm.yml down
docker run --shm-size 10.24g ...
```

### Медленная работа
1. Используйте GPU (ускоряет в 5-10 раз)
2. Выберите меньшую модель (qwen3:4b вместо 14b)
3. Уменьшите `MAX_MODEL_LEN` в `.env`

### Ошибки памяти
```bash
# Для Ollama - используйте меньшую модель
ollama pull qwen3:4b

# Для vLLM - уменьшите параметры
# В .env:
MAX_MODEL_LEN=2048
GPU_MEM_UTIL=0.8
```

---

## 🔐 Безопасность

### Firewall правила
```bash
# Разрешите доступ к LLM только из Docker сети
sudo ufw allow from 172.18.0.0/16 to any port 11434
sudo ufw allow from 172.18.0.0/16 to any port 8000

# Запретите внешний доступ
sudo ufw deny 11434
sudo ufw deny 8000
```

### Рекомендации
- ✅ Изолируйте LLM сервер в внутренней сети
- ✅ Логируйте все запросы
- ✅ Регулярно обновляйте модели
- ✅ Делайте бэкапы конфигурации

---

## 📚 Документация

- [Полная инструкция](./AIRGAP_DEPLOYMENT.md)
- [Ollama Docs](https://ollama.com/docs)
- [vLLM Docs](https://docs.vllm.ai/)
- [Qwen3 Model](https://huggingface.co/Qwen/Qwen3-8B)

---

## 💡 Советы

1. **Начните с малого** - используйте qwen3:4b для тестирования
2. **Используйте GPU** - даже слабая GPU ускоряет в 5-10 раз
3. **Мониторьте ресурсы** - `docker stats` и `nvidia-smi`
4. **Делайте бэкапы** - особенно конфигурации и моделей
5. **Тестируйте локально** - перед развёртыванием проверьте на тестовой машине

---

## 🆘 Поддержка

Если возникли проблемы:
1. Проверьте логи: `docker compose logs`
2. Запустите проверку: `bash scripts/check-local.sh`
3. Убедитесь, что модель загружена: `docker exec ollama ollama list`
4. Проверьте доступность API: `curl http://localhost:11434/api/tags`
5. Обратитесь к [AIRGAP_DEPLOYMENT.md](./AIRGAP_DEPLOYMENT.md)
