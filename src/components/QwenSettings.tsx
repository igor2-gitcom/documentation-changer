import { useState, useEffect } from 'react';
import { Settings, CheckCircle2, AlertCircle, Server } from 'lucide-react';

interface BackendStatus {
  status: string;
  model: string;
  apiKeyConfigured: boolean;
  timestamp: string;
}

export default function QwenSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        const data = await response.json();
        setBackendStatus(data);
      }
    } catch (error) {
      console.error('Backend health check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Server className="w-5 h-5 text-gray-600" />
          <div className="text-left">
            <h3 className="text-sm font-semibold text-gray-800">Статус Backend</h3>
            <p className="text-xs text-gray-500">
              {loading ? 'Проверка...' : backendStatus ? 'Подключено' : 'Недоступен'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {backendStatus && (
            <div className={`w-2 h-2 rounded-full ${
              backendStatus.apiKeyConfigured ? 'bg-green-500' : 'bg-yellow-500'
            }`} />
          )}
          <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50/50">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Проверка соединения...
            </div>
          ) : backendStatus ? (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Статус</span>
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="w-3 h-3" />
                    {backendStatus.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Модель</span>
                  <span className="text-xs font-mono text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                    {backendStatus.model}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">API ключ</span>
                  {backendStatus.apiKeyConfigured ? (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle2 className="w-3 h-3" />
                      Настроен
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-yellow-600">
                      <AlertCircle className="w-3 h-3" />
                      Демо-режим
                    </span>
                  )}
                </div>
              </div>

              {!backendStatus.apiKeyConfigured && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-700">
                    <strong>Демо-режим:</strong> Для полноценной работы укажите QWEN_API_KEY 
                    в переменных окружения Docker.
                  </p>
                </div>
              )}

              <button
                onClick={checkBackendHealth}
                className="w-full px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Обновить статус
              </button>
            </>
          ) : (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-700">
                <strong>Ошибка:</strong> Backend недоступен. Убедитесь, что сервис запущен.
              </p>
              <button
                onClick={checkBackendHealth}
                className="mt-2 text-xs text-red-600 underline"
              >
                Попробовать снова
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
