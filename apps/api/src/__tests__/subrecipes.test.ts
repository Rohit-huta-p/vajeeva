import './env';
import request from 'supertest';
import { createApp } from '../app';
import { User } from '../models/User';
import { SubRecipe } from '../models/SubRecipe';

const app = createApp();

let adminToken: string;

beforeAll(async () => {
  await User.deleteMany({});
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ email: 'admin-sr@test.com', password: 'password123' });
  await User.findByIdAndUpdate(reg.body.userId ?? (await User.findOne())!._id, { role: 'admin' });
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin-sr@test.com', password: 'password123' });
  adminToken = login.body.accessToken;
});

beforeEach(async () => { await SubRecipe.deleteMany({}); });

describe('Admin SubRecipes CRUD', () => {
  it('POST /api/admin/subrecipes creates a sub-recipe', async () => {
    const res = await request(app)
      .post('/api/admin/subrecipes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Tamarind extract' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Tamarind extract', usedIn: 0, slug: 'tamarind-extract' });
    expect(res.body.id).toBeDefined();
  });

  it('GET /api/admin/subrecipes lists all sub-recipes', async () => {
    await SubRecipe.create({ name: 'Coconut paste', slug: 'coconut-paste' });
    const res = await request(app)
      .get('/api/admin/subrecipes')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Coconut paste');
  });

  it('PUT /api/admin/subrecipes/:id updates the sub-recipe', async () => {
    const create = await request(app)
      .post('/api/admin/subrecipes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Old sub' });
    const id = create.body.id;
    const res = await request(app)
      .put(`/api/admin/subrecipes/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'New sub' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New sub');
  });

  it('DELETE /api/admin/subrecipes/:id removes the sub-recipe', async () => {
    const create = await request(app)
      .post('/api/admin/subrecipes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'ToDelete' });
    const id = create.body.id;
    const del = await request(app)
      .delete(`/api/admin/subrecipes/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(200);
    expect(del.body.ok).toBe(true);
    const list = await request(app)
      .get('/api/admin/subrecipes')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(list.body).toHaveLength(0);
  });
});
