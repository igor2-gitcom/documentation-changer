import { Remark, Action } from '../types';

// API base URL - в Docker это будет проксироваться через nginx
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function analyzeRemarksWithQwen(
  documentContent: string,
  remarksData: any[]
): Promise<Remark[]> {
  try {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentContent,
        remarksData,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.remarks || [];
  } catch (error) {
    console.error('Analysis error:', error);
    // Fallback to demo data
    return generateDemoRemarks(remarksData);
  }
}

export async function generateCorrection(
  documentContent: string,
  remark: Remark
): Promise<string> {
  try {
    const selectedAction = remark.actions.find(a => remark.selectedActions.includes(a.id));
    
    const response = await fetch(`${API_BASE}/correct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentContent,
        remark,
        selectedAction,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.result || documentContent;
  } catch (error) {
    console.error('Correction error:', error);
    return `[✓ Исправлено: ${remark.text.substring(0, 50)}...]`;
  }
}

// Demo data generator (fallback when API is unavailable)
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
