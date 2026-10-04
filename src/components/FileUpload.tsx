import React, { useCallback, useState } from 'react';
import { Upload, FileText, Table, Link, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onDocFileLoaded: (file: File, content: string) => void;
  onExcelFileLoaded: (file: File, data: any[]) => void;
  confluenceUrl: string;
  onConfluenceUrlChange: (url: string) => void;
}

export default function FileUpload({ 
  onDocFileLoaded, 
  onExcelFileLoaded, 
  confluenceUrl,
  onConfluenceUrlChange 
}: FileUploadProps) {
  const [docFile, setDocFile] = useState<File | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [excelError, setExcelError] = useState<string | null>(null);

  const handleDocFile = useCallback(async (file: File) => {
    setDocFile(file);
    setDocLoading(true);
    setDocError(null);
    try {
      const { parseDocFile } = await import('../utils/fileService');
      const content = await parseDocFile(file);
      onDocFileLoaded(file, content);
    } catch (err) {
      setDocError('Ошибка при чтении документа. Убедитесь, что файл в формате .docx');
      console.error(err);
    } finally {
      setDocLoading(false);
    }
  }, [onDocFileLoaded]);

  const handleExcelFile = useCallback(async (file: File) => {
    setExcelFile(file);
    setExcelLoading(true);
    setExcelError(null);
    try {
      const { parseExcelFile } = await import('../utils/fileService');
      const data = await parseExcelFile(file);
      onExcelFileLoaded(file, data);
    } catch (err) {
      setExcelError('Ошибка при чтении Excel файла. Убедитесь, что файл в формате .xlsx');
      console.error(err);
    } finally {
      setExcelLoading(false);
    }
  }, [onExcelFileLoaded]);

  const handleDrop = useCallback((type: 'doc' | 'excel') => (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (type === 'doc') handleDocFile(file);
      else handleExcelFile(file);
    }
  }, [handleDocFile, handleExcelFile]);

  return (
    <div className="space-y-6">
      {/* Confluence URL */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Link className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Ссылка на Confluence</h3>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          Укажите ссылку на страницу Confluence, где размещён документ
        </p>
        <input
          type="url"
          value={confluenceUrl}
          onChange={(e) => onConfluenceUrlChange(e.target.value)}
          placeholder="https://confluence.example.com/pages/..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
        />
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
          <AlertCircle className="w-3 h-3" />
          <span>Ссылка используется как источник документа. Также можно загрузить файл напрямую ниже.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Document Upload */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer
            ${docFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}
          onDrop={handleDrop('doc')}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById('doc-input')?.click()}
        >
          <input
            id="doc-input"
            type="file"
            accept=".doc,.docx"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleDocFile(e.target.files[0])}
          />
          
          <div className="text-center">
            {docLoading ? (
              <div className="animate-pulse">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-sm text-blue-600">Чтение документа...</p>
              </div>
            ) : docFile ? (
              <>
                <FileText className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p className="font-medium text-green-700">{docFile.name}</p>
                <p className="text-xs text-green-600 mt-1">Документ загружен ✓</p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="font-medium text-gray-700">Загрузите документ</p>
                <p className="text-sm text-gray-500 mt-1">Формат: .doc, .docx</p>
                <p className="text-xs text-gray-400 mt-2">Перетащите файл или нажмите для выбора</p>
              </>
            )}
          </div>

          {docError && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-600">{docError}</p>
            </div>
          )}
        </div>

        {/* Excel Upload */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer
            ${excelFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}
          onDrop={handleDrop('excel')}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById('excel-input')?.click()}
        >
          <input
            id="excel-input"
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleExcelFile(e.target.files[0])}
          />
          
          <div className="text-center">
            {excelLoading ? (
              <div className="animate-pulse">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-sm text-blue-600">Чтение таблицы замечаний...</p>
              </div>
            ) : excelFile ? (
              <>
                <Table className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p className="font-medium text-green-700">{excelFile.name}</p>
                <p className="text-xs text-green-600 mt-1">Таблица замечаний загружена ✓</p>
              </>
            ) : (
              <>
                <Table className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="font-medium text-gray-700">Загрузите таблицу замечаний</p>
                <p className="text-sm text-gray-500 mt-1">Формат: .xlsx, .xls, .csv</p>
                <p className="text-xs text-gray-400 mt-2">Перетащите файл или нажмите для выбора</p>
              </>
            )}
          </div>

          {excelError && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-600">{excelError}</p>
            </div>
          )}
        </div>
      </div>

      {/* Demo data button */}
      <div className="text-center">
        <button
          onClick={() => {
            const demoRemarks = [
              { location: 'Раздел 1.1', text: 'Неверная нумерация пунктов в таблице', type: 'error' },
              { location: 'Раздел 2.3', text: 'Отсутствует ссылка на источник данных', type: 'warning' },
              { location: 'Раздел 3.1', text: 'Несоответствие единиц измерения', type: 'error' },
              { location: 'Раздел 4.2', text: 'Устаревшая информация о сроках', type: 'suggestion' },
              { location: 'Приложение А', text: 'Необходимо обновить формат таблицы', type: 'formatting' },
              { location: 'Раздел 1.3', text: 'Дублирование информации из раздела 2.1', type: 'suggestion' },
            ];
            onExcelFileLoaded(new File([], 'demo_remarks.xlsx'), demoRemarks);
            
            const demoContent = `ДОКУМЕНТ: Техническое задание\n\n1. Введение\n1.1 Настоящий документ определяет требования к системе.\n1.2 Документ разработан на основе анализа бизнес-процессов.\n1.3 Основные цели проекта включают автоматизацию процессов.\n\n2. Основные требования\n2.1 Система должна обеспечивать обработку данных в реальном времени.\n2.2 Поддержка не менее 1000 одновременных пользователей.\n2.3 Интеграция с существующими системами предприятия.\n\n3. Технические требования\n3.1 Архитектура: микросервисная.\n3.2 База данных: PostgreSQL 15+.\n3.3 Язык разработки: Python 3.11+.\n\n4. Сроки и этапы\n4.1 Этап 1: Проектирование - Q1 2024.\n4.2 Этап 2: Разработка - Q2-Q3 2024.\n4.3 Этап 3: Тестирование - Q4 2024.\n\nПриложение А: Таблица соответствий`;
            onDocFileLoaded(new File([], 'demo_document.docx'), demoContent);
          }}
          className="text-sm text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors"
        >
          Или использовать демо-данные для тестирования
        </button>
      </div>
    </div>
  );
}
