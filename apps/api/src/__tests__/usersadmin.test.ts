import './env';
import request from 'supertest';
import { createApp } from '../app';
import { User } from '../models/User';

const app = createApp();

let adminToken: string;

beforeAll(async () => {
  await User.deleteMany({});
  // Create admin user
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ email: 'admin-ua@test.com', password: 'password123' });
  await User.findByIdAndUpdate(reg.body.userId ?? (await User.findOne())!._id, { role: 'admin' });
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin-ua@test.com', password: 'password123' });
  adminToken = login.body.accessToken;

  // Create a regular user
  await request(app)
    .post('/api/auth/register')
    .send({ email: 'regular@test.com', password: 'password123' });
});

describe('Admin Users', () => {
  it('GET /api/admin/users returns list of users with correct shape', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2); // admin + regular

    const u = res.body[0];
    expect(u).toHaveProperty('id');
    expect(u).toHaveProperty('email');
    expect(u).toHaveProperty('role');
    expect(u).toHaveProperty('authProviders');
    expect(u).toHaveProperty('joinedAt');
    expect(u).not.toHaveProperty('passwordHash');
  });

  it('GET /api/admin/users returns 401 for unauthenticated request', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it('GET /api/admin/users returns 403 for non-admin', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'regular@test.com', password: 'password123' });
    const userToken = loginRes.body.accessToken;
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});
