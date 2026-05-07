import {
  recordAlert,
  getAlertHistory,
  clearAlertHistory,
  getAlertCount,
  getRecentAlerts,
} from './alertHistory';

beforeEach(() => {
  clearAlertHistory();
});

describe('recordAlert', () => {
  it('should add an entry with id and timestamp', () => {
    const entry = recordAlert({ route: 'GET /api/users', durationMs: 1200, threshold: 1000 });
    expect(entry.id).toBeDefined();
    expect(entry.timestamp).toBeDefined();
    expect(entry.route).toBe('GET /api/users');
    expect(entry.durationMs).toBe(1200);
  });

  it('should accumulate multiple entries', () => {
    recordAlert({ route: 'GET /api/a', durationMs: 500, threshold: 400 });
    recordAlert({ route: 'GET /api/b', durationMs: 800, threshold: 600 });
    expect(getAlertHistory()).toHaveLength(2);
  });
});

describe('getAlertHistory', () => {
  it('should return all alerts when no route filter', () => {
    recordAlert({ route: 'GET /api/a', durationMs: 500, threshold: 400 });
    recordAlert({ route: 'POST /api/b', durationMs: 700, threshold: 600 });
    expect(getAlertHistory()).toHaveLength(2);
  });

  it('should filter alerts by route', () => {
    recordAlert({ route: 'GET /api/a', durationMs: 500, threshold: 400 });
    recordAlert({ route: 'POST /api/b', durationMs: 700, threshold: 600 });
    const filtered = getAlertHistory('GET /api/a');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].route).toBe('GET /api/a');
  });
});

describe('clearAlertHistory', () => {
  it('should remove all entries', () => {
    recordAlert({ route: 'GET /api/a', durationMs: 500, threshold: 400 });
    clearAlertHistory();
    expect(getAlertHistory()).toHaveLength(0);
  });
});

describe('getAlertCount', () => {
  it('should return total count', () => {
    recordAlert({ route: 'GET /api/a', durationMs: 500, threshold: 400 });
    recordAlert({ route: 'GET /api/a', durationMs: 600, threshold: 400 });
    expect(getAlertCount()).toBe(2);
  });

  it('should return count filtered by route', () => {
    recordAlert({ route: 'GET /api/a', durationMs: 500, threshold: 400 });
    recordAlert({ route: 'POST /api/b', durationMs: 700, threshold: 600 });
    expect(getAlertCount('GET /api/a')).toBe(1);
  });
});

describe('getRecentAlerts', () => {
  it('should return alerts within the time window', () => {
    recordAlert({ route: 'GET /api/a', durationMs: 500, threshold: 400 });
    const recent = getRecentAlerts(5000);
    expect(recent).toHaveLength(1);
  });

  it('should return empty array when window is 0ms', () => {
    recordAlert({ route: 'GET /api/a', durationMs: 500, threshold: 400 });
    const recent = getRecentAlerts(0);
    expect(recent).toHaveLength(0);
  });
});
