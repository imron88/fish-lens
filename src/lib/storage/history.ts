import { AnalysisReport } from '../engine/types';

const STORAGE_KEY = 'fishlens_history_v1';
const MAX_HISTORY_ITEMS = 50;

export function getScanHistory(): AnalysisReport[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read scan history from localStorage:', err);
    return [];
  }
}

export function saveScanToHistory(report: AnalysisReport): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getScanHistory();
    // Prepend new report, remove duplicates by target or id
    const filtered = existing.filter((item) => item.id !== report.id);
    const updated = [report, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save scan to localStorage:', err);
  }
}

export function removeScanFromHistory(reportId: string): AnalysisReport[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getScanHistory();
    const updated = existing.filter((item) => item.id !== reportId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to remove scan from history:', err);
    return [];
  }
}

export function clearScanHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear scan history:', err);
  }
}
