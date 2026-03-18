import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/server.js';

describe('Observabilidade basica de health', () => {
  it('deve responder liveness em /health/live', async () => {
    const response = await request(app).get('/health/live');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('ayel-cams-api');
    expect(typeof response.body.uptimeSeconds).toBe('number');
  });

  it('deve responder readiness em /health/ready com banco ativo', async () => {
    const response = await request(app).get('/health/ready');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.checks.database).toBe('up');
  });

  it('deve expor estado consolidado em /health', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.checks.database).toBe('up');
    expect(typeof response.body.timestamp).toBe('string');
  });
});
