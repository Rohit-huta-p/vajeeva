import './env';
import request from 'supertest';
import { createApp } from '../app';
import { User } from '../models/User';
import { Recipe } from '../models/Recipe';
import { SavedRecipe } from '../models/SavedRecipe';
import { CookLog } from '../models/CookLog';

const app = createApp();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jwt = require('jsonwebtoken');

const RECIPE = { slug: 'stat-recipe', nameEn: 'Stat Recipe', category: 'solid', status: 'published' };

let adminToken: string;

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}), Recipe.deleteMany({}), SavedRecipe.deleteMany({}), CookLog.deleteMany({}),
  ]);
  const admin = await User.create({ email: 'admin-stats@test.com', passwordHash: 'x', role: 'admin' });
  adminToken = jwt.sign({ userId: admin.id, role: 'admin' }, process.env.JWT_SECRET!, { expiresIn: '15m' });
});

describe('GET /api/admin/stats', () => {
  it('returns engagement metrics', async () => {
    const patient = await User.create({ email: 'p@test.com', passwordHash: 'x', lastSyncAt: new Date() });
    const recipe = await Recipe.create(RECIPE);
    await SavedRecipe.create({ userId: patient.id, recipeId: recipe.id });
    await CookLog.create({ userId: patient.id, recipeId: recipe.id, rating: 5 });
    await CookLog.create({ userId: patient.id, recipeId: recipe.id });

    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.users).toMatchObject({ total: 1, active7d: 1, active30d: 1 });
    expect(res.body.saves).toBe(1);
    expect(res.body.makes).toBe(2);
    expect(res.body.avgRating).toBe(5);      // avg of the rated makes only
    expect(res.body.savedNotMade).toBe(0);   // the saved recipe was made
    expect(res.body.makesByWeek).toHaveLength(8);
    expect(res.body.mostCooked[0]).toMatchObject({ slug: 'stat-recipe', makes: 2 });
  });

  it('counts a saved-but-never-made recipe as friction; null rating when none', async () => {
    const patient = await User.create({ email: 'p2@test.com', passwordHash: 'x', lastSyncAt: new Date() });
    const recipe = await Recipe.create(RECIPE);
    await SavedRecipe.create({ userId: patient.id, recipeId: recipe.id });
    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.savedNotMade).toBe(1);
    expect(res.body.makes).toBe(0);
    expect(res.body.avgRating).toBeNull();
  });

  it('403 for non-admin, 401 without token', async () => {
    const reg = await request(app).post('/api/auth/register').send({ email: 'u@test.com', password: 'password123' });
    const nonAdmin = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${reg.body.accessToken}`);
    expect(nonAdmin.status).toBe(403);
    const anon = await request(app).get('/api/admin/stats');
    expect(anon.status).toBe(401);
  });
});
