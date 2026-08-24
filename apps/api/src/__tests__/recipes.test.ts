import './env';
import request from 'supertest';
import { createApp } from '../app';
import { Recipe } from '../models/Recipe';

const app = createApp();

const FIXTURE = {
  slug: 'coconut-burfi',
  nameEn: 'Coconut Burfi',
  nameTa: 'தேங்காய் பர்ஃபி',
  category: 'semi-solid',
  description: 'A classic sweet.',
  ingredients: [{ nameEn: 'Coconut', quantityG: '50g', quantityCup: '¼ cup' }],
  steps: [{
    order: 1, text: 'Cook coconut in milk.', phase: 'Milk phase',
    heat: 'Low heat', timerStr: null, stepIngredients: ['Coconut'], illColor: '#2A3828',
  }],
  healthFlags: [{ condition: 'diabetes', severity: 'avoid', note: 'High sugar' }],
  sources: [{ text: 'Ksemakutulhalam', citation: '10/54' }],
  yieldStr: '4 pieces', shelfLife: '5 days',
  status: 'published',
};

beforeEach(async () => { await Recipe.deleteMany({}); });

describe('GET /api/recipes', () => {
  it('returns published recipes', async () => {
    await Recipe.create(FIXTURE);
    await Recipe.create({ ...FIXTURE, slug: 'draft-recipe', status: 'draft' });
    const res = await request(app).get('/api/recipes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].slug).toBe('coconut-burfi');
  });

  it('filters by category', async () => {
    await Recipe.create(FIXTURE);
    await Recipe.create({ ...FIXTURE, slug: 'rice-porridge', category: 'solid' });
    const res = await request(app).get('/api/recipes?category=semi-solid');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe('GET /api/recipes/search', () => {
  // The $search aggregation stage needs a live Atlas Search index (see
  // scripts/create-search-index.ts) and errors against mongodb-memory-server,
  // which backs this test suite (jest.config.js globalSetup) — so only the
  // no-op empty-query path is covered here. Verify the real $search query
  // manually against the Atlas-connected dev server (curl/Postman) after
  // running `npm run search:create-index`.
  it('returns [] without querying $search when q is missing', async () => {
    await Recipe.create(FIXTURE);
    const res = await request(app).get('/api/recipes/search');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns [] without querying $search when q is blank', async () => {
    await Recipe.create(FIXTURE);
    const res = await request(app).get('/api/recipes/search?q=%20');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /api/recipes/:slug', () => {
  it('returns recipe by slug', async () => {
    await Recipe.create(FIXTURE);
    const res = await request(app).get('/api/recipes/coconut-burfi');
    expect(res.status).toBe(200);
    expect(res.body.nameEn).toBe('Coconut Burfi');
  });

  it('returns 404 for unknown slug', async () => {
    const res = await request(app).get('/api/recipes/nope');
    expect(res.status).toBe(404);
  });

  it('returns 404 for draft slug (not published)', async () => {
    await Recipe.create({ ...FIXTURE, slug: 'secret-draft', status: 'draft' });
    const res = await request(app).get('/api/recipes/secret-draft');
    expect(res.status).toBe(404);
  });
});
