import { useEffect, useState } from 'react';
import { Brain, FileText, Table, ArrowRight, Sparkles } from 'lucide-react';

interface AnalysisStepProps {
  documentContent: string;
  remarksData: any[];
  onAnalysisComplete: (remarks: any[]) => void;
  isAnalyzing: boolean;
  progress: number;
}

export default function AnalysisStep({ documentContent, remarksData, isAnalyzing, progress }: AnalysisStepProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setCurrentStep(prev => (prev + 1) % 4);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  const steps = [
    { icon: <FileText className="w-5 h-5" />, label: 'Чтение содержимого документа', detail: `${documentContent.length} символов` },
    { icon: <Table className="w-5 h-5" />, label: 'Обработка таблицы замечаний', detail: `${remarksData.length} замечаний` },
    { icon: <Brain className="w-5 h-5" />, label: 'Анализ с помощью Qwen3', detail: 'Генерация действий...' },
    { icon: <Sparkles className="w-5 h-5" />, label: 'Формирование таблицы действий', detail: 'Подготовка результатов' },
  ];

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Анализ документа</h2>
          <p className="text-sm text-gray-500 mt-1">Qwen3 обрабатывает замечания и формирует действия</p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Прогресс анализа</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                i === currentStep && isAnalyzing
                  ? 'bg-blue-50 border border-blue-200'
                  : i < currentStep || !isAnalyzing
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className={`flex-shrink-0 ${
                i === currentStep && isAnalyzing
                  ? 'text-blue-600 animate-pulse'
                  : i < currentStep || !isAnalyzing
                  ? 'text-green-600'
                  : 'text-gray-400'
              }`}>
                {step.icon}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  i === currentStep && isAnalyzing ? 'text-blue-700' :
                  i < currentStep || !isAnalyzing ? 'text-green-700' : 'text-gray-500'
                }`}>
                  {step.label}
                </p>
                <p className="text-xs text-gray-400">{step.detail}</p>
              </div>
              {(i < currentStep || !isAnalyzing) && (
                <ArrowRight className="w-4 h-4 text-green-500" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
