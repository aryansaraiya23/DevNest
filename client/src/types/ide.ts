export type BottomPanelTab = 'output' | 'problems' | 'terminal';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description?: string;
  duration?: number;
}
