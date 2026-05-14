import express from 'express';
import request from 'supertest';
import { clearMetrics, recordMetric } from '../metrics/store';
import routeCompareRouter from './routeCompareRoute';

function makeMetric(
  method: string,
  route: string,
  duration: number,
  statusCode = 200
) {
  return { method, route, duration, statusCode, timestamp: Date.now() };
}

function buildApp() {
  const app = express();
  app.use('/routewatch/compare', routeCompareRouter);
  return app;
}

beforeEach(() => clearMetrics());

describe('GET /routewatch/compare', () => {
  it('returns 400 when routes param is missing', async () => {
    const res = await request(buildApp()).get('/routewatch/compare');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/routes/);
  });

  it('returns 400 when fewer than two routes are provided', async () => {
    const res = await request(buildApp()).get(
      '/routewatch/compare?routes=GET:/api/users'
    );
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/two route keys/);
  });

  it('returns 404 when a requested route has no metrics', async () => {
    recordMetric(makeMetric('GET', '/api/users', 120));
    const res = await request(buildApp()).get(
      '/routewatch/compare?routes=GET:/api/users,POST:/api/orders'
    );
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/POST:\/api\/orders/);
  });

  it('returns comparison data for two valid routes', async () => {
    [100, 200, 300].forEach((d) =>
      recordMetric(makeMetric('GET', '/api/users', d))
    );
    [50, 150, 250].forEach((d) =>
      recordMetric(makeMetric('POST', '/api/orders', d))
    );

    const res = await request(buildApp()).get(
      '/routewatch/compare?routes=GET:/api/users,POST:/api/orders'
    );

    expect(res.status).toBe(200);
    expect(res.body.routes).toHaveLength(2);

    const keys = res.body.routes.map((r: { route: string }) => r.route);
    expect(keys).toContain('GET:/api/users');
    expect(keys).toContain('POST:/api/orders');

    const users = res.body.routes.find(
      (r: { route: string }) => r.route === 'GET:/api/users'
    );
    expect(users).toHaveProperty('avg');
    expect(users).toHaveProperty('p95');
    expect(users).toHaveProperty('count');
  });

  it('handles three routes in a single comparison', async () => {
    ['GET:/a', 'GET:/b', 'GET:/c'].forEach((key) => {
      const [method, route] = key.split(':');
      [80, 160, 240].forEach((d) => recordMetric(makeMetric(method, route, d)));
    });

    const res = await request(buildApp()).get(
      '/routewatch/compare?routes=GET:/a,GET:/b,GET:/c'
    );

    expect(res.status).toBe(200);
    expect(res.body.routes).toHaveLength(3);
  });
});
