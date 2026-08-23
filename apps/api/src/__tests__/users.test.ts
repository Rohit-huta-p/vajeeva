import './env';
import request from 'supertest';
import { createApp } from '../app';
import { Recipe } from '../models/Recipe';
import { User } from '../models/User';
import { SavedRecipe } from '../models/SavedRecipe';

const app = createApp();

const RECIPE = {
  slug: 'del-recipe', nameEn: 'Del Recipe', nameTa: '', category: 'solid',
  description: 'Test', ingredients: [{ nameEn: 'A', quantityG: '1g', quantityCup: '1 tsp' }],
  steps: [{ order: 1, text: 'Do it', phase: 'P', heat: null, timerStr: null, stepIngredients: [], illColor: '#111111' }],
  healthFlags: [], sources: [], yieldStr: '1', shelfLife: '1 day', status: 'published',
};

let token: string;

beforeEach(async () => {
  await Promise.all([Recipe.deleteMany({}), User.deleteMany({}), SavedRecipe.deleteMany({})]);
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'del@test.com', password: 'password123' });
  token = res.body.accessToken;
});

describe('DELETE /api/users/me', () => {
  it('removes the account and its saved recipes', async () => {
    const recipe = await Recipe.create(RECIPE);
    await request(app)
      .post('/api/sync/saved')
      .set('Authorization', `Bearer ${token}`)
      .send({ added: [recipe.id], removed: [] });

    const del = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(del.status).toBe(204);
    expect(await User.countDocuments({ email: 'del@test.com' })).toBe(0);
    expect(await SavedRecipe.countDocuments({})).toBe(0);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).delete('/api/users/me');
    expect(res.status).toBe(401);
  });
});
