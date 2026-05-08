import request from 'supertest';
import express from 'express';
import trendRouter from './trendRoute';
import { recordMetric, clearMetrics } from '../metrics/store';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/routewatch/trend', trendRouter);
  return app;
}

function makeMetric(duration: number) {
  return {
    route: '/api/users',
    method: 'GET',
    statusCode: 200,
    duration,
    timestamp: Date.now(),
  };
}

describe('GET /routewatch/trend', () => {
  beforeEach(() => {
    clearMetrics();
  });

  it('returns a message when no metrics are recorded', async () => {
    const app = buildApp();
    const res = await request(app).get('/routewatch/trend');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/no metrics/i);
    expect(res.body.trends).toEqual({});
  });

  it('returns trend report for all routes', async () => {
    [100, 200, 150, 300, 250].forEach((d) => recordMetric(makeMetric(d)));
    const app = buildApp();
    const res = await request(app).get('/routewatch/trend');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('GET /api/users');
  });

  it('accepts a window query param', async () => {
    [100, 200, 150, 300, 250].forEach((d) => recordMetric(makeMetric(d)));
    const app = buildApp();
    const res = await request(app).get('/routewatch/trend?window=3');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('GET /api/users');
  });
});

describe('GET /routewatch/trend/:method/*', () => {
  beforeEach(() => {
    clearMetrics();
  });

  it('returns 404 when route has no metrics', async () => {
    const app = buildApp();
    const res = await request(app).get('/routewatch/trend/GET/api/unknown');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/no metrics found/i);
  });

  it('returns trend data for a specific route', async () => {
    [100, 200, 150].forEach((d) => recordMetric(makeMetric(d)));
    const app = buildApp();
    const res = await request(app).get('/routewatch/trend/GET/api/users');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('GET /api/users');
    expect(res.body).toHaveProperty('avg');
    expect(res.body).toHaveProperty('p95');
  });
});
