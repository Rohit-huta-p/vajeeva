import './env';
import request from 'supertest';
import { createApp } from '../app';
import { Recipe } from '../models/Recipe';
import { User } from '../models/User';

const app = createApp();

const RECIPE = {
  slug: 'sync-recipe', nameEn: 'Sync Recipe', nameTa: '', category: 'solid',
  description: 'Test', ingredients: [{ nameEn: 'A', quantityG: '1g', quantityCup: '1 tsp' }],
  steps: [{ order: 1, text: 'Do it', phase: 'P', heat: null, timerStr: null, stepIngredients: [], illColor: '#111111' }],
  healthFlags: [], sources: [], yieldStr: '1', shelfLife: '1 day', status: 'published',
};

let token: string;

beforeEach(async () => {
  await Recipe.deleteMany({});
  await User.deleteMany({});
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'sync@test.com', password: 'password123' });
  token = res.body.accessToken;
});

describe('GET /api/sync/recipes', () => {
  it('returns recipes updated after since param', async () => {
    const before = new Date(Date.now() - 1000).toISOString();
    await Recipe.create(RECIPE);
    const res = await request(app)
      .get(`/api/sync/recipes?since=${before}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('returns empty array when nothing updated since', async () => {
    await Recipe.create(RECIPE);
    const since = new Date(Date.now() + 5000).toISOString();
    const res = await request(app)
      .get(`/api/sync/recipes?since=${since}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/sync/recipes?since=2020-01-01');
    expect(res.status).toBe(401);
  });
});

describe('POST + GET /api/sync/saved', () => {
  it('saves and retrieves recipe IDs', async () => {
    const recipe = await Recipe.create(RECIPE);
    await request(app)
      .post('/api/sync/saved')
      .set('Authorization', `Bearer ${token}`)
      .send({ added: [recipe.id], removed: [] });
    const res = await request(app)
      .get('/api/sync/saved')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toContain(recipe.id);
  });
});

describe('POST + GET /api/sync/cooked', () => {
  it('records a make (by slug, with rating) and returns it', async () => {
    await Recipe.create(RECIPE);
    const post = await request(app)
      .post('/api/sync/cooked')
      .set('Authorization', `Bearer ${token}`)
      .send({ makes: [{ recipe: 'sync-recipe', rating: 5 }] });
    expect(post.status).toBe(200);
    expect(post.body).toMatchObject({ ok: true, count: 1 });

    const res = await request(app)
      .get('/api/sync/cooked')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ slug: 'sync-recipe', rating: 5 });
  });

  it('is append-only — repeat makes accumulate', async () => {
    await Recipe.create(RECIPE);
    await request(app).post('/api/sync/cooked').set('Authorization', `Bearer ${token}`)
      .send({ makes: [{ recipe: 'sync-recipe' }] });
    await request(app).post('/api/sync/cooked').set('Authorization', `Bearer ${token}`)
      .send({ makes: [{ recipe: 'sync-recipe' }] });
    const res = await request(app).get('/api/sync/cooked').set('Authorization', `Bearer ${token}`);
    expect(res.body).toHaveLength(2);
  });

  it('skips unknown recipes and clamps rating', async () => {
    await Recipe.create(RECIPE);
    const post = await request(app)
      .post('/api/sync/cooked')
      .set('Authorization', `Bearer ${token}`)
      .send({ makes: [{ recipe: 'sync-recipe', rating: 99 }, { recipe: 'does-not-exist' }] });
    expect(post.body.count).toBe(1);
    const res = await request(app).get('/api/sync/cooked').set('Authorization', `Bearer ${token}`);
    expect(res.body[0].rating).toBe(5); // clamped from 99
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/sync/cooked');
    expect(res.status).toBe(401);
  });
});
