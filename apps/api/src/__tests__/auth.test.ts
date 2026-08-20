import './env';
import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('POST /api/auth/register', () => {
  it('creates user and returns accessToken', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'user@test.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('rejects duplicate email with 409', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@test.com', password: 'password123' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@test.com', password: 'password123' });
    expect(res.status).toBe(409);
  });

  it('rejects short password with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'x@test.com', password: 'short' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'login@test.com', password: 'password123' });
  });

  it('returns accessToken and sets refreshToken cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  it('returns new accessToken when valid refreshToken cookie present', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'password123' });
    const cookie = loginRes.headers['set-cookie'][0];

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('returns 401 with no cookie', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });
});
