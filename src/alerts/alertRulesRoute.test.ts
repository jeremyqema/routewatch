import express from 'express';
import request from 'supertest';
import alertRulesRouter from './alertRulesRoute';
import { clearAlertRules } from './alertRules';

const app = express();
app.use(express.json());
app.use('/alert-rules', alertRulesRouter);

beforeEach(() => clearAlertRules());

describe('GET /alert-rules', () => {
  it('returns empty rules initially', async () => {
    const res = await request(app).get('/alert-rules');
    expect(res.status).toBe(200);
    expect(res.body.rules).toEqual([]);
  });
});

describe('POST /alert-rules', () => {
  it('adds a valid rule', async () => {
    const res = await request(app).post('/alert-rules').send({
      id: 'rule-1',
      condition: 'avg_exceeds',
      threshold: 300,
    });
    expect(res.status).toBe(201);
    expect(res.body.rule.id).toBe('rule-1');
    expect(res.body.rule.enabled).toBe(true);
  });

  it('returns 400 for missing fields', async () => {
    const res = await request(app).post('/alert-rules').send({ id: 'bad-rule' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Missing required fields/);
  });
});

describe('DELETE /alert-rules/:id', () => {
  it('removes an existing rule', async () => {
    await request(app).post('/alert-rules').send({ id: 'r1', condition: 'avg_exceeds', threshold: 100 });
    const res = await request(app).delete('/alert-rules/r1');
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('r1');
  });

  it('returns 404 for unknown rule', async () => {
    const res = await request(app).delete('/alert-rules/ghost');
    expect(res.status).toBe(404);
  });
});

describe('DELETE /alert-rules', () => {
  it('clears all rules', async () => {
    await request(app).post('/alert-rules').send({ id: 'r1', condition: 'avg_exceeds', threshold: 100 });
    await request(app).delete('/alert-rules');
    const res = await request(app).get('/alert-rules');
    expect(res.body.rules).toHaveLength(0);
  });
});
