import { FileText, Download, Eye } from 'lucide-react';

interface DocumentPreviewProps {
  originalContent: string;
  corrections: Array<{ remark: string; action: string; result: string }>;
  onExport: () => void;
  isExporting: boolean;
}

export default function DocumentPreview({ originalContent, corrections, onExport, isExporting }: DocumentPreviewProps) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Eye className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Предпросмотр корректировок</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-700">{corrections.length}</div>
            <div className="text-xs text-blue-600">Корректировок применено</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-700">
              {originalContent.split('\n').filter(l => l.trim()).length}
            </div>
            <div className="text-xs text-green-600">Строк в документе</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-700">
              {new Date().toLocaleDateString('ru-RU')}
            </div>
            <div className="text-xs text-purple-600">Дата обработки</div>
          </div>
        </div>

        {/* Corrections list */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Список внесённых изменений:</h4>
          {corrections.map((corr, i) => (
            <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-xs font-bold text-green-700">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 font-medium">{corr.remark}</p>
                <p className="text-xs text-blue-600 mt-1">→ {corr.action}</p>
                <p className="text-xs text-gray-500 mt-1 truncate">{corr.result}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Original content preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Содержимое документа</h3>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
            {originalContent}
          </pre>
        </div>
      </div>

      {/* Export */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-2">Экспорт скорректированного документа</h3>
        <p className="text-sm text-blue-100 mb-4">
          Документ будет сохранён в формате .docx со всеми внесёнными корректировками
        </p>
        <button
          onClick={onExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-6 py-3 bg-white text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Генерация...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Скачать документ (.docx)
            </>
          )}
        </button>
      </div>
    </div>
  );
}
