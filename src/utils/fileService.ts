import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

export async function parseExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        resolve(jsonData as any[]);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export async function parseDocFile(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error('Error parsing doc:', error);
    // Если не удалось распарсить как docx, читаем как текст
    return await file.text();
  }
}

export async function generateCorrectedDocument(
  originalContent: string,
  corrections: Array<{ remark: string; action: string; result: string }>,
  fileName: string
): Promise<void> {
  const paragraphs: Paragraph[] = [];

  // Заголовок
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Скорректированный документ',
          bold: true,
          size: 32,
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Информация о документе
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Исходный файл: ${fileName}`,
          italics: true,
          size: 20,
          color: '666666',
        }),
      ],
      spacing: { after: 200 },
    })
  );

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Дата корректировки: ${new Date().toLocaleDateString('ru-RU')}`,
          italics: true,
          size: 20,
          color: '666666',
        }),
      ],
      spacing: { after: 400 },
    })
  );

  // Разделитель
  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: '─'.repeat(60), color: 'CCCCCC' })],
      spacing: { after: 400 },
    })
  );

  // Содержание оригинала
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Содержание документа:',
          bold: true,
          size: 24,
        }),
      ],
      heading: HeadingLevel.HEADING_2,
      spacing: { after: 200 },
    })
  );

  // Разбиваем контент на абзацы
  const contentParagraphs = originalContent.split('\n').filter(p => p.trim());
  for (const para of contentParagraphs) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: para, size: 22 })],
        spacing: { after: 120 },
      })
    );
  }

  // Разделитель
  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: '─'.repeat(60), color: 'CCCCCC' })],
      spacing: { before: 400, after: 400 },
    })
  );

  // Внесённые корректировки
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Внесённые корректировки:',
          bold: true,
          size: 24,
        }),
      ],
      heading: HeadingLevel.HEADING_2,
      spacing: { after: 200 },
    })
  );

  for (let i = 0; i < corrections.length; i++) {
    const corr = corrections[i];
    
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${i + 1}. Замечание: `,
            bold: true,
            size: 22,
          }),
          new TextRun({
            text: corr.remark,
            size: 22,
          }),
        ],
        spacing: { after: 80 },
      })
    );

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `   Действие: `,
            bold: true,
            size: 20,
            color: '2563EB',
          }),
          new TextRun({
            text: corr.action,
            size: 20,
            color: '2563EB',
          }),
        ],
        spacing: { after: 80 },
      })
    );

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `   Результат: `,
            bold: true,
            size: 20,
            color: '16A34A',
          }),
          new TextRun({
            text: corr.result,
            size: 20,
            color: '16A34A',
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  // Создаём документ
  const doc = new Document({
    sections: [{
      properties: {},
      children: paragraphs,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const outputName = fileName.replace(/\.[^.]+$/, '') + '_скорректированный.docx';
  saveAs(blob, outputName);
}

export function getExcelColumns(data: any[]): string[] {
  if (data.length === 0) return [];
  return Object.keys(data[0]);
}
