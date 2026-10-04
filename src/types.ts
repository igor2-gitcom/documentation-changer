export interface Remark {
  id: string;
  row: number;
  location: string;
  text: string;
  type: 'error' | 'warning' | 'suggestion' | 'formatting';
  severity: 'high' | 'medium' | 'low';
  actions: Action[];
  selectedActions: string[];
  status: 'pending' | 'applied' | 'skipped';
}

export interface Action {
  id: string;
  label: string;
  description: string;
  category: 'replace' | 'delete' | 'add' | 'reformat' | 'restructure';
  aiGenerated: boolean;
  applied: boolean;
}

export interface DocumentState {
  originalContent: string;
  modifiedContent: string;
  fileName: string;
  remarksFileName: string;
}

export interface QwenConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}

export type Step = 'upload' | 'analyze' | 'actions' | 'preview' | 'export';
