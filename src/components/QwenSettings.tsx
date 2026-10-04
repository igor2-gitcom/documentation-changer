import { useState } from 'react';
import { Settings, Key, Globe, Cpu } from 'lucide-react';
import { QwenConfig } from '../types';

interface QwenSettingsProps {
  config: QwenConfig;
  onConfigChange: (config: QwenConfig) => void;
}

export default function QwenSettings({ config, onConfigChange }: QwenSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-gray-600" />
          <div className="text-left">
            <h3 className="text-sm font-semibold text-gray-800">Настройки Qwen3</h3>
            <p className="text-xs text-gray-500">
              {config.apiKey ? 'API ключ настроен' : 'Демо-режим (без API ключа)'}
            </p>
          </div>
        </div>
        <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50/50">
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1.5">
              <Key className="w-3 h-3" />
              API ключ Qwen (DashScope)
            </label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => onConfigChange({ ...config, apiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Получите ключ на dashscope.aliyuncs.com. Без ключа используется демо-режим.
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1.5">
              <Cpu className="w-3 h-3" />
              Модель
            </label>
            <select
              value={config.model}
              onChange={(e) => onConfigChange({ ...config, model: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="qwen3">Qwen3 (последняя)</option>
              <option value="qwen3-235b-a22b">Qwen3-235B-A22B</option>
              <option value="qwen3-32b">Qwen3-32B</option>
              <option value="qwen3-30b-a3b">Qwen3-30B-A3B</option>
              <option value="qwen3-14b">Qwen3-14B</option>
              <option value="qwen3-8b">Qwen3-8B</option>
              <option value="qwen3-4b">Qwen3-4B</option>
              <option value="qwen3-1.7b">Qwen3-1.7B</option>
              <option value="qwen3-0.6b">Qwen3-0.6B</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1.5">
              <Globe className="w-3 h-3" />
              Базовый URL API
            </label>
            <input
              type="url"
              value={config.baseUrl}
              onChange={(e) => onConfigChange({ ...config, baseUrl: e.target.value })}
              placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {!config.apiKey && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700">
                <strong>Демо-режим:</strong> Без API ключа приложение работает с предзаданными действиями. 
                Для полноценной работы с Qwen3 укажите API ключ DashScope.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
