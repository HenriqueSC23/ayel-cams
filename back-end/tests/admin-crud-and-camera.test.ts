import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/server.js';

function uniqueEmail(prefix: string) {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 100000)}@ayel.com.br`;
}

async function loginAsAdminAndGetToken() {
  const response = await request(app).post('/auth/login').send({
    email: 'admin@ayel.com.br',
    password: '123456',
  });

  expect(response.status).toBe(200);
  return response.body.token as string;
}

describe('CRUD administrativo e consultas de cameras', () => {
  it('deve criar, atualizar e remover usuario como administrador', async () => {
    const token = await loginAsAdminAndGetToken();
    const email = uniqueEmail('admin-create-user');

    const createResponse = await request(app).post('/users').set('Authorization', `Bearer ${token}`).send({
      fullName: 'Usuario Novo',
      email,
      password: '123456',
      role: 'cliente',
      status: 'Ativo',
      access: 'Area restrita',
      unit: 'Filial Sul',
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.item.email).toBe(email);

    const userId = createResponse.body.item.id as string;

    const updateResponse = await request(app).patch(`/users/${userId}`).set('Authorization', `Bearer ${token}`).send({
      status: 'Inativo',
      access: 'Sem acesso',
    });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.item.status).toBe('Inativo');
    expect(updateResponse.body.item.access).toBe('Sem acesso');

    const deleteResponse = await request(app).delete(`/users/${userId}`).set('Authorization', `Bearer ${token}`);
    expect(deleteResponse.status).toBe(204);
  });

  it('deve listar cameras restritas ao aplicar filtros como administrador', async () => {
    const token = await loginAsAdminAndGetToken();
    const response = await request(app)
      .get('/cameras')
      .set('Authorization', `Bearer ${token}`)
      .query({ access: 'restricted', status: 'live', search: 'galpao' });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items.length).toBeGreaterThan(0);
    expect(response.body.items.every((camera: { access: string; status: string }) => camera.access === 'restricted' && camera.status === 'live')).toBe(
      true,
    );
  });

  it('deve bloquear criacao de camera para usuario nao administrador', async () => {
    const unauthorizedResponse = await request(app).post('/cameras').send({
      name: 'Camera sem auth',
      location: 'Teste',
      category: 'Portaria',
      description: 'Teste sem autenticacao',
      access: 'public',
      status: 'live',
      quality: 'HD',
    });

    expect(unauthorizedResponse.status).toBe(401);

    const registerResponse = await request(app).post('/auth/register').send({
      fullName: 'Cliente Teste',
      email: uniqueEmail('client-create-camera'),
      password: '123456',
    });

    expect(registerResponse.status).toBe(201);
    const clientToken = registerResponse.body.token as string;

    const forbiddenResponse = await request(app).post('/cameras').set('Authorization', `Bearer ${clientToken}`).send({
      name: 'Camera sem permissao',
      location: 'Teste',
      category: 'Portaria',
      description: 'Teste sem permissao',
      access: 'public',
      status: 'live',
      quality: 'HD',
    });

    expect(forbiddenResponse.status).toBe(403);
  });
});
