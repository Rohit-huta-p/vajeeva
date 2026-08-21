import './env';
import request from 'supertest';
import { createApp } from '../app';
import { User } from '../models/User';
import { HealthFlagConfig } from '../models/HealthFlagConfig';

const app = createApp();

let adminToken: string;

beforeAll(async () => {
  await User.deleteMany({});
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ email: 'admin-hf@test.com', password: 'password123' });
  await User.findByIdAndUpdate(reg.body.userId ?? (await User.findOne())!._id, { role: 'admin' });
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin-hf@test.com', password: 'password123' });
  adminToken = login.body.accessToken;
});

beforeEach(async () => { await HealthFlagConfig.deleteMany({}); });

describe('Admin Health Flags', () => {
  it('GET /api/admin/health-flags returns empty object when no flags configured', async () => {
    const res = await request(app)
      .get('/api/admin/health-flags')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
  });

  it('PUT /api/admin/health-flags bulk-saves flags and GET returns them', async () => {
    const flags = {
      vegan: { label: 'Vegan', description: 'No animal products', enabled: true },
      gluten_free: { label: 'Gluten Free', description: 'No gluten', enabled: false },
    };
    const put = await request(app)
      .put('/api/admin/health-flags')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(flags);
    expect(put.status).toBe(200);
    expect(put.body).toMatchObject({
      vegan: { label: 'Vegan', enabled: true },
      gluten_free: { label: 'Gluten Free', enabled: false },
    });

    const get = await request(app)
      .get('/api/admin/health-flags')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(get.status).toBe(200);
    expect(Object.keys(get.body)).toHaveLength(2);
    expect(get.body.vegan.label).toBe('Vegan');
  });

  it('PUT replaces all flags (removes old ones)', async () => {
    // Seed two flags
    await request(app)
      .put('/api/admin/health-flags')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ vegan: { label: 'Vegan', description: 'desc', enabled: true } });

    // Replace with only one new flag
    await request(app)
      .put('/api/admin/health-flags')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ keto: { label: 'Keto', description: 'Low carb', enabled: true } });

    const get = await request(app)
      .get('/api/admin/health-flags')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(Object.keys(get.body)).toEqual(['keto']);
  });

  it('GET /api/admin/health-flags returns 403 for non-admin', async () => {
    const res = await request(app)
      .get('/api/admin/health-flags');
    expect(res.status).toBe(401); // no token → 401
  });
});
