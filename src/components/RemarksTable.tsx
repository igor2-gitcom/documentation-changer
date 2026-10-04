import React, { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp, Sparkles, AlertTriangle, AlertCircle, Lightbulb, Paintbrush } from 'lucide-react';
import { Remark } from '../types';

interface RemarksTableProps {
  remarks: Remark[];
  onToggleAction: (remarkId: string, actionId: string) => void;
  onSelectAll: (remarkId: string) => void;
  onDeselectAll: (remarkId: string) => void;
  onSkipRemark: (remarkId: string) => void;
  onApplyRemark: (remarkId: string) => void;
}

const typeIcons = {
  error: <AlertCircle className="w-4 h-4 text-red-500" />,
  warning: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
  suggestion: <Lightbulb className="w-4 h-4 text-blue-500" />,
  formatting: <Paintbrush className="w-4 h-4 text-purple-500" />,
};

const typeLabels = {
  error: 'Ошибка',
  warning: 'Предупреждение',
  suggestion: 'Предложение',
  formatting: 'Форматирование',
};

const severityColors = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-green-100 text-green-700 border-green-200',
};

const severityLabels = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
};

const categoryColors = {
  replace: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  add: 'bg-green-100 text-green-700',
  reformat: 'bg-purple-100 text-purple-700',
  restructure: 'bg-orange-100 text-orange-700',
};

export default function RemarksTable({
  remarks,
  onToggleAction,
  onSelectAll,
  onDeselectAll,
  onSkipRemark,
  onApplyRemark,
}: RemarksTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredRemarks = remarks.filter(r => {
    if (filter !== 'all' && r.type !== filter) return false;
    if (searchQuery && !r.text.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !r.location.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: remarks.length,
    pending: remarks.filter(r => r.status === 'pending').length,
    applied: remarks.filter(r => r.status === 'applied').length,
    skipped: remarks.filter(r => r.status === 'skipped').length,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-xs text-gray-500">Всего замечаний</div>
        </div>
        <div className="bg-white rounded-lg border border-yellow-200 p-3 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-xs text-gray-500">Ожидают решения</div>
        </div>
        <div className="bg-white rounded-lg border border-green-200 p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.applied}</div>
          <div className="text-xs text-gray-500">Применено</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <div className="text-2xl font-bold text-gray-400">{stats.skipped}</div>
          <div className="text-xs text-gray-500">Пропущено</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Поиск по замечаниям..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <div className="flex gap-2">
          {['all', 'error', 'warning', 'suggestion', 'formatting'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                filter === f 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'Все' : typeLabels[f as keyof typeof typeLabels]}
            </button>
          ))}
        </div>
      </div>

      {/* Remarks list */}
      <div className="space-y-3">
        {filteredRemarks.map((remark) => (
          <div
            key={remark.id}
            className={`bg-white rounded-xl border transition-all ${
              remark.status === 'applied' 
                ? 'border-green-300 bg-green-50/50' 
                : remark.status === 'skipped'
                ? 'border-gray-200 bg-gray-50/50 opacity-60'
                : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
            }`}
          >
            {/* Header */}
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {typeIcons[remark.type]}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                      {remark.location}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded border ${severityColors[remark.severity]}`}>
                      {severityLabels[remark.severity]}
                    </span>
                    {remark.status === 'applied' && (
                      <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Применено
                      </span>
                    )}
                    {remark.status === 'skipped' && (
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500 flex items-center gap-1">
                        <X className="w-3 h-3" /> Пропущено
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-800">{remark.text}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {remark.status === 'pending' && (
                    <>
                      <button
                        onClick={() => onApplyRemark(remark.id)}
                        disabled={remark.selectedActions.length === 0}
                        className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Применить
                      </button>
                      <button
                        onClick={() => onSkipRemark(remark.id)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Пропустить
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => toggleExpand(remark.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {expandedRows.has(remark.id) ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            {expandedRows.has(remark.id) && (
              <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-medium text-gray-600">
                      Возможные действия ({remark.actions.length})
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSelectAll(remark.id)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Выбрать все
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => onDeselectAll(remark.id)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Сбросить
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {remark.actions.map((action) => {
                    const isSelected = remark.selectedActions.includes(action.id);
                    return (
                      <button
                        key={action.id}
                        onClick={() => remark.status === 'pending' && onToggleAction(remark.id, action.id)}
                        disabled={remark.status !== 'pending'}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-200'
                            : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
                        } ${remark.status !== 'pending' ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-4 h-4 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                            isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-800">{action.label}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${categoryColors[action.category]}`}>
                                {action.category}
                              </span>
                              {action.aiGenerated && (
                                <Sparkles className="w-3 h-3 text-purple-400" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredRemarks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">Нет замечаний по выбранным фильтрам</p>
        </div>
      )}
    </div>
  );
}
