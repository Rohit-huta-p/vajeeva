import './env';
import request from 'supertest';
import { createApp } from '../app';
import { User } from '../models/User';
import { Recipe } from '../models/Recipe';
import { HealthFlagConfig } from '../models/HealthFlagConfig';

const app = createApp();

const RECIPE_INPUT = {
  slug: 'admin-test-recipe', nameEn: 'Admin Recipe', nameTa: '', category: 'solid',
  description: 'Test', ingredients: [{ nameEn: 'A', quantityG: '1g', quantityCup: '1 tsp' }],
  steps: [{ order: 1, text: 'Do it', phase: 'P', heat: null, stepIngredients: [], illColor: '#111111' }],
  healthFlags: [], sources: [], yieldStr: '1', shelfLife: '1 day', status: 'draft',
};

let adminToken: string;
let userToken: string;

beforeAll(async () => {
  await User.deleteMany({});
  const adminUser = await User.create({
    email: 'admin@test.com', passwordHash: 'x', role: 'admin',
  });
  const jwt = require('jsonwebtoken');
  adminToken = jwt.sign({ userId: adminUser.id, role: 'admin' }, process.env.JWT_SECRET!, { expiresIn: '15m' });

  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'user@test.com', password: 'password123' });
  userToken = res.body.accessToken;
});

beforeEach(async () => { await Recipe.deleteMany({}); });

describe('GET /api/admin/recipes', () => {
  it('returns all recipes including drafts for admin', async () => {
    await Recipe.create(RECIPE_INPUT);
    const res = await request(app)
      .get('/api/admin/recipes')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .get('/api/admin/recipes')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/admin/recipes', () => {
  it('creates a recipe', async () => {
    const res = await request(app)
      .post('/api/admin/recipes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(RECIPE_INPUT);
    expect(res.status).toBe(201);
    expect(res.body.slug).toBe('admin-test-recipe');
  });

  it('rejects duplicate slug with 409', async () => {
    await Recipe.create(RECIPE_INPUT);
    const res = await request(app)
      .post('/api/admin/recipes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(RECIPE_INPUT);
    expect(res.status).toBe(409);
  });
});

describe('PATCH /api/admin/recipes/:id', () => {
  it('updates status to published', async () => {
    const recipe = await Recipe.create(RECIPE_INPUT);
    const res = await request(app)
      .patch(`/api/admin/recipes/${recipe.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'published' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('published');
  });
});

describe('DELETE /api/admin/recipes/:id', () => {
  it('deletes a recipe', async () => {
    const recipe = await Recipe.create(RECIPE_INPUT);
    const res = await request(app)
      .delete(`/api/admin/recipes/${recipe.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(await Recipe.findById(recipe.id)).toBeNull();
  });
});

describe('health-condition write guard', () => {
  beforeAll(async () => {
    await HealthFlagConfig.create({ code: 'diabetes', label: 'Diabetes', description: 'd', enabled: true });
  });
  afterAll(async () => { await HealthFlagConfig.deleteMany({}); });

  it('rejects a recipe flagged with a condition not in the vocabulary (400)', async () => {
    const res = await request(app)
      .post('/api/admin/recipes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...RECIPE_INPUT, slug: 'guard-bad', healthFlags: [{ condition: 'pitta', severity: 'avoid', note: '' }] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/pitta/);
  });

  it('accepts a recipe flagged with a known condition code (201)', async () => {
    const res = await request(app)
      .post('/api/admin/recipes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...RECIPE_INPUT, slug: 'guard-good', healthFlags: [{ condition: 'diabetes', severity: 'caution', note: '' }] });
    expect(res.status).toBe(201);
  });
});
