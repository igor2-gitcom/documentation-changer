import { QwenConfig, Remark, Action } from '../types';

const defaultConfig: QwenConfig = {
  apiKey: '',
  model: 'qwen3',
  baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
};

export async function analyzeRemarksWithQwen(
  documentContent: string,
  remarksData: any[],
  config: QwenConfig = defaultConfig
): Promise<Remark[]> {
  // Если API ключ не указан, используем демо-данные
  if (!config.apiKey) {
    return generateDemoRemarks(remarksData);
  }

  try {
    const prompt = buildAnalysisPrompt(documentContent, remarksData);
    
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: `Ты - эксперт по анализу и корректировке документов. 
            Для каждого замечания предложи возможные действия по его устранению.
            Действия могут быть: replace (замена текста), delete (удаление), 
            add (добавление), reformat (переформатирование), restructure (реструктуризация).
            Ответь в формате JSON массива.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    return parseQwenResponse(content, remarksData);
  } catch (error) {
    console.error('Qwen API error:', error);
    return generateDemoRemarks(remarksData);
  }
}

function buildAnalysisPrompt(documentContent: string, remarksData: any[]): string {
  const truncatedContent = documentContent.substring(0, 3000);
  
  return `Проанализируй документ и замечания к нему.

СОДЕРЖИМОЕ ДОКУМЕНТА (фрагмент):
"""
${truncatedContent}
"""

ЗАМЕЧАНИЯ:
${remarksData.map((r, i) => `${i + 1}. ${JSON.stringify(r)}`).join('\n')}

Для каждого замечания предложи 2-4 возможных действия по его устранению.
Верни JSON в формате:
[
  {
    "remarkIndex": 0,
    "actions": [
      {
        "label": "Краткое описание действия",
        "description": "Подробное описание что будет сделано",
        "category": "replace|delete|add|reformat|restructure"
      }
    ]
  }
]`;
}

function parseQwenResponse(content: string, remarksData: any[]): Remark[] {
  try {
    // Извлекаем JSON из ответа
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON found');
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return remarksData.map((remark, index) => {
      const qwenActions = parsed.find((p: any) => p.remarkIndex === index)?.actions || [];
      
      return {
        id: `remark-${index}`,
        row: index + 1,
        location: remark.location || remark.раздел || remark.section || `Строка ${index + 1}`,
        text: remark.text || remark.замечание || remark.remark || String(remark),
        type: detectRemarkType(remark),
        severity: detectSeverity(remark),
        actions: qwenActions.map((a: any, ai: number) => ({
          id: `action-${index}-${ai}`,
          label: a.label,
          description: a.description,
          category: a.category || 'replace',
          aiGenerated: true,
          applied: false,
        })),
        selectedActions: [],
        status: 'pending' as const,
      };
    });
  } catch {
    return generateDemoRemarks(remarksData);
  }
}

function generateDemoRemarks(remarksData: any[]): Remark[] {
  const actionTypes: Array<{ label: string; description: string; category: Action['category'] }> = [
    { label: 'Заменить текст', description: 'Заменить проблемный фрагмент на корректный вариант', category: 'replace' },
    { label: 'Удалить фрагмент', description: 'Удалить проблемный текст без замены', category: 'delete' },
    { label: 'Добавить пояснение', description: 'Добавить уточняющий текст к проблемному месту', category: 'add' },
    { label: 'Исправить форматирование', description: 'Привести к единому стилю оформления', category: 'reformat' },
    { label: 'Переструктурировать раздел', description: 'Изменить структуру раздела для устранения замечания', category: 'restructure' },
    { label: 'Объединить с предыдущим', description: 'Объединить данный фрагмент с предыдущим абзацем', category: 'restructure' },
  ];

  return remarksData.map((remark, index) => {
    // Выбираем 2-4 случайных действия
    const numActions = 2 + Math.floor(Math.random() * 3);
    const shuffled = [...actionTypes].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, numActions);

    return {
      id: `remark-${index}`,
      row: index + 1,
      location: remark.location || remark.раздел || remark.section || `Строка ${index + 1}`,
      text: remark.text || remark.замечание || remark.remark || String(remark),
      type: detectRemarkType(remark),
      severity: detectSeverity(remark),
      actions: selected.map((a, ai) => ({
        id: `action-${index}-${ai}`,
        label: a.label,
        description: a.description,
        category: a.category,
        aiGenerated: false,
        applied: false,
      })),
      selectedActions: [],
      status: 'pending' as const,
    };
  });
}

function detectRemarkType(remark: any): Remark['type'] {
  const text = JSON.stringify(remark).toLowerCase();
  if (text.includes('ошибк') || text.includes('неверн') || text.includes('неправильн')) return 'error';
  if (text.includes('предупрежд') || text.includes('вниман')) return 'warning';
  if (text.includes('предложен') || text.includes('рекоменд')) return 'suggestion';
  if (text.includes('формат') || text.includes('стиль') || text.includes('оформл')) return 'formatting';
  return 'suggestion';
}

function detectSeverity(remark: any): Remark['severity'] {
  const text = JSON.stringify(remark).toLowerCase();
  if (text.includes('критич') || text.includes('существенн') || text.includes('важн')) return 'high';
  if (text.includes('незначит') || text.includes('мелк') || text.includes('косметич')) return 'low';
  return 'medium';
}

export async function generateCorrection(
  documentContent: string,
  remark: Remark,
  config: QwenConfig = defaultConfig
): Promise<string> {
  if (!config.apiKey) {
    return generateDemoCorrection(documentContent, remark);
  }

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: 'Ты - эксперт по редактированию документов. Внеси указанные изменения в текст и верни исправленный фрагмент.'
          },
          {
            role: 'user',
            content: `Документ:\n${documentContent.substring(0, 2000)}\n\nЗамечание: ${remark.text}\nДействие: ${remark.actions.find(a => remark.selectedActions.includes(a.id))?.description || 'Исправить'}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || documentContent;
  } catch {
    return generateDemoCorrection(documentContent, remark);
  }
}

function generateDemoCorrection(content: string, remark: Remark): string {
  // Имитация корректировки - добавляем пометку
  const marker = `\n[✓ Исправлено: ${remark.text.substring(0, 50)}...]`;
  return content + marker;
}
