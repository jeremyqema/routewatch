import express, { Request, Response } from 'express';
import request from 'supertest';
import { routewatch } from './routewatch';
import { getMetrics, clearMetrics } from '../metrics/store';
import { RouteMetrics } from '../types';

function buildApp(options = {}) {
  const app = express();
  app.use(routewatch(options));
  app.get('/fast', (_req: Request, res: Response) => res.json({ ok: true }));
  app.get('/slow', (_req: Request, res: Response) => {
    setTimeout(() => res.json({ ok: true }), 50);
  });
  return app;
}

beforeEach(() => clearMetrics());

describe('routewatch middleware', () => {
  it('records a metric after a request completes', async () => {
    const app = buildApp();
    await request(app).get('/fast');
    const metrics = getMetrics('GET', '/fast');
    expect(metrics).toHaveLength(1);
    expect(metrics[0].method).toBe('GET');
    expect(metrics[0].route).toBe('/fast');
    expect(metrics[0].statusCode).toBe(200);
    expect(metrics[0].durationMs).toBeGreaterThanOrEqual(0);
  });

  it('calls onSlowRoute when threshold is exceeded', async () => {
    const slowRoutes: RouteMetrics[] = [];
    const app = buildApp({
      slowThresholdMs: 10,
      onSlowRoute: (m: RouteMetrics) => slowRoutes.push(m),
    });
    await request(app).get('/slow');
    expect(slowRoutes).toHaveLength(1);
    expect(slowRoutes[0].durationMs).toBeGreaterThanOrEqual(10);
  });

  it('does not call onSlowRoute for fast routes', async () => {
    const slowRoutes: RouteMetrics[] = [];
    const app = buildApp({
      slowThresholdMs: 5000,
      onSlowRoute: (m: RouteMetrics) => slowRoutes.push(m),
    });
    await request(app).get('/fast');
    expect(slowRoutes).toHaveLength(0);
  });

  it('skips recording when disabled', async () => {
    const app = buildApp({ enabled: false });
    await request(app).get('/fast');
    expect(getMetrics()).toHaveLength(0);
  });
});
