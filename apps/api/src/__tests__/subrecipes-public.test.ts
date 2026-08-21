import './env';
import request from 'supertest';
import { createApp } from '../app';
import { SubRecipe } from '../models/SubRecipe';

const app = createApp();

beforeEach(async () => { await SubRecipe.deleteMany({}); });

describe('Public SubRecipes routes', () => {
  it('GET /api/subrecipes returns empty array when no sub-recipes', async () => {
    const res = await request(app).get('/api/subrecipes');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('GET /api/subrecipes lists all sub-recipes with full shape', async () => {
    await SubRecipe.create({
      name: 'Aromatic Powder Blend',
      slug: 'aromatic-powder-blend',
      ingredients: [
        { name: 'Cardamom pods', qty: '3–4' },
        { name: 'Cloves', qty: '2–3' },
      ],
      note: 'Store airtight.',
      method: 'Grind fine.',
      usedIn: 5,
    });
    const res = await request(app).get('/api/subrecipes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    const item = res.body[0];
    expect(item.slug).toBe('aromatic-powder-blend');
    expect(item.name).toBe('Aromatic Powder Blend');
    expect(item.usedIn).toBe(5);
    expect(Array.isArray(item.ingredients)).toBe(true);
    expect(item.ingredients[0]).toMatchObject({ name: 'Cardamom pods', qty: '3–4' });
    expect(item.note).toBe('Store airtight.');
    expect(item.method).toBe('Grind fine.');
    expect(item.id).toBeDefined();
    // passwordHash or other private fields must not leak
    expect(item._id).toBeUndefined();
  });

  it('GET /api/subrecipes/:slug returns a single sub-recipe', async () => {
    await SubRecipe.create({
      name: 'Aromatic Powder Blend',
      slug: 'aromatic-powder-blend',
      ingredients: [{ name: 'Cardamom pods', qty: '3–4' }],
      note: 'Store airtight.',
      method: 'Grind fine.',
      usedIn: 3,
    });
    const res = await request(app).get('/api/subrecipes/aromatic-powder-blend');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Aromatic Powder Blend');
    expect(res.body.ingredients).toHaveLength(1);
    expect(res.body.usedIn).toBe(3);
  });

  it('GET /api/subrecipes/:slug returns 404 for unknown slug', async () => {
    const res = await request(app).get('/api/subrecipes/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
