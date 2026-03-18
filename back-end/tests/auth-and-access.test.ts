import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/server.js';

function uniqueEmail(prefix: string) {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 100000)}@ayel.com.br`;
}

async function registerAndGetToken(email: string, password = '123456') {
  const registerResponse = await request(app).post('/auth/register').send({
    fullName: 'Usuario de Teste',
    email,
    password,
  });

  expect(registerResponse.status).toBe(201);
  return registerResponse.body.token as string;
}

describe('Auth e Controle de Acesso', () => {
  it('deve autenticar administrador com credenciais validas', async () => {
    const response = await request(app).post('/auth/login').send({
      email: 'admin@ayel.com.br',
      password: '123456',
    });

    expect(response.status).toBe(200);
    expect(typeof response.body.token).toBe('string');
    expect(response.body.user.role).toBe('administrador');
  });

  it('deve negar login com credenciais invalidas', async () => {
    const response = await request(app).post('/auth/login').send({
      email: 'admin@ayel.com.br',
      password: 'senha-invalida',
    });

    expect(response.status).toBe(401);
  });

  it('deve limitar tentativas excessivas de login com status 429', async () => {
    const email = uniqueEmail('ratelimit');
    let status = 0;

    for (let index = 0; index < 6; index += 1) {
      const response = await request(app).post('/auth/login').send({
        email,
        password: 'senha-invalida',
      });
      status = response.status;

      if (status === 429) {
        break;
      }
    }

    expect(status).toBe(429);
  });

  it('deve retornar somente cameras publicas quando nao autenticado', async () => {
    const response = await request(app).get('/cameras');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items.length).toBeGreaterThan(0);
    expect(response.body.items.every((item: { access: string }) => item.access === 'public')).toBe(true);
  });

  it('deve negar filtro restrito sem autenticacao', async () => {
    const response = await request(app).get('/cameras').query({ access: 'restricted' });
    expect(response.status).toBe(403);
  });

  it('deve bloquear acesso ao endpoint administrativo para usuario cliente', async () => {
    const token = await registerAndGetToken(uniqueEmail('client-admin-block'));

    const response = await request(app).get('/users').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(403);
  });

  it('deve atualizar perfil e senha do proprio usuario', async () => {
    const email = uniqueEmail('profile');
    const token = await registerAndGetToken(email, '123456');

    const profileResponse = await request(app).patch('/profile/me').set('Authorization', `Bearer ${token}`).send({
      phone: '+55 (11) 98888-1234',
      company: 'Ayel Security',
      jobTitle: 'Analista de Monitoramento',
      preferences: {
        notifyAlerts: false,
        preferGridView: false,
      },
    });

    expect(profileResponse.status).toBe(200);
    expect(profileResponse.body.item.phone).toBe('+55 (11) 98888-1234');
    expect(profileResponse.body.item.preferences.notifyAlerts).toBe(false);

    const invalidPasswordResponse = await request(app)
      .patch('/profile/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'senha-invalida',
        newPassword: '654321',
      });

    expect(invalidPasswordResponse.status).toBe(422);

    const validPasswordResponse = await request(app).patch('/profile/me/password').set('Authorization', `Bearer ${token}`).send({
      currentPassword: '123456',
      newPassword: '654321',
    });

    expect(validPasswordResponse.status).toBe(204);

    const loginAfterPasswordChange = await request(app).post('/auth/login').send({
      email,
      password: '654321',
    });

    expect(loginAfterPasswordChange.status).toBe(200);
  });

  it('deve invalidar token apos logout', async () => {
    const token = await registerAndGetToken(uniqueEmail('logout'));

    const meBeforeLogout = await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`);
    expect(meBeforeLogout.status).toBe(200);

    const logoutResponse = await request(app).post('/auth/logout').set('Authorization', `Bearer ${token}`);
    expect(logoutResponse.status).toBe(204);

    const meAfterLogout = await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`);
    expect(meAfterLogout.status).toBe(401);
  });
});
