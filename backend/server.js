import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов
  message: { error: 'Слишком много запросов. Попробуйте позже.' },
});
app.use('/api/', limiter);

// Qwen3 API configuration
const QWEN_API_KEY = process.env.QWEN_API_KEY || '';
const QWEN_BASE_URL = process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const QWEN_MODEL = process.env.QWEN_MODEL || 'qwen3';

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    model: QWEN_MODEL,
    apiKeyConfigured: !!QWEN_API_KEY,
  });
});

// Analyze remarks endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { documentContent, remarksData } = req.body;

    if (!documentContent || !remarksData) {
      return res.status(400).json({ error: 'Необходимо указать documentContent и remarksData' });
    }

    if (!QWEN_API_KEY) {
      // Demo mode - return mock data
      return res.json({ demo: true, remarks: generateDemoRemarks(remarksData) });
    }

    const prompt = buildAnalysisPrompt(documentContent, remarksData);

    const response = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${QWEN_API_KEY}`,
      },
      body: JSON.stringify({
        model: QWEN_MODEL,
        messages: [
          {
            role: 'system',
            content: `Ты - эксперт по анализу и корректировке документов. 
            Для каждого замечания предложи возможные действия по его устранению.
            Действия могут быть: replace (замена текста), delete (удаление), 
            add (добавление), reformat (переформатирование), restructure (реструктуризация).
            Ответь СТРОГО в формате JSON массива, без пояснений.`
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
      const errorText = await response.text();
      console.error('Qwen API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Ошибка API: ${response.status}`,
        details: errorText 
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    const parsedRemarks = parseQwenResponse(content, remarksData);
    res.json({ demo: false, remarks: parsedRemarks });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Generate correction endpoint
app.post('/api/correct', async (req, res) => {
  try {
    const { documentContent, remark, selectedAction } = req.body;

    if (!documentContent || !remark) {
      return res.status(400).json({ error: 'Необходимо указать documentContent и remark' });
    }

    if (!QWEN_API_KEY) {
      // Demo mode
      return res.json({ 
        demo: true, 
        result: `[✓ Исправлено: ${remark.text?.substring(0, 50)}...]` 
      });
    }

    const response = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${QWEN_API_KEY}`,
      },
      body: JSON.stringify({
        model: QWEN_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Ты - эксперт по редактированию документов. Внеси указанные изменения в текст и верни исправленный фрагмент.'
          },
          {
            role: 'user',
            content: `Документ:\n${documentContent.substring(0, 2000)}\n\nЗамечание: ${remark.text}\nДействие: ${selectedAction?.description || 'Исправить'}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Ошибка API: ${response.status}` });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || '';
    
    res.json({ demo: false, result });

  } catch (error) {
    console.error('Correction error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Helper functions
function buildAnalysisPrompt(documentContent, remarksData) {
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

function parseQwenResponse(content, remarksData) {
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON found');
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return remarksData.map((remark, index) => {
      const qwenActions = parsed.find(p => p.remarkIndex === index)?.actions || [];
      
      return {
        id: `remark-${index}`,
        row: index + 1,
        location: remark.location || remark.раздел || remark.section || `Строка ${index + 1}`,
        text: remark.text || remark.замечание || remark.remark || String(remark),
        type: detectRemarkType(remark),
        severity: detectSeverity(remark),
        actions: qwenActions.map((a, ai) => ({
          id: `action-${index}-${ai}`,
          label: a.label,
          description: a.description,
          category: a.category || 'replace',
          aiGenerated: true,
          applied: false,
        })),
        selectedActions: [],
        status: 'pending',
      };
    });
  } catch {
    return generateDemoRemarks(remarksData);
  }
}

function generateDemoRemarks(remarksData) {
  const actionTypes = [
    { label: 'Заменить текст', description: 'Заменить проблемный фрагмент на корректный вариант', category: 'replace' },
    { label: 'Удалить фрагмент', description: 'Удалить проблемный текст без замены', category: 'delete' },
    { label: 'Добавить пояснение', description: 'Добавить уточняющий текст к проблемному месту', category: 'add' },
    { label: 'Исправить форматирование', description: 'Привести к единому стилю оформления', category: 'reformat' },
    { label: 'Переструктурировать раздел', description: 'Изменить структуру раздела для устранения замечания', category: 'restructure' },
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
      status: 'pending',
    };
  });
}

function detectRemarkType(remark) {
  const text = JSON.stringify(remark).toLowerCase();
  if (text.includes('ошибк') || text.includes('неверн')) return 'error';
  if (text.includes('предупрежд') || text.includes('вниман')) return 'warning';
  if (text.includes('формат') || text.includes('стиль')) return 'formatting';
  return 'suggestion';
}

function detectSeverity(remark) {
  const text = JSON.stringify(remark).toLowerCase();
  if (text.includes('критич') || text.includes('существенн')) return 'high';
  if (text.includes('незначит') || text.includes('мелк')) return 'low';
  return 'medium';
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📡 Qwen3 API: ${QWEN_BASE_URL}`);
  console.log(`🤖 Model: ${QWEN_MODEL}`);
  console.log(`🔑 API Key: ${QWEN_API_KEY ? 'Configured ✓' : 'Not set (demo mode)'}`);
});
