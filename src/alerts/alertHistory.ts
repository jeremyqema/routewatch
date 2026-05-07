import { AlertHistoryEntry } from '../types';

const MAX_HISTORY_SIZE = 500;

const history: AlertHistoryEntry[] = [];

export function recordAlert(entry: Omit<AlertHistoryEntry, 'id' | 'timestamp'>): AlertHistoryEntry {
  const newEntry: AlertHistoryEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  };

  history.push(newEntry);

  if (history.length > MAX_HISTORY_SIZE) {
    history.splice(0, history.length - MAX_HISTORY_SIZE);
  }

  return newEntry;
}

export function getAlertHistory(route?: string): AlertHistoryEntry[] {
  if (route) {
    return history.filter((e) => e.route === route);
  }
  return [...history];
}

export function clearAlertHistory(): void {
  history.splice(0, history.length);
}

export function getAlertCount(route?: string): number {
  return getAlertHistory(route).length;
}

export function getRecentAlerts(limitMs: number = 60_000): AlertHistoryEntry[] {
  const cutoff = Date.now() - limitMs;
  return history.filter((e) => new Date(e.timestamp).getTime() >= cutoff);
}
