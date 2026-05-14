import express from 'express';
import request from 'supertest';
import { computeTopRoutes } from './topRoutes';
import { clearMetrics, recordMetric } from '../metrics/store';
import topRoutesRouter from './topRoutesRoute';

function makeMetric(route: string, method: string, duration: number, status = 200) {
  return { route, method, duration, status, timestamp: Date.now() };
}

function buildApp() {
  const app = express();
  app.use('/metrics/top-routes', topRoutesRouter);
  return app;
}

describe('GET /metrics/top-routes', () => {
  beforeEach(() => {
    clearMetrics();
  });

  it('returns 200 with top routes report', async () => {
    recordMetric(makeMetric('/api/users', 'GET', 120));
    recordMetric(makeMetric('/api/users', 'GET', 200));
    recordMetric(makeMetric('/api/posts', 'GET', 80));

    const res = await request(buildApp()).get('/metrics/top-routes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('topBySlowest');
    expect(res.body).toHaveProperty('topByCount');
    expect(res.body).toHaveProperty('topByErrorRate');
  });

  it('respects the limit query param', async () => {
    for (let i = 0; i < 10; i++) {
      recordMetric(makeMetric(`/api/route${i}`, 'GET', 100 + i * 10));
    }

    const res = await request(buildApp()).get('/metrics/top-routes?limit=3');
    expect(res.status).toBe(200);
    expect(res.body.topBySlowest.length).toBeLessThanOrEqual(3);
  });

  it('returns empty arrays when no metrics recorded', async () => {
    const res = await request(buildApp()).get('/metrics/top-routes');
    expect(res.status).toBe(200);
    expect(res.body.topBySlowest).toEqual([]);
    expect(res.body.topByCount).toEqual([]);
    expect(res.body.topByErrorRate).toEqual([]);
  });

  it('returns 400 for invalid limit param', async () => {
    const res = await request(buildApp()).get('/metrics/top-routes?limit=abc');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
