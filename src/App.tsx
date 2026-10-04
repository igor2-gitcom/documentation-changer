import { useState, useCallback } from 'react';
import { FileText, ArrowRight, ArrowLeft, Brain, CheckCircle2, Download } from 'lucide-react';
import { Remark, QwenConfig, Step } from './types';
import FileUpload from './components/FileUpload';
import RemarksTable from './components/RemarksTable';
import DocumentPreview from './components/DocumentPreview';
import QwenSettings from './components/QwenSettings';
import AnalysisStep from './components/AnalysisStep';
import { analyzeRemarksWithQwen, generateCorrection } from './utils/qwenService';
import { generateCorrectedDocument } from './utils/fileService';

const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: 'upload', label: 'Загрузка', icon: <FileText className="w-4 h-4" /> },
  { id: 'analyze', label: 'Анализ', icon: <Brain className="w-4 h-4" /> },
  { id: 'actions', label: 'Действия', icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: 'preview', label: 'Предпросмотр', icon: <Download className="w-4 h-4" /> },
];

export default function App() {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [qwenConfig, setQwenConfig] = useState<QwenConfig>({
    apiKey: '',
    model: 'qwen3',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  });
  const [confluenceUrl, setConfluenceUrl] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [documentFileName, setDocumentFileName] = useState('');
  const [remarksData, setRemarksData] = useState<any[]>([]);
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [corrections, setCorrections] = useState<Array<{ remark: string; action: string; result: string }>>([]);
  const [isExporting, setIsExporting] = useState(false);

  const handleDocFileLoaded = useCallback((file: File, content: string) => {
    setDocumentContent(content);
    setDocumentFileName(file.name);
  }, []);

  const handleExcelFileLoaded = useCallback((file: File, data: any[]) => {
    setRemarksData(data);
  }, []);

  const startAnalysis = useCallback(async () => {
    if (!documentContent || remarksData.length === 0) return;
    
    setCurrentStep('analyze');
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Имитация прогресса
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const analyzedRemarks = await analyzeRemarksWithQwen(documentContent, remarksData, qwenConfig);
      setRemarks(analyzedRemarks);
      setAnalysisProgress(100);
      
      setTimeout(() => {
        setIsAnalyzing(false);
        setCurrentStep('actions');
      }, 1000);
    } catch (error) {
      console.error('Analysis error:', error);
      setIsAnalyzing(false);
    } finally {
      clearInterval(progressInterval);
    }
  }, [documentContent, remarksData, qwenConfig]);

  const handleToggleAction = useCallback((remarkId: string, actionId: string) => {
    setRemarks(prev => prev.map(r => {
      if (r.id !== remarkId) return r;
      const isSelected = r.selectedActions.includes(actionId);
      return {
        ...r,
        selectedActions: isSelected
          ? r.selectedActions.filter(id => id !== actionId)
          : [...r.selectedActions, actionId],
      };
    }));
  }, []);

  const handleSelectAll = useCallback((remarkId: string) => {
    setRemarks(prev => prev.map(r => {
      if (r.id !== remarkId) return r;
      return { ...r, selectedActions: r.actions.map(a => a.id) };
    }));
  }, []);

  const handleDeselectAll = useCallback((remarkId: string) => {
    setRemarks(prev => prev.map(r => {
      if (r.id !== remarkId) return r;
      return { ...r, selectedActions: [] };
    }));
  }, []);

  const handleSkipRemark = useCallback((remarkId: string) => {
    setRemarks(prev => prev.map(r => {
      if (r.id !== remarkId) return r;
      return { ...r, status: 'skipped' };
    }));
  }, []);

  const handleApplyRemark = useCallback(async (remarkId: string) => {
    setRemarks(prev => prev.map(r => {
      if (r.id !== remarkId) return r;
      return { ...r, status: 'applied' };
    }));

    // Генерируем корректировку
    const remark = remarks.find(r => r.id === remarkId);
    if (remark) {
      const result = await generateCorrection(documentContent, remark, qwenConfig);
      const selectedAction = remark.actions.find(a => remark.selectedActions.includes(a.id));
      
      setCorrections(prev => [...prev, {
        remark: remark.text,
        action: selectedAction?.label || 'Не указано',
        result: result.substring(0, 200),
      }]);
    }
  }, [remarks, documentContent, qwenConfig]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await generateCorrectedDocument(documentContent, corrections, documentFileName);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  }, [documentContent, corrections, documentFileName]);

  const canProceed = () => {
    switch (currentStep) {
      case 'upload':
        return documentContent.length > 0 && remarksData.length > 0;
      case 'actions':
        return remarks.some(r => r.status === 'applied');
      default:
        return true;
    }
  };

  const getStepIndex = () => steps.findIndex(s => s.id === currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Корректировка документов</h1>
                <p className="text-xs text-gray-500">с помощью Qwen3</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 hidden sm:block">Powered by</span>
              <span className="px-2 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 text-xs font-medium rounded-md">
                Qwen3 AI
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Step indicator */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-center gap-1 sm:gap-2">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => {
                  if (i <= getStepIndex() || (i === getStepIndex() + 1 && canProceed())) {
                    setCurrentStep(step.id);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  step.id === currentStep
                    ? 'bg-blue-600 text-white shadow-md'
                    : i < getStepIndex()
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {step.icon}
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={`w-6 sm:w-10 h-0.5 mx-1 ${
                  i < getStepIndex() ? 'bg-green-300' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar with settings */}
          <div className="lg:col-span-1 space-y-4">
            <QwenSettings config={qwenConfig} onConfigChange={setQwenConfig} />
            
            {/* Info panel */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Как это работает</h4>
              <ol className="space-y-2 text-xs text-gray-600">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">1</span>
                  <span>Загрузите документ (.docx) и таблицу замечаний (.xlsx)</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">2</span>
                  <span>Qwen3 анализирует замечания и предлагает действия</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">3</span>
                  <span>Выберите нужные действия по каждому замечанию</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">4</span>
                  <span>Скачайте скорректированный документ</span>
                </li>
              </ol>
            </div>

            {/* Confluence link display */}
            {confluenceUrl && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Источник</h4>
                <a href={confluenceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline break-all">
                  {confluenceUrl}
                </a>
              </div>
            )}
          </div>

          {/* Main area */}
          <div className="lg:col-span-3">
            {currentStep === 'upload' && (
              <div className="space-y-6">
                <FileUpload
                  onDocFileLoaded={handleDocFileLoaded}
                  onExcelFileLoaded={handleExcelFileLoaded}
                  confluenceUrl={confluenceUrl}
                  onConfluenceUrlChange={setConfluenceUrl}
                />
                
                {/* Preview of loaded data */}
                {remarksData.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Предпросмотр замечаний</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            {Object.keys(remarksData[0] || {}).map(key => (
                              <th key={key} className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {remarksData.slice(0, 5).map((row, i) => (
                            <tr key={i} className="border-b border-gray-100">
                              {Object.values(row).map((val, j) => (
                                <td key={j} className="py-2 px-3 text-gray-700 truncate max-w-[200px]">
                                  {String(val)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {remarksData.length > 5 && (
                        <p className="text-xs text-gray-400 mt-2 text-center">
                          ... и ещё {remarksData.length - 5} замечаний
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 'analyze' && (
              <AnalysisStep
                documentContent={documentContent}
                remarksData={remarksData}
                onAnalysisComplete={(r) => setRemarks(r)}
                isAnalyzing={isAnalyzing}
                progress={analysisProgress}
              />
            )}

            {currentStep === 'actions' && (
              <RemarksTable
                remarks={remarks}
                onToggleAction={handleToggleAction}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onSkipRemark={handleSkipRemark}
                onApplyRemark={handleApplyRemark}
              />
            )}

            {currentStep === 'preview' && (
              <DocumentPreview
                originalContent={documentContent}
                corrections={corrections}
                onExport={handleExport}
                isExporting={isExporting}
              />
            )}
          </div>
        </div>
      </main>

      {/* Navigation footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => {
              const idx = getStepIndex();
              if (idx > 0) setCurrentStep(steps[idx - 1].id);
            }}
            disabled={getStepIndex() === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>

          <div className="text-xs text-gray-500">
            Шаг {getStepIndex() + 1} из {steps.length}
          </div>

          <button
            onClick={() => {
              const idx = getStepIndex();
              if (idx === 0) {
                startAnalysis();
              } else if (idx === steps.length - 2) {
                setCurrentStep('preview');
              } else if (idx < steps.length - 1) {
                setCurrentStep(steps[idx + 1].id);
              }
            }}
            disabled={!canProceed() || isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {currentStep === 'upload' ? 'Анализировать' : currentStep === 'actions' ? 'Предпросмотр' : 'Далее'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
