import './env';
import request from 'supertest';
import { createApp } from '../app';
import { User } from '../models/User';
import { Source } from '../models/Source';

const app = createApp();

let adminToken: string;

beforeAll(async () => {
  await User.deleteMany({});
  await Source.deleteMany({});
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ email: 'admin-src@test.com', password: 'password123' });
  await User.findByIdAndUpdate(reg.body.userId ?? (await User.findOne())!._id, { role: 'admin' });
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin-src@test.com', password: 'password123' });
  adminToken = login.body.accessToken;
});

beforeEach(async () => { await Source.deleteMany({}); });

describe('Admin Sources CRUD', () => {
  it('POST /api/admin/sources creates a source and returns it', async () => {
    const res = await request(app)
      .post('/api/admin/sources')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Samayamulu', type: 'Classical text' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Samayamulu', type: 'Classical text', recipeCount: 0 });
    expect(res.body.id).toBeDefined();
    expect(res.body.slug).toBe('samayamulu');
  });

  it('GET /api/admin/sources lists all sources', async () => {
    await request(app)
      .post('/api/admin/sources')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Source A', type: 'Modern reference' });
    const res = await request(app)
      .get('/api/admin/sources')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Source A');
  });

  it('PUT /api/admin/sources/:id updates the source', async () => {
    const create = await request(app)
      .post('/api/admin/sources')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Old Name', type: 'Classical text' });
    const id = create.body.id;
    const res = await request(app)
      .put(`/api/admin/sources/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'New Name', type: 'Modern reference' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New Name');
    expect(res.body.type).toBe('Modern reference');
  });

  it('DELETE /api/admin/sources/:id removes the source', async () => {
    const create = await request(app)
      .post('/api/admin/sources')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'ToDelete', type: 'Classical text' });
    const id = create.body.id;
    const del = await request(app)
      .delete(`/api/admin/sources/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(200);
    expect(del.body.ok).toBe(true);
    const list = await request(app)
      .get('/api/admin/sources')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(list.body).toHaveLength(0);
  });

  it('rejects non-admin with 403', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email: 'user-src@test.com', password: 'password123' });
    const userToken = reg.body.accessToken;
    const res = await request(app)
      .get('/api/admin/sources')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});

describe('Consumer Sources', () => {
  it('GET /api/sources returns all sources without auth', async () => {
    await request(app)
      .post('/api/admin/sources')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Arogya Padasastra', type: 'Classical text' });
    const res = await request(app).get('/api/sources');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].slug).toBe('arogya-padasastra');
  });

  it('GET /api/sources/:slug returns a single source', async () => {
    await request(app)
      .post('/api/admin/sources')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'ICMR-NIN 2024', type: 'Modern reference' });
    const res = await request(app).get('/api/sources/icmr-nin-2024');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('ICMR-NIN 2024');
  });

  it('GET /api/sources/:slug returns 404 for unknown slug', async () => {
    const res = await request(app).get('/api/sources/unknown-slug');
    expect(res.status).toBe(404);
  });
});
